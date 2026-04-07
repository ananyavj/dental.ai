import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(value?: string | null) {
  if (!value) return 'Just now'
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(value?: string | null) {
  if (!value) return 'Just now'
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function initials(name?: string | null) {
  if (!name) return 'DA'
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function formatRelativeMinutes(timestamp?: number) {
  if (!timestamp) return 'never'
  const delta = Math.max(1, Math.round((Date.now() - timestamp) / 60000))
  if (delta < 60) return `${delta} min ago`
  const hours = Math.round(delta / 60)
  return `${hours} hr ago`
}

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

export async function withTimeout<T>(promise: Promise<T>, fallback: T, timeout = 800): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>(resolve => {
      window.setTimeout(() => resolve(fallback), timeout)
    }),
  ])
}

export function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}
