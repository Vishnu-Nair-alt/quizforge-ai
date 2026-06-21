import csv
import io

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models import (
    ParticipantAnswer,
    QuizSession,
    SessionParticipant,
    User,
)


def get_owned_session(
    db: Session,
    session_code: str,
    current_user: User,
) -> QuizSession:
    session = (
        db.query(QuizSession)
        .filter(QuizSession.session_code == session_code.upper())
        .first()
    )

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )

    if session.host_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to view this session history.",
        )

    return session


def get_owner_session_history(db: Session, current_user: User):
    sessions = (
        db.query(QuizSession)
        .filter(QuizSession.host_user_id == current_user.id)
        .order_by(QuizSession.created_at.desc())
        .all()
    )

    history = []

    for session in sessions:
        participants = (
            db.query(SessionParticipant)
            .filter(SessionParticipant.session_id == session.id)
            .all()
        )
        submitted = [
            participant
            for participant in participants
            if participant.has_submitted
        ]
        scores = [participant.score or 0 for participant in submitted]

        history.append({
            "session_id": session.id,
            "quiz_id": session.quiz_id,
            "quiz_title": session.quiz.title,
            "session_code": session.session_code,
            "status": session.status,
            "created_at": session.created_at,
            "started_at": session.started_at,
            "ended_at": session.ended_at,
            "participant_count": len(participants),
            "submitted_count": len(submitted),
            "total_questions": len(session.quiz.questions),
            "average_score": (
                round(sum(scores) / len(scores), 2)
                if scores else None
            ),
        })

    return {"sessions": history}


def build_participant_detail(
    db: Session,
    participant: SessionParticipant,
    questions: list,
):
    answers = (
        db.query(ParticipantAnswer)
        .filter(
            ParticipantAnswer.session_id == participant.session_id,
            ParticipantAnswer.participant_id == participant.id,
        )
        .order_by(ParticipantAnswer.question_index.asc())
        .all()
    )
    total_questions = len(questions)
    answer_details = []

    for answer in answers:
        question = (
            questions[answer.question_index]
            if 0 <= answer.question_index < total_questions
            else {}
        )
        answer_details.append({
            "question_index": answer.question_index,
            "question": question.get("question", "Question unavailable"),
            "selected_answer": answer.selected_answer,
            "correct_answer": question.get("correct_answer", ""),
            "is_correct": answer.is_correct,
        })

    correct_count = sum(1 for answer in answers if answer.is_correct)
    incorrect_count = sum(1 for answer in answers if not answer.is_correct)

    return {
        "participant_id": participant.id,
        "user_id": participant.user_id,
        "display_name": participant.display_name,
        "joined_at": participant.joined_at,
        "has_submitted": participant.has_submitted,
        "score": participant.score,
        "correct_count": correct_count,
        "incorrect_count": incorrect_count,
        "unanswered_count": max(total_questions - len(answers), 0),
        "submitted_at": participant.submitted_at,
        "answers": answer_details,
    }


def get_owner_session_detail(
    db: Session,
    session_code: str,
    current_user: User,
):
    session = get_owned_session(db, session_code, current_user)
    participants = (
        db.query(SessionParticipant)
        .filter(SessionParticipant.session_id == session.id)
        .order_by(SessionParticipant.joined_at.asc())
        .all()
    )
    participant_details = [
        build_participant_detail(db, participant, session.quiz.questions)
        for participant in participants
    ]

    return {
        "session_id": session.id,
        "quiz_id": session.quiz_id,
        "quiz_title": session.quiz.title,
        "quiz_filename": session.quiz.filename,
        "difficulty": session.quiz.difficulty,
        "topic_focus": session.quiz.topic_focus,
        "total_questions": len(session.quiz.questions),
        "session_code": session.session_code,
        "status": session.status,
        "created_at": session.created_at,
        "started_at": session.started_at,
        "ended_at": session.ended_at,
        "participant_count": len(participants),
        "submitted_count": sum(
            1 for participant in participants if participant.has_submitted
        ),
        "participants": participant_details,
    }


def delete_owner_session(
    db: Session,
    session_code: str,
    current_user: User,
):
    session = get_owned_session(db, session_code, current_user)
    deleted_session_code = session.session_code

    try:
        db.query(ParticipantAnswer).filter(
            ParticipantAnswer.session_id == session.id,
        ).delete(synchronize_session=False)
        db.query(SessionParticipant).filter(
            SessionParticipant.session_id == session.id,
        ).delete(synchronize_session=False)
        db.delete(session)
        db.commit()
    except Exception:
        db.rollback()
        raise

    return {
        "session_code": deleted_session_code,
        "message": "Session history deleted successfully.",
    }


def csv_safe(value):
    if value is None:
        return ""

    text = str(value)
    if text.startswith(("=", "+", "-", "@")):
        return f"'{text}"
    return text


def create_session_results_csv(
    db: Session,
    session_code: str,
    current_user: User,
):
    detail = get_owner_session_detail(db, session_code, current_user)
    output = io.StringIO(newline="")
    writer = csv.writer(output)

    writer.writerow([
        "Participant Name",
        "Score",
        "Total Questions",
        "Correct Count",
        "Incorrect Count",
        "Unanswered Count",
        "Submitted",
        "Submitted Time",
        "Joined Time",
    ])

    for participant in detail["participants"]:
        writer.writerow([
            csv_safe(participant["display_name"]),
            participant["score"] if participant["score"] is not None else "",
            detail["total_questions"],
            participant["correct_count"],
            participant["incorrect_count"],
            participant["unanswered_count"],
            "Yes" if participant["has_submitted"] else "No",
            (
                participant["submitted_at"].isoformat()
                if participant["submitted_at"] else ""
            ),
            participant["joined_at"].isoformat(),
        ])

    return (
        output.getvalue(),
        f"quizforge-{detail['session_code']}-results.csv",
    )
