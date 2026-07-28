import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import QRCode from 'qrcode'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  ArrowRight,
  Copy,
  Check,
  ArrowLeft,
  Timer,
  Shield,
  Link2,
  Ghost,
  Scan,
} from 'lucide-react'
import QrScanner from './QrScanner'

interface LandingProps {
  onCreateRoom: (ttl?: number) => void
  onJoinRoom: (offer: string) => void
  onConnectManual: (answer: string) => void
  status: string
  errorMsg: string
  manualOffer: string
  manualAnswer: string
  onDismissError: () => void
}

const ttlOptions = [
  { label: '∞', value: null },
  { label: '10s', value: 10000 },
  { label: '30s', value: 30000 },
  { label: '1m', value: 60000 },
  { label: '5m', value: 300000 },
]

const btnPrimary = 'bg-[#00f0ff] hover:bg-[#00d4e6] text-[#030609] font-bold shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] transition-all duration-300'
const btnSecondary = 'bg-[#7b61ff] hover:bg-[#6b52e6] text-white font-bold shadow-[0_0_20px_rgba(123,97,255,0.3)] hover:shadow-[0_0_30px_rgba(123,97,255,0.5)] transition-all duration-300'

export default function Landing({
  onCreateRoom, onJoinRoom, onConnectManual,
  status, errorMsg, manualOffer, manualAnswer, onDismissError,
}: LandingProps) {
  const [screen, setScreen] = useState<'home' | 'create' | 'join'>('home')
  const [ttl, setTtl] = useState<number | null>(null)
  const [offerInput, setOfferInput] = useState('')
  const [answerInput, setAnswerInput] = useState('')
  const [copied, setCopied] = useState('')
  const [showScanner, setShowScanner] = useState<'offer' | 'answer' | null>(null)
  const [offerQr, setOfferQr] = useState('')
  const [answerQr, setAnswerQr] = useState('')

  useEffect(() => {
    if (manualOffer) {
      QRCode.toDataURL(manualOffer, { width: 200, margin: 1, color: { dark: '#00f0ff', light: '#03060900' } })
        .then(setOfferQr)
        .catch(() => {})
    } else {
      setOfferQr('')
    }
  }, [manualOffer])

  useEffect(() => {
    if (manualAnswer) {
      QRCode.toDataURL(manualAnswer, { width: 200, margin: 1, color: { dark: '#7b61ff', light: '#03060900' } })
        .then(setAnswerQr)
        .catch(() => {})
    } else {
      setAnswerQr('')
    }
  }, [manualAnswer])

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 2000)
  }

  const isBusy = status === 'creating' || status === 'connecting'

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto scanlines">
      {showScanner && (
        <QrScanner
          onScan={(data) => {
            if (showScanner === 'offer') {
              setOfferInput(data)
            } else {
              setAnswerInput(data)
            }
            setShowScanner(null)
          }}
          onClose={() => setShowScanner(null)}
        />
      )}

      <div className="min-h-full flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm sm:max-w-md">

          <AnimatePresence mode="wait">
            {screen === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                <motion.div
                  initial={{ opacity: 0, y: -30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="text-center mb-12"
                >
                  <div className="relative inline-block mb-6">
                    <div className="absolute -inset-4 bg-[#00f0ff]/5 rounded-full blur-2xl" />
                    <div className="relative w-14 h-14 rounded-2xl bg-[#030609] border border-[#00f0ff]/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.15)]">
                      <Ghost className="w-6 h-6 text-[#00f0ff]" />
                    </div>
                  </div>

                  <div className="relative">
                    <h1 className="font-mono text-4xl sm:text-5xl font-bold tracking-tighter">
                      <span className="text-[#00f0ff]" style={{ textShadow: '0 0 20px rgba(0,240,255,0.5), 0 0 40px rgba(0,240,255,0.2)' }}>
                        PHANTOM
                      </span>
                      <span className="text-zinc-600 font-light"> b0dj0x</span>
                    </h1>
                    <span className="inline-block w-[3px] h-8 sm:h-9 bg-[#00f0ff] ml-1 -mb-1 animate-blink" />
                  </div>

                  <p className="text-zinc-600 text-xs sm:text-sm mt-4 font-mono tracking-[0.15em] uppercase">
                    e2e encrypted · ephemeral · zero trace
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-5">
                    <Badge variant="primary" className="font-mono text-[10px] tracking-wider">ECDH</Badge>
                    <Badge variant="secondary" className="font-mono text-[10px] tracking-wider">AES-256-GCM</Badge>
                    <Badge className="font-mono text-[10px] tracking-wider">P2P</Badge>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                  className="w-full space-y-4"
                >
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <div onClick={() => setScreen('create')} className="relative group cursor-pointer">
                      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-[#00f0ff] to-[#00b4d4] opacity-30 group-hover:opacity-100 transition-all duration-500 blur-sm" />
                      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-[#00f0ff] to-[#00b4d4] opacity-0 group-hover:opacity-60 transition-all duration-500" style={{ animation: 'border-glow 2s ease-in-out infinite' }} />
                      <div className="relative rounded-2xl bg-[#030609] border border-[#00f0ff]/20 group-hover:border-[#00f0ff]/50 transition-colors duration-300 px-5 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/20 flex items-center justify-center shrink-0 group-hover:bg-[#00f0ff]/20 transition-colors">
                            <Plus className="w-5 h-5 text-[#00f0ff]" />
                          </div>
                          <div className="flex-1">
                            <div className="text-[#00f0ff] font-mono font-bold text-sm tracking-wider uppercase">Create Room</div>
                            <div className="text-zinc-500 text-xs font-mono mt-1">Generate encrypted offer</div>
                          </div>
                          <div className="w-8 h-8 rounded-lg bg-[#00f0ff]/5 flex items-center justify-center group-hover:bg-[#00f0ff]/20 transition-colors">
                            <ArrowRight className="w-4 h-4 text-[#00f0ff]/60 group-hover:text-[#00f0ff]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <div onClick={() => setScreen('join')} className="relative group cursor-pointer">
                      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-[#7b61ff] to-[#5b3fd4] opacity-30 group-hover:opacity-100 transition-all duration-500 blur-sm" />
                      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-[#7b61ff] to-[#5b3fd4] opacity-0 group-hover:opacity-60 transition-all duration-500" style={{ animation: 'border-glow-violet 2s ease-in-out infinite' }} />
                      <div className="relative rounded-2xl bg-[#030609] border border-[#7b61ff]/20 group-hover:border-[#7b61ff]/50 transition-colors duration-300 px-5 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-[#7b61ff]/10 border border-[#7b61ff]/20 flex items-center justify-center shrink-0 group-hover:bg-[#7b61ff]/20 transition-colors">
                            <Link2 className="w-5 h-5 text-[#7b61ff]" />
                          </div>
                          <div className="flex-1">
                            <div className="text-[#7b61ff] font-mono font-bold text-sm tracking-wider uppercase">Join Room</div>
                            <div className="text-zinc-500 text-xs font-mono mt-1">Paste offer to connect</div>
                          </div>
                          <div className="w-8 h-8 rounded-lg bg-[#7b61ff]/5 flex items-center justify-center group-hover:bg-[#7b61ff]/20 transition-colors">
                            <ArrowRight className="w-4 h-4 text-[#7b61ff]/60 group-hover:text-[#7b61ff]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {screen === 'create' && (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="space-y-3"
              >
                <Card className="border-zinc-800 bg-zinc-900/40">
                  <CardContent className="p-5 space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/20 flex items-center justify-center">
                        <Plus className="w-4 h-4 text-[#00f0ff]" />
                      </div>
                      <span className="text-zinc-100 font-mono font-bold text-sm tracking-wider uppercase">Create Room</span>
                    </div>

                    {!manualOffer && (
                      <>
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Timer className="w-3.5 h-3.5 text-[#00f0ff]/60" />
                            <span className="text-zinc-400 text-[10px] font-mono tracking-[0.15em] uppercase">Message lifetime</span>
                          </div>
                          <div className="grid grid-cols-5 gap-2">
                            {ttlOptions.map(opt => (
                              <motion.button
                                key={opt.label}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setTtl(opt.value)}
                                className={`py-2.5 rounded-xl text-center transition-all text-xs font-mono font-bold cursor-pointer ${
                                  ttl === opt.value
                                    ? 'bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/40 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                                    : 'bg-zinc-800/50 text-zinc-500 border border-zinc-800 hover:bg-zinc-800 hover:text-zinc-300 hover:border-zinc-700'
                                }`}
                              >
                                {opt.label}
                              </motion.button>
                            ))}
                          </div>
                        </div>

                        <Button
                          onClick={() => onCreateRoom(ttl ?? undefined)}
                          disabled={isBusy}
                          className={`w-full h-11 text-sm font-mono font-bold tracking-wider uppercase ${btnPrimary} disabled:opacity-30 disabled:cursor-not-allowed`}
                        >
                          {isBusy ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-[#030609]/30 border-t-[#030609] rounded-full animate-spin" />
                              Generating...
                            </span>
                          ) : (
                            <>
                              <Shield className="w-4 h-4" />
                              Generate Offer
                            </>
                          )}
                        </Button>
                      </>
                    )}

                    {manualOffer && !manualAnswer && (
                      <>
                        <div className="bg-[#00f0ff]/5 border border-[#00f0ff]/15 rounded-xl px-4 py-3.5 flex items-start gap-3">
                          <Shield className="w-4 h-4 text-[#00f0ff] shrink-0 mt-0.5" />
                          <p className="text-[#00f0ff]/60 text-xs font-mono leading-relaxed">
                            Share this offer — your peer can scan the QR or copy the text.
                          </p>
                        </div>

                        <div>
                          <div className="text-zinc-500 text-[10px] font-mono tracking-[0.15em] uppercase mb-2">Your Offer</div>
                          <div className="relative">
                            <div className="bg-[#030609] border border-zinc-800 rounded-xl p-3.5 text-xs font-mono text-zinc-400 leading-relaxed break-all max-h-28 overflow-y-auto">
                              {manualOffer}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copy(manualOffer, 'offer')}
                              className={`absolute top-2 right-2 h-7 px-2.5 text-[10px] font-mono font-semibold ${copied === 'offer' ? 'text-emerald-400' : 'text-zinc-500'}`}
                            >
                              {copied === 'offer' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              {copied === 'offer' ? 'Copied' : 'Copy'}
                            </Button>
                          </div>
                        </div>

                        <div className="flex justify-center">
                          {offerQr && (
                            <div className="bg-white/5 border border-zinc-800 rounded-xl p-3">
                              <img src={offerQr} alt="QR code" className="w-32 h-32 sm:w-36 sm:h-36" />
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-zinc-500 text-[10px] font-mono tracking-[0.15em] uppercase">Peer's Answer</span>
                            <button
                              onClick={() => setShowScanner('answer')}
                              className="flex items-center gap-1 text-[#7b61ff]/60 hover:text-[#7b61ff] transition-colors font-mono text-[10px] font-semibold cursor-pointer"
                            >
                              <Scan className="w-3 h-3" />
                              Scan QR
                            </button>
                          </div>
                          <Textarea
                            value={answerInput}
                            onChange={(e) => setAnswerInput(e.target.value)}
                            placeholder="Paste the answer string here..."
                            rows={3}
                            className="text-xs font-mono resize-none bg-[#030609] border-zinc-800 focus:border-[#00f0ff]/30"
                          />
                        </div>

                        <Button
                          onClick={() => onConnectManual(answerInput)}
                          disabled={answerInput.length < 50 || isBusy}
                          className={`w-full h-11 text-sm font-mono font-bold tracking-wider uppercase ${btnSecondary} disabled:opacity-30 disabled:cursor-not-allowed`}
                        >
                          {isBusy ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Connecting...
                            </span>
                          ) : (
                            <>
                              <Link2 className="w-4 h-4" />
                              Connect
                            </>
                          )}
                        </Button>
                      </>
                    )}

                    {manualAnswer && (
                      <>
                        <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-4 py-3.5 flex items-start gap-3">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <p className="text-emerald-300/70 text-xs font-mono">
                            Connected! Send this to the room creator — they can scan the QR.
                          </p>
                        </div>
                        <div className="relative">
                          <div className="bg-[#030609] border border-zinc-800 rounded-xl p-3.5 text-xs font-mono text-zinc-400 leading-relaxed break-all max-h-28 overflow-y-auto">
                            {manualAnswer}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copy(manualAnswer, 'answer')}
                            className={`absolute top-2 right-2 h-7 px-2.5 text-[10px] font-mono font-semibold ${copied === 'answer' ? 'text-emerald-400' : 'text-zinc-500'}`}
                          >
                            {copied === 'answer' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copied === 'answer' ? 'Copied' : 'Copy'}
                          </Button>
                        </div>
                        <div className="flex justify-center">
                          {answerQr && (
                            <div className="bg-white/5 border border-zinc-800 rounded-xl p-3">
                              <img src={answerQr} alt="QR code" className="w-32 h-32 sm:w-36 sm:h-36" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 rounded-xl bg-[#00f0ff]/5 border border-[#00f0ff]/10 px-4 py-3.5">
                          <span className="w-3.5 h-3.5 border-2 border-[#00f0ff]/30 border-t-[#00f0ff] rounded-full animate-spin" />
                          <span className="text-zinc-400 text-xs font-mono">Waiting for connection...</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <motion.div whileHover={{ x: -3 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setScreen('home'); setAnswerInput('') }}
                    className="text-zinc-600 hover:text-zinc-300 font-mono text-xs"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {screen === 'join' && (
              <motion.div
                key="join"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="space-y-3"
              >
                <Card className="border-zinc-800 bg-zinc-900/40">
                  <CardContent className="p-5 space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#7b61ff]/10 border border-[#7b61ff]/20 flex items-center justify-center">
                        <Link2 className="w-4 h-4 text-[#7b61ff]" />
                      </div>
                      <span className="text-zinc-100 font-mono font-bold text-sm tracking-wider uppercase">Join Room</span>
                    </div>

                    {!manualAnswer && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500 text-[10px] font-mono tracking-[0.15em] uppercase">Peer's Offer</span>
                          <button
                            onClick={() => setShowScanner('offer')}
                            className="flex items-center gap-1 text-[#7b61ff]/60 hover:text-[#7b61ff] transition-colors font-mono text-[10px] font-semibold cursor-pointer"
                          >
                            <Scan className="w-3 h-3" />
                            Scan QR
                          </button>
                        </div>
                        <Textarea
                          value={offerInput}
                          onChange={(e) => setOfferInput(e.target.value)}
                          placeholder="Paste the offer or scan QR..."
                          rows={4}
                          className="text-xs font-mono resize-none bg-[#030609] border-zinc-800 focus:border-[#7b61ff]/30"
                        />

                        <Button
                          onClick={() => onJoinRoom(offerInput)}
                          disabled={offerInput.length < 50 || isBusy}
                          className={`w-full h-11 text-sm font-mono font-bold tracking-wider uppercase ${btnSecondary} disabled:opacity-30 disabled:cursor-not-allowed`}
                        >
                          {isBusy ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Generating...
                            </span>
                          ) : (
                            <>
                              <Link2 className="w-4 h-4" />
                              Join & Generate Answer
                            </>
                          )}
                        </Button>
                      </>
                    )}

                    {manualAnswer && (
                      <>
                        <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-4 py-3.5 flex items-start gap-3">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <p className="text-emerald-300/70 text-xs font-mono">
                            Answer generated! Share this with the room creator — they can scan the QR.
                          </p>
                        </div>
                        <div className="relative">
                          <div className="bg-[#030609] border border-zinc-800 rounded-xl p-3.5 text-xs font-mono text-zinc-400 leading-relaxed break-all max-h-28 overflow-y-auto">
                            {manualAnswer}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copy(manualAnswer, 'answer')}
                            className={`absolute top-2 right-2 h-7 px-2.5 text-[10px] font-mono font-semibold ${copied === 'answer' ? 'text-emerald-400' : 'text-zinc-500'}`}
                          >
                            {copied === 'answer' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copied === 'answer' ? 'Copied' : 'Copy'}
                          </Button>
                        </div>
                        <div className="flex justify-center">
                          {answerQr && (
                            <div className="bg-white/5 border border-zinc-800 rounded-xl p-3">
                              <img src={answerQr} alt="QR code" className="w-32 h-32 sm:w-36 sm:h-36" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 rounded-xl bg-[#7b61ff]/5 border border-[#7b61ff]/10 px-4 py-3.5">
                          <span className="w-3.5 h-3.5 border-2 border-[#7b61ff]/30 border-t-[#7b61ff] rounded-full animate-spin" />
                          <span className="text-zinc-400 text-xs font-mono">Waiting for connection...</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <motion.div whileHover={{ x: -3 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setScreen('home'); setOfferInput('') }}
                    className="text-zinc-600 hover:text-zinc-300 font-mono text-xs"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {status === 'error' && errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3.5 flex items-start gap-3"
            >
              <p className="text-red-300/80 text-xs font-mono flex-1 leading-relaxed">{errorMsg}</p>
              <button onClick={onDismissError} className="text-red-400/50 hover:text-red-300 transition-colors cursor-pointer shrink-0">
                <span className="text-lg leading-none">&times;</span>
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
