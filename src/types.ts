export interface ChatMessage {
  id: string
  text: string
  sender: 'me' | 'peer'
  timestamp: number
  ttl?: number
  selfDestructAt?: number
}

export type ConnectionStatus = 'idle' | 'creating' | 'waiting' | 'connecting' | 'connected' | 'disconnected' | 'error'
