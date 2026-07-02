import json
import os

from dotenv import load_dotenv
from fastapi import HTTPException, status
from google import genai
from sqlalchemy.orm import Session

from models import ParticipantAnswer, QuizSession, SessionParticipant, User
from features.host_ai_analysis.schemas import (
    HostAIInterpretation,
    ParticipantAIInterpretation,
)


load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

client = None


def get_genai_client():
    global client

    if client is None:
        client = genai.Client(api_key=GEMINI_API_KEY)

    return client


def build_host_analysis_payload(
    db: Session,
    session_id: int,
    current_user: User,
) -> dict:
    quiz_session = (
        db.query(QuizSession)
        .filter(
            QuizSession.id == session_id,
            QuizSession.host_user_id == current_user.id,
        )
        .first()
    )

    if quiz_session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )

    if quiz_session.quiz is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz data for this session was not found.",
        )

    participants = (
        db.query(SessionParticipant)
        .filter(SessionParticipant.session_id == quiz_session.id)
        .all()
    )
    submitted_participants = [
        participant
        for participant in participants
        if participant.has_submitted
    ]

    if not submitted_participants:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="AI analysis requires at least one submitted quiz.",
        )

    submitted_ids = [participant.id for participant in submitted_participants]
    answers = (
        db.query(ParticipantAnswer)
        .filter(
            ParticipantAnswer.session_id == quiz_session.id,
            ParticipantAnswer.participant_id.in_(submitted_ids),
        )
        .all()
    )

    answers_by_question = {}
    for answer in answers:
        answers_by_question.setdefault(answer.question_index, []).append(answer)

    submitted_count = len(submitted_participants)
    question_stats = []

    for question_index, question in enumerate(quiz_session.quiz.questions):
        question_answers = answers_by_question.get(question_index, [])
        correct_count = sum(1 for answer in question_answers if answer.is_correct)
        wrong_count = sum(1 for answer in question_answers if not answer.is_correct)
        unanswered_count = submitted_count - correct_count - wrong_count

        question_stats.append({
            "question_index": question_index,
            "question": question.get("question", ""),
            "difficulty": question.get("difficulty", ""),
            "correct_answer": question.get("correct_answer", ""),
            "explanation": question.get("explanation", ""),
            "correct_count": correct_count,
            "wrong_count": wrong_count,
            "unanswered_count": max(unanswered_count, 0),
            "correct_percentage": round(
                (correct_count / submitted_count) * 100,
                2,
            ),
        })

    scores = [participant.score or 0 for participant in submitted_participants]

    return {
        "session_id": quiz_session.id,
        "quiz_title": quiz_session.quiz.title,
        "total_questions": len(quiz_session.quiz.questions),
        "participant_count": len(participants),
        "submitted_count": submitted_count,
        "average_score": round(sum(scores) / submitted_count, 2),
        "question_stats": question_stats,
    }


def generate_host_ai_analysis(payload: dict) -> dict:
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GEMINI_API_KEY is missing in .env file.",
        )

    prompt = f"""
You are an educational assessment analyst.

Interpret the aggregate quiz performance data below for the quiz host.
The backend has already calculated every numeric statistic. Do not recalculate,
change, or invent numbers. Do not infer participant identities.

Return valid JSON only with these fields:
- overall_summary: concise summary of the class performance
- performance_level: one short label such as Excellent, Strong, Mixed, Needs Support
- weak_topics: list of concepts learners appear to struggle with
- strong_topics: list of concepts learners understand well
- hardest_questions: list of objects with question_index and reason
- easiest_questions: list of objects with question_index and reason
- question_quality_notes: list of objects with question_index and note
- recommended_actions: list of practical teaching or quiz-improvement actions

Use zero-based question_index values exactly as provided. Base every conclusion
only on the supplied quiz text, explanations, and aggregate statistics.

Analysis payload:
{json.dumps(payload, ensure_ascii=False)}
"""

    try:
        response = get_genai_client().models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": HostAIInterpretation,
            },
        )

        if response.parsed is None:
            raise ValueError("Gemini returned no structured analysis.")

        return response.parsed.model_dump()
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI performance analysis failed: {str(error)}",
        ) from error


def get_host_ai_analysis(
    db: Session,
    session_id: int,
    current_user: User,
) -> dict:
    payload = build_host_analysis_payload(db, session_id, current_user)
    interpretation = generate_host_ai_analysis(payload)
    return {**payload, **interpretation}


