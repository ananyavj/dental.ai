import { useState, useRef } from 'react'
import AppLayout from '../components/AppLayout'
import { specialtyChat } from '../lib/gemini'
import { SPECIALTY_QUICK_PROMPTS } from '../lib/data'
import { Mic, MicOff, Send, Loader2, ChevronRight } from 'lucide-react'

const SPECIALTIES = [
  {
    id: 'Endodontics',
    label: 'Endodontics',
    fullName: 'Endodontics',
    desc: 'RCT, pulp biology, rotary systems, retreatment',
    icon: '🦷',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    activeColor: 'bg-dental-blue border-dental-blue text-white',
  },
  {
    id: 'Periodontics',
    label: 'Periodontics',
    fullName: 'Periodontics',
    desc: 'Periodontitis staging, SRP, bone grafts, peri-implantitis',
    icon: '🔬',
    color: 'bg-green-50 border-green-200 text-green-700',
    activeColor: 'bg-green-600 border-green-600 text-white',
  },
  {
    id: 'Implantology',
    label: 'Implantology',
    fullName: 'Implantology',
    desc: 'Placement protocols, bone augmentation, sinus lift',
    icon: '⚙️',
    color: 'bg-purple-50 border-purple-200 text-purple-700',
    activeColor: 'bg-purple-600 border-purple-600 text-white',
  },
  {
    id: 'OralSurgery',
    label: 'Oral Surgery',
    fullName: 'Oral Surgery',
    desc: 'Extractions, impactions, facial space infections',
    icon: '🔪',
    color: 'bg-red-50 border-red-200 text-red-700',
    activeColor: 'bg-red-600 border-red-600 text-white',
  },
  {
    id: 'Orthodontics',
    label: 'Orthodontics',
    fullName: 'Orthodontics',
    desc: 'Cephalometrics, appliance selection, aligner therapy',
    icon: '📐',
    color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    activeColor: 'bg-indigo-600 border-indigo-600 text-white',
  },
  {
    id: 'Paediatric',
    label: 'Paediatric',
    fullName: 'Paediatric Dentistry',
    desc: 'Behaviour management, pulpotomy, space maintainers',
    icon: '👶',
    color: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    activeColor: 'bg-yellow-500 border-yellow-500 text-white',
  },
  {
    id: 'Prosthodontics',
    label: 'Prosthodontics',
    fullName: 'Prosthodontics',
    desc: 'Crowns, RPD, complete dentures, digital workflow',
    icon: '👑',
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    activeColor: 'bg-orange-500 border-orange-500 text-white',
  },
  {
    id: 'OralMedicine',
    label: 'Oral Medicine',
    fullName: 'Oral Medicine',
    desc: 'Mucosal lesions, PMDs, orofacial pain, TMJ',
    icon: '🩺',
    color: 'bg-teal-50 border-teal-200 text-teal-700',
    activeColor: 'bg-teal-600 border-teal-600 text-white',
  },
]

