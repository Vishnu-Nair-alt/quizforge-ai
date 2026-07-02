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


class ParticipantAIQuestionReview(BaseModel):
    question_index: int
    outcome: str
    review: str
    next_step: str


class ParticipantAIInterpretation(BaseModel):
    overall_summary: str
    performance_level: str
    weak_areas: List[str]
    strong_areas: List[str]
    likely_misconceptions: List[str]
    what_to_learn_next: List[str]
    practice_recommendations: List[str]
    question_reviews: List[ParticipantAIQuestionReview]


class ParticipantAIAnswerEvidence(BaseModel):
    question_index: int
    question: str
    selected_answer: str
    correct_answer: str
    is_correct: bool
    explanation: str


class ParticipantAIAnalysisResponse(ParticipantAIInterpretation):
    session_id: int
    quiz_title: str
    participant_display_name: str
    total_questions: int
    score: int
    correct_count: int
    incorrect_count: int
    unanswered_count: int
    submitted_count: int
    participant_count: int
    class_average_score: float
    answer_evidence: List[ParticipantAIAnswerEvidence]
