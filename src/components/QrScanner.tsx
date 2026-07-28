import { useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { X, CameraOff } from 'lucide-react'

interface QrScannerProps {
  onScan: (data: string) => void
  onClose: () => void
}

export default function QrScanner({ onScan, onClose }: QrScannerProps) {
  const elRef = useRef<HTMLDivElement>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    const el = elRef.current
    if (!el) return
    const id = 'qr-' + Math.random().toString(36).slice(2, 8)
    el.id = id

    const scanner = new Html5Qrcode(id)
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        scanner.stop().catch(() => {})
        scanner.clear()
        onScan(decodedText)
      },
      undefined,
    ).catch(() => {
      // camera access denied — handled via UI below
    })

    return () => {
      scanner.stop().catch(() => {})
      scanner.clear()
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
          <div ref={elRef} className="w-full min-h-[280px]" />
        </div>
        <p className="text-zinc-500 text-xs font-mono text-center mt-3">
          <CameraOff className="w-3 h-3 inline-block mr-1" />
          Point camera at QR code
        </p>
      </div>
    </div>
  )
}
