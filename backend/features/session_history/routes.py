import io

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db
from models import User
from features.auth.service import get_current_user
from features.session_history.service import (
    create_session_results_csv,
    delete_owner_session,
    get_owner_session_detail,
    get_owner_session_history,
)
from schemas import (
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
