import { useState } from 'react';
import { Copy, Loader2, RefreshCw, Wand2 } from 'lucide-react';

type StyleMode = 'Formal' | 'Santai Tongkrongan' | 'Storytelling' | 'Custom';

export default function App() {
  const [sourceScript, setSourceScript] = useState('');
  const [styleMode, setStyleMode] = useState<StyleMode>('Formal');
  const [customStyleRef, setCustomStyleRef] = useState('');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

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
        }),
      });

      let data: any = null;
      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(
              'Endpoint /api/rewrite tidak ditemukan (404). Jika di-deploy di Vercel, pastikan fungsi serverless api/rewrite.ts disertakan.'
            );
          }
          throw new Error(`Respon server error (${response.status}): ${text.slice(0, 120)}`);
        }
        try {
          data = JSON.parse(text);
        } catch {
          data = { result: text };
        }
      }

      if (!response.ok) {
        let msg = data?.error || 'Gagal menyusun ulang naskah.';
        if (typeof msg === 'string' && (msg.startsWith('{') || msg.startsWith('['))) {
          try {
            const parsed = JSON.parse(msg);
            msg = parsed?.error?.message || parsed?.message || msg;
          } catch {
            // keep msg as is
          }
        }
        throw new Error(msg);
      }

      if (!data?.result) {
        throw new Error('Tidak ada respon teks yang dihasilkan dari AI.');
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
        <header className="space-y-2">
          <div className="inline-flex items-center justify-center space-x-2 text-indigo-600 mb-2">
            <RefreshCw className="w-5 h-5" />
            <span className="font-semibold tracking-wide uppercase text-sm">AI Script Rewriter</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Amati, Tiru, Modifikasi
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
            Ubah naskah mentah menjadi narasi matang yang lebih natural dan siap di-voiceover. 
            Pertahankan kronologi, ciptakan gaya baru.
          </p>
        </header>

        {/* Main Interface Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Inputs */}
          <div className="space-y-6 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
            
            {/* Source Script */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <label htmlFor="sourceScript" className="block text-sm font-semibold text-slate-800">
                  Naskah Sumber
                </label>
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
