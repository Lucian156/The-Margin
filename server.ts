/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Endpoints
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      app: 'The Margin',
      tagline: 'Pick the winner. Predict the margin. Lowest score wins.',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/scoring-test', (_req, res) => {
    // Dynamic import to avoid CJS module issues
    import('./src/utils/scoring.js')
      .then(({ runScoringUnitTests }) => {
        const tests = runScoringUnitTests();
        res.json({ success: true, tests });
      })
      .catch((err) => {
        res.status(500).json({ success: false, error: String(err) });
      });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[The Margin] Full-stack server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[The Margin] Failed to start server:', err);
});
