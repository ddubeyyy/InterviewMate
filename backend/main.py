# backend/main.py
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from groq import Groq
import os, json, uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="InterviewMate - Conversational Agent (Option C)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("Warning: GROQ_API_KEY not set. Set backend/.env with GROQ_API_KEY=...")

groq_client = Groq(api_key=GROQ_API_KEY)

sessions: Dict[str, dict] = {}

class StartResponse(BaseModel):
    session_id: str
    role: str
    persona: str
    started_at: str

class NextRequest(BaseModel):
    session_id: str
    user_text: str = ""

class NextResponse(BaseModel):
    next_question: Optional[str] = None
    answer_text: Optional[str] = None
    feedback: Optional[str] = None
    end_session: bool = False
    summary: Optional[str] = None

# ---------- LLM helper ----------
def call_llm(system_prompt: str, user_messages: List[Dict[str,str]], model: str="llama-3.3-70b-versatile", temperature: float=0.6, max_tokens: int=512) -> str:
    messages = [{"role":"system", "content": system_prompt}] + user_messages
    try:
        resp = groq_client.chat.completions.create(
            messages=messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens
        )
        return resp.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM call failed: {str(e)}")

# ---------- Decision / response prompt ----------
DECIDER_SYSTEM_PROMPT = """
You are a skilled interviewer and assistant. Given the conversation and the user's latest utterance,
you must choose exactly one action and output ONLY valid JSON (no extra commentary).

Output JSON schema:
{
  "action": "<one-of: ask_followup | ask_new_topic | answer_user | end_session>",
  "content": "<the question text to ask OR the answer text the AI should say>",
  "should_score": <true|false>,               // whether to include a score/feedback for the user's last answer
  "score": <optional numeric 1-10>,           // optional numeric evaluation if should_score true
  "feedback": "<optional short feedback text>" 
}

Rules:
- If the user asked a direct question (e.g. 'Explain binary search'), choose action 'answer_user' and put the explanation in 'content'.
- If the user described their project / past work, and you should probe deeper, choose 'ask_followup' and put a specific follow-up (e.g. 'What tech stack did you use? How did you handle authentication?'). Make followups specific and contextual.
- If the user answered previous question well and you should move to a new topic/question, choose 'ask_new_topic' and put the next interview-style question (e.g. 'Explain how a hash table works.').
- If the interview should end (e.g. user asked to finish or enough topics covered), choose 'end_session' and put a brief closing note in 'content'.
- Keep 'content' concise (one or two sentences / a question).
- When you decide to evaluate the candidate's last answer (should_score true), return an approximate integer score 1-10 and a 1-2 sentence feedback in 'feedback'.
- Be helpful, conversational, and maintain the persona described in 'persona' (neutral/confused/efficient/chatty).

Make sure JSON is valid and parsable.
"""

# ---------- Final summary prompt ----------
SUMMARY_SYSTEM_PROMPT = """
You are an expert career coach. Given the interview transcript, produce a concise final summary with:
1) Overall performance (1 sentence)
2) 2-3 strengths
3) 2-3 areas for improvement
4) Top 2 concrete recommendations

Keep the summary ~150-220 words and encouraging but honest.
"""

# ---------- Evaluate single answer prompt (fallback) ----------
EVALUATE_SYSTEM_PROMPT = """
You are an interviewer evaluating a single answer. Output two lines:
SCORE: [1-10]
FEEDBACK: [1-2 sentence feedback]
"""

