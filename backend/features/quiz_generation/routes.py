from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pypdf import PdfReader
from google import genai

import os
import re

from schemas import GenerateQuizRequest, QuizGenerationResponse, SaveQuizRequest
from database import get_db
from models import Quiz, UploadedDocument, User
from features.auth.service import get_current_user


router = APIRouter()

# Gemini setup
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

client = genai.Client(api_key=GEMINI_API_KEY)

def chunk_text(text: str, chunk_size: int = 5000, overlap: int = 500):
    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap

    return chunks


def select_relevant_context(text: str, topic_focus: Optional[str], max_chars: int = 20000):
    """
    Simple V1 context selector.
    If topic_focus is given, select chunks containing those topic words.
    If not, use the beginning of the document.
    """

    if not text.strip():
        return ""

    if not topic_focus or not topic_focus.strip():
        return text[:max_chars]

    chunks = chunk_text(text)

    topic_words = [
        word.strip().lower()
        for word in re.split(r"[, ]+", topic_focus)
        if len(word.strip()) > 2
    ]

    scored_chunks = []

    for chunk in chunks:
        chunk_lower = chunk.lower()
        score = sum(chunk_lower.count(word) for word in topic_words)
        scored_chunks.append((score, chunk))

    scored_chunks.sort(key=lambda item: item[0], reverse=True)

    selected_chunks = [
        chunk
        for score, chunk in scored_chunks
        if score > 0
    ]

    if not selected_chunks:
        selected_chunks = chunks[:4]

    selected_text = "\n\n".join(selected_chunks)

    return selected_text[:max_chars]




@router.post("/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported."
        )

    extracted_text = ""

    try:
        reader = PdfReader(file.file)

        for page_number, page in enumerate(reader.pages, start=1):
            page_text = page.extract_text() or ""
            extracted_text += f"\n\n--- Page {page_number} ---\n"
            extracted_text += page_text

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to read PDF: {str(e)}"
        )

    document = UploadedDocument(
        owner_id=current_user.id,
        filename=file.filename,
        extracted_text=extracted_text
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return {
        "success": True,
        "document_id": document.id,
        "filename": document.filename,
        "total_characters": len(document.extracted_text),
        "preview": document.extracted_text[:1000]
    }






@router.post("/generate-quiz")
def generate_quiz(
    request: GenerateQuizRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is missing in .env file."
        )

    document = (
        db.query(UploadedDocument)
        .filter(
            UploadedDocument.id == request.document_id,
            UploadedDocument.owner_id == current_user.id
        )
        .first()
    )

    if document is None or not document.extracted_text.strip():
        raise HTTPException(
            status_code=404,
            detail="Uploaded PDF not found."
        )

    selected_context = select_relevant_context(
        text=document.extracted_text,
        topic_focus=request.topic_focus
    )

    prompt = f"""
You are an expert academic quiz creator.

Your task:
Generate {request.number_of_questions} multiple choice questions from the provided document text.

Quiz title:
{request.title}

Difficulty:
{request.difficulty}

Topic focus:
{request.topic_focus if request.topic_focus else "No specific topic focus. Use the most important concepts from the document."}

Rules:
- Use ONLY the provided document text.
- Do not invent facts outside the document.
- Each question must have exactly 4 options.
- Only one option should be correct.
- The correct_answer must exactly match one of the 4 options.
- Avoid vague questions.
- Avoid repeating the same concept too many times.
- Generate questions that test understanding, not just word matching.
- Include a short explanation for the correct answer.
- Return valid JSON only.

Document text:
{selected_context}
"""

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": QuizGenerationResponse,
            }
        )

        quiz_data = response.parsed

        return {
            "success": True,
            "title": request.title,
            "filename": document.filename,
            "difficulty": request.difficulty,
            "topic_focus": request.topic_focus,
            "questions": [question.model_dump() for question in quiz_data.questions]
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Quiz generation failed: {str(e)}"
        )






@router.post("/quizzes")
def save_quiz(
    request: SaveQuizRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not request.questions:
        raise HTTPException(
            status_code=400,
            detail="Cannot save a quiz without questions."
        )

    quiz = Quiz(
        owner_id=current_user.id,
        title=request.title,
        filename=request.filename,
        difficulty=request.difficulty,
        number_of_questions=len(request.questions),
        topic_focus=request.topic_focus,
        questions=[question.model_dump() for question in request.questions]
    )

    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    return {
        "success": True,
        "message": "Quiz saved successfully.",
        "quiz_id": quiz.id
    }





@router.get("/quizzes")
def get_all_quizzes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quizzes = (
        db.query(Quiz)
        .filter(Quiz.owner_id == current_user.id)
        .order_by(Quiz.created_at.desc())
        .all()
    )

    return {
        "success": True,
        "quizzes": [
            {
                "id": quiz.id,
                "title": quiz.title,
                "filename": quiz.filename,
                "difficulty": quiz.difficulty,
                "number_of_questions": quiz.number_of_questions,
                "topic_focus": quiz.topic_focus,
                "created_at": quiz.created_at
            }
            for quiz in quizzes
        ]
    }





@router.get("/quizzes/{quiz_id}")
def get_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quiz = (
        db.query(Quiz)
        .filter(Quiz.id == quiz_id, Quiz.owner_id == current_user.id)
        .first()
    )

    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found."
        )

    return {
        "success": True,
        "quiz": {
            "id": quiz.id,
            "title": quiz.title,
            "filename": quiz.filename,
            "difficulty": quiz.difficulty,
            "number_of_questions": quiz.number_of_questions,
            "topic_focus": quiz.topic_focus,
            "questions": quiz.questions,
            "created_at": quiz.created_at
        }
    }





@router.put("/quizzes/{quiz_id}")
def update_quiz(
    quiz_id: int,
    request: SaveQuizRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quiz = (
        db.query(Quiz)
        .filter(Quiz.id == quiz_id, Quiz.owner_id == current_user.id)
        .first()
    )

    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found."
        )

    quiz.title = request.title
    quiz.filename = request.filename or quiz.filename
    quiz.difficulty = request.difficulty
    quiz.topic_focus = request.topic_focus
    quiz.number_of_questions = len(request.questions)
    quiz.questions = [question.model_dump() for question in request.questions]

    db.commit()
    db.refresh(quiz)

    return {
        "success": True,
        "message": "Quiz updated successfully.",
        "quiz_id": quiz.id
    }






@router.delete("/quizzes/{quiz_id}")
def delete_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quiz = (
        db.query(Quiz)
        .filter(Quiz.id == quiz_id, Quiz.owner_id == current_user.id)
        .first()
    )

    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found."
        )

    db.delete(quiz)
    db.commit()

    return {
        "success": True,
        "message": "Quiz deleted successfully."
    }




@router.get("/test-gemini")
def test_gemini():
    if not GEMINI_API_KEY:
        return {
            "success": False,
            "message": "GEMINI_API_KEY is missing in .env file."
        }

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents="Say: QuizForge AI backend is connected."
        )

        return {
            "success": True,
            "response": response.text
        }

    except Exception as e:
        return {
            "success": False,
            "message": "Gemini API test failed.",
            "error": str(e)
        }
