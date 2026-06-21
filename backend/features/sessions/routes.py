from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import (
    CreateSessionRequest,
    CreateSessionResponse,
    CurrentHostSessionResponse,
    PublicSessionStatusResponse,
    JoinSessionRequest,
    JoinSessionResponse,
    HostLobbyResponse,
    StartSessionResponse,
    EndSessionResponse,
    SafeQuizResponse,
    SubmitAnswersRequest,
    SubmitAnswersResponse,
    MyResultResponse,
    HostResultsResponse
)
from features.auth.service import get_current_user, get_optional_current_user
from features.sessions.service import (
    create_quiz_session,
    get_current_host_session,
    get_public_session_status,
    get_host_lobby,
    join_session,
    start_session,
    end_session,
    get_safe_quiz_questions,
    submit_answers,
    get_my_result,
    get_host_results
)


session_router = APIRouter(prefix="/sessions", tags=["Sessions"])


@session_router.post("", response_model=CreateSessionResponse)
def create_session(
    request: CreateSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return create_quiz_session(db, request.quiz_id, current_user)


@session_router.get("/current-host", response_model=CurrentHostSessionResponse)
def current_host_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_current_host_session(db, current_user)


@session_router.get("/{session_code}/status", response_model=PublicSessionStatusResponse)
def session_status(
    session_code: str,
    db: Session = Depends(get_db)
):
    return get_public_session_status(db, session_code)


@session_router.get("/{session_code}/lobby", response_model=HostLobbyResponse)
def host_lobby(
    session_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_host_lobby(db, session_code, current_user)


@session_router.post("/{session_code}/join", response_model=JoinSessionResponse)
def join_quiz_session(
    session_code: str,
    request: JoinSessionRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user)
):
    return join_session(db, session_code, request.name, current_user)


@session_router.post("/{session_code}/start", response_model=StartSessionResponse)
def start_quiz_session(
    session_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return start_session(db, session_code, current_user)


@session_router.post("/{session_code}/end", response_model=EndSessionResponse)
def end_quiz_session(
    session_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return end_session(db, session_code, current_user)


@session_router.get("/{session_code}/questions", response_model=SafeQuizResponse)
def get_questions_for_participant(
    session_code: str,
    participant_id: int = Query(...),
    participant_token: str = Query(...),
    db: Session = Depends(get_db)
):
    return get_safe_quiz_questions(
        db=db,
        session_code=session_code,
        participant_id=participant_id,
        participant_token=participant_token
    )


@session_router.post("/{session_code}/submit", response_model=SubmitAnswersResponse)
def submit_quiz_answers(
    session_code: str,
    request: SubmitAnswersRequest,
    db: Session = Depends(get_db)
):
    return submit_answers(db, session_code, request)


@session_router.get("/{session_code}/my-result", response_model=MyResultResponse)
def participant_result(
    session_code: str,
    participant_id: int = Query(...),
    participant_token: str = Query(...),
    db: Session = Depends(get_db)
):
    return get_my_result(
        db=db,
        session_code=session_code,
        participant_id=participant_id,
        participant_token=participant_token
    )


@session_router.get("/{session_code}/results", response_model=HostResultsResponse)
def host_results(
    session_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_host_results(db, session_code, current_user)
