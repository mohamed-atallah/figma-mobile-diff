import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import * as dotenv from 'dotenv';
import comparisonRoutes from './api/routes/comparison.routes';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));
app.use('/storage', express.static(path.join(__dirname, '../storage')));

// API Routes
app.use('/api/comparisons', comparisonRoutes);

// Serve frontend pages
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.get('/results/:id', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public', 'results.html'));
});

app.get('/history', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public', 'history.html'));
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '3.0.0',
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 Mobile Visual Regression Testing Server');
  console.log('='.repeat(60));
  console.log(`📍 Server running at: http://${HOST}:${PORT}`);
  console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🔍 API endpoint: http://${HOST}:${PORT}/api/comparisons`);
  console.log('='.repeat(60));
  console.log('Ready to accept image comparisons! 🎉');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});

export default app;
