import secrets
import string
from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from schemas import SubmitAnswersRequest
from models import Quiz, User, QuizSession, SessionParticipant, ParticipantAnswer


SESSION_CODE_LENGTH = 6


def generate_session_code(db: Session) -> str:
    characters = string.ascii_uppercase + string.digits

    while True:
        code = "".join(secrets.choice(characters) for _ in range(SESSION_CODE_LENGTH))

        existing_session = (
            db.query(QuizSession)
            .filter(QuizSession.session_code == code)
            .first()
        )

        if existing_session is None:
            return code


def generate_participant_token(db: Session) -> str:
    while True:
        token = secrets.token_urlsafe(24)

        existing_participant = (
            db.query(SessionParticipant)
            .filter(SessionParticipant.participant_token == token)
            .first()
        )

        if existing_participant is None:
            return token


def get_session_by_code(db: Session, session_code: str) -> QuizSession:
    session = (
        db.query(QuizSession)
        .filter(QuizSession.session_code == session_code.upper())
        .first()
    )

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found."
        )

    return session


def ensure_session_host(session: QuizSession, current_user: User):
    if session.host_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to manage this session."
        )


def create_quiz_session(db: Session, quiz_id: int, current_user: User):
    existing_session = (
        db.query(QuizSession)
        .filter(
            QuizSession.host_user_id == current_user.id,
            QuizSession.status.in_(["waiting", "active"])
        )
        .order_by(QuizSession.created_at.desc())
        .first()
    )

    if existing_session is not None:
        return {
            "session_id": existing_session.id,
            "quiz_id": existing_session.quiz_id,
            "session_code": existing_session.session_code,
            "status": existing_session.status
        }

    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == quiz_id,
            Quiz.owner_id == current_user.id
        )
        .first()
    )

    if quiz is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found."
        )

    session_code = generate_session_code(db)

    new_session = QuizSession(
        quiz_id=quiz.id,
        host_user_id=current_user.id,
        session_code=session_code,
        status="waiting"
    )

    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return {
        "session_id": new_session.id,
        "quiz_id": new_session.quiz_id,
        "session_code": new_session.session_code,
        "status": new_session.status
    }


def get_current_host_session(db: Session, current_user: User):
    session = (
        db.query(QuizSession)
        .filter(
            QuizSession.host_user_id == current_user.id,
            QuizSession.status.in_(["waiting", "active"])
        )
        .order_by(QuizSession.created_at.desc())
        .first()
    )

    if session is None:
        return {"session": None}

    return {
        "session": {
            "session_id": session.id,
            "quiz_id": session.quiz_id,
            "session_code": session.session_code,
            "status": session.status
        }
    }


def get_public_session_status(db: Session, session_code: str):
    session = get_session_by_code(db, session_code)

    participant_count = (
        db.query(SessionParticipant)
        .filter(SessionParticipant.session_id == session.id)
        .count()
    )

    return {
        "session_code": session.session_code,
        "status": session.status,
        "quiz_title": session.quiz.title,
        "participant_count": participant_count
    }


def get_host_lobby(db: Session, session_code: str, current_user: User):
    session = get_session_by_code(db, session_code)
    ensure_session_host(session, current_user)

    participants = (
        db.query(SessionParticipant)
        .filter(SessionParticipant.session_id == session.id)
        .order_by(SessionParticipant.joined_at.asc())
        .all()
    )

    return {
        "session_id": session.id,
        "session_code": session.session_code,
        "status": session.status,
        "quiz_title": session.quiz.title,
        "participants": [
            {
                "id": participant.id,
                "display_name": participant.display_name,
                "joined_at": participant.joined_at,
                "has_submitted": participant.has_submitted
            }
            for participant in participants
        ]
    }


def join_session(db: Session, session_code: str, name: str | None, current_user: User | None):
    session = get_session_by_code(db, session_code)

    if session.status != "waiting":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You can only join while the session is waiting."
        )

    if current_user is not None:
        display_name = name.strip() if name and name.strip() else current_user.name
        user_id = current_user.id
    else:
        if name is None or not name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Name is required for guest participants."
            )

        display_name = name.strip()
        user_id = None

    existing_name = (
        db.query(SessionParticipant)
        .filter(
            SessionParticipant.session_id == session.id,
            SessionParticipant.display_name == display_name
        )
        .first()
    )

    if existing_name is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This participant name is already used in this session."
        )

    participant_token = generate_participant_token(db)

    participant = SessionParticipant(
        session_id=session.id,
        user_id=user_id,
        display_name=display_name,
        participant_token=participant_token
    )

    db.add(participant)
    db.commit()
    db.refresh(participant)

    return {
        "participant_id": participant.id,
        "participant_token": participant.participant_token,
        "display_name": participant.display_name,
        "session_code": session.session_code,
        "status": session.status
    }


def start_session(db: Session, session_code: str, current_user: User):
    session = get_session_by_code(db, session_code)
    ensure_session_host(session, current_user)

    if session.status == "active":
        return {
            "session_code": session.session_code,
            "status": session.status,
            "started_at": session.started_at,
            "message": "Session is already active."
        }

    if session.status == "ended":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ended sessions cannot be started again."
        )

    session.status = "active"
    session.started_at = datetime.utcnow()

    db.commit()
    db.refresh(session)

    return {
        "session_code": session.session_code,
        "status": session.status,
        "started_at": session.started_at,
        "message": "Session started successfully."
    }

