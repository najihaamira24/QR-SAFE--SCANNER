import { useState } from 'react';
import { decodeImage } from './qrDecoder';
import CameraScanner from './ui/components/CameraScanner';
import { classifyPayload, type PayloadResult } from './core/payload/payloadClassifier';
import { parseURL } from './core/url-parser/urlParser';
import { analyzeURL, type AnalysisResult } from './core/rules/ruleEngine';

function App() {
  const [result, setResult] = useState<PayloadResult | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const processText = (text: string) => {
    const payload = classifyPayload(text);
    setResult(payload);
    setError(null);

    if (payload.type === 'URL') {
      const parsedUrl = parseURL(payload.rawData);
      if (parsedUrl) {
        const analysisResult = analyzeURL(parsedUrl);
        setAnalysis(analysisResult);
      } else {
        setAnalysis(null);
        setError("Format URL tidak valid.");
      }
    } else {
      setAnalysis(null);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setResult(null);
    setAnalysis(null);
    setError(null);

    try {
      const decodedText = await decodeImage(file);
      if (decodedText) {
        processText(decodedText);
      } else {
        setError("QR Code tidak terdeteksi di dalam gambar ini.");
      }
    } catch (err) {
      setError("Terjadi kesalahan saat memproses gambar.");
    }
  };

  const handleScanSuccess = (text: string) => {
    setIsScanning(false);
    processText(text);
  };

  const getRiskColor = (level: string) => {
    if (level === 'Risiko tinggi') return 'bg-danger/10 text-danger border-danger/40';
    if (level === 'Waspada') return 'bg-honey/30 text-cocoa border-honey';
    return 'bg-sage/25 text-cocoa border-sage';
  };

  // Fungsi untuk membuka link dengan konfirmasi keamanan
  const handleOpenLink = (url: string) => {
    if (analysis?.level === 'Risiko tinggi') {
      const confirm = window.confirm(
        "PERINGATAN KERAS: Tautan ini memiliki RISIKO TINGGI dan berpotensi mencuri data Anda. Apakah Anda benar-benar yakin ingin membukanya?"
      );
      if (!confirm) return; // Batal buka
    } else if (analysis?.level === 'Waspada') {
      const confirm = window.confirm(
        "Hati-hati: Tautan ini memiliki indikator mencurigakan. Tetap lanjutkan membuka tautan?"
      );
      if (!confirm) return;
    }
    
    // Buka link di tab baru dengan aman (noopener, noreferrer)
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Fungsi untuk menyalin teks
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Teks berhasil disalin!");
  };

  return (
    <div className="min-h-screen bg-cream text-cocoa flex flex-col items-center">

      {isScanning && (
        <CameraScanner
          onScanSuccess={handleScanSuccess}
          onCancel={() => setIsScanning(false)}
        />
      )}

      {/* HEADER */}
      <header className="w-full bg-sage px-6 pt-10 pb-24 text-center rounded-b-[2.5rem]">
        <h1 className="text-3xl font-bold text-cocoa mb-2">QR Safe Scanner</h1>
        <p className="text-cocoa/80 text-sm">
          Literasi Digital - Kelompok 3<br />
          Pemindai QR Code dengan Analisis Tujuan Tautan
        </p>
      </header>

      <main className="w-full max-w-md px-4 -mt-14 pb-10 flex flex-col gap-5">
        {/* AKSI */}
        <div className="bg-white rounded-3xl shadow-xl shadow-cocoa/10 p-5 flex gap-3">
          <button
            onClick={() => setIsScanning(true)}
            className="flex-1 bg-honey text-cocoa font-semibold px-4 py-3 rounded-2xl shadow-md shadow-honey/50 hover:brightness-95 active:scale-95 transition"
          >
            Scan QR
          </button>

          <label className="flex-1 text-center bg-white text-cocoa font-semibold border-2 border-sage px-4 py-3 rounded-2xl hover:bg-sage/20 active:scale-95 transition cursor-pointer">
            Upload Gambar
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {result && result.rawData && (
          <div className="p-5 bg-white shadow-xl shadow-cocoa/10 rounded-3xl">
            <h3 className="text-sm font-semibold text-cocoa/60 uppercase tracking-wide mb-2">Hasil Pemindaian</h3>

            <div className="mb-4">
              <span className="inline-block bg-peach/40 text-cocoa text-xs font-bold px-3 py-1 rounded-full mb-2">
                Tipe: {result.type}
              </span>
              <p className="break-all bg-cream p-3 rounded-2xl border border-cocoa/10 text-cocoa font-mono text-sm">
                {result.rawData}
              </p>
            </div>

            {analysis && (
              <div className={`mt-4 p-4 border rounded-2xl ${getRiskColor(analysis.level)}`}>
                <div className="flex justify-between items-center mb-2">
                  <strong className="text-lg">Status: {analysis.level}</strong>
                  <span className="text-sm font-bold">Skor: {analysis.score}</span>
                </div>

                {analysis.matches.length > 0 ? (
                  <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                    {analysis.matches.map((match, index) => (
                      <li key={index}>
                        {match.reason}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm mt-2">Sistem tidak menemukan indikator risiko pada tautan ini.</p>
                )}
              </div>
            )}

            {/* TOMBOL AKSI & EDUKASI */}
            <div className="mt-5 flex gap-3">
              {result.type === 'URL' && (
                <button
                  onClick={() => handleOpenLink(result.rawData)}
                  className={`flex-1 font-semibold px-4 py-3 rounded-2xl shadow-md active:scale-95 hover:brightness-95 transition ${analysis?.level === 'Risiko tinggi' ? 'bg-danger text-white' : 'bg-honey text-cocoa'}`}
                >
                  {analysis?.level === 'Risiko tinggi' ? 'Buka (Berisiko!)' : 'Buka Tautan'}
                </button>
              )}
              <button
                onClick={() => handleCopy(result.rawData)}
                className="flex-1 bg-sage/30 text-cocoa font-semibold px-4 py-3 rounded-2xl hover:bg-sage/50 active:scale-95 transition"
              >
                Salin Teks
              </button>
            </div>

            {/* KOTAK EDUKASI */}
            <div className="mt-5 p-4 bg-peach/20 border border-peach/50 rounded-2xl text-sm text-cocoa">
              <strong className="block mb-1">💡 Tahukah kamu?</strong>
              Penipuan lewat QR Code disebut <strong>Quishing</strong>. Selalu periksa domain tautan sebelum membuka. Jangan pernah memasukkan password atau data pribadi di situs yang mencurigakan.
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-danger/10 border border-danger/40 text-danger rounded-2xl">
            {error}
          </div>
        )}
      </main>
    </div>
  )
}

export default App;
