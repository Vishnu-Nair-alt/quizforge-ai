# ⚡ QuizForge AI

QuizForge AI is an AI-powered quiz generation and live assessment platform that transforms PDF documents into interactive quizzes.

Users can upload study material, automatically generate multiple-choice questions using AI, review and edit the generated questions, and host live quiz sessions that participants can join using a session code.

The project combines AI-assisted content generation with a full-stack quiz management and real-time assessment workflow.

---

## ✨ Features

### 🤖 AI Quiz Generation

- Upload PDF documents
- Extract text from uploaded material
- Generate multiple-choice questions automatically using Gemini
- Generate questions directly from the source material
- Review and edit generated questions before saving

### 📝 Quiz Management

- Create and save quizzes
- Edit generated questions
- Maintain quizzes under authenticated user accounts
- Reuse saved quizzes for live sessions

### 🎮 Live Quiz Sessions

- Hosts can create a live quiz session
- Unique session codes are generated automatically
- Participants can join without creating an account
- Participants join using a display name and session code
- Hosts control when the session starts and ends
- Participant answers are recorded individually

### 📊 Results

- Track participant submissions
- Store answers for each question
- View session results from the host interface
- Associate participant responses with individual quiz sessions

### 🔐 Authentication

- User registration and login
- JWT-based authentication
- Protected host functionality
- Guest participation in live quizzes without requiring an account

---

## 🛠️ Tech Stack

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- FastAPI
- Python
- SQLAlchemy
- JWT Authentication
- REST APIs

### Database

- SQLite for local development
- PostgreSQL planned for production deployment

### AI

- Google Gemini API

### Deployment

- Vercel — Frontend
- Render — Backend
- Supabase PostgreSQL — Production Database

---

## 🏗️ Architecture

```text
                   ┌────────────────────┐
                   │       User         │
                   └─────────┬──────────┘
                             │
                             ▼
                   ┌────────────────────┐
                   │   React Frontend   │
                   │       Vite         │
                   └─────────┬──────────┘
                             │
                        REST API
                             │
                             ▼
                   ┌────────────────────┐
                   │  FastAPI Backend   │
                   └──────┬───────┬─────┘
                          │       │
                          │       │
                          ▼       ▼
                 ┌────────────┐ ┌─────────────┐
                 │ SQLAlchemy │ │ Gemini API  │
                 └──────┬─────┘ └─────────────┘
                        │
                        ▼
                 ┌──────────────┐
                 │   Database   │
                 └──────────────┘
```

---

## 📁 Project Structure

```text
QuizForge-AI/
│
├── backend/
│   ├── features/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:

- Python 3.10+
- Node.js
- npm
- Git

You will also need a Google Gemini API key.

---

## ⚙️ Backend Setup

Clone the repository:

```bash
git clone <YOUR_REPOSITORY_URL>
cd QuizForge-AI/backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the backend directory and add the required environment variables:

```env
GEMINI_API_KEY=your_gemini_api_key
SECRET_KEY=your_jwt_secret
DATABASE_URL=your_database_url
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

FastAPI's interactive API documentation can be accessed at:

```text
http://127.0.0.1:8000/docs
```

---

## 💻 Frontend Setup

Open another terminal:

```bash
cd QuizForge-AI/frontend
```

Install dependencies:

```bash
npm install
```

Create the required frontend environment configuration:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Start the development server:

```bash
npm run dev
```

The frontend will normally run at:

```text
http://localhost:5173
```

---

## 🔄 Application Workflow

```text
Upload PDF
    ↓
Extract document text
    ↓
Send content to Gemini
    ↓
Generate MCQs
    ↓
Review / Edit Questions
    ↓
Save Quiz
    ↓
Create Live Session
    ↓
Generate Session Code
    ↓
Participants Join
    ↓
Host Starts Quiz
    ↓
Participants Submit Answers
    ↓
View Session Results
```

## 🔮 Future Improvements

Potential additions include:

- Quiz session history
- Results export
- Downloadable PDF reports
- Advanced quiz analytics
- Question difficulty controls
- AI-generated explanations
- Multiple question types
- Improved session management
- Custom quiz sharing
- Enhanced host dashboard

---

## 🤝 Contributing

This project is currently under active development.

Suggestions, bug reports, and contributions are welcome through GitHub Issues and Pull Requests.

---

## ⭐ About

QuizForge AI was built as a full-stack project exploring AI-assisted education, automated assessment generation, REST API development, authentication, database design, and interactive quiz workflows.
