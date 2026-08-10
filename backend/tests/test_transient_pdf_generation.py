import os
import unittest
from unittest.mock import patch

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["GEMINI_API_KEY"] = "test-key"

from fastapi.testclient import TestClient

from database import Base, engine
from features.auth.service import get_current_user
from main import app
from models import User
from schemas import MCQ, QuizGenerationResponse


class FakePage:
    def extract_text(self):
        return "Photosynthesis converts light energy into chemical energy."


class FakeReader:
    def __init__(self, _file):
        self.pages = [FakePage()]


class FakeModels:
    def generate_content(self, **_kwargs):
        question = MCQ(
            question="What does photosynthesis convert?",
            options=["Light energy", "Sound energy", "Heat only", "Motion"],
            correct_answer="Light energy",
            difficulty="Easy",
            explanation="The source states that light energy is converted.",
        )
        return type(
            "FakeResponse",
            (),
            {"parsed": QuizGenerationResponse(questions=[question])},
        )()


class FakeClient:
    models = FakeModels()


class TransientPdfGenerationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.dependency_overrides[get_current_user] = lambda: User(
            id=1,
            name="Test User",
            email="test@example.com",
            password_hash="unused",
        )
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        cls.client.close()
        app.dependency_overrides.clear()

    def test_models_have_no_pdf_storage(self):
        Base.metadata.create_all(engine)
        self.assertNotIn("uploaded_documents", Base.metadata.tables)
        self.assertNotIn("filename", Base.metadata.tables["quizzes"].columns)

    @patch("features.quiz_generation.routes.PdfReader", FakeReader)
    @patch("features.quiz_generation.routes.client", FakeClient())
    def test_generate_quiz_accepts_pdf_as_multipart_without_source_metadata(self):
        response = self.client.post(
            "/generate-quiz",
            files={"file": ("biology.pdf", b"temporary PDF bytes", "application/pdf")},
            data={
                "title": "Biology Quiz",
                "number_of_questions": "1",
                "difficulty": "Easy",
                "topic_focus": "photosynthesis",
            },
        )

        self.assertEqual(response.status_code, 200, response.text)
        payload = response.json()
        self.assertEqual(payload["title"], "Biology Quiz")
        self.assertEqual(len(payload["questions"]), 1)
        self.assertNotIn("filename", payload)
        self.assertNotIn("document_id", payload)
        self.assertNotIn("extracted_text", payload)


if __name__ == "__main__":
    unittest.main()
