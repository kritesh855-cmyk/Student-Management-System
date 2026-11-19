import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import healthRoutes from './backend/routes/healthRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Built-in Express middleware to parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files (HTML, CSS, JS, Uploads) from /public
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// Step 1 API Route: Server Health Check
app.use('/api/health', healthRoutes);

// Fallback route: serve index.html for main page
app.get('/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Student Management System running at http://localhost:${PORT}`);
});
