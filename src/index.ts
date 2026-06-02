/**
 * Facebook Trending Posts - Express Server
 * API endpoint for generating and posting content
 */

import 'dotenv/config';
import express from 'express';
import { generateRoute } from './routes/generate.js';
import { initDatabase } from './db.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initDatabase();

// Middleware
app.use(express.json());

// Routes
app.use('/api', generateRoute);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
  console.log(`[Server] Generate endpoint: POST /api/generate-posts`);
});
