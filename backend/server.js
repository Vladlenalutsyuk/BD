const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = 3000;
const JWT_SECRET = 'your_jwt_secret_key'; // Replace with a secure key in production

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'vladlena121512',
  database: 'children_center'
});

// Initialize database and tables
const initializeDatabase = async () => {
  try {
    await db.promise().query('CREATE DATABASE IF NOT EXISTS children_center');
    await db.promise().query('USE children_center');

    // Users table
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'parent', 'teacher') NOT NULL
      )
    `);

    // Subjects table
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
      )
    `);

    // Parents table
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS parents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        phone VARCHAR(15),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Teachers table
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS teachers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        subject_id INT,
        phone VARCHAR(15),
        education VARCHAR(255),
        experience INT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT
      )
    `);

    // Deleted teachers table
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS deleted_teachers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        subject_id INT,
        phone VARCHAR(15),
        education VARCHAR(255),
        experience INT,
        deleted_at DATETIME
      )
    `);

    // Children table
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS children (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        birth_date DATE NOT NULL,
        parent_id INT NOT NULL,
        FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
      )
    `);

    // Rooms table
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE
      )
    `);

    // Classes table
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS classes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        subject_id INT NOT NULL,
        schedule DATETIME NOT NULL,
        teacher_id INT,
        room_id INT,
        price DECIMAL(10,2) DEFAULT 0.00,
        class_type ENUM('group', 'individual') NOT NULL,
        min_age INT NOT NULL DEFAULT 3,
        max_age INT NOT NULL DEFAULT 16,
        completed BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
      )
    `);

    // Enrollments table
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        child_id INT NOT NULL,
        class_id INT NOT NULL,
        FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
        UNIQUE(child_id, class_id)
      )
    `);

    // Reviews table
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        parent_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Trigger for archiving deleted teachers
    await db.promise().query(`
      CREATE TRIGGER IF NOT EXISTS archive_teacher
      BEFORE DELETE ON teachers
      FOR EACH ROW
      BEGIN
        INSERT INTO deleted_teachers (user_id, subject_id, phone, education, experience, deleted_at)
        VALUES (OLD.user_id, OLD.subject_id, OLD.phone, OLD.education, OLD.experience, NOW());
      END
    `);

    console.log('✅ Database and tables successfully initialized');
  } catch (err) {
    console.error('❌ Error initializing database:', err.stack);
    process.exit(1);
  }
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token not provided' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Start server
const startServer = async () => {
  await initializeDatabase();
  db.connect(err => {
    if (err) {
      console.error('❌ Error connecting to database:', err.stack);
      process.exit(1);
    }
    console.log('✅ Database connection established');
  });

  // Registration (parents only)
  app.post('/api/register', async (req, res) => {
    const { username, email, password, phone } = req.body;
    if (!username || !email || !password || !phone) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (username.length > 50) return res.status(400).json({ error: 'Username must not exceed 50 characters' });
    if (email.length > 100) return res.status(400).json({ error: 'Email must not exceed 100 characters' });
    if (phone.length > 15) return res.status(400).json({ error: 'Phone must not exceed 15 characters' });

    try {
      const hash = await bcrypt.hash(password, 10);
      await db.promise().query('START TRANSACTION');
      try {
        const [userResult] = await db.promise().query(
          'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
          [username, email, hash, 'parent']
        );
        const userId = userResult.insertId;
        await db.promise().query('INSERT INTO parents (user_id, phone) VALUES (?, ?)', [userId, phone]);
        await db.promise().query('COMMIT');
        res.status(201).json({ message: 'Parent registered' });
      } catch (err) {
        await db.promise().query('ROLLBACK');
        const errorMsg =
          err.code === 'ER_DUP_ENTRY'
            ? err.message.includes('username')
              ? 'Username already taken'
              : 'Email already registered'
            : 'Registration error';
        res.status(400).json({ error: errorMsg });
      }
    } catch (err) {
      console.error('Server error:', err.stack);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Login
  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
      const [results] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
      if (results.length === 0) return res.status(401).json({ error: 'User not found' });
      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ error: 'Invalid password' });
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
      res.json({ user: { id: user.id, email: user.email, role: user.role, username: user.username }, token });
    } catch (err) {
      console.error('Server error:', err.stack);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // New endpoint: Validate token
  app.get('/api/auth/validate', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]; // Получаем токен из заголовка "Bearer <token>"

    if (!token) {
      return res.status(401).json({ error: 'Токен отсутствует' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET); // Проверяем токен
      const currentTime = Math.floor(Date.now() / 1000);

      if (decoded.exp < currentTime) {
        return res.status(401).json({ error: 'Токен истёк' });
      }

      // Возвращаем информацию о пользователе
      res.json({
        valid: true,
        role: decoded.role,
        userId: decoded.id,
      });
    } catch (err) {
      res.status(401).json({ error: 'Недействительный токен' });
    }
  });

  // Get subjects
  app.get('/api/subjects', async (req, res) => {
    try {
      const [results] = await db.promise().query('SELECT * FROM subjects');
      res.json(results || []);
    } catch (err) {
      console.error('Error fetching subjects:', err.stack);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Public endpoint for classes (with child age filtering)
  app.get('/api/classes/public', async (req, res) => {
    const { subject_id, child_id } = req.query;
    try {
      let query = `
        SELECT classes.id, classes.schedule, classes.price, classes.class_type, classes.min_age, classes.max_age,
               subjects.name AS subject, teachers.id AS teacher_id, users.username AS teacher_name,
               rooms.name AS room, classes.subject_id, classes.room_id
        FROM classes
        JOIN subjects ON classes.subject_id = subjects.id
        LEFT JOIN teachers ON classes.teacher_id = teachers.id
        LEFT JOIN users ON teachers.user_id = teachers.user_id
        LEFT JOIN rooms ON classes.room_id = rooms.id
        WHERE classes.schedule > NOW()
      `;
      const params = [];
      if (subject_id) {
        query += ' AND classes.subject_id = ?';
        params.push(subject_id);
      }
      if (child_id) {
        query += ` AND (
          classes.class_type = 'individual' OR
          EXISTS (
            SELECT 1 FROM children
            WHERE children.id = ? AND
            FLOOR(DATEDIFF(CURDATE(), children.birth_date) / 365.25) BETWEEN classes.min_age AND classes.max_age
          )
        )`;
        params.push(child_id);
      }
      const [results] = await db.promise().query(query, params);
      res.json(results || []);
    } catch (err) {
      console.error('Error fetching public classes:', err.stack);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Public endpoint for reviews
  app.get('/api/reviews', async (req, res) => {
    try {
      const [results] = await db.promise().query(`
        SELECT reviews.id, reviews.content, reviews.created_at, users.username AS parent_name
        FROM reviews
        JOIN users ON reviews.parent_id = users.id
        WHERE users.role = 'parent'
      `);
      res.json(results || []);
    } catch (err) {
      console.error('Error fetching reviews:', err.stack);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Add review
  app.post('/api/reviews', authenticateToken, async (req, res) => {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Review content is required' });
    }
    try {
      await db.promise().query('INSERT INTO reviews (parent_id, content) VALUES (?, ?)', [req.user.id, content]);
      res.status(201).json({ message: 'Review added' });
    } catch (err) {
      console.error('Error adding review:', err.stack);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Public endpoint for teachers
  app.get('/api/users/teachers/public', async (req, res) => {
    try {
      const [results] = await db.promise().query(`
        SELECT users.id, users.username, subjects.name AS subject, teachers.education, teachers.experience
        FROM users
        JOIN teachers ON users.id = teachers.user_id
        LEFT JOIN subjects ON teachers.subject_id = subjects.id
        WHERE users.role = 'teacher'
      `);
      res.json(results || []);
    } catch (err) {
      console.error('Error fetching public teacher data:', err.stack);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get rooms
  app.get('/api/rooms', authenticateToken, async (req, res) => {
    try {
      const [results] = await db.promise().query('SELECT * FROM rooms');
      res.json(results || []);
    } catch (err) {
      console.error('Error fetching rooms:', err.stack);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get all teachers (admin only)
  app.get('/api/teachers', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    try {
      const [results] = await db.promise().query(`
        SELECT teachers.id, users.username, subjects.name AS subject_name
        FROM teachers
        JOIN users ON teachers.user_id = users.id
        LEFT JOIN subjects ON teachers.subject_id = subjects.id
      `);
      res.json(results || []);
    } catch (err) {
      console.error('Error fetching teachers:', err.stack);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get teachers by subject
  app.get('/api/teachers/by-subject/:subjectId', authenticateToken, async (req, res) => {
    const { subjectId } = req.params;
    try {
      const [results] = await db.promise().query(`
        SELECT teachers.id, users.username
        FROM teachers
        JOIN users ON teachers.user_id = users.id
        WHERE teachers.subject_id = ?
      `, [subjectId]);
      res.json(results || []);
    } catch (err) {
      console.error('Error fetching teachers by subject:', err.stack);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get teacher list for admin panel
  app.get('/api/users/teachers', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    try {
      const [results] = await db.promise().query(`
        SELECT users.id AS user_id, users.username, users.email, subjects.name AS subject_name, teachers.phone
        FROM users
        JOIN teachers ON users.id = teachers.user_id
        LEFT JOIN subjects ON teachers.subject_id = subjects.id
        WHERE users.role = 'teacher'
      `);
      console.log('GET /api/users/teachers - Response:', results);
      res.json(results || []);
    } catch (err) {
      console.error('Error fetching teacher list:', err.stack);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Create new teacher (admin only)
  app.post('/api/teachers', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    if (username.length > 50) return res.status(400).json({ error: 'Username must not exceed 50 characters' });
    if (email.length > 100) return res.status(400).json({ error: 'Email must not exceed 100 characters' });

    try {
      const hash = await bcrypt.hash(password, 10);
      await db.promise().query('START TRANSACTION');
      try {
        const [userResult] = await db.promise().query(
          'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
          [username, email, hash, 'teacher']
        );
        const userId = userResult.insertId;
        await db.promise().query('INSERT INTO teachers (user_id) VALUES (?)', [userId]);
        await db.promise().query('COMMIT');
        res.status(201).json({ message: 'Teacher created' });
      } catch (err) {
        await db.promise().query('ROLLBACK');
        const errorMsg =
          err.code === 'ER_DUP_ENTRY'
            ? err.message.includes('username')
              ? 'Username already taken'
              : 'Email already registered'
            : 'Error creating teacher';
        res.status(400).json({ error: errorMsg });
      }
    } catch (err) {
      console.error('Server error:', err.stack);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Delete teacher (admin only)
  app.delete('/api/teachers/:userId', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { userId } = req.params;
    try {
      const [result] = await db.promise().query('DELETE FROM users WHERE id = ? AND role = ?', [userId, 'teacher']);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Teacher not found' });
      }
      res.json({ message: 'Teacher deleted' });
    } catch (err) {
      console.error('Error deleting teacher:', err.stack);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get teacher profile
  app.get('/api/teachers/profile', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Access denied' });
    }
    try {
      const [results] = await db.promise().query(`
        SELECT users.username, users.email, teachers.phone, teachers.education, teachers.experience, subjects.name AS subject_name, teachers.subject_id
        FROM users
        JOIN teachers ON users.id = teachers.user_id
        LEFT JOIN subjects ON teachers.subject_id = subjects.id
        WHERE users.id = ?
      `, [req.user.id]);
      if (results.length === 0) return res.status(404).json({ error: 'Teacher not found' });
      res.json(results[0]);
    } catch (err) {
      console.error('Error fetching profile:', err.stack);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Update teacher profile
  app.put('/api/teachers/profile', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { phone, education, experience, subject_id } = req.body;
    if (!phone || phone.length > 15) {
      return res.status(400).json({ error: 'Phone is required and must not exceed 15 characters' });
    }
    try {
      const [result] = await db.promise().query(
        'UPDATE teachers SET phone = ?, education = ?, experience = ?, subject_id = ? WHERE user_id = ?',
        [phone, education || null, experience || null, subject_id || null, req.user.id]
      );
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Teacher not found' });
      res.json({ message: 'Profile updated' });
    } catch (err) {
      console.error('Error updating profile:', err.stack);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get teacher salary
  app.get('/api/teachers/salary', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { month } = req.query;
    try {
      const [teacher] = await db.promise().query('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
      if (teacher.length === 0) return res.status(404).json({ error: 'Teacher not found' });
      const teacherId = teacher[0].id;

      let query = `
        SELECT DATE_FORMAT(schedule, '%Y-%m') AS month, COUNT(*) AS class_count, SUM(price * 0.4) AS total_salary
        FROM classes
        WHERE teacher_id = ? AND completed = TRUE
      `;
      const params = [teacherId];

      if (month) {
        query += ' AND DATE_FORMAT(schedule, \'%Y-%m\') = ?';
        params.push(month);
      } else {
        query += ' GROUP BY DATE_FORMAT(schedule, \'%Y-%m\')';
      }

      query += ' ORDER BY month DESC';

      const [results] = await db.promise().query(query, params);
      // Ensure total_salary is a number
      const formattedResults = results.map(item => ({
        ...item,
        total_salary: Number(item.total_salary) || 0
      }));
      res.json(formattedResults);
    } catch (err) {
      console.error('Error in /api/teachers/salary:', err.stack);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Mark class as completed (admin only)
  app.put('/api/classes/:id/complete', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { id } = req.params;
    try {
      const [result] = await db.promise().query(
        'UPDATE classes SET completed = TRUE WHERE id = ? AND schedule <= NOW()',
        [id]
      );
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Class not found or not yet occurred' });
      res.json({ message: 'Class marked as completed' });
    } catch (err) {
      console.error('Error marking class as completed:', err.stack);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get upcoming classes for teacher
  app.get('/api/classes/upcoming', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Access denied' });
    }
    try {
      const [teacher] = await db.promise().query('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
      if (teacher.length === 0) return res.status(404).json({ error: 'Teacher not found' });
      const teacherId = teacher[0].id;

      const [results] = await db.promise().query(`
        SELECT classes.id, classes.schedule, classes.price, classes.class_type, classes.min_age, classes.max_age,
               subjects.name AS subject, rooms.name AS room, classes.completed
        FROM classes
        JOIN subjects ON classes.subject_id = subjects.id
        LEFT JOIN rooms ON classes.room_id = rooms.id
        WHERE classes.teacher_id = ? AND (classes.schedule > NOW() OR classes.completed = FALSE)
        ORDER BY classes.schedule
      `, [teacherId]);

      res.json(results || []);
    } catch (err) {
      console.error('Error fetching upcoming classes:', err.stack);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get completed classes for teacher
  app.get('/api/classes/completed', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Access denied' });
    }
    try {
      const [teacher] = await db.promise().query('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
      if (teacher.length === 0) return res.status(404).json({ error: 'Teacher not found' });
      const teacherId = teacher[0].id;

      const [results] = await db.promise().query(`
        SELECT classes.id, classes.schedule, classes.price, classes.class_type, classes.min_age, classes.max_age,
               subjects.name AS subject, rooms.name AS room, classes.completed
        FROM classes
        JOIN subjects ON classes.subject_id = subjects.id
        LEFT JOIN rooms ON classes.room_id = rooms.id
        WHERE classes.teacher_id = ? AND classes.completed = TRUE
        ORDER BY classes.schedule DESC
      `, [teacherId]);

      res.json(results || []);
    } catch (err) {
      console.error('Error fetching completed classes:', err.stack);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get classes for weekly view (upcoming)
  app.get('/api/classes/upcoming/weekly', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { startDate } = req.query;
    if (!startDate) return res.status(400).json({ error: 'Start date is required' });

    try {
      const [teacher] = await db.promise().query('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
      if (teacher.length === 0) return res.status(404).json({ error: 'Teacher not found' });
      const teacherId = teacher[0].id;

      const [results] = await db.promise().query(`
        SELECT classes.id, classes.schedule, classes.price, classes.class_type, classes.min_age, classes.max_age,
               subjects.name AS subject, rooms.name AS room, classes.completed
        FROM classes
        JOIN subjects ON classes.subject_id = subjects.id
        LEFT JOIN rooms ON classes.room_id = rooms.id
        WHERE classes.teacher_id = ?
        AND classes.schedule BETWEEN ? AND DATE_ADD(?, INTERVAL 7 DAY)
        AND (classes.schedule > NOW() OR classes.completed = FALSE)
        ORDER BY classes.schedule
      `, [teacherId, startDate, startDate]);

      res.json(results || []);
    } catch (err) {
      console.error('Error fetching weekly upcoming classes:', err.stack);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get classes for weekly view (completed)
  app.get('/api/classes/completed/weekly', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { startDate } = req.query;
    if (!startDate) return res.status(400).json({ error: 'Start date is required' });

    try {
      const [teacher] = await db.promise().query('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
      if (teacher.length === 0) return res.status(404).json({ error: 'Teacher not found' });
      const teacherId = teacher[0].id;

      const [results] = await db.promise().query(`
        SELECT classes.id, classes.schedule, classes.price, classes.class_type, classes.min_age, classes.max_age,
               subjects.name AS subject, rooms.name AS room, classes.completed
        FROM classes
        JOIN subjects ON classes.subject_id = subjects.id
        LEFT JOIN rooms ON classes.room_id = rooms.id
        WHERE classes.teacher_id = ?
        AND classes.schedule BETWEEN ? AND DATE_ADD(?, INTERVAL 7 DAY)
        AND classes.completed = TRUE
        ORDER BY classes.schedule DESC
      `, [teacherId, startDate, startDate]);

      res.json(results || []);
    } catch (err) {
      console.error('Error fetching weekly completed classes:', err.stack);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get classes for daily view
  app.get('/api/classes/daily', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Date is required' });

    try {
      const [teacher] = await db.promise().query('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
      if (teacher.length === 0) return res.status(404).json({ error: 'Teacher not found' });
      const teacherId = teacher[0].id;

      const [results] = await db.promise().query(`
        SELECT classes.id, classes.schedule, classes.price, classes.class_type, classes.min_age, classes.max_age,
               subjects.name AS subject, rooms.name AS room, classes.completed
        FROM classes
        JOIN subjects ON classes.subject_id = subjects.id
        LEFT JOIN rooms ON classes.room_id = rooms.id
        WHERE classes.teacher_id = ?
        AND DATE(classes.schedule) = ?
        ORDER BY classes.schedule
      `, [teacherId, date]);

      res.json(results || []);
    } catch (err) {
      console.error('Error fetching daily classes:', err.stack);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Add class (admin only)
  app.post('/api/classes', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { subject_id, teacher_id, schedule, room_id, price, class_type, min_age, max_age } = req.body;
    if (!subject_id || !teacher_id || !schedule || !class_type || price == null) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }
    try {
      const [conflicts] = await db.promise().query(`
        SELECT id FROM classes
        WHERE teacher_id = ? AND schedule = ?
      `, [teacher_id, schedule]);
      if (conflicts.length > 0) {
        return res.status(400).json({ error: 'Schedule conflict: teacher is already booked at this time' });
      }
      await db.promise().query(`
        INSERT INTO classes (subject_id, teacher_id, schedule, room_id, price, class_type, min_age, max_age)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [subject_id, teacher_id, schedule, room_id || null, price, class_type, min_age || 3, max_age || 16]);
      res.status(201).json({ message: 'Class added' });
    } catch (err) {
      console.error('Error adding class:', err.stack);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Update class (admin only)
  app.put('/api/classes/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { id } = req.params;
    const { subject_id, teacher_id, schedule, room_id, price, class_type, min_age, max_age } = req.body;
    if (!subject_id || !teacher_id || !schedule || !class_type || price == null) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }
    try {
      const [conflicts] = await db.promise().query(`
        SELECT id FROM classes
        WHERE teacher_id = ? AND schedule = ? AND id != ?
      `, [teacher_id, schedule, id]);
      if (conflicts.length > 0) {
        return res.status(400).json({ error: 'Schedule conflict: teacher is already booked at this time' });
      }
      const [result] = await db.promise().query(`
        UPDATE classes SET subject_id = ?, teacher_id = ?, schedule = ?, room_id = ?, price = ?, class_type = ?, min_age = ?, max_age = ?
        WHERE id = ?
      `, [subject_id, teacher_id, schedule, room_id || null, price, class_type, min_age || 3, max_age || 16, id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Class not found' });
      res.json({ message: 'Class updated' });
    } catch (err) {
      console.error('Error updating class:', err.stack);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Delete class (admin only)
  app.delete('/api/classes/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { id } = req.params;
    try {
      const [result] = await db.promise().query('DELETE FROM classes WHERE id = ?', [id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Class not found' });
      res.json({ message: 'Class deleted' });
    } catch (err) {
      console.error('Error deleting class:', err.stack);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get all classes (admin only)
  app.get('/api/classes', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    try {
      const [results] = await db.promise().query(`
        SELECT classes.id, classes.schedule, classes.price, classes.class_type, classes.min_age, classes.max_age,
               subjects.name AS subject, users.username AS teacher_name, rooms.name AS room,
               classes.subject_id, classes.teacher_id, classes.room_id, classes.completed
        FROM classes
        JOIN subjects ON classes.subject_id = subjects.id
        LEFT JOIN teachers ON classes.teacher_id = teachers.id
        LEFT JOIN users ON teachers.user_id = users.id
        LEFT JOIN rooms ON classes.room_id = rooms.id
        ORDER BY classes.schedule
      `);
      console.log('GET /api/classes - Response:', results);
      res.json(results || []);
    } catch (err) {
      console.error('Error fetching classes:', err.stack);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get parents and their children (admin only)
  app.get('/api/users/parents-children', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    try {
      const [results] = await db.promise().query(`
        SELECT users.id AS user_id, users.username, users.email, parents.phone,
               children.id AS child_id, children.name AS child_name, children.birth_date
        FROM users
        JOIN parents ON users.id = parents.user_id
        LEFT JOIN children ON parents.id = children.parent_id
        WHERE users.role = 'parent'
        ORDER BY users.username, children.name
      `);
      // Format the data to group children under their parents
      const parentsMap = new Map();
      results.forEach(row => {
        if (!parentsMap.has(row.user_id)) {
          parentsMap.set(row.user_id, {
            user_id: row.user_id,
            username: row.username,
            email: row.email,
            phone: row.phone,
            children: []
          });
        }
        if (row.child_id) {
          parentsMap.get(row.user_id).children.push({
            id: row.child_id,
            name: row.child_name,
            birth_date: row.birth_date
          });
        }
      });
      const formattedResults = Array.from(parentsMap.values());
      console.log('GET /api/users/parents-children - Response:', formattedResults);
      res.json(formattedResults || []);
    } catch (err) {
      console.error('Error fetching parents and children:', err.stack);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get enrolled children for a class
  app.get('/api/enrollments/:classId', authenticateToken, async (req, res) => {
    const { classId } = req.params;
    try {
      const [results] = await db.promise().query(`
        SELECT children.id, children.name, children.birth_date
        FROM enrollments
        JOIN children ON enrollments.child_id = children.id
        WHERE enrollments.class_id = ?
      `, [classId]);
      res.json(results || []);
    } catch (err) {
      console.error('Error fetching enrolled children:', err.stack);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Teacher statistics (admin only)
  app.get('/api/statistics/teachers', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    try {
      const [results] = await db.promise().query(`
        SELECT users.username AS teacher_name, subjects.name AS subject_name,
               COUNT(classes.id) AS class_count, COUNT(enrollments.id) AS total_students,
               SUM(classes.price) AS total_revenue
        FROM teachers
        JOIN users ON teachers.user_id = users.id
        LEFT JOIN subjects ON teachers.subject_id = subjects.id
        LEFT JOIN classes ON teachers.id = classes.teacher_id
        LEFT JOIN enrollments ON classes.id = enrollments.class_id
        GROUP BY teachers.id, users.username, subjects.name
      `);
      console.log('GET /api/statistics/teachers - Response:', results);
      res.json(results || []);
    } catch (err) {
      console.error('Error fetching teacher statistics:', err.stack);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Start server
  app.listen(port, () => {
    console.log(`✅ Server running at http://localhost:${port}`);
  });
};

// Handle startup errors
startServer().catch(err => {
  console.error('❌ Error starting server:', err.stack);
  process.exit(1);
});