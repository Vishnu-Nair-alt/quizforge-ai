import io

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db
from models import User
from features.auth.service import get_current_user
from features.host_ai_analysis.schemas import ParticipantAIAnalysisResponse
from features.host_ai_analysis.service import get_participant_ai_analysis
from features.session_history.service import (
    create_session_results_csv,
    delete_owner_session,
    get_joined_session_detail,
    get_joined_session_history,
    get_owner_session_detail,
    get_owner_session_history,
)
from schemas import (
    JoinedSessionHistoryResponse,
    SessionDetailResponse,
    SessionHistoryResponse,
)


session_history_router = APIRouter(
    prefix="/session-history",
    tags=["Session History"],
)


@session_history_router.get("", response_model=SessionHistoryResponse)
def list_session_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_owner_session_history(db, current_user)


@session_history_router.get("/joined", response_model=JoinedSessionHistoryResponse)
def list_joined_session_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_joined_session_history(db, current_user)


@session_history_router.get(
    "/joined/{session_code}",
    response_model=SessionDetailResponse,
)
def get_joined_session_history_detail(
    session_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_joined_session_detail(db, session_code, current_user)


@session_history_router.get(
    "/joined/{session_code}/ai-analysis",
    response_model=ParticipantAIAnalysisResponse,
)
def get_joined_session_ai_analysis(
    session_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_participant_ai_analysis(db, session_code, current_user)


@session_history_router.get(
    "/{session_code}",
    response_model=SessionDetailResponse,
)
def get_session_history_detail(
    session_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_owner_session_detail(db, session_code, current_user)


@session_history_router.delete("/{session_code}")
def delete_session_history(
    session_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return delete_owner_session(db, session_code, current_user)


@session_history_router.get("/{session_code}/export")
def export_session_history_report(
    session_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    csv_content, filename = create_session_results_csv(
        db,
        session_code,
        current_user,
    )

    return StreamingResponse(
        io.BytesIO(csv_content.encode("utf-8-sig")),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )
