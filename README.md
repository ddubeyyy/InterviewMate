🎯 InterviewMate – AI-Powered Conversational Mock Interview Platform

InterviewMate is a fully AI-driven mock interview platform that conducts realistic, adaptive conversations — just like a real interviewer.
It reads your resume, asks contextual follow-ups, answers your questions, and evaluates every response.

Built with FastAPI + Groq LLM + React (Vite).

✨ Features
🧠 Conversational AI Interviewer

Understands your answers and asks follow-up questions.

Asks deeper questions if you mention projects, tech stack, achievements, problems solved.

Answers your questions too (DSA, DBMS, Java, anything).

Does not follow a static question bank — fully conversational.

📄 Resume-Aware Interview

Uploads .txt resume

Extracts context

First question + follow-ups fully aligned to resume

👤 Personalized Greeting

Greets you by your name

Reads resume

Starts with: “Hello Disha, nice to meet you. Tell me about yourself…”

🎤 Voice + Text Input

Chrome-based speech recognition

Type or speak your answer

📊 Real-Time Evaluation

Scoring (1–10)

Feedback after each answer

Deeper follow-ups when score < 8

Final summary at the end

🚀 Project Structure
InterviewMate/
│
├── backend/                # FastAPI backend
│   ├── main.py             # Core AI conversation engine
│   ├── requirements.txt
│   ├── .env                # GROQ_API_KEY goes here
│   └── ...
│
└── frontend/               # React (Vite) app
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── index.css
    │   └── ...
    ├── vite.config.js
    └── package.json

🛠️ Installation & Setup
1️⃣ Backend Setup (FastAPI)

Go to backend directory:

cd backend


Install requirements:

pip install -r requirements.txt


Create .env file inside backend/:

GROQ_API_KEY=your_groq_api_key_here


Run backend:

uvicorn main:app --reload --host 0.0.0.0 --port 8000


Check backend:

👉 http://localhost:8000/api/health

You should see:

{
  "status": "healthy",
  "groq_configured": true
}

2️⃣ Frontend Setup (React + Vite)

Go to frontend:

cd frontend


Install dependencies:

npm install


Run development server:

npm run dev


Open the app:

👉 http://localhost:5173

🔌 API Endpoints
POST /api/start

Starts interview session.

FormData fields:

name
email
role
persona
resume (optional)

POST /api/next

Send answer → AI sends next question.

Body:

{
  "session_id": "uuid",
  "user_text": "Your answer"
}

🤖 How the Conversational AI Works
1️⃣ Reads resume

→ extracts skills, projects, experience.

2️⃣ Greets user

→ “Hello Disha, I reviewed your resume…”

3️⃣ First question

→ Personalized intro question.

4️⃣ AI Decision Engine

For every message, AI chooses:

ask_followup

ask_new_topic

answer_user

end_session

5️⃣ Dynamic Follow-Ups

Example:

You say: "I built a Food Delivery App."
AI asks:

What tech stack did you use?

How did you implement authentication?

What challenges did you face?

How did you scale it?

6️⃣ AI answers your questions

If you ask:

“Explain two pointer technique”

AI explains it instantly.

🎨 Frontend Features

Modern UI

Interview timer

Avatar-based chat

Voice input

Resume upload

Summary page

Smooth animations

Professional design

📋 Environment Variables
Variable	Description
GROQ_API_KEY	Required – Groq LLM key
