from typing import List
from typing import Literal
from pydantic import BaseModel, EmailStr, Field
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class GenerateQuizRequest(BaseModel):
    document_id: int
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




#LOGIN/REGISTER SCHEMAS
class UserSignupRequest(BaseModel):
    name: str = Field(min_length=2)
    email: EmailStr
    password: str = Field(min_length=6)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

#v2


class CreateSessionRequest(BaseModel):
    quiz_id: int


class CreateSessionResponse(BaseModel):
    session_id: int
    quiz_id: int
    session_code: str
    status: str


class PublicSessionStatusResponse(BaseModel):
    session_code: str
    status: str
    quiz_title: str
    participant_count: int


class JoinSessionRequest(BaseModel):
    name: Optional[str] = None


class JoinSessionResponse(BaseModel):
    participant_id: int
    participant_token: str
    display_name: str
    session_code: str
    status: str


class ParticipantLobbyItem(BaseModel):
    id: int
    display_name: str
    joined_at: datetime
    has_submitted: bool


class HostLobbyResponse(BaseModel):
    session_id: int
    session_code: str
    status: str
    quiz_title: str
    participants: List[ParticipantLobbyItem]


class StartSessionResponse(BaseModel):
    session_code: str
    status: str
    started_at: Optional[datetime]
    message: str


class EndSessionResponse(BaseModel):
    session_code: str
    status: str
    ended_at: Optional[datetime]
    message: str


class SafeQuestionItem(BaseModel):
    question_index: int
    question: str
    options: List[str]


class SafeQuizResponse(BaseModel):
    session_code: str
    status: str
    quiz_title: str
    questions: List[SafeQuestionItem]


class SubmitAnswersResponse(BaseModel):
    participant_id: int
    display_name: str
    score: int
    total_questions: int
    submitted_at: datetime


class MyResultResponse(BaseModel):
    participant_id: int
    display_name: str
    has_submitted: bool
    score: Optional[int]
    total_questions: int
    submitted_at: Optional[datetime]


class HostResultItem(BaseModel):
    participant_id: int
    display_name: str
    has_submitted: bool
    score: Optional[int]
    total_questions: int
    submitted_at: Optional[datetime]


class HostResultsResponse(BaseModel):
    session_code: str
    status: str
    quiz_title: str
    results: List[HostResultItem]

class SubmittedAnswer(BaseModel):
    question_index: int
    selected_answer: str

class SubmitAnswersRequest(BaseModel):
    participant_id: int
    participant_token: str
    answers: List[SubmittedAnswer]