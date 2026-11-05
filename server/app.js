
import express from 'express';
import cors from 'cors';

import notFound from './src/middleware/notFound.js';
import errorHandler from './src/middleware/errorHandler.js';
import routes from './src/routes/index.js';

const app = express();

// 1. Built-in middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. CORS middleware
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  }),
);

// 3. Health check route
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FreelanceHub API is running',
    timestamp: new Date().toISOString(),
  });
});

// 4. Your API routes will go here later
app.use('/api/v1', routes);

// 5. Handle unknown routes
app.use(notFound);

// 6. Central error handler (must be last)
app.use(errorHandler);

export default app;
