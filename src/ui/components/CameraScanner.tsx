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
        // Minta izin akses kamera belakang (environment)
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError("Gagal mengakses kamera. Pastikan izin browser sudah diberikan.");
      }
    };

    startCamera();

    // Fungsi untuk terus-menerus memeriksa frame video
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
              return; // Berhenti scanning jika sudah dapat
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(scanFrame);
    };

    // Mulai loop scanning setelah video siap
    if (videoRef.current) {
      videoRef.current.onloadedmetadata = () => {
        animationFrameId = requestAnimationFrame(scanFrame);
      };
    }

    // Pembersihan saat komponen ditutup
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 bg-cocoa/95 flex flex-col items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-md bg-cocoa rounded-3xl overflow-hidden shadow-2xl border-4 border-sage">
        {error ? (
          <div className="text-peach p-8 text-center">{error}</div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-auto"
            />
            <canvas ref={canvasRef} className="hidden" />
            {/* Bingkai panduan scan */}
            <div className="absolute inset-0 border-4 border-honey rounded-2xl pointer-events-none opacity-70 m-12"></div>
          </>
        )}
      </div>
      
      <p className="text-white mt-4 text-sm">Arahkan kamera ke QR Code</p>
      
      <button 
        onClick={onCancel}
        className="mt-6 bg-peach text-cocoa font-semibold px-8 py-3 rounded-2xl shadow hover:brightness-95 active:scale-95 transition"
      >
        Batal
      </button>
    </div>
  );
}