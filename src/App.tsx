import { useState } from 'react';
import { decodeImage } from './qrDecoder';
import CameraScanner from './ui/components/CameraScanner';
import { classifyPayload, type PayloadResult } from './core/payload/payloadClassifier';
import { parseURL, type ParsedURL } from './core/url-parser/urlParser';
import { analyzeURL, type AnalysisResult } from './core/rules/ruleEngine';

const QUISHING_TIPS = [
  {
    title: "Waspada Stiker QR Timpaan",
    desc: "Penipu sering menempelkan stiker QR palsu di atas kode QR asli di tempat umum seperti meja kafe, parkiran, atau kotak amal.",
  },
  {
    title: "Cek Ejaan Domain (Typosquatting)",
    desc: "Perhatikan domain yang mirip aslinya seperti 'gopay-promo.xyz' atau 'bca-login.top'. Situs resmi selalu menggunakan domain utama.",
  },
  {
    title: "Hindari Tautan Pemendek URL",
    desc: "QR Code resmi jarang menggunakan pemendek tautan (bit.ly, tinyurl) karena menyembunyikan alamat tujuan sebenarnya.",
  },
  {
    title: "Jangan Input PIN atau OTP",
    desc: "Memindai QR untuk membaca informasi tidak pernah membutuhkan PIN, password, atau kode OTP perbankan Anda.",
  },
];

const DEMO_SAMPLES = [
  { label: "Contoh Aman (0 Poin)", value: "https://kemkes.go.id/id/layanan" },
  { label: "Contoh Waspada (4 Poin)", value: "http://bit.ly/promo-hadiah-undian" },
  { label: "Contoh Risiko Tinggi (7 Poin)", value: "http://192.168.1.10/update-mobile-bca.apk" },
];

