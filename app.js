const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const emailRoutes = require('./routes/emailRoutes');
const testRoutes = require('./routes/testRoutes');
const { globalLimiter, apiLimiter, testLimiter } = require('./middleware/rateLimiter');
const { blockBlacklistedIPs } = require('./middleware/ipFilter');

const app = express();

// Security middleware
app.use(helmet()); // Set security headers
app.use(cors()); // Enable CORS with default options
app.use(blockBlacklistedIPs); // Block blacklisted IPs

// Trust proxy - needed for rate limiting by IP to work properly behind a reverse proxy
app.set('trust proxy', 1);

// Body parsing middleware
app.use(express.json({ limit: '1mb' })); // Limit body size to prevent DDOS
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply global rate limiter to all requests
app.use(globalLimiter);

// Routes with specific rate limiters
app.use('/api/auth', authRoutes);
app.use('/api/tasks', apiLimiter, taskRoutes);
app.use('/api/organizations', apiLimiter, organizationRoutes);
app.use('/api/email', apiLimiter, emailRoutes);
app.use('/test', testLimiter, testRoutes);
app.use('/api', apiLimiter, userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
