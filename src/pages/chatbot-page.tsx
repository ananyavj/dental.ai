import { Bot, GraduationCap, MessageSquarePlus, Send, Stethoscope, UserRound } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { PageHeader } from '../components/common/page-header'
import { useAuth } from '../contexts/auth-context'
import { getChatConversations, upsertConversation } from '../lib/data-client'
import { chatWithGemini } from '../lib/gemini'
import { formatDateTime } from '../lib/utils'
import type { ChatMode, Conversation, ConversationMessage } from '../types'

type ChatLocationState = {
  mode?: ChatMode
  title?: string
  prompt?: string
}

const modeOptions: Array<{
  value: ChatMode
  label: string
  helper: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { value: 'practitioner', label: 'Practitioner', helper: 'Concise chairside guidance', icon: Stethoscope },
  { value: 'student', label: 'Student', helper: 'Exam-first explanations', icon: GraduationCap },
  { value: 'patient', label: 'Patient', helper: 'Plain-language education', icon: UserRound },
]

function emptyConversation(mode: ChatMode): Conversation {
  return {
    id: crypto.randomUUID(),
    title: mode === 'practitioner' ? 'New practitioner chat' : mode === 'student' ? 'New student chat' : 'New patient guide chat',
    mode: mode === 'practitioner' ? 'Practitioner' : mode === 'student' ? 'Student' : 'Patient',
    updated_at: new Date().toISOString(),
    messages: [],
  }
}

function resolveDefaultMode(role?: string | null): ChatMode {
  if (role === 'student') return 'student'
  if (role === 'patient') return 'patient'
  return 'practitioner'
}

