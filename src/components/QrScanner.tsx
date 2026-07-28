import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { X, CameraOff, Camera, Scan } from 'lucide-react'

interface QrScannerProps {
  onScan: (data: string) => void
  onClose: () => void
}

export default function QrScanner({ onScan, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scannedRef = useRef(false)
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 720 } },
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream

        const video = videoRef.current!
        video.srcObject = stream
        await video.play()
        if (cancelled) return
        setLoading(false)
      } catch (err: any) {
        if (!cancelled) setError(err?.toString() || 'Camera access denied')
      }
    }
    start()

    return () => {
      cancelled = true
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [])

  async function decodeFrame(): Promise<string | null> {
    const video = videoRef.current
    if (!video || video.videoWidth === 0) return null

    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return null

    // Try ImageCapture API first (most reliable on Android)
    if ('ImageCapture' in window) {
      try {
        const capture = new (window as any).ImageCapture(track)
        const bitmap = await capture.grabFrame()
        const canvas = document.createElement('canvas')
        canvas.width = bitmap.width
        canvas.height = bitmap.height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(bitmap, 0, 0)
        bitmap.close()
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        })
        if (code) return code.data
      } catch {}
    }

    // Fallback: try drawing video frame to canvas
    try {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(video, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      })
      if (code) return code.data
    } catch {}

    return null
  }

  async function scan() {
    if (scannedRef.current) return
    const result = await decodeFrame()
    if (result) {
      scannedRef.current = true
      onScanRef.current(result)
    }
  }

  // Auto-scan every second using ImageCapture
  useEffect(() => {
    if (loading || error) return
    const interval = setInterval(() => { scan() }, 1000)
    return () => clearInterval(interval)
  }, [loading, error])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030609]/90 backdrop-blur-sm">
      <div className="relative w-full max-w-sm mx-4">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-zinc-400 hover:text-white transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-black">
          {error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-6">
              <CameraOff className="w-8 h-8 text-red-400" />
              <p className="text-red-300/80 text-xs font-mono text-center">{error}</p>
              <button onClick={onClose} className="mt-2 text-xs font-mono text-zinc-500 hover:text-zinc-300 underline underline-offset-4 cursor-pointer">Close</button>
            </div>
          ) : (
            <div className="relative w-full aspect-[4/3] bg-black">
              <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-52 h-52 border-2 border-[#00f0ff]/60 rounded-lg shadow-[0_0_30px_rgba(0,240,255,0.15)]" />
              </div>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <span className="text-zinc-400 text-xs font-mono animate-pulse">Starting camera...</span>
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 p-3 text-center bg-gradient-to-t from-black/80 to-transparent bg-black/60">
                <Camera className="w-3.5 h-3.5 inline-block mr-1.5 text-zinc-500" />
                <span className="text-zinc-400 text-xs font-mono">Point camera at QR code</span>
              </div>
            </div>
          )}
        </div>
        {!error && !loading && !scannedRef.current && (
          <button
            onClick={scan}
            className="mt-3 w-full py-3 rounded-xl bg-[#00f0ff] hover:bg-[#00d4e6] text-[#030609] font-mono font-bold text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Scan className="w-4 h-4" />
            Tap to Scan
          </button>
        )}
      </div>
    </div>
  )
}
