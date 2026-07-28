import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { X, CameraOff } from 'lucide-react'

interface QrScannerProps {
  onScan: (data: string) => void
  onClose: () => void
}

export default function QrScanner({ onScan, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef(0)
  const scannedRef = useRef(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop())
          return
        }
        streamRef.current = stream

        const video = videoRef.current!
        video.srcObject = stream
        await video.play()

        const canvas = canvasRef.current!
        const ctx = canvas.getContext('2d')!

        function tick() {
          if (cancelled || scannedRef.current) return
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            ctx.drawImage(video, 0, 0)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const code = jsQR(imageData.data, imageData.width, imageData.height)
            if (code) {
              scannedRef.current = true
              onScan(code.data)
              return
            }
          }
          rafRef.current = requestAnimationFrame(tick)
        }
        tick()
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.toString() || 'Camera access denied')
        }
      }
    }

    start()

    return () => {
      cancelled = true
      cancelAnimationFrame(rafRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [onScan])

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
              <button
                onClick={onClose}
                className="mt-2 text-xs font-mono text-zinc-500 hover:text-zinc-300 underline underline-offset-4 cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="relative w-full aspect-[4/3] bg-black">
              <video
                ref={videoRef}
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-[#00f0ff]/50 rounded-lg" />
              </div>
              <div className="absolute bottom-0 inset-x-0 p-3 text-center">
                <span className="text-zinc-500 text-xs font-mono animate-pulse">Scanning...</span>
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
