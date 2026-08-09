import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables before importing modules that read them.
load_dotenv()

from database import Base, engine
import models  # noqa: F401 - registers all SQLAlchemy models with Base.metadata
from sqlalchemy import inspect, text

from features.quiz_generation.routes import router as api_router
from features.auth.routes import auth_router
from features.sessions.routes import session_router
from features.session_history.routes import session_history_router
from features.host_ai_analysis.routes import host_ai_analysis_router

app = FastAPI(
    title="QuizForge AI Backend",
    description="Backend API for generating and saving AI-powered quizzes.",
    version="1.0.0"
)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")

# Keep local development available and allow the deployed frontend configured
# through Render's FRONTEND_URL environment variable.
origins = list(dict.fromkeys([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    FRONTEND_URL,
]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Lightweight migration for existing local SQLite databases.
if engine.dialect.name == "sqlite" and "avatar_url" not in {column["name"] for column in inspect(engine).get_columns("session_participants")}:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE session_participants ADD COLUMN avatar_url TEXT"))


@app.get("/")
def root():
    return {
        "message": "QuizForge AI Backend is running."
    }

app.include_router(auth_router)
app.include_router(api_router)
app.include_router(session_router)
app.include_router(session_history_router)
app.include_router(host_ai_analysis_router)


