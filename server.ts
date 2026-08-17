import express from 'express';
import path from 'path';
import { processRewriteScript } from './src/lib/geminiRewriter.js';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  app.post('/api/rewrite', async (req, res) => {
    try {
      const { sourceScript, styleMode, customStyleRef } = req.body || {};

      if (!sourceScript || !styleMode) {
        return res.status(400).json({ error: 'sourceScript and styleMode are required.' });
      }

      if (styleMode === 'Custom' && !customStyleRef) {
        return res.status(400).json({ error: 'customStyleRef is required when styleMode is Custom.' });
      }

      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
      if (!apiKey) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY in your environment variables.',
        });
      }

      const result = await processRewriteScript({
        sourceScript,
        styleMode,
        customStyleRef,
        apiKey,
      });

      res.json({ result });
    } catch (error: any) {
      console.error('Error generating script:', error);
      res.status(500).json({
        error: error?.message || 'Failed to rewrite the script.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
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
