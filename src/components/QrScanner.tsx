import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { X, CameraOff, Camera, Scan } from 'lucide-react'

interface QrScannerProps {
  onScan: (data: string) => void
  onClose: () => void
}

export default function QrScanner({ onScan, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scannedRef = useRef(false)
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan
  const timerRef = useRef(0)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    let cancelled = false
    const useNative = 'BarcodeDetector' in window

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

        const canvas = canvasRef.current!
        const ctx = canvas.getContext('2d')!

        async function scan() {
          if (cancelled || scannedRef.current) return
          if (video.readyState < video.HAVE_CURRENT_DATA || video.videoWidth === 0) {
            timerRef.current = window.setTimeout(scan, 400)
            return
          }

          try {
            if (useNative) {
              const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
              const barcodes = await detector.detect(video)
              if (barcodes.length > 0) {
                scannedRef.current = true
                onScanRef.current(barcodes[0].rawValue)
                return
              }
            } else {
              const bitmap = await createImageBitmap(video, {
                resizeWidth: Math.min(video.videoWidth, 640),
                resizeHeight: Math.min(video.videoHeight, 480),
                resizeQuality: 'medium',
              })
              canvas.width = bitmap.width
              canvas.height = bitmap.height
              ctx.drawImage(bitmap, 0, 0)
              bitmap.close()
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'attemptBoth',
              })
              if (code) {
                scannedRef.current = true
                onScanRef.current(code.data)
                return
              }
            }
          } catch {}
          timerRef.current = window.setTimeout(scan, 400)
        }
        scan()
      } catch (err: any) {
        if (!cancelled) setError(err?.toString() || 'Camera access denied')
      }
    }
    start()

    return () => {
      cancelled = true
      clearTimeout(timerRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [])

  async function capture() {
    if (scannedRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    try {
      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
        const barcodes = await detector.detect(video)
        if (barcodes.length > 0) {
          scannedRef.current = true
          onScanRef.current(barcodes[0].rawValue)
          return
        }
      }
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const bitmap = await createImageBitmap(video, {
        resizeWidth: Math.min(video.videoWidth || 640, 640),
        resizeHeight: Math.min(video.videoHeight || 480, 480),
        resizeQuality: 'medium',
      })
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      ctx.drawImage(bitmap, 0, 0)
      bitmap.close()
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      })
      if (code) {
        scannedRef.current = true
        onScanRef.current(code.data)
      } else {
        setFeedback('no-qr')
        setTimeout(() => setFeedback(''), 1500)
      }
    } catch {
      setFeedback('no-qr')
      setTimeout(() => setFeedback(''), 1500)
    }
  }

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
              {feedback === 'no-qr' && (
                <div className="absolute inset-0 flex items-center justify-center bg-amber-500/20">
                  <span className="text-amber-400 text-sm font-mono">No QR found, try again</span>
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 p-3 text-center bg-gradient-to-t from-black/80 to-transparent">
                <Camera className="w-3.5 h-3.5 inline-block mr-1.5 text-zinc-500" />
                <span className="text-zinc-400 text-xs font-mono">Point camera at QR code</span>
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}
        </div>
        {!error && !scannedRef.current && (
          <button
            onClick={capture}
            className="mt-3 w-full py-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 text-zinc-300 font-mono text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Scan className="w-4 h-4" />
            Tap to Scan
          </button>
        )}
      </div>
    </div>
  )
}