function App() {
  const [result, setResult] = useState<PayloadResult | null>(null);
  const [parsedUrl, setParsedUrl] = useState<ParsedURL | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [manualInput, setManualInput] = useState('');
  const [showManual, setShowManual] = useState(false);

  const processText = (text: string) => {
    const payload = classifyPayload(text);
    setResult(payload);
    setError(null);
    setCopied(false);

    if (payload.type === 'URL') {
      const parsed = parseURL(payload.rawData);
      setParsedUrl(parsed);
      if (parsed) {
        const analysisResult = analyzeURL(parsed);
        setAnalysis(analysisResult);
      } else {
        setAnalysis(null);
        setError("Format URL tidak valid.");
      }
    } else {
      setParsedUrl(null);
      setAnalysis(null);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setResult(null);
    setParsedUrl(null);
    setAnalysis(null);
    setError(null);

    try {
      const decodedText = await decodeImage(file);
      if (decodedText) {
        processText(decodedText);
      } else {
        setError("QR Code tidak terdeteksi di dalam gambar ini. Pastikan gambar cukup jelas dan terang.");
      }
    } catch (err) {
      setError("Terjadi kesalahan saat memproses gambar.");
    }
    event.target.value = '';
  };

  const handleScanSuccess = (text: string) => {
    setIsScanning(false);
    processText(text);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    processText(manualInput.trim());
  };

  const getRiskTheme = (level: string) => {
    if (level === 'Risiko tinggi') {
      return {
        card: 'bg-danger/10 text-danger border-danger/40',
        badge: 'bg-danger text-white',
        bar: 'bg-danger',
        label: 'Berbahaya / Risiko Tinggi',
      };
    }
    if (level === 'Waspada') {
      return {
        card: 'bg-ambercandy/15 text-cocoa border-ambercandy',
        badge: 'bg-ambercandy text-white',
        bar: 'bg-ambercandy',
        label: 'Perlu Waspada',
      };
    }
    return {
      card: 'bg-limecandy/20 text-cocoa border-limecandy',
      badge: 'bg-deepteal text-white',
      bar: 'bg-limecandy',
      label: 'Tautan Terpantau Aman',
    };
  };

  const handleOpenLink = (url: string) => {
    if (analysis?.level === 'Risiko tinggi') {
      const confirm = window.confirm(
        "PERINGATAN KERAS: Tautan ini memiliki RISIKO TINGGI dan berpotensi mencuri data Anda. Apakah Anda benar-benar yakin ingin membukanya?"
      );
      if (!confirm) return;
    } else if (analysis?.level === 'Waspada') {
      const confirm = window.confirm(
        "Hati-hati: Tautan ini memiliki indikator mencurigakan. Tetap lanjutkan membuka tautan?"
      );
      if (!confirm) return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setResult(null);
    setParsedUrl(null);
    setAnalysis(null);
    setError(null);
    setManualInput('');
  };

  // Skala ruleEngine: 0-2 = Aman, 3-5 = Waspada, >= 6 = Risiko tinggi
  const riskPercent = analysis ? Math.min(100, Math.round((analysis.score / 6) * 100)) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-mintcandy/20 via-cream to-white text-cocoa flex flex-col items-center selection:bg-ambercandy selection:text-white">
      {isScanning && (
        <CameraScanner
          onScanSuccess={handleScanSuccess}
          onCancel={() => setIsScanning(false)}
        />
      )}

      {/* HERO HEADER - Deep Teal (#24796C) */}
      <header className="relative w-full overflow-hidden bg-deepteal px-6 pt-9 pb-24 text-center rounded-b-[2.75rem] shadow-xl">
        {/* Decorative Ambient Circles */}
        <div className="pointer-events-none absolute -top-16 -left-16 w-56 h-56 rounded-full bg-mintcandy/25 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-12 w-64 h-64 rounded-full bg-ambercandy/25 blur-2xl" />
        <div className="pointer-events-none absolute top-6 right-10 w-24 h-24 rounded-full border border-mintcandy/20" />

        <div className="relative z-10 max-w-md mx-auto flex flex-col items-center">
          {/* Group Pill Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-mintcandy/35 text-cream px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide mb-4">
            <span className="w-2 h-2 rounded-full bg-limecandy animate-pulse" />
            <span>LITERASI DIGITAL • KELOMPOK 3</span>
          </div>

          {/* App Emblem + Title */}
          <div className="flex items-center justify-center gap-3 mb-2.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-ambercandy to-orchidcandy p-0.5 shadow-lg shadow-black/25">
              <div className="w-full h-full bg-deepteal rounded-[14px] flex items-center justify-center text-limecandy">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              QR Safe <span className="text-ambercandy">Scanner</span>
            </h1>
          </div>

          <p className="text-cream/90 text-sm max-w-xs leading-relaxed">
            Deteksi keamanan tautan QR Code secara instan untuk mencegah jebakan <strong className="text-limecandy font-semibold">Quishing</strong>
          </p>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="w-full max-w-md px-4 -mt-14 pb-12 flex flex-col gap-5 relative z-20">
        {/* ACTION HUB CARD */}
        <div className="bg-white rounded-3xl shadow-xl shadow-deepteal/10 border border-mintcandy/30 p-5">
          <div className="grid grid-cols-2 gap-3.5">
            {/* Scan QR Button - Amber (#E58606) */}
            <button
              onClick={() => setIsScanning(true)}
              className="group relative overflow-hidden bg-ambercandy text-white p-4 rounded-2xl shadow-lg shadow-ambercandy/30 hover:brightness-105 active:scale-95 transition flex flex-col items-center text-center gap-2"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2m10 0h2a2 2 0 012 2v2m0 10v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2m4-10h2v2H7V7zm8 0h2v2h-2V7zm-8 8h2v2H7v-2zm8 0h2v2h-2v-2z" />
                </svg>
              </div>
              <div>
                <span className="block font-bold text-base">Scan QR</span>
                <span className="block text-[11px] text-white/85">Buka Kamera</span>
              </div>
            </button>

            {/* Upload Image Button - Indigo (#5D69B1) */}
            <label className="group bg-indigocandy/10 hover:bg-indigocandy/20 text-indigocandy border-2 border-dashed border-indigocandy/60 p-4 rounded-2xl active:scale-95 transition cursor-pointer flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-indigocandy/20 text-indigocandy flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <span className="block font-bold text-base">Upload QR</span>
                <span className="block text-[11px] text-indigocandy/80">Pilih dari Galeri</span>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {/* Toggle Manual / Demo Bar */}
          <div className="mt-4 pt-3.5 border-t border-deepteal/10">
            <button
              type="button"
              onClick={() => setShowManual(!showManual)}
              className="w-full flex items-center justify-between text-xs font-semibold text-cocoa/75 hover:text-deepteal transition"
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-ambercandy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Uji Tautan Manual / Simulasi Cepat
              </span>
              <span className="text-deepteal font-bold">{showManual ? 'Tutup ▲' : 'Buka ▼'}</span>
            </button>

            {showManual && (
              <div className="mt-3 space-y-2.5">
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Tempel URL atau teks QR di sini..."
                    className="flex-1 bg-cream border border-mintcandy/60 rounded-xl px-3 py-2 text-xs text-cocoa placeholder:text-cocoa/45 focus:outline-none focus:border-deepteal"
                  />
                  <button
                    type="submit"
                    className="bg-deepteal text-white text-xs font-semibold px-3.5 py-2 rounded-xl hover:brightness-110 active:scale-95 transition"
                  >
                    Analisis
                  </button>
                </form>

                <div className="flex flex-wrap gap-1.5">
                  {DEMO_SAMPLES.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setManualInput(sample.value);
                        processText(sample.value);
                      }}
                      className="text-[11px] font-semibold bg-mintcandy/15 hover:bg-mintcandy/30 text-deepteal border border-mintcandy/40 px-2.5 py-1 rounded-lg transition"
                    >
                      ⚡ {sample.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ERROR ALERT */}
        {error && (
          <div className="p-4 bg-danger/10 border-l-4 border-danger text-danger rounded-2xl flex items-start gap-3 shadow-sm">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm font-medium">{error}</div>
          </div>
        )}

        {/* SCAN RESULT & SECURITY METER */}
        {result && result.rawData && (
          <div className="p-5 bg-white shadow-xl shadow-deepteal/10 border border-mintcandy/30 rounded-3xl space-y-4">
            {/* Result Top Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-ambercandy" />
                <h3 className="text-xs font-bold text-cocoa/70 uppercase tracking-wider">
                  Hasil Analisis QR
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {/* Badge Tipe - Orchid (#CC61B0) */}
                <span className="inline-flex items-center gap-1 bg-orchidcandy/15 text-orchidcandy border border-orchidcandy/35 text-xs font-bold px-3 py-0.5 rounded-full">
                  {result.type === 'URL' ? '🌐 Tautan Web' : '📝 Teks Biasa'}
                </span>
                <button
                  onClick={handleReset}
                  title="Bersihkan hasil"
                  className="text-xs text-cocoa/50 hover:text-danger font-semibold px-1.5 py-0.5 rounded transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Domain Breakdown Pills (if URL) */}
            {parsedUrl && (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-mintcandy/15 border border-mintcandy/40 rounded-xl p-2.5">
                  <span className="block text-[10px] font-bold uppercase text-deepteal">Protokol</span>
                  <span className="font-mono text-xs font-bold text-cocoa">
                    {parsedUrl.protocol.replace(':', '').toUpperCase()}
                    {parsedUrl.protocol === 'https:' ? ' 🔒' : ' ⚠️'}
                  </span>
                </div>
                <div className="bg-indigocandy/10 border border-indigocandy/30 rounded-xl p-2.5 overflow-hidden">
                  <span className="block text-[10px] font-bold uppercase text-indigocandy">Domain Tujuan</span>
                  <span className="block font-mono text-xs font-bold text-cocoa truncate" title={parsedUrl.hostname}>
                    {parsedUrl.hostname}
                  </span>
                </div>
              </div>
            )}

            {/* Raw Payload Box */}
            <div className="relative">
              <p className="break-all bg-cream p-3.5 rounded-2xl border border-deepteal/15 text-cocoa font-mono text-xs leading-relaxed">
                {result.rawData}
              </p>
            </div>

            {/* Visual Risk Meter & Findings */}
            {analysis && (() => {
              const theme = getRiskTheme(analysis.level);
              return (
                <div className={`p-4 border-2 rounded-2xl ${theme.card} space-y-3`}>
                  <div className="flex justify-between items-center gap-2">
                    <div>
                      <span className={`inline-block text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-md mb-1 ${theme.badge}`}>
                        {analysis.level}
                      </span>
                      <h4 className="font-bold text-base">{theme.label}</h4>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] uppercase font-bold opacity-75">Poin Risiko</span>
                      <span className="text-2xl font-extrabold">{analysis.score}</span>
                      <span className="text-xs font-semibold opacity-70"> / 6+</span>
                    </div>
                  </div>

                  {/* Visual Progress Bar & Scale Legend */}
                  <div className="space-y-1">
                    <div className="w-full h-2.5 bg-white/80 rounded-full overflow-hidden border border-deepteal/10">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${theme.bar}`}
                        style={{ width: `${Math.max(6, riskPercent)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-semibold opacity-75">
                      <span>0–2: Aman</span>
                      <span>3–5: Waspada</span>
                      <span>≥6: Risiko Tinggi</span>
                    </div>
                  </div>

                  {/* Checklist of Detections */}
                  {analysis.matches.length > 0 ? (
                    <div className="pt-1 space-y-1.5">
                      <span className="block text-xs font-bold uppercase tracking-wide opacity-80">
                        Temuan Indikator ({analysis.matches.length}):
                      </span>
                      <ul className="space-y-1.5 text-xs">
                        {analysis.matches.map((match, index) => (
                          <li key={index} className="flex items-start justify-between gap-2 bg-white/70 p-2.5 rounded-xl">
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-ambercandy shrink-0">⚠️</span>
                              <span className="font-medium leading-snug">{match.reason}</span>
                            </div>
                            <span className="shrink-0 font-mono font-bold text-[11px] bg-deepteal/10 text-deepteal px-2 py-0.5 rounded-md">
                              +{match.weight}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-white/75 p-2.5 rounded-xl text-xs font-medium text-cocoa">
                      <span>✅</span>
                      <span>Tidak ditemukan pola mencurigakan pada struktur tautan ini.</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-1">
              {result.type === 'URL' && (
                <button
                  onClick={() => handleOpenLink(result.rawData)}
                  className={`flex-1 flex items-center justify-center gap-2 font-bold px-4 py-3 rounded-2xl shadow-md active:scale-95 hover:brightness-95 transition ${
                    analysis?.level === 'Risiko tinggi'
                      ? 'bg-danger text-white shadow-danger/30'
                      : 'bg-ambercandy text-white shadow-ambercandy/35'
                  }`}
                >
                  <span>{analysis?.level === 'Risiko tinggi' ? 'Buka (Berisiko!)' : 'Kunjungi Tautan'}</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => handleCopy(result.rawData)}
                className={`flex-1 flex items-center justify-center gap-2 font-bold px-4 py-3 rounded-2xl border transition active:scale-95 ${
                  copied
                    ? 'bg-deepteal text-white border-deepteal'
                    : 'bg-mintcandy/20 text-deepteal border-mintcandy/60 hover:bg-mintcandy/35'
                }`}
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Salin Teks</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* INTERACTIVE GUIDE & ANTI-QUISHING CAROUSEL */}
        <div className="bg-white/95 rounded-3xl shadow-lg shadow-deepteal/5 border border-indigocandy/25 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-indigocandy/15 text-indigocandy flex items-center justify-center font-bold text-sm">
                💡
              </span>
              <h3 className="font-bold text-sm text-indigocandy">
                Tips Anti-Quishing ({tipIndex + 1}/{QUISHING_TIPS.length})
              </h3>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setTipIndex((prev) => (prev - 1 + QUISHING_TIPS.length) % QUISHING_TIPS.length)}
                className="w-7 h-7 rounded-xl bg-indigocandy/10 hover:bg-indigocandy/25 text-indigocandy font-bold text-xs flex items-center justify-center transition"
                aria-label="Tip sebelumnya"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={() => setTipIndex((prev) => (prev + 1) % QUISHING_TIPS.length)}
                className="w-7 h-7 rounded-xl bg-indigocandy/10 hover:bg-indigocandy/25 text-indigocandy font-bold text-xs flex items-center justify-center transition"
                aria-label="Tip selanjutnya"
              >
                ▶
              </button>
            </div>
          </div>

          <div className="bg-indigocandy/10 border border-indigocandy/25 rounded-2xl p-4">
            <h4 className="font-bold text-sm text-cocoa mb-1">
              {QUISHING_TIPS[tipIndex].title}
            </h4>
            <p className="text-xs text-cocoa/80 leading-relaxed">
              {QUISHING_TIPS[tipIndex].desc}
            </p>
          </div>

          {/* 3-Step Visual Security Pipeline */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="bg-mintcandy/15 rounded-2xl p-2.5 border border-mintcandy/35">
              <span className="block text-base mb-0.5">📷</span>
              <span className="block text-[11px] font-bold text-deepteal">1. Pindai QR</span>
              <span className="block text-[10px] text-cocoa/65">Kamera / Galeri</span>
            </div>
            <div className="bg-ambercandy/15 rounded-2xl p-2.5 border border-ambercandy/35">
              <span className="block text-base mb-0.5">🔍</span>
              <span className="block text-[11px] font-bold text-cocoa">2. Cek Risiko</span>
              <span className="block text-[10px] text-cocoa/65">Analisis Domain</span>
            </div>
            <div className="bg-limecandy/20 rounded-2xl p-2.5 border border-limecandy/45">
              <span className="block text-base mb-0.5">🛡️</span>
              <span className="block text-[11px] font-bold text-deepteal">3. Tetap Aman</span>
              <span className="block text-[10px] text-cocoa/65">Cegah Phishing</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