def build_participant_analysis_payload(
    db: Session,
    session_code: str,
    current_user: User,
) -> dict:
    participant = (
        db.query(SessionParticipant)
        .join(QuizSession, SessionParticipant.session_id == QuizSession.id)
        .filter(
            SessionParticipant.user_id == current_user.id,
            QuizSession.session_code == session_code.upper(),
        )
        .first()
    )

    if participant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or not joined by the current user.",
        )

    if not participant.has_submitted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="AI analysis requires your submitted quiz answers.",
        )

    quiz_session = participant.session
    if quiz_session.quiz is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz data for this session was not found.",
        )

    participants = (
        db.query(SessionParticipant)
        .filter(SessionParticipant.session_id == quiz_session.id)
        .all()
    )
    submitted_participants = [
        session_participant
        for session_participant in participants
        if session_participant.has_submitted
    ]
    submitted_count = len(submitted_participants)
    submitted_scores = [
        session_participant.score or 0
        for session_participant in submitted_participants
    ]

    answers = (
        db.query(ParticipantAnswer)
        .filter(
            ParticipantAnswer.session_id == quiz_session.id,
            ParticipantAnswer.participant_id == participant.id,
        )
        .order_by(ParticipantAnswer.question_index.asc())
        .all()
    )
    answers_by_question = {
        answer.question_index: answer
        for answer in answers
    }
    answer_evidence = []

    for question_index, question in enumerate(quiz_session.quiz.questions):
        answer = answers_by_question.get(question_index)
        answer_evidence.append({
            "question_index": question_index,
            "question": question.get("question", ""),
            "selected_answer": (
                answer.selected_answer
                if answer is not None
                else "Unanswered"
            ),
            "correct_answer": question.get("correct_answer", ""),
            "is_correct": bool(answer and answer.is_correct),
            "explanation": question.get("explanation", ""),
        })

    correct_count = sum(1 for answer in answers if answer.is_correct)
    incorrect_count = sum(1 for answer in answers if not answer.is_correct)
    total_questions = len(quiz_session.quiz.questions)

    return {
        "session_id": quiz_session.id,
        "quiz_title": quiz_session.quiz.title,
        "participant_display_name": participant.display_name,
        "total_questions": total_questions,
        "score": participant.score or 0,
        "correct_count": correct_count,
        "incorrect_count": incorrect_count,
        "unanswered_count": max(total_questions - len(answers), 0),
        "submitted_count": submitted_count,
        "participant_count": len(participants),
        "class_average_score": (
            round(sum(submitted_scores) / submitted_count, 2)
            if submitted_count else 0
        ),
        "answer_evidence": answer_evidence,
    }


def generate_participant_ai_analysis(payload: dict) -> dict:
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GEMINI_API_KEY is missing in .env file.",
        )

    prompt = f"""
You are a supportive personal quiz coach.

Interpret the participant's own quiz answers below. The backend has already
calculated every numeric statistic. Do not recalculate, change, or invent
numbers. Do not name or compare individual classmates. You may use the anonymous
class_average_score only as light context.

Return valid JSON only with these fields:
- overall_summary: concise, learner-facing summary of this participant's result
- performance_level: one short label such as Excellent, Strong, Mixed, Needs Practice
- weak_areas: concepts this participant should review based on wrong or unanswered answers
- strong_areas: concepts this participant appears to understand
- likely_misconceptions: specific misunderstanding patterns visible in their answers
- what_to_learn_next: prioritized learning topics or subskills for this participant
- practice_recommendations: concrete study or practice actions
- question_reviews: list of objects with question_index, outcome, review, and next_step

Use zero-based question_index values exactly as provided. Base every conclusion
only on the supplied question text, answer choices, correct answers,
explanations, and participant answer evidence.

Participant analysis payload:
{json.dumps(payload, ensure_ascii=False)}
"""

    try:
        response = get_genai_client().models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": ParticipantAIInterpretation,
            },
        )

        if response.parsed is None:
            raise ValueError("Gemini returned no structured analysis.")

        return response.parsed.model_dump()
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI participant analysis failed: {str(error)}",
        ) from error


def get_participant_ai_analysis(
    db: Session,
    session_code: str,
    current_user: User,
) -> dict:
    payload = build_participant_analysis_payload(
        db,
        session_code,
        current_user,
    )
    interpretation = generate_participant_ai_analysis(payload)
    return {**payload, **interpretation}
