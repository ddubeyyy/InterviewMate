# 🎯 InterviewMate - AI-Powered Mock Interview Platform
**InterviewMate** is a professional AI-powered mock interview application that provides realistic interview practice with intelligent feedback, resume analysis, and adaptive questioning. Built with FastAPI and React, powered by Groq's ultra-fast LLM inference.

## ✨ Key Features

### 🎤 **Realistic Interview Experience**
- **Live Timer**: Track your interview duration in real-time
- **Professional Interface**: Corporate-styled UI that mimics real video interview platforms
- **Interviewer Personas**: Practice with different interviewer styles (Professional, Inquisitive, Direct, Friendly)
- **Dynamic Interviewer Names**: Random interviewer assignment for variety

### 📄 **Resume-Powered Intelligence**
- **Resume Upload**: Upload your resume (.txt, .pdf, .doc, .docx)
- **Contextual Questions**: AI generates personalized questions based on your background
- **Experience-Based Evaluation**: Feedback tailored to your resume and experience level
- **Smart Introduction**: Interviewer acknowledges reviewing your background

### 🤖 **AI-Driven Evaluation**
- **Real-Time Scoring**: Each answer rated 1-10 by Groq's LLM
- **Constructive Feedback**: Persona-matched feedback after every answer
- **Adaptive Follow-Ups**: Get additional questions if your answer needs improvement (score < 8)
- **Conversational Flow**: AI maintains context throughout the interview

### 🎙️ **Multiple Input Methods**
- **Text Input**: Type your answers with keyboard shortcuts (Enter to send)
- **Voice Input**: Speak your answers using browser speech recognition
- **Visual Feedback**: Real-time listening indicator during voice input

### 📊 **Comprehensive Analysis**
- **Performance Summary**: Detailed analysis of strengths and improvement areas
- **Interview Transcript**: Full conversation history with scores
- **Actionable Recommendations**: Specific advice for future interviews

### 🎨 **Professional Design**
- Modern, clean interface
- Responsive layout for all devices
- Real interview platform aesthetics
- Smooth animations and transitions

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- Groq API Key (free at [console.groq.com](https://console.groq.com))

### Quick Start

1. **Set up Groq API Key**
   - Get your free API key from [https://console.groq.com](https://console.groq.com)
   - Add it to Replit Secrets with key: `GROQ_API_KEY`

2. **The application is ready to use!**
   - All dependencies are installed automatically
   - Frontend is built and served from the backend
   - Access at your Replit URL

### Local Development

**Install Dependencies:**
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend  
cd frontend
npm install
npm run build
```

**Start the Server:**
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 5000
```

Visit `http://localhost:5000`

## 📖 How to Use

### Starting an Interview

1. **Select Position**: Choose the role you're interviewing for
   - Software Engineer
   - Sales Representative
   - Retail Associate

2. **Choose Interviewer Style**:
   - **Professional & Balanced**: Standard, objective interviewer
   - **Inquisitive & Detail-Oriented**: Asks clarifying questions, explores depth
   - **Direct & Time-Conscious**: Efficient, to-the-point questions
   - **Friendly & Conversational**: Warm, engaging, chatty style

3. **Upload Resume (Optional)**:
   - Drag and drop or click to select your resume
   - Supported formats: .txt, .pdf, .doc, .docx
   - AI will generate personalized questions based on your experience

4. **Begin Interview**: Click to start your timed interview session

### During the Interview

- **Timer**: Watch the clock to practice time management
- **First Question**: Always "Tell me about yourself" (personalized if resume uploaded)
- **Answer Questions**: Type or use voice input (🎤)
- **Receive Feedback**: Get instant AI evaluation after each answer
- **Follow-Up Questions**: Triggered automatically for answers scoring below 8/10
- **Natural Flow**: AI asks contextual questions based on your previous answers

### After the Interview

- **Performance Summary**: Review your overall performance
- **Key Strengths**: See what you did well
- **Improvement Areas**: Understand where to focus
- **Recommendations**: Get actionable advice for next time
- **Start Again**: Practice as many times as you need

## 🏗️ Architecture

### Backend (FastAPI + Python)

```
backend/
├── main.py              # FastAPI application
│   ├── /api/start       # Create interview session (accepts resume upload)
│   ├── /api/next        # Get next question / evaluate answer
│   └── /api/health      # Health check
├── question_bank.json   # Base question library (15 questions)
└── requirements.txt     # Python dependencies
```

**Key Backend Features:**
- FormData handling for resume uploads
- Resume text parsing (up to 3000 characters)
- Contextual question generation using LLM
- Session state management with resume context
- Adaptive evaluation based on candidate background

### Frontend (React + Vite)

```
frontend/
├── src/
│   ├── App.jsx          # Main application component
│   │   ├── Setup Stage  # Role, persona, resume selection
│   │   └── Interview    # Live interview interface with timer
│   ├── main.jsx         # React entry point
│   └── index.css        # Professional styling
├── dist/                # Built files (served by FastAPI)
└── package.json
```

**Key Frontend Features:**
- Multi-stage interface (Setup → Interview → Summary)
- Real-time timer with MM:SS format
- Resume file upload with drag-and-drop
- Voice input using Web Speech API
- Message threading with interviewer avatars
- Responsive design for mobile and desktop

## 🔌 API Documentation

### POST /api/start

Create a new interview session with optional resume.

**Request (FormData):**
```
role: "software_engineer" | "sales" | "retail"
persona: "neutral" | "confused" | "efficient" | "chatty"
resume: File (optional)
```

**Response:**
```json
{
  "session_id": "uuid",
  "role": "software_engineer",
  "persona": "neutral",
  "started_at": "2025-11-24T12:00:00"
}
```

### POST /api/next

Get next question or submit answer for evaluation.

**Request:**
```json
{
  "session_id": "uuid",
  "user_text": "My answer..." // Empty string to get first question
}
```

**Response:**
```json
{
  "next_question": "Next interview question...",
  "feedback": "Constructive feedback on your answer",
  "followups": ["Optional follow-up questions"],
  "end_session": false,
  "summary": null // Populated when interview ends
}
```

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "groq_configured": true
}
```

## 🧠 How It Works

### Interview Flow

1. **Session Creation**: User selects role, persona, and optionally uploads resume
2. **Resume Processing**: System parses resume text (first 3000 characters)
3. **Contextual Introduction**: First question references resume if provided
4. **Answer Evaluation**: Groq LLM scores answer (1-10) and provides feedback
5. **Adaptive Questioning**:
   - Score ≥ 8: Move to next question
   - Score < 8: Ask up to 2 follow-up questions
6. **Dynamic Generation**: If resume provided, AI generates contextual questions
7. **Final Summary**: LLM analyzes full interview transcript and provides comprehensive feedback

### AI Intelligence

**Resume Context Integration:**
```python
# Questions reference candidate's specific experience
"Can you elaborate on the scalable web applications you mentioned 
serving millions of users in your background?"
```

**Persona-Matched Feedback:**
- **Professional**: Balanced, objective assessment
- **Inquisitive**: Asks for more details, explores deeper
- **Direct**: Brief, actionable feedback
- **Friendly**: Warm, encouraging tone

**Adaptive Follow-Ups:**
- Triggered when score < 8
- Maximum 2 per question
- Helps candidates improve incomplete answers

## 🛠️ Technologies

**Backend:**
- FastAPI (Modern Python web framework)
- Groq API (Ultra-fast LLM inference with llama-3.3-70b-versatile)
- Uvicorn (ASGI server)
- Pydantic (Data validation)
- Python-multipart (File upload handling)

**Frontend:**
- React 18 (UI framework)
- Vite (Build tool and dev server)
- Web Speech API (Voice input)
- Modern CSS (Custom styling)

**Infrastructure:**
- Replit (Hosting and deployment)
- Nix (Package management)

## 🎨 Customization

### Adding New Roles

Edit `backend/question_bank.json`:

```json
{
  "product_manager": [
    {
      "id": "pm_1",
      "text": "Describe your product roadmap process.",
      "followups": [
        "How do you prioritize features?",
        "How do you handle stakeholder disagreements?"
      ]
    }
  ]
}
```

Then update frontend role options in `App.jsx`.

### Changing LLM Model

Update in `backend/main.py`:

```python
chat_completion = groq_client.chat.completions.create(
    messages=messages,
    model="llama-3.3-70b-versatile",  # Change model here
    temperature=0.7,
    max_tokens=1024,
)
```

Available Groq models:
- `llama-3.3-70b-versatile` (Default - balanced performance)
- `llama-3.2-90b-text-preview` (Most capable)
- `mixtral-8x7b-32768` (Large context window)

### Adjusting Scoring Criteria

Modify `evaluate_answer()` in `backend/main.py`:

```python
system_prompt = f"""Rate based on:
- Clarity (30%)
- Completeness (30%)
- Relevance (20%)
- Specific examples (20%)
"""
```

### Customizing Timer Limits

Add maximum time limits in `frontend/src/App.jsx`:

```javascript
useEffect(() => {
  if (stage === 'interview' && !interviewEnded) {
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev >= 3600) { // 60 minute limit
          setInterviewEnded(true)
          return prev
        }
        return prev + 1
      })
    }, 1000)
  }
}, [stage, interviewEnded])
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | Groq API key for LLM access | Yes |

