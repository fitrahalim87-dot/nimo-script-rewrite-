import type { IncomingMessage, ServerResponse } from 'http';
import { processRewriteScript } from '../src/lib/geminiRewriter.js';

interface ExtendedRequest extends IncomingMessage {
  body?: any;
  query?: any;
  method?: string;
}

interface ExtendedResponse extends ServerResponse {
  status: (code: number) => ExtendedResponse;
  json: (data: any) => void;
  send: (body: any) => void;
  setHeader: (name: string, value: string | number | readonly string[]) => this;
  end: () => this;
}

export default async function handler(req: ExtendedRequest, res: ExtendedResponse) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed. Gunakan POST request.' });
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        // ignore
      }
    }

    if (!body && (req as any).readable) {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      const rawBody = Buffer.concat(buffers).toString();
      if (rawBody) {
        try {
          body = JSON.parse(rawBody);
        } catch (e) {
          // ignore
        }
      }
    }

    const { sourceScript, styleMode, customStyleRef } = body || {};

    if (!sourceScript || !styleMode) {
      res.status(400).json({ error: 'sourceScript dan styleMode harus diisi.' });
      return;
    }

    if (styleMode === 'Custom' && !customStyleRef) {
      res.status(400).json({ error: 'customStyleRef wajib diisi jika memilih gaya Custom.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    if (!apiKey) {
      res.status(500).json({
        error: 'GEMINI_API_KEY belum dikonfigurasi pada environment variables Vercel. Silakan buka Dashboard Vercel > Settings > Environment Variables > Tambahkan GEMINI_API_KEY.',
      });
      return;
    }

    const result = await processRewriteScript({
      sourceScript,
      styleMode,
      customStyleRef,
      apiKey,
    });

    res.status(200).json({ result });
  } catch (error: any) {
    console.error('Vercel API error:', error);
    res.status(500).json({
      error: error?.message || 'Terjadi kesalahan saat memproses naskah dengan AI.',
    });
  }
}
