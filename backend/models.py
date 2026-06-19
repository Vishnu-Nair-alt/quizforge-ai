from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean,JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    quizzes = relationship("Quiz", back_populates="owner")


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    title = Column(String, nullable=False)
    filename = Column(String, nullable=True)
    difficulty = Column(String, nullable=False)
    number_of_questions = Column(Integer, nullable=False)
    topic_focus = Column(String, nullable=True)
    questions = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="quizzes")


class UploadedDocument(Base):
    __tablename__ = "uploaded_documents"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    filename = Column(String, nullable=False)
    extracted_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User")


    #V2

class QuizSession(Base):
    __tablename__ = "quiz_sessions"

    id = Column(Integer, primary_key=True, index=True)

    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    host_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_code = Column(String, unique=True, index=True, nullable=False)
    status = Column(String, default="waiting", nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)

    quiz = relationship("Quiz")
    host = relationship("User")
    participants = relationship("SessionParticipant", back_populates="session")


class SessionParticipant(Base):
    __tablename__ = "session_participants"

    id = Column(Integer, primary_key=True, index=True)

    session_id = Column(Integer, ForeignKey("quiz_sessions.id"), nullable=False)

    # If participant is logged in, store user_id.
    # If guest, this stays null.
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    display_name = Column(String, nullable=False)

    # This acts like a private key for guest participants.
    # They need this token to submit answers or see their own result.
    participant_token = Column(String, unique=True, index=True, nullable=False)

    joined_at = Column(DateTime, default=datetime.utcnow)

    has_submitted = Column(Boolean, default=False)
    score = Column(Integer, nullable=True)
    submitted_at = Column(DateTime, nullable=True)

    session = relationship("QuizSession", back_populates="participants")
    user = relationship("User")
    answers = relationship("ParticipantAnswer", back_populates="participant")


class ParticipantAnswer(Base):
    __tablename__ = "participant_answers"

    id = Column(Integer, primary_key=True, index=True)

    session_id = Column(Integer, ForeignKey("quiz_sessions.id"), nullable=False)
    participant_id = Column(Integer, ForeignKey("session_participants.id"), nullable=False)

    question_index = Column(Integer, nullable=False)
    selected_answer = Column(String, nullable=False)
    is_correct = Column(Boolean, nullable=False)

    participant = relationship("SessionParticipant", back_populates="answers")