## 🐛 Troubleshooting

**Issue**: "Failed to start interview"
- **Solution**: Verify GROQ_API_KEY is set in Replit Secrets

**Issue**: Voice input not working
- **Solution**: Use Chrome or Edge browser (Safari/Firefox have limited support)

**Issue**: Resume not being used in questions
- **Solution**: Ensure resume file is .txt format or contains readable text

**Issue**: Timer not starting
- **Solution**: Refresh the page and start a new interview

**Issue**: Questions seem repetitive
- **Solution**: Upload a resume for personalized, context-aware questions

## 🎯 Best Practices

### For Candidates

1. **Upload Your Resume**: Get personalized questions matching your experience
2. **Use Full Sentences**: AI evaluates clarity and completeness
3. **Provide Examples**: Specific stories score higher than generic answers
4. **Watch the Timer**: Practice time management for real interviews
5. **Review Feedback**: Learn from each answer before continuing

### For Developers

1. **Resume Format**: Encourage plain text (.txt) for best parsing
2. **Token Limits**: Resume parsing limited to 3000 chars to save API costs
3. **Error Handling**: All API calls have try-catch with user-friendly messages
4. **Session Management**: In-memory sessions - consider Redis for production
5. **Rate Limiting**: Add rate limits to prevent API abuse

## 📊 Performance

- **Question Generation**: ~2-3 seconds per question
- **Answer Evaluation**: ~3-4 seconds per evaluation
- **Resume Processing**: <1 second for parsing
- **Total Interview Time**: 20-45 minutes typically

## 🔒 Security & Privacy

- Resume data stored only during session (in-memory)
- No persistent storage of personal information
- CORS enabled for cross-origin requests
- File upload size limits enforced
- Text extraction only (no file storage)

## 📄 License

This project is open source and available for educational purposes.

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [Groq](https://groq.com/) - Ultra-fast LLM inference
- [React](https://react.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [Replit](https://replit.com/) - Development and hosting platform

---

**Ready to ace your next interview?** 🚀 Start practicing now!

Made with ❤️ using AI and modern web technologies
#   I n t e r v i e w M a t e 
 
 
