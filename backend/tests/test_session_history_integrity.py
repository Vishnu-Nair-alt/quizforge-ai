import os
import unittest

os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from fastapi import HTTPException

from database import Base, SessionLocal, engine
from features.quiz_generation.routes import delete_quiz
from features.session_history.service import get_owner_session_history
from models import Quiz, QuizSession, User


class SessionHistoryIntegrityTests(unittest.TestCase):
    def setUp(self):
        Base.metadata.create_all(engine)
        self.db = SessionLocal()

    def tearDown(self):
        self.db.rollback()
        self.db.close()

    def test_history_list_handles_an_existing_orphaned_session(self):
        user = User(
            id=101,
            name="History Owner",
            email="history-owner@example.com",
            password_hash="unused",
        )
        orphaned_session = QuizSession(
            quiz_id=99999,
            host_user_id=user.id,
            session_code="ORPHAN",
            status="ended",
        )
        self.db.add_all([user, orphaned_session])
        self.db.commit()

        result = get_owner_session_history(self.db, user)

        self.assertEqual(len(result["sessions"]), 1)
        self.assertEqual(result["sessions"][0]["quiz_title"], "Deleted quiz")
        self.assertEqual(result["sessions"][0]["total_questions"], 0)

        self.db.delete(orphaned_session)
        self.db.delete(user)
        self.db.commit()

    def test_quiz_with_session_history_cannot_be_deleted(self):
        user = User(
            id=102,
            name="Quiz Owner",
            email="quiz-owner@example.com",
            password_hash="unused",
        )
        quiz = Quiz(
            owner_id=user.id,
            title="Retained Quiz",
            difficulty="Easy",
            number_of_questions=1,
            topic_focus="",
            questions=[],
        )
        self.db.add_all([user, quiz])
        self.db.flush()
        session = QuizSession(
            quiz_id=quiz.id,
            host_user_id=user.id,
            session_code="RETAIN",
            status="ended",
        )
        self.db.add(session)
        self.db.commit()

        with self.assertRaises(HTTPException) as raised:
            delete_quiz(quiz.id, self.db, user)

        self.assertEqual(raised.exception.status_code, 409)
        self.assertIsNotNone(self.db.get(Quiz, quiz.id))

        self.db.delete(session)
        self.db.delete(quiz)
        self.db.delete(user)
        self.db.commit()


if __name__ == "__main__":
    unittest.main()