function MessageContent({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  if (role === 'user') {
    return <p className="whitespace-pre-wrap text-sm leading-6">{content}</p>
  }

  return (
    <div className="rich-prose">
      {content.split('\n').map((line, index) => (
        <p key={index}>{line}</p>
      ))}
    </div>
  )
}

export default function ChatbotPage() {
  const { profile } = useAuth()
  const location = useLocation()
  const state = (location.state || {}) as ChatLocationState
  const [mode, setMode] = useState<ChatMode>(() => state.mode || resolveDefaultMode(profile?.role))
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const hydratedRef = useRef(false)
  const consumeStateRef = useRef(false)

  useEffect(() => {
    setMode(state.mode || resolveDefaultMode(profile?.role))
  }, [profile?.role, state.mode])

  useEffect(() => {
    if (!profile) return
    void getChatConversations(profile).then(items => {
      setConversations(items)
      setActiveId(current => current || items[0]?.id || emptyConversation(resolveDefaultMode(profile.role)).id)
      hydratedRef.current = true
    })
  }, [profile])

  const activeConversation = useMemo(() => {
    const existing = conversations.find(item => item.id === activeId)
    if (existing) return existing
    return conversations[0] ?? emptyConversation(mode)
  }, [activeId, conversations, mode])

  const persistConversation = useCallback(async (conversation: Conversation, messages: ConversationMessage[]) => {
    if (!profile) return
    const nextConversation = {
      ...conversation,
      mode: mode === 'practitioner' ? 'Practitioner' : mode === 'student' ? 'Student' : 'Patient',
      updated_at: new Date().toISOString(),
      messages,
    }
    setConversations(current => [nextConversation, ...current.filter(item => item.id !== conversation.id)])
    setActiveId(conversation.id)
    await upsertConversation(profile, nextConversation, messages)
  }, [mode, profile])

  const sendPrompt = useCallback(async (prompt: string, seededTitle?: string, targetConversation?: Conversation) => {
    if (!profile || !prompt.trim()) return
    setSending(true)

    const baseConversation =
      targetConversation ??
      conversations.find(item => item.id === activeId) ??
      {
        ...emptyConversation(mode),
        id: activeId || crypto.randomUUID(),
        title: seededTitle || prompt.slice(0, 50),
      }

    const nextMessages: ConversationMessage[] = [
      ...(baseConversation.messages || []),
      {
        id: crypto.randomUUID(),
        role: 'user',
        content: prompt.trim(),
        created_at: new Date().toISOString(),
      },
    ]

    await persistConversation(
      {
        ...baseConversation,
        title: seededTitle || baseConversation.title || prompt.slice(0, 50),
      },
      nextMessages
    )

    try {
      const reply = await chatWithGemini(
        mode,
        prompt,
        nextMessages.map(item => ({ role: item.role, content: item.content }))
      )
      const fullMessages = [
        ...nextMessages,
        {
          id: crypto.randomUUID(),
          role: 'assistant' as const,
          content: reply,
          created_at: new Date().toISOString(),
        },
      ]
      await persistConversation(
        {
          ...baseConversation,
          title: seededTitle || baseConversation.title || prompt.slice(0, 50),
        },
        fullMessages
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to send message')
    } finally {
      setSending(false)
      setMessage('')
    }
  }, [activeId, conversations, mode, persistConversation, profile])

  useEffect(() => {
    if (!hydratedRef.current || consumeStateRef.current || !state.prompt) return
    consumeStateRef.current = true
    const title = state.title || state.prompt.slice(0, 60)
    const seeded = emptyConversation(state.mode || mode)
    setMode(state.mode || mode)
    setActiveId(seeded.id)
    setConversations(current => [seeded, ...current])
    void sendPrompt(state.prompt, title, seeded)
  }, [mode, sendPrompt, state.mode, state.prompt, state.title])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Chatbot"
        title="Three-mode dental AI workspace"
        description="Practitioner, Student, and Patient modes share the same fast-loading shell. Conversations persist to Supabase when available and fall back cleanly when not."
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              const draft = emptyConversation(mode)
              setConversations(current => [draft, ...current])
              setActiveId(draft.id)
            }}
          >
            <MessageSquarePlus className="h-4 w-4" /> New chat
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <Card className="overflow-hidden">
          <CardContent className="space-y-4 p-4">
            <div className="grid gap-2">
              {modeOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMode(option.value)}
                  className={`rounded-2xl border p-3 text-left transition duration-150 ${
                    mode === option.value ? 'border-primary bg-primary/8 text-foreground' : 'border-border bg-muted/30 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <option.icon className="h-4 w-4" />
                    <span className="font-medium">{option.label}</span>
                  </div>
                  <p className="mt-1 text-xs">{option.helper}</p>
                </button>
              ))}
            </div>

            <div className="space-y-2 border-t border-border pt-4">
              {conversations.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveId(item.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition duration-150 ${
                    activeConversation.id === item.id ? 'border-primary bg-primary/8' : 'border-border bg-card'
                  }`}
                >
                  <p className="line-clamp-2 text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.mode} • {formatDateTime(item.updated_at)}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="flex min-h-[70vh] flex-col p-0">
            <div className="border-b border-border px-5 py-4">
              <p className="text-sm font-semibold">{activeConversation.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {mode === 'practitioner' ? 'Clinical co-pilot' : mode === 'student' ? 'Exam and viva support' : 'Patient-friendly guidance'}
              </p>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {(activeConversation.messages || []).length ? (
                (activeConversation.messages || []).map(item => (
                  <div key={item.id} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-3xl rounded-2xl px-4 py-3 ${
                      item.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border bg-muted/30 text-foreground'
                    }`}>
                      {item.role === 'assistant' ? (
                        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <Bot className="h-3.5 w-3.5" />
                          dental.ai
                        </div>
                      ) : null}
                      <MessageContent role={item.role} content={item.content} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center">
                  <div className="max-w-md space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Bot className="h-5 w-5" />
                    </div>
                    <p className="text-lg font-semibold">Start a fast new conversation</p>
                    <p className="text-sm text-muted-foreground">
                      Ask a chairside question, revise for exams, or explain something simply for a patient.
                    </p>
                  </div>
                </div>
              )}

              {sending ? (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    Generating reply...
                  </div>
                </div>
              ) : null}
            </div>

            <form
              className="border-t border-border px-5 py-4"
              onSubmit={event => {
                event.preventDefault()
                void sendPrompt(message)
              }}
            >
              <div className="flex items-end gap-3">
                <Input
                  value={message}
                  onChange={event => setMessage(event.target.value)}
                  placeholder={mode === 'student' ? 'Ask for a concise exam explanation...' : 'Ask dental.ai anything...'}
                  className="h-12"
                />
                <Button type="submit" size="icon" disabled={sending || !message.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
