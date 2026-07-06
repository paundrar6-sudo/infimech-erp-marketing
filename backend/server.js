const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./config/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite development server (port 5173) and production
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static upload folders (for mock logos or download brochures)
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Register Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/operators', require('./routes/operators'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/social', require('./routes/social'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/notifications', require('./routes/notifications'));

// Base route status
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', service: 'Marketing ERP API', time: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express Error Handler:', err.stack);
  res.status(500).json({ message: 'Terjadi kesalahan internal pada server.', error: err.message });
});

// Initialize DB and start server
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`=========================================`);
    });
  } catch (err) {
    console.error('Failed to start server due to database initialization failure:', err);
    process.exit(1);
  }
}

startServer();