# --------- Endpoints ----------
@app.post("/api/start", response_model=StartResponse)
async def start(
    role: str = Form(...),
    persona: str = Form(...),
    name: str = Form(...),
    email: str = Form(...),
    resume: Optional[UploadFile] = File(None)
):
    role = role.lower()
    persona = persona.lower()
    if persona not in ["neutral","confused","efficient","chatty"]:
        raise HTTPException(status_code=400, detail="Invalid persona")

    resume_text = ""
    if resume:
        try:
            content = await resume.read()
            resume_text = content.decode("utf-8", errors="ignore")[:4000]
        except:
            resume_text = ""

    sid = str(uuid.uuid4())
    sessions[sid] = {
        "name": name,
        "email": email,
        "role": role,
        "persona": persona,
        "started_at": datetime.utcnow().isoformat(),
        "history": [],
        "resume": resume_text,
        "active": True,
        "turns": 0
    }

    greeting = (
        f"Hello {name}! It's great to meet you. "
        f"I’ve reviewed your resume and background. "
        f"Let's begin your {role} interview. "
    )
    first_q_prompt = f"""
You are an interviewer. Generate the VERY FIRST interview question, personalized using this resume:

Resume:
{resume_text}

Persona: {persona}
Role: {role}

Rules:
- Start the question with a warm, natural tone.
- Make the question relevant to the user's resume.
- Do NOT mention that this was AI-generated.
- Keep it short and specific.
"""

    first_question = call_llm(
        first_q_prompt,
        [{"role": "user", "content": "Generate first question."}],
        temperature=0.5,
        max_tokens=120
    ).strip()

    # Add greeting + question to history
    sessions[sid]["history"].append({"speaker": "agent", "text": greeting})
    sessions[sid]["history"].append({"speaker": "agent", "text": first_question})

    return StartResponse(
        session_id=sid,
        role=role,
        persona=persona,
        started_at=sessions[sid]["started_at"]
    )

    # initial prompt: ask candidate to introduce themselves
    opener = "Tell me about yourself and what interests you about this role."
    sessions[sid]["history"].append({"speaker":"agent", "text": opener})
    return StartResponse(session_id=sid, role=role, persona=persona, started_at=sessions[sid]["started_at"])

