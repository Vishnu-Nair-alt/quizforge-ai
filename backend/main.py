from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from database import Base, engine

# Load .env before importing router if router uses os.getenv()
load_dotenv()

from routes.quizGen import router as api_router
from routes.login_signup import auth_router

app = FastAPI(
    title="QuizForge AI Backend",
    description="Backend API for generating and saving AI-powered quizzes.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {
        "message": "QuizForge AI Backend is running."
    }

app.include_router(auth_router)
app.include_router(api_router)


