from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import User
from features.auth.service import get_current_user
from features.host_ai_analysis.schemas import HostAIAnalysisResponse
from features.host_ai_analysis.service import get_host_ai_analysis


host_ai_analysis_router = APIRouter(
    prefix="/sessions",
    tags=["Host AI Analysis"],
)


@host_ai_analysis_router.get(
    "/{session_id}/ai-analysis",
    response_model=HostAIAnalysisResponse,
)
def host_ai_analysis(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_host_ai_analysis(db, session_id, current_user)
