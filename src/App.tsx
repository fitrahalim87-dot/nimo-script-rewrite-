import { useState, useEffect } from 'react';
import { Copy, Loader2, RefreshCw, Wand2, Eye, EyeOff, Key, ChevronDown, ChevronUp, Save } from 'lucide-react';

type StyleMode = 'Formal' | 'Santai Tongkrongan' | 'Storytelling' | 'Custom';

export default function App() {
  const [sourceScript, setSourceScript] = useState(() => localStorage.getItem('sourceScript') || '');
  const [styleMode, setStyleMode] = useState<StyleMode>(() => (localStorage.getItem('styleMode') as StyleMode) || 'Formal');
  const [customStyleRef, setCustomStyleRef] = useState(() => localStorage.getItem('customStyleRef') || '');
  const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem('userApiKey') || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiKeyPanel, setShowApiKeyPanel] = useState(false);
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('sourceScript', sourceScript);
    if (sourceScript.trim()) {
      setIsSaved(true);
      const timer = setTimeout(() => setIsSaved(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [sourceScript]);

  useEffect(() => {
    localStorage.setItem('styleMode', styleMode);
  }, [styleMode]);

  useEffect(() => {
    localStorage.setItem('customStyleRef', customStyleRef);
  }, [customStyleRef]);

  useEffect(() => {
    localStorage.setItem('userApiKey', userApiKey);
  }, [userApiKey]);

  const handleRewrite = async () => {
    if (!sourceScript.trim()) {
      setError('Masukkan naskah sumber terlebih dahulu.');
      return;
    }
    if (styleMode === 'Custom' && !customStyleRef.trim()) {
      setError('Masukkan contoh gaya naskah untuk referensi Custom.');
      return;
    }

    setError('');
    setIsGenerating(true);
    setResult('');
    setCopied(false);

    try {
      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceScript,
          styleMode,
          customStyleRef: styleMode === 'Custom' ? customStyleRef : undefined,
          userApiKey: userApiKey.trim() || undefined,
        }),
      });

      const contentType = response.headers.get('content-type');
      let data: any = {};
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        // If it's HTML, we show a clean message, otherwise we show the text
        if (text.includes('<!DOCTYPE html>') || text.includes('<html>')) {
          throw new Error('Sistem tidak dapat terhubung ke server atau server sedang memuat ulang. Harap tunggu beberapa saat.');
        }
        throw new Error(text || 'Gagal menyusun ulang naskah (Server Error).');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyusun ulang naskah.');
      }

      setResult(data.result);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 font-sans p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2.5 text-indigo-600 mb-1">
              <img 
                src="/src/assets/images/nimo_logo_1786925899163.jpg" 
                alt="Nimo Logo" 
                className="w-7 h-7 rounded-lg shadow-sm border border-indigo-100 object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="font-bold tracking-wider uppercase text-xs">Nimo Skrip Rewrite</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Amati, Tiru, Modifikasi
            </h1>
            <p className="text-base text-slate-600 max-w-xl leading-relaxed">
              Ubah naskah mentah menjadi narasi matang yang lebih natural dan siap di-voiceover. 
              Pertahankan kronologi, ciptakan gaya baru.
            </p>
          </div>
          <div className="hidden md:block">
            <img 
              src="/src/assets/images/nimo_logo_1786925899163.jpg" 
              alt="Nimo Skrip Rewrite Icon" 
              className="w-16 h-16 rounded-2xl shadow-md border border-slate-200 object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </header>

        {/* Main Interface Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Inputs */}
          <div className="space-y-6 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
            
            {/* API Key Input */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowApiKeyPanel(!showApiKeyPanel)}
                className="w-full flex justify-between items-center p-4 hover:bg-slate-100/75 transition-colors text-left"
              >
                <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-indigo-600" />
                  Masukkan API Key Gemini
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-medium bg-slate-200/60 px-2 py-0.5 rounded">
                    {userApiKey ? 'Key Anda' : 'Key Sistem'}
                  </span>
                  {showApiKeyPanel ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </button>

              {showApiKeyPanel && (
                <div className="p-4 pt-0 space-y-3 border-t border-slate-200/50 animate-in fade-in duration-200">
                  <div className="relative mt-3">
                    <input
                      id="userApiKey"
                      type={showApiKey ? 'text' : 'password'}
                      value={userApiKey}
                      onChange={(e) => setUserApiKey(e.target.value)}
                      placeholder="AI_zaSy..."
                      className="w-full pl-3 pr-10 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                      title={showApiKey ? 'Sembunyikan' : 'Tampilkan'}
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {/* Panduan Membuat API Key */}
                  <div className="pt-2 border-t border-slate-200 space-y-1.5">
                    <p className="text-[11px] font-semibold text-slate-700">Cara Mendapatkan API Key Gemini Gratis:</p>
                    <ol className="text-[11px] text-slate-600 list-decimal list-inside space-y-1 leading-normal">
                      <li>Buka <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-semibold inline-flex items-center gap-0.5">Google AI Studio (klik di sini)</a></li>
                      <li>Login menggunakan Akun Google Anda.</li>
                      <li>Klik tombol <strong className="text-slate-700">"Get API Key"</strong> di pojok kiri atas.</li>
                      <li>Klik <strong className="text-slate-700">"Create API Key"</strong> lalu pilih proyek dan salin kuncinya.</li>
                      <li>Tempel (paste) kode kunci tersebut pada kolom di atas!</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>

            {/* Source Script */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2">
                  <label htmlFor="sourceScript" className="block text-sm font-semibold text-slate-800">
                    Naskah Sumber
                  </label>
                  {isSaved && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full animate-fade-in transition-all">
                      <Save className="w-3 h-3" />
                      Tersimpan
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium text-slate-500">
                  {sourceScript.length} karakter | {sourceScript.trim() ? sourceScript.trim().split(/\s+/).length : 0} kata
                </span>
              </div>
              <textarea
                id="sourceScript"
                value={sourceScript}
                onChange={(e) => setSourceScript(e.target.value)}
                placeholder="Masukkan naskah mentah Anda di sini..."
                className="w-full h-64 p-4 text-base bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-y"
              />
            </div>

            {/* Style Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-800">
                Gaya Bahasa
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['Formal', 'Santai Tongkrongan', 'Storytelling', 'Custom'] as StyleMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setStyleMode(mode)}
                    className={`px-4 py-3 text-left rounded-xl border transition-all ${
                      styleMode === mode
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium ring-1 ring-indigo-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Style Reference (Conditional) */}
            {styleMode === 'Custom' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <label htmlFor="customStyleRef" className="block text-sm font-semibold text-slate-800">
                  Referensi Gaya Custom
                </label>
                <textarea
                  id="customStyleRef"
                  value={customStyleRef}
                  onChange={(e) => setCustomStyleRef(e.target.value)}
                  placeholder="Masukkan contoh tulisan atau naskah dengan gaya yang ingin Anda tiru..."
                  className="w-full h-32 p-4 text-base bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleRewrite}
              disabled={isGenerating || !sourceScript.trim()}
              className="w-full py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sedang Menulis Ulang...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  <span>Rewrite Naskah</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Output */}
          <div className="flex flex-col bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 h-full min-h-[500px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                Hasil Akhir
              </h2>
              {result && (
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copied ? 'Disalin!' : 'Salin'}</span>
                </button>
              )}
            </div>

            <div className="flex-1 flex flex-col bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex-1 p-6 overflow-y-auto">
                {result ? (
                  <div className="prose prose-slate max-w-none whitespace-pre-wrap leading-relaxed text-slate-800">
                    {result}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                    <Wand2 className="w-12 h-12 opacity-20" />
                    <p className="text-center text-sm max-w-xs">
                      Naskah hasil rewrite akan muncul di sini. Hasil ditulis secara natural dan nyaman untuk voice-over.
                    </p>
                  </div>
                )}
              </div>
              {result && (
                <div className="bg-slate-100 border-t border-slate-200 px-6 py-3 flex justify-between items-center text-xs font-medium text-slate-500">
                  <span>{result.length} karakter | {result.trim() ? result.trim().split(/\s+/).length : 0} kata</span>
                  <span className={Math.abs(result.length - sourceScript.length) / (sourceScript.length || 1) > 0.1 ? "text-amber-600" : "text-emerald-600"}>
                    {Math.abs(result.length - sourceScript.length) / (sourceScript.length || 1) > 0.1 ? '⚠️ Selisih panjang berubah > 10%' : '✓ Panjang mendekati sumber'}
                  </span>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
