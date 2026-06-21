from typing import List

from pydantic import BaseModel


class HostAIQuestionStat(BaseModel):
    question_index: int
    question: str
    difficulty: str
    correct_answer: str
    explanation: str
    correct_count: int
    wrong_count: int
    unanswered_count: int
    correct_percentage: float


class HostAIQuestionReason(BaseModel):
    question_index: int
    reason: str


class HostAIQuestionQualityNote(BaseModel):
    question_index: int
    note: str


class HostAIInterpretation(BaseModel):
    overall_summary: str
    performance_level: str
    weak_topics: List[str]
    strong_topics: List[str]
    hardest_questions: List[HostAIQuestionReason]
    easiest_questions: List[HostAIQuestionReason]
    question_quality_notes: List[HostAIQuestionQualityNote]
    recommended_actions: List[str]


class HostAIAnalysisResponse(HostAIInterpretation):
    session_id: int
    quiz_title: str
    total_questions: int
    participant_count: int
    submitted_count: int
    average_score: float
    question_stats: List[HostAIQuestionStat]