@app.post("/api/next", response_model=NextResponse)
async def next_endpoint(req: NextRequest):
    sid = req.session_id
    user_text = (req.user_text or "").strip()
    if sid not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    session = sessions[sid]
    if not session.get("active", True):
        return NextResponse(end_session=True, summary="Interview already finished.")

    role = session["role"]
    persona = session["persona"]
    resume = session.get("resume", "")
    history = session["history"]

    # add user's utterance if present
    if user_text:
        history.append({"speaker":"user", "text": user_text})
        session["turns"] += 1

    # Build a short conversation transcript for model
    # Keep limited recent context (last ~10 messages)
    recent = history[-12:]
    convo_text = ""
    for m in recent:
        convo_text += f"{m['speaker'].upper()}: {m['text']}\n"

    # Prepare decider input (tell model whether user just asked a question)
    user_asked_question = False
    if user_text:
        # Very simple heuristic to detect user questions: presence of '?' or starting with 'explain'/'how'/'what' etc.
        lower = user_text.lower()
        if "?" in user_text or lower.strip().startswith(("explain","how","what","why","define","difference","show","write","implement","give","compare")):
            user_asked_question = True

    # Build decider user message
    decider_user_msg = {
        "role":"user",
        "content": json.dumps({
            "role": role,
            "persona": persona,
            "resume_present": bool(resume),
            "recent_transcript": convo_text,
            "user_just_spoke": user_text,
            "user_asked_question": user_asked_question,
            "turns": session["turns"]
        })
    }

    # Ask the decider to choose action
    raw_decision = call_llm(DECIDER_SYSTEM_PROMPT, [decider_user_msg], temperature=0.6, max_tokens=400)

    # parse JSON robustly
    try:
        decision = json.loads(raw_decision)
    except Exception:
        # If the model didn't return clean JSON, try to extract a JSON substring
        import re
        m = re.search(r"\{.*\}", raw_decision, re.S)
        if m:
            try:
                decision = json.loads(m.group(0))
            except:
                decision = None
        else:
            decision = None

    if not decision or "action" not in decision:
        # Fallback simple behavior: if user asked question -> answer it; else ask a followup about user's last statement
        if user_asked_question and user_text:
            action = "answer_user"
            content = None
        else:
            action = "ask_followup"
            content = None
    else:
        action = decision.get("action")
        content = decision.get("content")
        should_score = decision.get("should_score", False)
        provided_score = decision.get("score")
        provided_feedback = decision.get("feedback")

    # If action == answer_user: generate an answer (if model didn't include content)
    if action == "answer_user":
        if not content:
            answer_prompt = f"You are an expert interviewer and teacher. Answer the user's question directly and concisely, matching the persona: {persona}.\n\nUser question:\n{user_text}"
            ans = call_llm(answer_prompt, [{"role":"user","content":user_text}], temperature=0.2, max_tokens=400)
            content = ans.strip()
        # record agent answer
        history.append({"speaker":"agent", "text": content})
        return NextResponse(answer_text=content, end_session=False)

    # If action == ask_followup: generate contextual follow-up (if content absent)
    if action == "ask_followup":
        if not content:
            # ask the model to produce a single specific follow-up to the user's last statement
            followup_prompt = f"You are an interviewer following up on the candidate's last statement. Persona: {persona}. Resume present: {bool(resume)}.\n\nRecent transcript:\n{convo_text}\n\nProduce ONE specific probing follow-up question (concise) that digs deeper into the candidate's last point."
            fu = call_llm(followup_prompt, [{"role":"user","content": "Generate one follow-up question."}], temperature=0.6, max_tokens=120)
            content = fu.strip().splitlines()[0]
        history.append({"speaker":"agent", "text": content})
        # Optionally provide feedback if decision asked for score
        fb = None
        if decision and decision.get("should_score"):
            # evaluate the previous user answer (last user message) quickly
            prev_user = user_text if user_text else ""
            if prev_user:
                eval_resp = call_llm(EVALUATE_SYSTEM_PROMPT, [{"role":"user","content": f"Question: {history[-2]['text'] if len(history)>=2 else 'N/A'}\nAnswer: {prev_user}"}], temperature=0.3, max_tokens=150)
                # parse SCORE / FEEDBACK lines
                score = None; feedback = None
                for line in eval_resp.splitlines():
                    if line.upper().startswith("SCORE:"):
                        try:
                            score = int(line.split(":",1)[1].strip())
                        except:
                            pass
                    if line.upper().startswith("FEEDBACK:"):
                        feedback = line.split(":",1)[1].strip()
                fb = feedback or None
        return NextResponse(next_question=content, feedback=fb, end_session=False)

    # If action == ask_new_topic: produce a new interview-style question
    if action == "ask_new_topic":
        if not content:
            new_topic_prompt = f"You are an interviewer for role {role} with persona {persona}. Based on the recent transcript:\n{convo_text}\n\nGenerate one concise new interview question to move the interview forward."
            content = call_llm(new_topic_prompt, [{"role":"user","content":"Generate new topic question."}], temperature=0.6, max_tokens=120).strip().splitlines()[0]
        history.append({"speaker":"agent", "text": content})
        return NextResponse(next_question=content, end_session=False)

    # If action == end_session
    if action == "end_session":
        summary = None
        try:
            # produce final summary using session history
            transcript = "\n".join([f"{m['speaker']}: {m['text']}" for m in history])
            summary = call_llm(SUMMARY_SYSTEM_PROMPT, [{"role":"user","content": transcript}], temperature=0.3, max_tokens=400)
        except:
            summary = "Thank you — session ended."
        session["active"] = False
        history.append({"speaker":"agent","text":"Interview ended."})
        return NextResponse(end_session=True, summary=summary)

    # default fallback: politely ask for clarification
    fallback = "I didn't quite catch that — could you rephrase or ask a question? Or say 'ask me a question' to continue the interview."
    history.append({"speaker":"agent", "text": fallback})
    return NextResponse(next_question=fallback, end_session=False)

@app.get("/api/health")
async def health():
    return {"status":"healthy", "groq_configured": bool(GROQ_API_KEY)}

# Serve static frontend if present (optional)
try:
    app.mount("/", StaticFiles(directory="../frontend/dist", html=True), name="frontend")
except Exception:
    pass
