const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const router = express.Router();


// Refresh Token Route
router.post('/refresh-token', (req, res) => {
    const refreshToken = req.header('x-refresh-token');
    if (!refreshToken) return res.status(401).json({ error: 'Access denied. No refresh token provided.' });
  
    try {
      const verified = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const newToken = jwt.sign({ user_id: verified.user_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token: newToken });
    } catch (error) {
      res.status(400).json({ error: 'Invalid refresh token' });
    }
  });
  

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// User Signup Route
router.post('/signup', async (req, res) => {
  const { full_name, email, password } = req.body;
  try {
    // Check if the user already exists
    const userExist = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user into the database
    const newUser = await pool.query(
      'INSERT INTO users (full_name, email, password) VALUES ($1, $2, $3) RETURNING *',
      [full_name, email, hashedPassword]
    );

    // Create JWT token
    const token = jwt.sign({ user_id: newUser.rows[0].id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// User Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      // Check if the user exists
      const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (user.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
  
      // Check password
      const isMatch = await bcrypt.compare(password, user.rows[0].password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
  
      // Create JWT access token
      const token = jwt.sign({ user_id: user.rows[0].id }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });
  
      // Create JWT refresh token
      const refreshToken = jwt.sign({ user_id: user.rows[0].id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '7d',
      });
  
      res.json({ token, refreshToken });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

// Get User Profile Route
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await pool.query('SELECT id, full_name, email FROM users WHERE id = $1', [req.user.user_id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


// OLD VER
// const express = require('express');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const pool = require('./db');
// const router = express.Router();

// // Middleware to verify JWT token
// const verifyToken = (req, res, next) => {
//   const token = req.header('Authorization');
//   if (!token) return res.status(401).json({ error: 'Access denied' });

//   try {
//     const verified = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = verified;
//     next();
//   } catch (error) {
//     res.status(400).json({ error: 'Invalid token' });
//   }
// };

// // User Signup Route
// router.post('/signup', async (req, res) => {
//   const { full_name, email, password } = req.body;
//   try {
//     // Check if the user already exists
//     const userExist = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
//     if (userExist.rows.length > 0) {
//       return res.status(400).json({ error: 'User already exists' });
//     }

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Insert new user into the database
//     const newUser = await pool.query(
//       'INSERT INTO users (full_name, email, password) VALUES ($1, $2, $3) RETURNING *',
//       [full_name, email, hashedPassword]
//     );

//     // Create JWT token
//     const token = jwt.sign({ user_id: newUser.rows[0].id }, process.env.JWT_SECRET, {
//       expiresIn: '1h',
//     });

//     res.status(201).json({ token });
//   } catch (error) {
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // User Login Route
// router.post('/login', async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     // Check if the user exists
//     const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
//     if (user.rows.length === 0) {
//       return res.status(400).json({ error: 'Invalid credentials' });
//     }

//     // Check password
//     const isMatch = await bcrypt.compare(password, user.rows[0].password);
//     if (!isMatch) {
//       return res.status(400).json({ error: 'Invalid credentials' });
//     }

//     // Create JWT token
//     const token = jwt.sign({ user_id: user.rows[0].id }, process.env.JWT_SECRET, {
//       expiresIn: '1h',
//     });

//     res.json({ token });
//   } catch (error) {
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // Get User Profile Route
// router.get('/profile', verifyToken, async (req, res) => {
//   try {
//     const user = await pool.query('SELECT id, full_name, email FROM users WHERE id = $1', [req.user.user_id]);
//     if (user.rows.length === 0) {
//       return res.status(404).json({ error: 'User not found' });
//     }
//     res.json(user.rows[0]);
//   } catch (error) {
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// module.exports = router;