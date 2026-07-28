const ALGO = { name: 'ECDH', namedCurve: 'P-256' } as const
const AES = { name: 'AES-GCM', length: 256 } as const

function bufToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

function base64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  return buf.buffer
}

export interface KeyPairData {
  publicKeyJwk: JsonWebKey
  privateKey: CryptoKey
}

function requireSecureContext() {
  if (!crypto.subtle) {
    throw new Error(
      'Web Crypto API not available. Access this app via HTTPS (not plain HTTP) '
      + 'to enable encryption. Run `npm run dev` on this machine and connect '
      + 'from your phone using the HTTPS URL shown in the terminal.'
    )
  }
}

export async function generateKeyPair(): Promise<KeyPairData> {
  requireSecureContext()
  const kp = await crypto.subtle.generateKey(ALGO, true, ['deriveKey', 'deriveBits'])
  const publicKeyJwk = await crypto.subtle.exportKey('jwk', kp.publicKey)
  return { publicKeyJwk, privateKey: kp.privateKey }
}

export async function deriveSharedKey(
  privateKey: CryptoKey,
  peerPublicKeyJwk: JsonWebKey
): Promise<CryptoKey> {
  const peerPubKey = await crypto.subtle.importKey(
    'jwk', peerPublicKeyJwk, ALGO, false, []
  )
  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: peerPubKey },
    privateKey,
    AES,
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encrypt(
  key: CryptoKey,
  plaintext: string
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  )
  return bufToBase64(iv.buffer) + ':' + bufToBase64(ciphertext)
}

export async function decrypt(
  key: CryptoKey,
  envelope: string
): Promise<string> {
  const [ivB64, ctB64] = envelope.split(':')
  const iv = new Uint8Array(base64ToBuf(ivB64))
  const ct = base64ToBuf(ctB64)
  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ct
  )
  return new TextDecoder().decode(plainBuf)
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  const arr = crypto.getRandomValues(new Uint8Array(6))
  for (let i = 0; i < 6; i++) code += chars[arr[i] % chars.length]
  return code
}
