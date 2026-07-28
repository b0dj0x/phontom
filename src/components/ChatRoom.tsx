import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, LogOut, Timer, Ghost } from 'lucide-react'
import type { ChatMessage } from '../types'

interface ChatRoomProps {
  roomId: string
  messages: ChatMessage[]
  onSend: (text: string, ttl?: number) => void
  onTyping: () => void
  onDisconnect: () => void
  typing: boolean
  defaultTTL: number | null
}

export default function ChatRoom({
  roomId,
  messages,
  onSend,
  onTyping,
  onDisconnect,
  typing,
  defaultTTL,
}: ChatRoomProps) {
  const [input, setInput] = useState('')
  const [, forceUpdate] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!defaultTTL) return
    const interval = setInterval(() => forceUpdate(n => n + 1), 500)
    return () => clearInterval(interval)
  }, [defaultTTL])

  const visibleMessages = messages.filter(
    msg => !msg.selfDestructAt || msg.selfDestructAt > Date.now()
  )

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    onSend(text, defaultTTL ?? undefined)
    setInput('')
    inputRef.current?.focus()
  }

  return (
    <div className="relative z-10 flex flex-col h-screen max-h-screen">
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="border-b border-zinc-800/80 bg-[#030609]/80 backdrop-blur-xl px-4 sm:px-6 py-3 flex items-center justify-between shrink-0"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00f0ff]" />
            <div className="absolute -inset-1 rounded-full bg-[#00f0ff]/20 animate-ping" />
          </div>
          <div>
            <span className="text-[#00f0ff] text-xs font-mono font-bold tracking-wider uppercase">Connected</span>
            <span className="text-zinc-600 text-[10px] font-mono ml-2 hidden sm:inline">e2e</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hidden sm:block">
            <span className="font-mono text-[10px] text-zinc-500 tracking-widest">{roomId}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDisconnect}
            title="Disconnect & destroy"
            className="hover:bg-red-500/10 group"
          >
            <LogOut className="w-4 h-4 text-zinc-500 group-hover:text-red-400 transition-colors" />
          </Button>
        </div>
      </motion.header>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="mx-auto max-w-2xl xl:max-w-3xl">
          <AnimatePresence mode="popLayout">
            {visibleMessages.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center py-24"
              >
                <div className="relative mb-5">
                  <div className="absolute -inset-4 bg-[#00f0ff]/5 rounded-full blur-2xl" />
                  <div className="relative w-16 h-16 rounded-2xl bg-[#030609] border border-zinc-800 flex items-center justify-center">
                    <Ghost className="w-7 h-7 text-zinc-600" />
                  </div>
                </div>
                <p className="text-zinc-400 font-mono font-bold text-sm tracking-wider uppercase">No messages</p>
                <p className="text-zinc-600 text-xs font-mono mt-2">end-to-end encrypted</p>
              </motion.div>
            )}

            {visibleMessages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
                className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'} mb-4`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[80%] lg:max-w-[70%] rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 ${
                    msg.sender === 'me'
                      ? 'rounded-tr-sm bg-[#00f0ff]/10 border border-[#00f0ff]/25'
                      : 'rounded-tl-sm bg-zinc-800/40 border border-zinc-700/30'
                  }`}
                >
                  <p className={`text-sm sm:text-base leading-relaxed break-words font-medium ${
                    msg.sender === 'me' ? 'text-white' : 'text-zinc-100'
                  }`}>
                    {msg.text}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] sm:text-[11px] font-mono ${
                      msg.sender === 'me' ? 'text-white/25' : 'text-white/15'
                    }`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.selfDestructAt && (
                      <span className="text-[10px] sm:text-[11px] font-mono text-[#ff3366]/60 flex items-center gap-1">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 6v6l4 2" />
                        </svg>
                        {Math.max(0, Math.ceil((msg.selfDestructAt - Date.now()) / 1000))}s
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {typing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center gap-3 px-1 py-2"
              >
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-[#00f0ff]/50"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">peer typing...</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
        className="border-t border-zinc-800/80 bg-[#030609]/80 backdrop-blur-xl px-4 sm:px-6 py-3.5 shrink-0"
      >
        <div className="mx-auto max-w-2xl xl:max-w-3xl flex items-center gap-2.5">
          {defaultTTL && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50 shrink-0">
              <Timer className="w-3.5 h-3.5 text-[#00f0ff]/70" />
              <span className="text-[10px] font-mono text-[#00f0ff]/70 font-bold">
                {defaultTTL >= 60000 ? `${defaultTTL / 60000}m` : `${defaultTTL / 1000}s`}
              </span>
            </div>
          )}

          <Input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              onTyping()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Type a secure message..."
            className="flex-1 h-11 sm:h-12 text-sm sm:text-base rounded-xl bg-zinc-800/30 border-zinc-700/50 focus:border-[#00f0ff]/30 text-white placeholder-zinc-500 font-mono"
          />

          <Button
            onClick={handleSend}
            disabled={!input.trim()}
            size="icon"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#00f0ff] hover:bg-[#00d4e6] text-[#030609] shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
