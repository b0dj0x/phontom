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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const supportsBarcodeDetector = 'BarcodeDetector' in window

    ;(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 720 } },
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream

        const video = videoRef.current!
        video.srcObject = stream
        await video.play()
        setLoading(false)

        if (supportsBarcodeDetector) {
          const detector = new (window as any).BarcodeDetector({
            formats: ['qr_code'],
          })
          ;(async function scanWithDetector() {
            while (!cancelled && !scannedRef.current) {
              if (video.readyState >= video.HAVE_CURRENT_DATA) {
                try {
                  const barcodes = await detector.detect(video)
                  if (barcodes.length > 0 && !scannedRef.current) {
                    scannedRef.current = true
                    onScan(barcodes[0].rawValue)
                    return
                  }
                } catch {}
              }
              await new Promise(r => requestAnimationFrame(r))
            }
          })()
        } else {
          const canvas = canvasRef.current!
          const ctx = canvas.getContext('2d')!

          ;(function tick() {
            if (cancelled || scannedRef.current) return
            if (video.readyState >= video.HAVE_CURRENT_DATA) {
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
          })()
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.toString() || 'Camera access denied')
      }
    })()

    return () => {
      cancelled = true
      cancelAnimationFrame(rafRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
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
              <div className="absolute bottom-0 inset-x-0 p-3 text-center bg-gradient-to-t from-black/60 to-transparent">
                <span className="text-zinc-400 text-xs font-mono">Point camera at QR code</span>
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
