// Import required modules
const express = require('express');
const dotenv = require('dotenv');

// Import the PostgreSQL pool
const pool = require('./db');

// Import user routes
const userRoutes = require('./userRoutes');

// Load environment variables from .env file
dotenv.config();

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Basic route to test server
app.get('/', (req, res) => {
  res.send('Alumni App API is running...');
});

// Route to test database connection
app.get('/test-db', async (req, res) => {
    try {
      const result = await pool.query('SELECT NOW()');
      res.json({ message: 'Database connection successful', time: result.rows[0].now });
    } catch (error) {
      res.status(500).json({ error: 'Database connection failed' });
    }
  });

// Use user routes
app.use('/api/users', userRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
    console.log(`Server is running on port http://localhost:${PORT}/test-db`);
    console.log(`Server is running on port http://localhost:${PORT}/api/users`);
    console.log(`Server is running on port http://localhost:${PORT}/refresh-token`);
});
