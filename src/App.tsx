import { useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import Background3D from './components/Background3D'
import Landing from './components/Landing'
import ChatRoom from './components/ChatRoom'
import { useSecureChat } from './hooks/useSecureChat'

export default function App() {
  const {
    status,
    roomId,
    messages,
    typing,
    defaultTTL,
    errorMsg,
    manualOffer,
    manualAnswer,
    createRoom,
    joinRoom,
    connectManual,
    sendSecure,
    sendTyping,
    disconnect,
    setErrorMsg,
  } = useSecureChat()

  const disconnectRef = useRef(disconnect)
  disconnectRef.current = disconnect

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (status === 'connected') {
        e.preventDefault()
        e.returnValue = 'Leaving will destroy all messages.'
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [status])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && status === 'connected') {
        disconnectRef.current()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [status])

  const isOnLanding = status === 'idle' || status === 'creating' || status === 'connecting' || status === 'error' || status === 'waiting'

  return (
    <div className="relative w-full h-full bg-[#030609] overflow-hidden">
      <Background3D />
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 0%, #03060980 50%, #030609 100%)' }}
      />

      <AnimatePresence mode="wait">
        {isOnLanding && (
          <Landing
            key="landing"
            onCreateRoom={createRoom}
            onJoinRoom={joinRoom}
            onConnectManual={connectManual}
            status={status}
            errorMsg={errorMsg}
            manualOffer={manualOffer}
            manualAnswer={manualAnswer}
            onDismissError={() => setErrorMsg('')}
          />
        )}

        {status === 'connected' && roomId && (
          <ChatRoom
            key="chat"
            roomId={roomId}
            messages={messages}
            onSend={sendSecure}
            onTyping={sendTyping}
            onDisconnect={disconnect}
            typing={typing}
            defaultTTL={defaultTTL}
          />
        )}

        {status === 'disconnected' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030609]/90 backdrop-blur-sm">
            <div className="text-center space-y-5">
              <div className="relative inline-block">
                <div className="absolute -inset-4 bg-[#ff3366]/10 rounded-full blur-xl" />
                <div className="relative w-16 h-16 rounded-2xl glass flex items-center justify-center mx-auto">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff3366" strokeWidth="1.5">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </div>
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg">Session Ended</h2>
                <p className="text-white/25 text-sm font-mono mt-1 max-w-xs">
                  All messages have been permanently destroyed. No trace remains.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button onClick={() => window.location.reload()} className="group relative overflow-hidden rounded-xl p-[1px] cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00f0ff] to-[#7b61ff] opacity-30 group-hover:opacity-50 transition-opacity blur-sm" />
                  <div className="relative bg-[#030609] rounded-xl px-6 py-2.5 font-semibold text-sm text-white transition-colors">
                    Start New Session
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
