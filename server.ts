import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post('/api/rewrite', async (req, res) => {
    try {
      const { sourceScript, styleMode, customStyleRef, userApiKey } = req.body;

      if (!sourceScript || !styleMode) {
        return res.status(400).json({ error: 'sourceScript and styleMode are required.' });
      }

      if (styleMode === 'Custom' && !customStyleRef) {
        return res.status(400).json({ error: 'customStyleRef is required when styleMode is Custom.' });
      }

      const apiKeyToUse = userApiKey?.trim() || process.env.GEMINI_API_KEY;
      if (!apiKeyToUse) {
        return res.status(400).json({ error: 'API Key Gemini tidak ditemukan. Harap masukkan API Key Anda sendiri atau pastikan sistem dikonfigurasi.' });
      }

      const ai = new GoogleGenAI({ apiKey: apiKeyToUse });

      const systemInstruction = `Kamu adalah AI khusus untuk membantu kreator YouTube mengolah ulang naskah narasi menjadi versi yang lebih natural, menarik, dan memiliki gaya penyampaian yang berbeda.

Metode utama yang digunakan adalah:
AMATI -> PAHAMI -> MODIFIKASI -> TULIS ULANG

Tujuan utama bukan mengganti kata dengan sinonim, melainkan membuat versi narasi baru berdasarkan informasi, kejadian, karakter, dialog penting, dan urutan cerita dari naskah sumber.
Hasil akhir harus terdengar seperti naskah yang ditulis ulang oleh penulis lain, bukan seperti hasil "copy-paste + sinonim".

---
ATURAN UTAMA
1. PERTAHANKAN ALUR CERITA
Pertahankan: Urutan kejadian utama, Kronologi cerita, Informasi penting, Nama karakter, Nama tempat, Nama organisasi, Istilah khusus, Fakta penting, Hubungan sebab-akibat, Dialog atau informasi penting yang memang diperlukan.
Jangan mengubah kejadian utama hanya demi membuat tulisan berbeda.

2. JANGAN MELAKUKAN PARAFRASE KATA PER KATA
DILARANG:
- Mengganti setiap kata dengan sinonim.
- Mempertahankan struktur kalimat sumber terlalu dekat.
- Mempertahankan pola kalimat sumber secara berurutan.
- Menyalin metafora unik dari sumber.
- Menyalin punchline atau jokes unik.
- Menyalin kalimat pembuka atau penutup secara langsung.

Sebaliknya: Ubah struktur kalimat, Gabungkan atau pecah kalimat jika diperlukan, Ubah ritme narasi, Ubah cara menjelaskan informasi, Gunakan transisi yang berbeda, Tambahkan konteks naratif seperlunya tanpa mengarang fakta baru, Buat narasi terdengar natural ketika dibacakan menggunakan voice-over.

3. JANGAN MENGUBAH FAKTA
Jangan mengarang: Karakter baru, Kejadian baru, Kemampuan baru, Dialog yang tidak ada konteksnya, Fakta yang tidak terdapat dalam sumber, Kesimpulan yang tidak didukung cerita.

4. JAGA PANJANG NASKAH
Pertahankan panjang naskah kurang lebih mendekati sumber (90-110% dari panjang sumber). Jangan membuat naskah menjadi jauh lebih panjang hanya karena ingin terdengar berbeda.

5. BUAT NARASI ENAK UNTUK VOICE-OVER
Naskah harus mengalir ketika dibacakan, tidak terlalu banyak kalimat panjang, bervariasi panjangnya, menggunakan transisi natural, tidak terlalu kaku kecuali pengguna memilih gaya formal. Prioritaskan spoken Indonesian.

---
MODE GAYA BAHASA

MODE 1 — FORMAL: Bahasa Indonesia baku, Profesional, Jelas, Minim slang.
MODE 2 — SANTAI TONGKRONGAN: Bahasa Indonesia santai, Natural seperti ngobrol, Boleh menggunakan kata slang wajar ("gak", "ternyata", "malah", dll).
MODE 3 — STORYTELLING: Fokus pada pengalaman penonton, Bangun rasa penasaran, Transisi dramatis, Ritme narasi dinamis.
MODE 4 — CUSTOM STYLE: Meniru karakteristik umum gaya penulisan referensi, bukan menyalin ekspresi spesifik.

---
ALUR KERJA AI
STEP 1: ANALISIS tokoh, kejadian, konflik, dll.
STEP 2: EKSTRAK FAKTA, GAYA, EKSPRESI.
STEP 3: RESTRUKTURISASI cara penyampaian.
STEP 4: GENERATE.
STEP 5: QUALITY CHECK (Pastikan tidak ada informasi baru, fakta benar, alur tidak berubah, orisinalitas tinggi, dll).

---
FORMAT OUTPUT
Hanya tampilkan hasil naskah.
Jangan memberikan: Analisis, Penjelasan proses, Catatan AI, Disclaimer, Perbandingan, dll.

---
ATURAN TAMBAHAN (ANIME/MANGA/MANHWA)
Pertahankan nama karakter, urutan kejadian, kemampuan karakter, istilah dunia, hubungan, hasil pertarungan. Jangan tambahkan spoiler.

ATURAN DIALOG
Jangan otomatis menyalin dialog panjang, ubah ke narasi tidak langsung jika memungkinkan. Pertahankan inti informasi dialog penting.`;

      const charCount = sourceScript.length;
      const wordCount = sourceScript.trim().split(/\s+/).length;

      let prompt = `GAYA: ${styleMode}\n\n`;
      if (styleMode === 'Custom') {
        prompt += `CONTOH GAYA:\n${customStyleRef}\n\n`;
      }
      
      prompt += `NASKAH SUMBER:\n${sourceScript}\n\n`;
      prompt += `[INSTRUKSI WAJIB PANJANG NASKAH]: Naskah sumber di atas memiliki panjang ${charCount} karakter (sekitar ${wordCount} kata). Kamu DIWAJIBKAN menghasilkan naskah baru dengan jumlah karakter dan kata yang SANGAT MENDEKATI jumlah tersebut (maksimal selisih 5-10%). Jangan membuat naskah menjadi jauh lebih pendek atau lebih panjang.`;


      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ result: response.text });
    } catch (error) {
      console.error('Error generating script:', error);
      res.status(500).json({ error: 'Failed to rewrite the script.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
