import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

interface Props {
  onScanSuccess: (result: string) => void;
  onCancel: () => void;
}

export default function CameraScanner({ onScanSuccess, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError("Gagal mengakses kamera. Pastikan izin kamera di browser sudah diaktifkan.");
      }
    };

    startCamera();

    const scanFrame = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });

            if (code) {
              onScanSuccess(code.data);
              return;
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(scanFrame);
    };

    if (videoRef.current) {
      videoRef.current.onloadedmetadata = () => {
        animationFrameId = requestAnimationFrame(scanFrame);
      };
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 bg-cocoa/95 backdrop-blur-md flex flex-col items-center justify-center z-50 p-5">
      {/* Status Pill */}
      <div className="flex items-center gap-2 bg-white/10 border border-mintcandy/40 text-cream px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide mb-4">
        <span className="w-2 h-2 rounded-full bg-limecandy animate-ping" />
        <span>PEMINDAI KAMERA AKTIF</span>
      </div>

      {/* Viewfinder Container */}
      <div className="relative w-full max-w-sm bg-deepteal rounded-3xl overflow-hidden shadow-2xl border-2 border-mintcandy/60 aspect-square flex items-center justify-center">
        {error ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-danger/20 text-danger flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-cream text-sm font-medium">{error}</p>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Darkened vignette border */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_50px_rgba(25,53,49,0.85)]" />

            {/* Corner Brackets & Animated Laser Line */}
            <div className="absolute inset-10 pointer-events-none">
              {/* Top-Left */}
              <div className="absolute top-0 left-0 w-9 h-9 border-t-4 border-l-4 border-ambercandy rounded-tl-2xl" />
              {/* Top-Right */}
              <div className="absolute top-0 right-0 w-9 h-9 border-t-4 border-r-4 border-ambercandy rounded-tr-2xl" />
              {/* Bottom-Left */}
              <div className="absolute bottom-0 left-0 w-9 h-9 border-b-4 border-l-4 border-ambercandy rounded-bl-2xl" />
              {/* Bottom-Right */}
              <div className="absolute bottom-0 right-0 w-9 h-9 border-b-4 border-r-4 border-ambercandy rounded-br-2xl" />

              {/* Scanning Laser */}
              <div className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-limecandy to-transparent shadow-[0_0_12px_#99C945] animate-scanline" />
            </div>
          </>
        )}
      </div>

      <p className="text-cream/90 mt-4 text-sm font-medium text-center">
        Posisikan kode QR tepat di dalam kotak bidik
      </p>

      <button 
        onClick={onCancel}
        className="mt-6 flex items-center gap-2 bg-orchidcandy text-white font-semibold px-7 py-3 rounded-2xl shadow-lg border border-white/20 hover:brightness-110 active:scale-95 transition"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        Tutup Kamera
      </button>
    </div>
  );
}
