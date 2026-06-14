from ast import List
from typing import Literal, Optional
from pydantic import BaseModel, Field


class GenerateQuizRequest(BaseModel):
    title: str
    number_of_questions: int = Field(ge=1, le=30)
    difficulty: Literal["Easy", "Medium", "Hard", "Mixed"]
    topic_focus: Optional[str] = ""


class MCQ(BaseModel):
    question: str
    options: List[str] = Field(min_length=4, max_length=4)
    correct_answer: str
    difficulty: str
    explanation: str


class QuizGenerationResponse(BaseModel):
    questions: List[MCQ]


class SaveQuizRequest(BaseModel):
    title: str
    filename: Optional[str] = None
    difficulty: str
    topic_focus: Optional[str] = ""
    questions: List[MCQ]