function SpecialtyCard({ specialty, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        border-2 rounded-xl p-4 text-left transition-all duration-200 hover:shadow-md
        ${isActive ? specialty.activeColor + ' shadow-md' : specialty.color + ' hover:scale-[1.02]'}
      `}
    >
      <div className="text-2xl mb-2">{specialty.icon}</div>
      <h3 className={`font-bold text-sm ${isActive ? 'text-white' : ''}`}>{specialty.label}</h3>
      <p className={`text-[10px] mt-1 ${isActive ? 'text-white/80' : 'opacity-70'}`}>{specialty.fullName}</p>
      <p className={`text-[10px] mt-1 leading-snug ${isActive ? 'text-white/70' : 'opacity-60'}`}>{specialty.desc}</p>
      {isActive && (
        <div className="flex items-center gap-1 mt-2">
          <div className="w-1.5 h-1.5 bg-green-300 rounded-full online-dot" />
          <span className="text-[10px] text-white/90">Online</span>
        </div>
      )}
    </button>
  )
}

function ChatPanel({ specialty, messages, onSend, loading }) {
  const [input, setInput] = useState('')
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)
  const chips = SPECIALTY_QUICK_PROMPTS[specialty.id] || []

  const handleSend = () => {
    if (!input.trim() || loading) return
    onSend(input.trim())
    setInput('')
  }

  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice input not supported. Use Chrome.')
      return
    }
    if (listening) { recRef.current?.stop(); setListening(false); return }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const r = new SR()
    r.continuous = false; r.interimResults = true; r.lang = 'en-IN'
    r.onresult = e => setInput(Array.from(e.results).map(x => x[0].transcript).join(''))
    r.onend = () => setListening(false)
    r.start(); recRef.current = r; setListening(true)
  }

  return (
    <div className="flex-1 flex flex-col bg-white border border-dental-border rounded-xl overflow-hidden">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-dental-border flex items-center gap-3">
        <span className="text-xl">{specialty.icon}</span>
        <div>
          <h3 className="text-sm font-bold text-dental-text">{specialty.label}</h3>
          <p className="text-[10px] text-dental-text-secondary">{specialty.desc}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 bg-green-500 rounded-full online-dot" />
          <span className="text-[10px] text-green-600 font-medium">Online</span>
        </div>
      </div>

      {/* Quick Prompt Chips */}
      <div className="px-4 py-2 border-b border-dental-border flex gap-2 flex-wrap">
        {chips.map(chip => (
          <button
            key={chip}
            onClick={() => setInput(chip)}
            className="text-[10px] bg-dental-surface border border-dental-border text-dental-text-secondary px-2.5 py-1 rounded-full hover:bg-dental-blue-light hover:text-dental-blue hover:border-dental-blue transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8 text-dental-text-secondary">
            <div className="text-3xl mb-3">{specialty.icon}</div>
            <p className="text-sm font-medium">{specialty.label} ready</p>
            <p className="text-xs mt-1 max-w-xs mx-auto">{specialty.desc}</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-3 text-xs leading-relaxed ${
              m.role === 'user'
                ? 'bg-dental-blue text-white'
                : 'bg-dental-surface text-dental-text border border-dental-border whitespace-pre-wrap'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-dental-surface border border-dental-border rounded-xl px-4 py-3 flex gap-1">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-dental-border flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={`Ask ${specialty.label} a clinical question...`}
          className="input-field flex-1 text-xs"
        />
        <button
          onClick={toggleVoice}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            listening ? 'bg-red-100 text-red-600' : 'bg-dental-surface text-dental-text-secondary hover:bg-dental-blue-light hover:text-dental-blue'
          }`}
        >
          {listening ? <MicOff size={14} /> : <Mic size={14} />}
        </button>
        <button onClick={handleSend} disabled={!input.trim() || loading} className="btn-primary w-8 h-8 p-0 justify-center">
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
    </div>
  )
}

export default function SpecialtyAIs() {
  const [activeSpecialty, setActiveSpecialty] = useState(null)
  const [chatSessions, setChatSessions] = useState({})
  const [loading, setLoading] = useState(false)

  const handleSelectSpecialty = (s) => {
    setActiveSpecialty(s)
    if (!chatSessions[s.id]) {
      setChatSessions(prev => ({ ...prev, [s.id]: [] }))
    }
  }

  const handleSend = async (message) => {
    if (!activeSpecialty) return
    const id = activeSpecialty.id
    const current = chatSessions[id] || []
    setChatSessions(prev => ({ ...prev, [id]: [...current, { role: 'user', content: message }] }))
    setLoading(true)
    try {
      const reply = await specialtyChat(id, current, message)
      setChatSessions(prev => ({ ...prev, [id]: [...(prev[id] || []), { role: 'assistant', content: reply }] }))
    } catch (err) {
      setChatSessions(prev => ({ ...prev, [id]: [...(prev[id] || []), { role: 'assistant', content: `Error: ${err.message}` }] }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-lg font-bold text-dental-text">Clinical Specialists</h1>
          <p className="text-xs text-dental-text-secondary mt-0.5">
            Eight named clinical assistants, each primed on specialty-specific evidence and protocols
          </p>
        </div>

        {/* Specialty Grid */}
        <div className="grid grid-cols-4 gap-3">
          {SPECIALTIES.map(s => (
            <SpecialtyCard
              key={s.id}
              specialty={s}
              isActive={activeSpecialty?.id === s.id}
              onClick={() => handleSelectSpecialty(s)}
            />
          ))}
        </div>

        {/* Chat Panel */}
        {activeSpecialty ? (
          <ChatPanel
            specialty={activeSpecialty}
            messages={chatSessions[activeSpecialty.id] || []}
            onSend={handleSend}
            loading={loading}
          />
        ) : (
          <div className="bg-white border border-dental-border rounded-xl p-10 text-center">
            <p className="text-dental-text-secondary text-sm">
              Select a clinical specialist above to begin a consultation
            </p>
            <p className="text-xs text-dental-text-secondary mt-1">
              Each assistant is primed on specialty-specific guidelines, protocols and clinical reasoning
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
