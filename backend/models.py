from sqlalchemy import Column, Integer, String, DateTime, JSON
from datetime import datetime
from database import Base


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    filename = Column(String, nullable=True)
    difficulty = Column(String, nullable=False)
    number_of_questions = Column(Integer, nullable=False)
    topic_focus = Column(String, nullable=True)

    # Store questions as JSON list
    questions = Column(JSON, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)