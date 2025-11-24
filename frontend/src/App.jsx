import { useState, useRef, useEffect } from 'react'

function App() {
  const [stage, setStage] = useState('setup')
  const [role, setRole] = useState('software_engineer')
  const [persona, setPersona] = useState('neutral')
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [interviewEnded, setInterviewEnded] = useState(false)
  const [summary, setSummary] = useState('')
  const [resume, setResume] = useState(null)
  const [resumeText, setResumeText] = useState('')
  const [timer, setTimer] = useState(0)
  const [interviewerName, setInterviewerName] = useState('')
  const [companyName, setCompanyName] = useState('TechCorp')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')

  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)
  const timerRef = useRef(null)
  const fileInputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const names = ['Sarah Chen', 'Michael Rodriguez', 'Emily Thompson', 'David Kumar', 'Jessica Williams']
    setInterviewerName(names[Math.floor(Math.random() * names.length)])
  }, [])

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setUserInput(transcript)
        setIsListening(false)
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (stage === 'interview' && !interviewEnded) {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [stage, interviewEnded])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      setResume(file)
      const text = await file.text()
      setResumeText(text)
    }
  }

  const startInterview = async () => {
    setIsLoading(true)
    try {

      const formData = new FormData()   // <-- YOU WERE MISSING THIS

      formData.append('role', role)
      formData.append('persona', persona)
      formData.append('name', fullName)
      formData.append('email', email)

      if (resume) {
        formData.append('resume', resume)
      }

      const response = await fetch('/api/start', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) throw new Error('Failed to start interview')
      
      const data = await response.json()
      setSessionId(data.session_id)
      setStage('interview')
      setTimer(0)
      
      getNextQuestion(data.session_id, '')
    } catch (error) {
      console.error('Error starting interview:', error)
      alert('Failed to start interview. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }


  const getNextQuestion = async (sid, userText) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          session_id: sid || sessionId, 
          user_text: userText 
        })
      })
      
      if (!response.ok) throw new Error('Failed to get next question')
      
      const data = await response.json()
      
      if (data.feedback) {
        setMessages(prev => [...prev, {
          type: 'feedback',
          content: data.feedback
        }])
      }
      
      if (data.end_session) {
        setInterviewEnded(true)
        setSummary(data.summary || 'Interview completed. Thank you for participating!')
        setMessages(prev => [...prev, {
          type: 'agent',
          content: '🎉 Interview Complete! Thank you for your time today.'
        }])
      } else if (data.next_question) {
        setMessages(prev => [...prev, {
          type: 'agent',
          content: data.next_question
        }])
      }
    } catch (error) {
      console.error('Error getting next question:', error)
      alert('Failed to communicate with server. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = () => {
    if (!userInput.trim() || isLoading || interviewEnded) return
    
    setMessages(prev => [...prev, {
      type: 'user',
      content: userInput
    }])
    
    getNextQuestion(sessionId, userInput)
    setUserInput('')
  }

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const resetInterview = () => {
    setStage('setup')
    setSessionId(null)
    setMessages([])
    setUserInput('')
    setInterviewEnded(false)
    setSummary('')
    setTimer(0)
    setResume(null)
    setResumeText('')
  }

  if (stage === 'setup') {
    return (
      <div className="app">
        <div className="container">
          <div className="setup-card">
            <div className="logo-section">
              <div className="company-logo">
                <div className="logo-icon">💼</div>
                <h1>{companyName}</h1>
              </div>
              <p className="welcome-text">Welcome to your mock interview session</p>
            </div>
            
            <div className="form-section">
              <div className="form-group">
                <label htmlFor="role">
                  <span className="label-icon">👔</span>
                  Position Applying For:
                </label>
                <select 
                  id="role"
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  className="select-input"
                >
                  <option value="software_engineer">Software Engineer</option>
                  <option value="sales">Sales Representative</option>
                  <option value="retail">Retail Associate</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="persona">
                  <span className="label-icon">👤</span>
                  Interviewer Style:
                </label>
                <select 
                  id="persona"
                  value={persona} 
                  onChange={(e) => setPersona(e.target.value)}
                  className="select-input"
                >
                  <option value="neutral">Professional & Balanced</option>
                  <option value="confused">Inquisitive & Detail-Oriented</option>
                  <option value="efficient">Direct & Time-Conscious</option>
                  <option value="chatty">Friendly & Conversational</option>
                </select>
              </div>

              {/* NAME FIELD */}
              <div className="form-group">
                <label>
                  <span className="label-icon">🧑</span>
                  Full Name:
                </label>
                <input 
                  type="text"
                  className="text-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              {/* EMAIL FIELD */}
              <div className="form-group">
                <label>
                  <span className="label-icon">📧</span>
                  Email:
                </label>
                <input 
                  type="email"
                  className="text-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>


              <div className="form-group">
                <label>
                  <span className="label-icon">📄</span>
                  Upload Your Resume (Optional):
                </label>
                <div className="file-upload-container">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt"
                    onChange={handleFileChange}
                    className="file-input"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload" className="file-upload-label">
                    <span className="upload-icon">📎</span>
                    {resume ? resume.name : 'Choose .txt file or drag here'}
                  </label>
                  {resume && (
                    <button 
                      onClick={() => { setResume(null); setResumeText(''); if(fileInputRef.current) fileInputRef.current.value = '' }}
                      className="remove-file-btn"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p className="helper-text">
                  Upload a plain text (.txt) resume for personalized questions based on your experience
                </p>
              </div>

              <button 
                onClick={startInterview} 
                disabled={isLoading}
                className="btn btn-primary btn-large"
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Starting Interview...
                  </>
                ) : (
                  <>
                    <span>🎯</span>
                    Begin Interview
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app interview-mode">
      <div className="interview-container">
        <div className="interview-header-bar">
          <div className="header-left">
            <div className="company-badge">
              <span className="company-icon">💼</span>
              <span>{companyName}</span>
            </div>
            <div className="interview-meta">
              <span className="interviewer-name">
                <span className="meta-icon">👤</span>
                {interviewerName}
              </span>
              <span className="divider">•</span>
              <span className="role-display">{role.replace('_', ' ')}</span>
            </div>
          </div>
          <div className="header-right">
            <div className="timer-display">
              <span className="timer-icon">⏱️</span>
              <span className="timer-value">{formatTime(timer)}</span>
            </div>
            <button onClick={resetInterview} className="btn btn-end">
              End Interview
            </button>
          </div>
        </div>

        <div className="interview-body">
          <div className="messages-area">
            <div className="messages-container">
              <div className="interview-start-notice">
                <p>📹 Interview Recording Started • {new Date().toLocaleDateString()}</p>
              </div>
              
              {messages.map((msg, index) => (
                <div key={index} className={`message-wrapper ${msg.type}`}>
                  {msg.type === 'agent' && (
                    <div className="message-avatar">
                      <div className="avatar-circle interviewer">
                        {interviewerName.charAt(0)}
                      </div>
                      <span className="avatar-name">{interviewerName}</span>
                    </div>
                  )}
                  {msg.type === 'user' && (
                    <div className="message-avatar user-avatar">
                      <span className="avatar-name">You</span>
                      <div className="avatar-circle user">
                        Y
                      </div>
                    </div>
                  )}
                  <div className="message-content-wrapper">
                    <div className={`message-bubble ${msg.type}`}>
                      {msg.content}
                    </div>
                    {msg.type === 'feedback' && (
                      <div className="feedback-label">💡 Feedback</div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="message-wrapper agent">
                  <div className="message-avatar">
                    <div className="avatar-circle interviewer">
                      {interviewerName.charAt(0)}
                    </div>
                    <span className="avatar-name">{interviewerName}</span>
                  </div>
                  <div className="message-content-wrapper">
                    <div className="message-bubble agent typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {interviewEnded ? (
            <div className="summary-panel">
              <div className="summary-header">
                <h3>📊 Interview Performance Summary</h3>
                <p className="summary-time">Total Duration: {formatTime(timer)}</p>
              </div>
              <div className="summary-content">{summary}</div>
              <div className="summary-actions">
                <button onClick={resetInterview} className="btn btn-primary">
                  Start New Interview
                </button>
              </div>
            </div>
          ) : (
            <div className="input-panel">
              <div className="input-container">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your answer here... (Press Enter to send)"
                  className="text-input"
                  rows="3"
                  disabled={isLoading}
                />
                <div className="input-actions">
                  <button
                    onClick={toggleVoiceInput}
                    className={`btn btn-voice ${isListening ? 'listening' : ''}`}
                    disabled={isLoading}
                    title="Voice Input"
                  >
                    {isListening ? (
                      <>
                        <span className="pulse-dot"></span>
                        Listening...
                      </>
                    ) : (
                      <>
                        🎤 Voice
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!userInput.trim() || isLoading}
                    className="btn btn-send"
                  >
                    Send Answer →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