def end_session(db: Session, session_code: str, current_user: User):
    session = get_session_by_code(db, session_code)
    ensure_session_host(session, current_user)

    if session.status == "ended":
        return {
            "session_code": session.session_code,
            "status": session.status,
            "ended_at": session.ended_at,
            "message": "Session is already ended."
        }

    session.status = "ended"
    session.ended_at = datetime.utcnow()

    db.commit()
    db.refresh(session)

    return {
        "session_code": session.session_code,
        "status": session.status,
        "ended_at": session.ended_at,
        "message": "Session ended successfully."
    }

def validate_participant(
    db: Session,
    session: QuizSession,
    participant_id: int,
    participant_token: str
) -> SessionParticipant:
    participant = (
        db.query(SessionParticipant)
        .filter(
            SessionParticipant.id == participant_id,
            SessionParticipant.session_id == session.id,
            SessionParticipant.participant_token == participant_token
        )
        .first()
    )

    if participant is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid participant credentials."
        )

    return participant


def get_safe_quiz_questions(
    db: Session,
    session_code: str,
    participant_id: int,
    participant_token: str
):
    session = get_session_by_code(db, session_code)

    if session.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz is not active right now."
        )

    validate_participant(db, session, participant_id, participant_token)

    questions = session.quiz.questions

    safe_questions = []

    for index, question in enumerate(questions):
        safe_questions.append({
            "question_index": index,
            "question": question["question"],
            "options": question["options"]
        })

    return {
        "session_code": session.session_code,
        "status": session.status,
        "quiz_title": session.quiz.title,
        "questions": safe_questions
    }


def normalize_answer(answer: str) -> str:
    return answer.strip().lower()


def submit_answers(db: Session, session_code: str, request: SubmitAnswersRequest):
    session = get_session_by_code(db, session_code)

    if session.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Answers can only be submitted while the session is active."
        )

    participant = validate_participant(
        db=db,
        session=session,
        participant_id=request.participant_id,
        participant_token=request.participant_token
    )

    if participant.has_submitted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already submitted this quiz."
        )

    questions = session.quiz.questions
    total_questions = len(questions)

    submitted_indices = [answer.question_index for answer in request.answers]

    if len(submitted_indices) != len(set(submitted_indices)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate question indexes are not allowed."
        )

    score = 0

    for submitted_answer in request.answers:
        question_index = submitted_answer.question_index

        if question_index < 0 or question_index >= total_questions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid question index: {question_index}"
            )

        original_question = questions[question_index]
        correct_answer = original_question["correct_answer"]

        is_correct = (
            normalize_answer(submitted_answer.selected_answer)
            == normalize_answer(correct_answer)
        )

        if is_correct:
            score += 1

        answer_record = ParticipantAnswer(
            session_id=session.id,
            participant_id=participant.id,
            question_index=question_index,
            selected_answer=submitted_answer.selected_answer,
            is_correct=is_correct
        )

        db.add(answer_record)

    participant.has_submitted = True
    participant.score = score
    participant.submitted_at = datetime.utcnow()

    db.commit()
    db.refresh(participant)

    return {
        "participant_id": participant.id,
        "display_name": participant.display_name,
        "score": participant.score,
        "total_questions": total_questions,
        "submitted_at": participant.submitted_at
    }


def get_my_result(
    db: Session,
    session_code: str,
    participant_id: int,
    participant_token: str
):
    session = get_session_by_code(db, session_code)

    participant = validate_participant(
        db=db,
        session=session,
        participant_id=participant_id,
        participant_token=participant_token
    )

    total_questions = len(session.quiz.questions)

    return {
        "participant_id": participant.id,
        "display_name": participant.display_name,
        "has_submitted": participant.has_submitted,
        "score": participant.score,
        "total_questions": total_questions,
        "submitted_at": participant.submitted_at
    }


def get_host_results(db: Session, session_code: str, current_user: User):
    session = get_session_by_code(db, session_code)
    ensure_session_host(session, current_user)

    participants = (
        db.query(SessionParticipant)
        .filter(SessionParticipant.session_id == session.id)
        .all()
    )

    total_questions = len(session.quiz.questions)

    def sort_key(participant: SessionParticipant):
        submitted_rank = 0 if participant.has_submitted else 1
        score_rank = -(participant.score or 0)
        submitted_time = participant.submitted_at or datetime.max
        return submitted_rank, score_rank, submitted_time

    participants.sort(key=sort_key)

    return {
        "session_code": session.session_code,
        "status": session.status,
        "quiz_title": session.quiz.title,
        "results": [
            {
                "participant_id": participant.id,
                "display_name": participant.display_name,
                "has_submitted": participant.has_submitted,
                "score": participant.score,
                "total_questions": total_questions,
                "submitted_at": participant.submitted_at
            }
            for participant in participants
        ]
    }
