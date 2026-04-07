import { useState, useRef, useEffect, useCallback } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Send, Mic, MicOff, Plus, Paperclip, Image as ImageIcon,
  GraduationCap, Stethoscope, User, MessageSquare,
  Loader2, ChevronDown, ChevronRight, Trash2,
  Book, Zap, Bot,
} from 'lucide-react'
import AppLayout from '../components/AppLayout'
import PageTransition from '../components/PageTransition'
import { useAuth } from '../contexts/AuthContext'
import { loadChatWorkspace, persistChatWorkspace } from '../lib/appData'
import { specialtyChat, SPECIALTY_PROMPTS, API_KEY } from '../lib/gemini'

// ─── System Prompts ────────────────────────────────────────────────────────────
const STUDENT_SYSTEM_PROMPT = `You are DentalAI Study Assistant, an expert tutor for BDS and MDS dental students in India. You master all dental subjects: Oral Anatomy, Oral Physiology, Oral Biochemistry, General Pathology, Oral Pathology, Oral Microbiology, General Medicine, General Surgery, Oral Medicine & Radiology, Conservative Dentistry, Endodontics, Periodontics, Prosthodontics, Oral & Maxillofacial Surgery, Orthodontics, Pedodontics, and Community Dentistry.

When answering:
- Use clear headings and bullet points
- Include mnemonics wherever helpful
- Highlight KEY EXAM FACTS in bold
- Mention if a topic is 'frequently asked in entrance exams'
- Reference standard Indian dental textbooks (Shafer's, Orban's, Wheeler's, Berkovitz, Ash & Nelson) when relevant
- For drugs: always provide both adult AND pediatric dosages
- Be encouraging — students are stressed

When an image is uploaded (X-ray, histology slide, diagram), explain what it shows from an exam perspective. Format your answer beautifully with proper structure.`

const PRACTITIONER_SYSTEM_PROMPT = `You are DentalAI Clinical Co-pilot, an expert AI assistant for qualified dental practitioners. You provide evidence-based clinical guidance.

When answering:
- Lead with the clinical answer immediately — practitioners are busy
- Cite relevant guidelines (ADA, WHO, FDI, BDA) and landmark studies
- Format complex answers as: Assessment → Differential Diagnosis → Management Protocol → Prescriptions (with exact doses) → References
- For drug prescriptions: include dose, frequency, duration, contraindications, and Indian brand names where possible
- For drug interactions: state severity and clinical management  
- For procedures: give step-by-step protocol when asked
- Always end with a brief AI disclaimer

When an image is uploaded (X-ray, radiograph), provide a structured radiographic interpretation. Format: Imaging Type → Quality → Findings → Interpretation → Next Steps.`

const PATIENT_SYSTEM_PROMPT = `You are DentalAI Patient Guide, a friendly and empathetic dental health assistant for patients (not healthcare professionals).

When answering:
- Use simple, non-technical language that anyone can understand
- Avoid jargon — explain terms if you must use them
- Be reassuring but honest — never minimise serious symptoms
- Always recommend seeing a dentist for diagnosis and treatment
- For symptoms that could be serious (swelling, fever, difficulty breathing/swallowing), urge immediate professional care
- Use a warm, caring tone
- Keep answers concise — patients want clarity, not essays

Never provide specific diagnoses or prescribe medications. Your role is to educate and guide patients to seek appropriate professional care.`

// ─── Suggested Prompts per mode ───────────────────────────────────────────────
const SUGGESTED_PROMPTS = {
  student: [
    'Explain Vertucci classification with a mnemonic',
    'What are the key differences between ameloblastoma and OKC?',
    'How does fluoride prevent caries? Include mechanism',
    'Staging and grading of periodontitis (2017 classification)',
    'Compare GIC vs composite resin for Class V cavities',
  ],
  practitioner: [
    'Management protocol for acute periapical abscess',
    'Drug interaction: amoxicillin + warfarin — significance?',
    'NaOCl concentration and activation method for necrotic tooth',
    'When to extract vs retain a periodontally compromised tooth?',
    'Surgical flap design for lower impacted third molar — step by step',
  ],
  patient: [
    'Why are my gums bleeding when I brush?',
    'Is root canal treatment painful?',
    'How often should I visit the dentist?',
    'What foods should I avoid after a tooth extraction?',
    'My child has a wobbly tooth — what should I do?',
  ],
}

