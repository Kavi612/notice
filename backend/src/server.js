require('dotenv').config();
const express = require('express');
const cors = require('cors');
const noticeRoutes = require('./routes/noticeRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS for the Vite dev server and deployed frontend origins
const rawCorsOrigin = process.env.CORS_ORIGIN || '';
const configuredOrigins = rawCorsOrigin
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0 && o !== '*');

const allowedOrigins = Array.from(new Set(['http://localhost:5173', ...configuredOrigins]));

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, mobile, server-to-server) or matching allowed origins
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Mount notice routes at /api/notices
app.use('/api/notices', noticeRoutes);

// Return JSON 404 for unknown routes
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.url} does not exist`,
    });
});

// Centralized JSON 500 handler for unhandled errors
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: err.message || 'An unexpected error occurred',
    });
});

// Start listening if run directly
let server;
if (process.env.NODE_ENV !== 'test') {
    server = app.listen(PORT, () => {
        console.log(`Notice Board backend server running on port ${PORT}`);
    });
}

module.exports = { app, server };
