import { useEffect, useRef, useCallback, useState } from 'react'
import { generateKeyPair, deriveSharedKey, encrypt, decrypt } from '../utils/crypto'
import type { ChatMessage, ConnectionStatus } from '../types'
import type { KeyPairData } from '../utils/crypto'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

interface PeerMessage {
  type: 'key-exchange' | 'chat' | 'typing' | 'disconnect'
  payload: unknown
}

function waitForIceGathering(pc: RTCPeerConnection, timeoutMs = 1500): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve()
  return Promise.race([
    new Promise<void>((resolve) => {
      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === 'complete') resolve()
      }
    }),
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ])
}

export function useSecureChat() {
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const statusRef = useRef(status)
  statusRef.current = status
  const [roomId, setRoomId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [defaultTTL, setDefaultTTL] = useState<number | null>(null)
  const [typing, setTyping] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [manualOffer, setManualOffer] = useState('')
  const [manualAnswer, setManualAnswer] = useState('')

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const keysRef = useRef<KeyPairData | null>(null)
  const sharedKeyRef = useRef<CryptoKey | null>(null)
  const isCreatorRef = useRef(false)
  const peerKeyReceivedRef = useRef(false)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const connectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cleanup = useCallback(() => {
    if (connectionTimerRef.current) {
      clearTimeout(connectionTimerRef.current)
      connectionTimerRef.current = null
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
    dcRef.current?.close()
    pcRef.current?.close()
    dcRef.current = null
    pcRef.current = null
    keysRef.current = null
    sharedKeyRef.current = null
    peerKeyReceivedRef.current = false
    setErrorMsg('')
    setManualOffer('')
    setManualAnswer('')
    setStatus('idle')
    setRoomId(null)
    setMessages([])
  }, [])

  // Connection timeout: if stuck in waiting or connecting, abort
  useEffect(() => {
    if (status !== 'waiting' && status !== 'connecting') return
    connectionTimerRef.current = setTimeout(() => {
      if (statusRef.current === 'waiting' || statusRef.current === 'connecting') {
        cleanup()
        setErrorMsg('Connection timed out — peer did not respond')
        setStatus('error')
      }
    }, 120000)
    return () => {
      if (connectionTimerRef.current) {
        clearTimeout(connectionTimerRef.current)
        connectionTimerRef.current = null
      }
    }
  }, [status, cleanup])

  useEffect(() => {
    return cleanup
  }, [cleanup])

  const setupDataChannel = useCallback((dc: RTCDataChannel) => {
    dcRef.current = dc

    dc.onopen = async () => {
      if (!keysRef.current) return
      peerKeyReceivedRef.current = false
      dc.send(JSON.stringify({
        type: 'key-exchange',
        payload: { publicKeyJwk: keysRef.current.publicKeyJwk },
      }))
    }

    dc.onmessage = async (e) => {
      try {
        const msg = JSON.parse(e.data) as PeerMessage

        if (msg.type === 'key-exchange') {
          const { publicKeyJwk } = msg.payload as { publicKeyJwk: JsonWebKey }
          if (!keysRef.current || peerKeyReceivedRef.current) return
          peerKeyReceivedRef.current = true
          const key = await deriveSharedKey(keysRef.current.privateKey, publicKeyJwk)
          sharedKeyRef.current = key
          setStatus('connected')
          setRoomId('encrypted')
        }

        if (msg.type === 'chat' && sharedKeyRef.current) {
          const { encrypted, ttl } = msg.payload as { encrypted: string; ttl?: number }
          const decrypted = await decrypt(sharedKeyRef.current, encrypted)
          setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            text: decrypted,
            sender: 'peer',
            timestamp: Date.now(),
            ttl: ttl || undefined,
            selfDestructAt: ttl ? Date.now() + ttl : undefined,
          }])
        }

        if (msg.type === 'typing') {
          setTyping(true)
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = setTimeout(() => setTyping(false), 2000)
        }

        if (msg.type === 'disconnect') {
          cleanup()
        }
      } catch {
        // malformed message — ignore
      }
    }

    dc.onclose = () => {
      if (statusRef.current === 'connected') {
        setErrorMsg('Peer disconnected')
        setStatus('disconnected')
      }
    }

    dc.onerror = () => {
      setErrorMsg('Connection error')
      setStatus('error')
    }
  }, [cleanup])

  const createRoom = useCallback(async (ttl?: number) => {
    try {
      cleanup()
      setStatus('creating')
      isCreatorRef.current = true
      if (ttl) setDefaultTTL(ttl)
      keysRef.current = await generateKeyPair()

      const pc = new RTCPeerConnection(ICE_SERVERS)
      pcRef.current = pc

      const dc = pc.createDataChannel('phantom-chat', { ordered: true })
      setupDataChannel(dc)

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      await waitForIceGathering(pc)

      const offerStr = btoa(JSON.stringify(pc.localDescription))
      setManualOffer(offerStr)
      setStatus('waiting')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to create room')
      setStatus('error')
    }
  }, [cleanup, setupDataChannel])

  const joinRoom = useCallback(async (offerString: string) => {
    try {
      cleanup()
      setStatus('connecting')
      isCreatorRef.current = false
      keysRef.current = await generateKeyPair()

      const offerDesc = JSON.parse(atob(offerString)) as RTCSessionDescriptionInit
      const pc = new RTCPeerConnection(ICE_SERVERS)
      pcRef.current = pc

      pc.ondatachannel = (e) => {
        setupDataChannel(e.channel)
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offerDesc))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      await waitForIceGathering(pc)

      const answerStr = btoa(JSON.stringify(pc.localDescription))
      setManualAnswer(answerStr)
      setStatus('waiting')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to join room')
      setStatus('error')
    }
  }, [cleanup, setupDataChannel])

  const connectManual = useCallback(async (answerString: string) => {
    try {
      setStatus('connecting')
      const answerDesc = JSON.parse(atob(answerString)) as RTCSessionDescriptionInit
      const pc = pcRef.current
      if (!pc) return
      await pc.setRemoteDescription(new RTCSessionDescription(answerDesc))
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to establish connection')
      setStatus('error')
    }
  }, [])

  const sendSecure = useCallback(async (text: string, ttl?: number) => {
    const dc = dcRef.current
    if (!dc || !sharedKeyRef.current || dc.readyState !== 'open') return
    const encrypted = await encrypt(sharedKeyRef.current, text)
    dc.send(JSON.stringify({ type: 'chat', payload: { encrypted, ttl } } as PeerMessage))
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      text,
      sender: 'me',
      timestamp: Date.now(),
      ttl: ttl || undefined,
      selfDestructAt: ttl ? Date.now() + ttl : undefined,
    }])
  }, [])

  const sendTyping = useCallback(() => {
    const dc = dcRef.current
    if (!dc || dc.readyState !== 'open') return
    dc.send(JSON.stringify({ type: 'typing', payload: {} } as PeerMessage))
  }, [])

  const disconnect = useCallback(() => {
    if (dcRef.current?.readyState === 'open') {
      dcRef.current.send(JSON.stringify({ type: 'disconnect', payload: {} }))
    }
    cleanup()
  }, [cleanup])

  return {
    status,
    roomId,
    messages,
    defaultTTL,
    typing,
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
  }
}