// ─── Specialty sub-modes (for practitioner) ───────────────────────────────────
const SPECIALTIES = [
  { id: 'none', label: 'General' },
  { id: 'Endo.ai', label: 'Endo' },
  { id: 'Perio.ai', label: 'Perio' },
  { id: 'Implant.ai', label: 'Implant' },
  { id: 'OralSurg.ai', label: 'Surgery' },
  { id: 'OrthoD.ai', label: 'Ortho' },
  { id: 'Pedo.ai', label: 'Pedo' },
  { id: 'Prostho.ai', label: 'Prostho' },
  { id: 'OralMed.ai', label: 'OralMed' },
]

// ─── Mode config ─────────────────────────────────────────────────────────────
const MODES = [
  { id: 'student', label: 'Student', icon: GraduationCap, color: 'text-success' },
  { id: 'practitioner', label: 'Practitioner', icon: Stethoscope, color: 'text-primary' },
  { id: 'patient', label: 'Patient', icon: User, color: 'text-text-muted-light' },
]

// ─── Markdown-like text renderer ─────────────────────────────────────────────
function ChatMarkdown({ text }) {
  const lines = text.split('\n')
  const rendered = []
  let inList = false
  let listItems = []

  const flushList = () => {
    if (listItems.length) {
      rendered.push(
        <ul key={`ul-${rendered.length}`} className="my-1.5 pl-5 space-y-0.5">
          {listItems.map((item, i) => (
            <li key={i} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
          ))}
        </ul>
      )
      listItems = []
    }
    inList = false
  }

  const formatInline = (str) =>
    str
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="font-family:monospace;font-size:0.75rem;background:#F3F4F6;padding:2px 4px;border-radius:4px">$1</code>')

  lines.forEach((line, i) => {
    const trimmed = line.trim()

    if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      if (inList) flushList()
      const level = trimmed.startsWith('### ') ? 3 : trimmed.startsWith('## ') ? 2 : 1
      const text = trimmed.replace(/^#+\s/, '')
      rendered.push(
        <p key={i} className={`font-semibold mt-3 mb-1 ${level === 1 ? 'text-base' : 'text-sm'}`}
          dangerouslySetInnerHTML={{ __html: formatInline(text) }} />
      )
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.match(/^\d+\.\s/)) {
      inList = true
      listItems.push(trimmed.replace(/^[-•]\s|^\d+\.\s/, ''))
    } else if (trimmed === '') {
      if (inList) flushList()
      rendered.push(<div key={i} className="h-1.5" />)
    } else {
      if (inList) flushList()
      rendered.push(
        <p key={i} className="text-sm leading-relaxed mb-1"
          dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />
      )
    }
  })
  if (inList) flushList()

  return <div className="chat-prose">{rendered}</div>
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'

  return (
    <Motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot size={14} className="text-white" />
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[80%] rounded-[12px] px-4 py-2.5 ${
        isUser
          ? 'bg-primary text-white rounded-tr-[4px]'
          : 'bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-tl-[4px]'
      }`}>
        {isUser ? (
          <p className="text-sm leading-relaxed">{msg.content}</p>
        ) : (
          <div className="text-text-primary-light dark:text-text-primary-dark">
            <ChatMarkdown text={msg.content} />
          </div>
        )}
        {msg.image && (
          <img
            src={msg.image}
            alt="Uploaded"
            className="max-w-xs rounded-lg mt-2 border border-white/20"
          />
        )}
      </div>
    </Motion.div>
  )
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
        <Bot size={14} className="text-white" />
      </div>
      <div className="bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-[12px] rounded-tl-[4px] px-4 py-3">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  )
}

// ─── Conversation sidebar ─────────────────────────────────────────────────────
function ConversationSidebar({ conversations, activeId, onSelect, onNew }) {
  return (
    <div className="w-[220px] flex-shrink-0 border-r border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark flex flex-col h-full">
      <div className="p-3 border-b border-border-light dark:border-border-dark">
        <button
          onClick={onNew}
          className="btn-primary w-full justify-center text-xs"
        >
          <Plus size={13} /> New chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {conversations.map(conv => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`w-full text-left px-3 py-2 rounded-[8px] text-xs transition-all duration-150 ${
              conv.id === activeId
                ? 'bg-primary-50 text-primary'
                : 'text-text-muted-light dark:text-text-muted-dark hover:bg-white dark:hover:bg-surface-dark hover:text-text-primary-light dark:hover:text-text-primary-dark'
            }`}
          >
            <p className="font-medium line-clamp-2">{conv.title}</p>
            <p className="text-2xs mt-0.5 opacity-70">{conv.mode} · {conv.time}</p>
          </button>
        ))}
        {conversations.length === 0 && (
          <p className="text-xs text-text-muted-light dark:text-text-muted-dark text-center py-8 px-3">
            No conversations yet. Start a new chat!
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Main Chatbot ─────────────────────────────────────────────────────────────
export default function Chatbot() {
  const { role: userRole, profile } = useAuth()

  // Default mode based on user role
  const defaultMode = userRole === 'student' ? 'student' : userRole === 'patient' ? 'patient' : 'practitioner'

  const [mode, setMode] = useState(defaultMode)
  const [specialty, setSpecialty] = useState('none')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [pendingImage, setPendingImage] = useState(null) // { base64, mimeType, preview }
  const [conversations, setConversations] = useState([])
  const [activeConvId, setActiveConvId] = useState(null)
  const [showSuggestions, setShowSuggestions] = useState(true)

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const recognitionRef = useRef(null)

  const hasApiKey = API_KEY && API_KEY !== 'your_gemini_api_key_here'

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    const workspace = loadChatWorkspace(profile)
    setConversations(workspace)
    setActiveConvId(workspace[0]?.id || null)
    setMessages(workspace[0]?.messages || [])
  }, [profile])

  useEffect(() => {
    if (!activeConvId) return
    const activeConversation = conversations.find(item => item.id === activeConvId)
    if (activeConversation?.messages) {
      setMessages(activeConversation.messages)
    }
  }, [activeConvId, conversations])

  useEffect(() => {
    if (!activeConvId || messages.length === 0) return
    const modeLabel = MODES.find(item => item.id === mode)?.label || 'Practitioner'
    const updated = persistChatWorkspace({ conversationId: activeConvId, mode: modeLabel, messages })
    setConversations(loadChatWorkspace(profile))
    if (!updated.find(item => item.id === activeConvId)) return
  }, [activeConvId, messages, mode, profile])

  // Auto-resize textarea
  const resizeTextarea = () => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 150) + 'px'
  }

  // ── Build system prompt ──
  const getSystemPrompt = useCallback(() => {
    if (mode === 'student') return STUDENT_SYSTEM_PROMPT
    if (mode === 'patient') return PATIENT_SYSTEM_PROMPT
    // Practitioner — check specialty
    if (specialty !== 'none' && SPECIALTY_PROMPTS[specialty]) return SPECIALTY_PROMPTS[specialty]
    return PRACTITIONER_SYSTEM_PROMPT
  }, [mode, specialty])

  // ── Send Message ──
  const sendMessage = async (text, imageData) => {
    if (!text.trim() && !imageData) return
    if (isLoading) return

    const userMsg = {
      role: 'user',
      content: text.trim(),
      image: imageData?.preview || null,
      id: Date.now(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setPendingImage(null)
    setShowSuggestions(false)
    setIsLoading(true)

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    try {
      let response = ''
      if (!hasApiKey) {
        response = `Demo response for ${MODES.find(item => item.id === mode)?.label || 'Practitioner'} mode:\n\nI saved your question in the workspace and generated a graceful fallback because Gemini is not configured yet. Add \`VITE_GEMINI_API_KEY\` to enable live model responses.`
      } else {
        const historyForApi = messages.map(m => ({ role: m.role, content: m.content }))
        const specialtyName = specialty !== 'none' ? specialty : 'Endo.ai'
        response = await specialtyChat(
          specialtyName,
          historyForApi,
          text.trim(),
          getSystemPrompt()
        )
      }
      setMessages(prev => [...prev, { role: 'assistant', content: response, id: Date.now() + 1 }])
    } catch (err) {
      const errMsg = err.message === 'GEMINI_KEY_MISSING'
        ? 'API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.'
        : `AI error: ${err.message}`
      toast.error(errMsg)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I encountered an error: ${errMsg}`,
        id: Date.now() + 1,
        error: true,
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = () => sendMessage(input, pendingImage)

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Voice input ──
  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('Voice input not supported. Please use Chrome.')
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = 'en-IN'
    rec.onresult = e => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('')
      setInput(transcript)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => { setListening(false); toast.error('Voice recognition failed') }
    rec.start()
    recognitionRef.current = rec
    setListening(true)
    toast('Listening...', { icon: '🎤' })
  }

  // ── Image upload ──
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large. Max 5MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target.result.split(',')[1]
      setPendingImage({ base64, mimeType: file.type, preview: ev.target.result })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // ── New conversation ──
  const startNewConversation = () => {
    setMessages([])
    setShowSuggestions(true)
    setInput('')
    setPendingImage(null)
    const newId = `conv-${Date.now()}`
    setActiveConvId(newId)
    const next = [
      { id: newId, title: 'New conversation', mode: MODES.find(m => m.id === mode)?.label || 'General', time: 'Now' },
      ...conversations,
    ]
    setConversations(next)
    persistChatWorkspace({ conversationId: newId, mode: MODES.find(m => m.id === mode)?.label || 'General', messages: [] })
  }

  // ── Mode switch ──
  const switchMode = (newMode) => {
    setMode(newMode)
    setSpecialty('none')
    setShowSuggestions(true)
  }

  const suggestions = SUGGESTED_PROMPTS[mode] || SUGGESTED_PROMPTS.practitioner
  const currentMode = MODES.find(m => m.id === mode)

  return (
    <AppLayout>
      <div className="flex h-full">
        {/* Conversation History Sidebar (hidden on mobile) */}
        <div className="hidden lg:flex">
          <ConversationSidebar
            conversations={conversations}
            activeId={activeConvId}
            onSelect={setActiveConvId}
            onNew={startNewConversation}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mode Switcher Header */}
          <div className="border-b border-border-light dark:border-border-dark bg-white dark:bg-surface-dark px-4 py-3 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              {MODES.map(({ id, label, icon }) => {
                // Hide modes that don't apply to this user role
                if (id === 'practitioner' && userRole === 'patient') return null
                if (id === 'student' && userRole === 'patient') return null
                return (
                  <button
                    key={id}
                    onClick={() => switchMode(id)}
                    className={`mode-pill ${mode === id ? 'active' : ''}`}
                  >
                    {icon({ size: 13 })}
                    {label}
                  </button>
                )
              })}
            </div>

            {/* Specialty sub-selector — shown only in practitioner mode */}
            {mode === 'practitioner' && (
              <div className="flex items-center gap-1.5 flex-wrap border-l border-border-light dark:border-border-dark pl-3">
                {SPECIALTIES.map(sp => (
                  <button
                    key={sp.id}
                    onClick={() => setSpecialty(sp.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-150 ${
                      specialty === sp.id
                        ? 'bg-primary text-white border-primary'
                        : 'border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted-dark hover:border-primary/40 hover:text-primary'
                    }`}
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
            {/* Empty state */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center space-y-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <Bot size={22} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-text-primary-light dark:text-text-primary-dark">
                    DentalAI {currentMode?.label} Mode
                  </h2>
                  <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1 max-w-sm">
                    {mode === 'student' && "Your AI study tutor for BDS & MDS. Ask anything — I'll explain with mnemonics and exam tips."}
                    {mode === 'practitioner' && "Your clinical co-pilot. Evidence-based answers, drug protocols, and step-by-step procedures."}
                    {mode === 'patient' && "Ask me anything about your dental health. I'll explain in simple terms and help you understand your options."}
                  </p>
                </div>

                {/* API Key warning */}
                {!hasApiKey && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-[8px] p-3 max-w-sm">
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      <strong>API Key Required:</strong> Add <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">VITE_GEMINI_API_KEY</code> to your .env file to enable AI responses.
                    </p>
                  </div>
                )}

                {/* Suggested prompts */}
                {showSuggestions && (
                  <div className="w-full max-w-xl">
                    <p className="text-xs font-medium text-text-muted-light dark:text-text-muted-dark mb-2">Try asking:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {suggestions.slice(0, 4).map((s, i) => (
                        <button
                          key={i}
                          onClick={() => { setInput(s); textareaRef.current?.focus() }}
                          className="text-left px-3 py-2.5 rounded-[8px] border border-border-light dark:border-border-dark text-sm text-text-muted-light dark:text-text-muted-dark hover:border-primary/40 hover:text-primary hover:bg-primary-50/50 dark:hover:bg-primary/5 transition-all duration-150"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Message list */}
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}

            {/* Typing indicator */}
            {isLoading && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested chips above input (desktop) */}
          {messages.length > 0 && !isLoading && (
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
              {suggestions.slice(0, 3).map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted-dark hover:border-primary/40 hover:text-primary hover:bg-primary-50/50 dark:hover:bg-primary/5 transition-all duration-150 whitespace-nowrap flex-shrink-0"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Pending image preview */}
          {pendingImage && (
            <div className="px-4 pb-2">
              <div className="relative inline-block">
                <img src={pendingImage.preview} alt="Pending" className="h-16 rounded-[8px] border border-border-light dark:border-border-dark" />
                <button
                  onClick={() => setPendingImage(null)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-danger text-white rounded-full flex items-center justify-center text-xs"
                >×</button>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-border-light dark:border-border-dark bg-white dark:bg-surface-dark px-4 py-3">
            <div className="flex items-end gap-2">
              {/* Attachment */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 flex items-center justify-center rounded-[8px] text-text-muted-light dark:text-text-muted-dark hover:bg-bg-light dark:hover:bg-border-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-all flex-shrink-0"
                title="Attach image (X-ray, diagram)"
              >
                <Paperclip size={16} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => { setInput(e.target.value); resizeTextarea() }}
                onKeyDown={handleKeyDown}
                placeholder={
                  mode === 'student' ? 'Ask about any dental topic, subject, or MCQ...' :
                  mode === 'patient' ? 'Ask your dental health question...' :
                  'Ask a clinical question, drug protocol, or procedure...'
                }
                rows={1}
                className="flex-1 resize-none text-sm bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-[8px] px-3 py-2 text-text-primary-light dark:text-text-primary-dark placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all leading-relaxed max-h-[150px]"
                style={{ minHeight: '38px' }}
              />

              {/* Voice */}
              <button
                onClick={toggleVoice}
                className={`w-9 h-9 flex items-center justify-center rounded-[8px] transition-all flex-shrink-0 ${
                  listening
                    ? 'bg-red-100 text-danger border border-red-200'
                    : 'text-text-muted-light dark:text-text-muted-dark hover:bg-bg-light dark:hover:bg-border-dark hover:text-text-primary-light dark:hover:text-text-primary-dark'
                }`}
                title={listening ? 'Stop recording' : 'Voice input'}
              >
                {listening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              {/* Send */}
              <button
                onClick={handleSend}
                disabled={(!input.trim() && !pendingImage) || isLoading}
                className="w-9 h-9 flex items-center justify-center rounded-[8px] bg-primary text-white hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
                title="Send message"
              >
                {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </div>

            <p className="text-center text-2xs text-text-muted-light dark:text-text-muted-dark mt-2">
              AI-generated responses — always verify with clinical judgement. Not a substitute for professional advice.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
