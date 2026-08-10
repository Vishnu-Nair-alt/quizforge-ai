import os
import unittest
from unittest.mock import patch

os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import dns.resolver
from fastapi import HTTPException
from pydantic import ValidationError

from database import Base, SessionLocal, engine
from features.auth.validation import ensure_email_domain_accepts_mail
from features.sessions.service import join_session
from models import Quiz, QuizSession, SessionParticipant, User
from schemas import UserSignupRequest


class FakeMxRecord:
    exchange = "mail.example.com."


class AuthenticationAndSessionGuardTests(unittest.TestCase):
    def setUp(self):
        Base.metadata.create_all(engine)
        self.db = SessionLocal()

    def tearDown(self):
        self.db.rollback()
        self.db.close()

    def test_host_cannot_join_own_session(self):
        host = User(
            id=201,
            name="Quiz Host",
            email="host@example.com",
            password_hash="unused",
        )
        quiz = Quiz(
            owner_id=host.id,
            title="Host Guard Quiz",
            difficulty="Easy",
            number_of_questions=1,
            topic_focus="",
            questions=[],
        )
        self.db.add_all([host, quiz])
        self.db.flush()
        session = QuizSession(
            quiz_id=quiz.id,
            host_user_id=host.id,
            session_code="NOHOST",
            status="waiting",
        )
        self.db.add(session)
        self.db.commit()

        with self.assertRaises(HTTPException) as raised:
            join_session(self.db, session.session_code, host.name, None, host)

        self.assertEqual(raised.exception.status_code, 403)
        self.assertEqual(self.db.query(SessionParticipant).count(), 0)

        self.db.delete(session)
        self.db.delete(quiz)
        self.db.delete(host)
        self.db.commit()

    def test_signup_password_requires_length_letter_number_and_special_character(self):
        valid = UserSignupRequest(
            name="Valid User",
            email="person@example.com",
            password="secure123!",
        )
        self.assertEqual(valid.password, "secure123!")

        for invalid_password in ("short1!", "onlyletters!", "12345678!", "secure123"):
            with self.subTest(password=invalid_password):
                with self.assertRaises(ValidationError):
                    UserSignupRequest(
                        name="Invalid User",
                        email="person@example.com",
                        password=invalid_password,
                    )

    @patch("features.auth.validation.dns.resolver.resolve", return_value=[FakeMxRecord()])
    def test_email_domain_with_mx_record_is_accepted(self, _resolve):
        ensure_email_domain_accepts_mail("person@example.com")

    @patch("features.auth.validation.dns.resolver.resolve", side_effect=dns.resolver.NXDOMAIN)
    def test_nonexistent_email_domain_is_rejected(self, _resolve):
        with self.assertRaises(HTTPException) as raised:
            ensure_email_domain_accepts_mail("person@does-not-exist.invalid")

        self.assertEqual(raised.exception.status_code, 422)


if __name__ == "__main__":
    unittest.main()
