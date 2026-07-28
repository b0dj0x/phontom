import { useRef, useState } from 'react'
import jsQR from 'jsqr'
import { X, CameraOff, Camera } from 'lucide-react'

interface QrScannerProps {
  onScan: (data: string) => void
  onClose: () => void
}

export default function QrScanner({ onScan, onClose }: QrScannerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  function decodeFile(file: File) {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        })
        if (code) {
          onScan(code.data)
        } else {
          setError('No QR code found in photo. Try again.')
        }
      } catch {
        setError('Could not read image.')
      }
    }
    img.onerror = () => setError('Could not load image.')
    img.src = URL.createObjectURL(file)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) decodeFile(file)
    // reset so re-selecting same file triggers onChange
    e.target.value = ''
  }

  function openCamera() {
    inputRef.current?.click()
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
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center">
            <Camera className="w-7 h-7 text-zinc-400" />
          </div>
          <p className="text-zinc-400 text-sm font-mono text-center leading-relaxed">
            Take a photo of the QR code<br />
            <span className="text-zinc-600 text-xs">The native camera will open</span>
          </p>
          <button
            onClick={openCamera}
            className="w-full py-3.5 rounded-xl bg-[#00f0ff] hover:bg-[#00d4e6] text-[#030609] font-mono font-bold text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all cursor-pointer"
          >
            Open Camera
          </button>
          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 w-full">
              <CameraOff className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-300/80 text-xs font-mono flex-1">{error}</p>
              <button onClick={() => setError('')} className="text-red-400/50 hover:text-red-300 cursor-pointer">&times;</button>
            </div>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          className="hidden"
        />
      </div>
    </div>
  )
}
