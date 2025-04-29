const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = 3000;
const JWT_SECRET = 'your_jwt_secret_key'; // Замените на безопасный ключ в продакшене

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'vladlena121512', // Ваш пароль MySQL
  database: 'children_center',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Initialize database and tables
const initializeDatabase = async () => {
  try {
    await db.query('CREATE DATABASE IF NOT EXISTS children_center');
    await db.query('USE children_center');

    // Users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'parent', 'teacher') NOT NULL
      )
    `);

    // Subjects table
    await db.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
      )
    `);

    // Parents table
    await db.query(`
      CREATE TABLE IF NOT EXISTS parents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        phone VARCHAR(15),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Teachers table
    await db.query(`
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
    await db.query(`
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
    await db.query(`
      CREATE TABLE IF NOT EXISTS children (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        birth_date DATE NOT NULL,
        parent_id INT NOT NULL,
        FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
      )
    `);

    // Rooms table
    await db.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE
      )
    `);

    // Classes table
    await db.query(`
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
    await db.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        class_id INT NOT NULL,
        child_id INT NOT NULL,
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
        FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
        UNIQUE (class_id, child_id)
      )
    `);

    // Reviews table
    await db.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        parent_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
      )
    `);

    // Insert default admin if not exists
    const [admin] = await db.query('SELECT * FROM users WHERE role = "admin"');
    if (admin.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.query(`
        INSERT INTO users (username, email, password, role)
        VALUES ('admin', 'admin@example.com', ?, 'admin')
      `, [hashedPassword]);
    }

    // Insert sample parent user and parent record if not exists
    const [parents] = await db.query('SELECT * FROM users WHERE role = "parent"');
    let parentId = 1; // Default parent_id for reviews
    if (parents.length === 0) {
      const hashedPassword = await bcrypt.hash('parent123', 10);
      await db.query(`
        INSERT INTO users (username, email, password, role)
        VALUES ('parent1', 'parent1@example.com', ?, 'parent')
      `, [hashedPassword]);

      const [userResult] = await db.query('SELECT id FROM users WHERE username = "parent1"');
      const userId = userResult[0].id;

      await db.query(`
        INSERT INTO parents (user_id, phone)
        VALUES (?, '1234567890')
      `, [userId]);

      const [parentResult] = await db.query('SELECT id FROM parents WHERE user_id = ?', [userId]);
      parentId = parentResult[0].id;
    } else {
      const [parentResult] = await db.query('SELECT id FROM parents WHERE user_id = ?', [parents[0].id]);
      parentId = parentResult[0]?.id || 1; // Fallback to 1 if parent not found
    }

    // Insert sample data for testing (optional, remove in production)
    const [subjects] = await db.query('SELECT * FROM subjects');
    if (subjects.length === 0) {
      await db.query(`
        INSERT INTO subjects (name) VALUES
        ('Математика'), ('Рисование'), ('Музыка')
      `);
    }

    const [rooms] = await db.query('SELECT * FROM rooms');
    if (rooms.length === 0) {
      await db.query(`
        INSERT INTO rooms (name) VALUES
        ('Кабинет 101'), ('Кабинет 102')
      `);
    }

    const [reviews] = await db.query('SELECT * FROM reviews');
    if (reviews.length === 0) {
      await db.query(`
        INSERT INTO reviews (parent_id, content, created_at) VALUES
        (?, 'Отличный центр, ребёнок в восторге!', NOW()),
        (?, 'Учителя очень внимательные, рекомендую!', NOW())
      `, [parentId, parentId]);
    }
  } catch (err) {
    console.error('Ошибка инициализации базы данных:', err.stack);
  }
};

// Middleware to authenticate JWT
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Токен отсутствует' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Недействительный токен' });
  }
};

// Middleware to check admin role
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ только для администраторов' });
  }
  next();
};

// Initialize database on startup
initializeDatabase();

// Routes

// Validate token
app.get('/api/auth/validate', authenticateToken, (req, res) => {
  res.json({ valid: true, role: req.user.role });
});

// Public endpoint: Get all subjects (no authentication required)
app.get('/api/subjects/public', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM subjects');
    res.json(results);
  } catch (err) {
    console.error('Ошибка получения предметов:', err.stack);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Authenticated endpoint: Get all subjects
app.get('/api/subjects', authenticateToken, async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM subjects');
    res.json(results);
  } catch (err) {
    console.error('Ошибка получения предметов:', err.stack);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Public endpoint: Get public classes (no authentication required)
app.get('/api/classes/public', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT c.id, s.name AS subject, u.username AS teacher_name, c.schedule, r.name AS room,
             c.price, c.class_type, c.min_age, c.max_age, c.completed, c.subject_id, c.teacher_id, c.room_id,
             (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id) AS enrolled_count
      FROM classes c
      JOIN subjects s ON c.subject_id = s.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN rooms r ON c.room_id = r.id
      WHERE c.completed = FALSE AND c.schedule >= NOW()
    `);
    res.json(results);
  } catch (err) {
    console.error('Ошибка получения публичных занятий:', err.stack);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Public endpoint: Get public teachers (no authentication required)
app.get('/api/users/teachers/public', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT u.id AS user_id, t.id, u.username, s.name AS subject, t.education, t.experience
      FROM users u
      JOIN teachers t ON u.id = t.user_id
      LEFT JOIN subjects s ON t.subject_id = s.id
      WHERE u.role = 'teacher'
    `);
    res.json(results);
  } catch (err) {
    console.error('Ошибка получения публичных учителей:', err.stack);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Public endpoint: Get reviews (no authentication required)
app.get('/api/reviews', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT r.id, r.content, r.created_at, u.username AS parent_name
      FROM reviews r
      LEFT JOIN parents p ON r.parent_id = p.id
      LEFT JOIN users u ON p.user_id = u.id
    `);
    res.json(results.map(review => ({
      ...review,
      parent_name: review.parent_name || 'Аноним'
    })));
  } catch (err) {
    console.error('Ошибка получения отзывов:', err.stack);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Register new teacher (admin only)
app.post('/api/teachers', authenticateToken, adminOnly, async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [userResult] = await db.query(`
      INSERT INTO users (username, email, password, role)
      VALUES (?, ?, ?, 'teacher')
    `, [username, email, hashedPassword]);

    await db.query(`
      INSERT INTO teachers (user_id)
      VALUES (?)
    `, [userResult.insertId]);

    res.status(201).json({ message: 'Учитель успешно создан' });
  } catch (err) {
    console.error('Ошибка создания учителя:', err.stack);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Пользователь с таким именем или email уже существует' });
    } else {
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
});

// Get all teachers (admin only)
app.get('/api/users/teachers', authenticateToken, adminOnly, async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT u.id AS user_id, t.id, u.username, u.email, t.phone, s.name AS subject_name
      FROM users u
      JOIN teachers t ON u.id = t.user_id
      LEFT JOIN subjects s ON t.subject_id = s.id
      WHERE u.role = 'teacher'
    `);
    res.json(results);
  } catch (err) {
    console.error('Ошибка получения учителей:', err.stack);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Delete teacher (admin only)
app.delete('/api/teachers/:userId', authenticateToken, adminOnly, async (req, res) => {
  const { userId } = req.params;
  try {
    const [teacher] = await db.query(`
      SELECT * FROM teachers WHERE user_id = ?
    `, [userId]);
    if (teacher.length === 0) {
      return res.status(404).json({ error: 'Учитель не найден' });
    }

    await db.query(`
      INSERT INTO deleted_teachers (user_id, subject_id, phone, education, experience, deleted_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [teacher[0].user_id, teacher[0].subject_id, teacher[0].phone, teacher[0].education, teacher[0].experience]);

    await db.query('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ message: 'Учитель успешно удален' });
  } catch (err) {
    console.error('Ошибка удаления учителя:', err.stack);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Get parents and their children (admin only)
app.get('/api/users/parents-children', authenticateToken, adminOnly, async (req, res) => {
  try {
    const [parents] = await db.query(`
      SELECT u.id AS user_id, u.username, u.email, p.phone
      FROM users u
      JOIN parents p ON u.id = p.user_id
      WHERE u.role = 'parent'
    `);

    const parentIds = parents.map(p => p.user_id);
    const [children] = await db.query(`
      SELECT c.id, c.name, c.birth_date, c.parent_id, p.user_id
      FROM children c
      JOIN parents p ON c.parent_id = p.id
      WHERE p.user_id IN (?)
    `, [parentIds.length ? parentIds : [0]]);

    const result = parents.map(parent => ({
      ...parent,
      children: children.filter(child => child.user_id === parent.user_id)
        .map(({ id, name, birth_date }) => ({ id, name, birth_date })),
    }));

    res.json(result);
  } catch (err) {
    console.error('Ошибка получения родителей и детей:', err.stack);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Get all rooms
app.get('/api/rooms', authenticateToken, async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM rooms');
    res.json(results);
  } catch (err) {
    console.error('Ошибка получения комнат:', err.stack);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Get teachers by subject
app.get('/api/teachers/by-subject/:subjectId', authenticateToken, async (req, res) => {
  const { subjectId } = req.params;
  try {
    const [results] = await db.query(`
      SELECT u.id, u.username
      FROM users u
      JOIN teachers t ON u.id = t.user_id
      WHERE t.subject_id = ? AND u.role = 'teacher'
    `, [subjectId]);
    res.json(results);
  } catch (err) {
    console.error('Ошибка получения учителей по предмету:', err.stack);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Create class (admin only)
app.post('/api/classes', authenticateToken, adminOnly, async (req, res) => {
  const { subject_id, teacher_id, schedule, room_id, price, class_type, min_age, max_age } = req.body;
  if (!subject_id || !schedule || !class_type || !price || min_age == null || max_age == null) {
    return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
  }
  try {
    const [subject] = await db.query('SELECT id FROM subjects WHERE id = ?', [subject_id]);
    if (subject.length === 0) {
      return res.status(400).json({ error: 'Предмет не найден' });
    }

    if (teacher_id) {
      const [teacher] = await db.query('SELECT id FROM teachers WHERE id = ?', [teacher_id]);
      if (teacher.length === 0) {
        return res.status(400).json({ error: 'Учитель не найден' });
      }
    }

    if (room_id) {
      const [room] = await db.query('SELECT id FROM rooms WHERE id = ?', [room_id]);
      if (room.length === 0) {
        return res.status(400).json({ error: 'Комната не найдена' });
      }
    }

    await db.query(`
      INSERT INTO classes (subject_id, schedule, teacher_id, room_id, price, class_type, min_age, max_age)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [subject_id, schedule, teacher_id || null, room_id || null, price, class_type, min_age, max_age]);

    res.status(201).json({ message: 'Занятие успешно создано' });
  } catch (err) {
    console.error('Ошибка создания занятия:', err.stack);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Get all classes (admin only)
app.get('/api/classes', authenticateToken, adminOnly, async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT c.id, s.name AS subject, u.username AS teacher_name, c.schedule, r.name AS room,
             c.price, c.class_type, c.min_age, c.max_age, c.completed, c.subject_id, c.teacher_id, c.room_id,
             (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id) AS enrolled_count
      FROM classes c
      JOIN subjects s ON c.subject_id = s.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN rooms r ON c.room_id = r.id
    `);
    res.json(results);
  } catch (err) {
    console.error('Ошибка получения занятий:', err.stack);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Update class (admin only)
app.put('/api/classes/:id', authenticateToken, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { subject_id, teacher_id, schedule, room_id, price, class_type, min_age, max_age } = req.body;
  if (!subject_id || !schedule || !class_type || !price || min_age == null || max_age == null) {
    return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
  }
  try {
    const [subject] = await db.query('SELECT id FROM subjects WHERE id = ?', [subject_id]);
    if (subject.length === 0) {
      return res.status(400).json({ error: 'Предмет не найден' });
    }

    if (teacher_id) {
      const [teacher] = await db.query('SELECT id FROM teachers WHERE id = ?', [teacher_id]);
      if (teacher.length === 0) {
        return res.status(400).json({ error: 'Учитель не найден' });
      }
    }

    if (room_id) {
      const [room] = await db.query('SELECT id FROM rooms WHERE id = ?', [room_id]);
      if (room.length === 0) {
        return res.status(400).json({ error: 'Комната не найдена' });
      }
    }

    await db.query(`
      UPDATE classes
      SET subject_id = ?, teacher_id = ?, schedule = ?, room_id = ?, price = ?, class_type = ?, min_age = ?, max_age = ?
      WHERE id = ?
    `, [subject_id, teacher_id || null, schedule, room_id || null, price, class_type, min_age, max_age, id]);

    res.json({ message: 'Занятие успешно обновлено' });
  } catch (err) {
    console.error('Ошибка обновления занятия:', err.stack);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Delete class (admin only)
app.delete('/api/classes/:id', authenticateToken, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM classes WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Занятие не найдено' });
    }
    res.json({ message: 'Занятие успешно удалено' });
  } catch (err) {
    console.error('Ошибка удаления занятия:', err.stack);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Mark class as completed (admin only)
app.put('/api/classes/:id/complete', authenticateToken, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('UPDATE classes SET completed = TRUE WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Занятие не найдено' });
    }
    res.json({ message: 'Занятие отмечено как завершенное' });
  } catch (err) {
    console.error('Ошибка отметки занятия как завершенного:', err.stack);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Get enrolled children for a class (admin only)
app.get('/api/enrollments/:classId', authenticateToken, adminOnly, async (req, res) => {
  const { classId } = req.params;
  try {
    const [results] = await db.query(`
      SELECT c.id, c.name, c.birth_date
      FROM children c
      JOIN enrollments e ON c.id = e.child_id
      WHERE e.class_id = ?
    `, [classId]);
    res.json(results);
  } catch (err) {
    console.error('Ошибка получения записанных детей:', err.stack);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Remove child from class (admin only)
app.delete('/api/enrollments/:classId/:childId', authenticateToken, adminOnly, async (req, res) => {
  const { classId, childId } = req.params;
  try {
    const [result] = await db.query(`
      DELETE FROM enrollments WHERE class_id = ? AND child_id = ?
    `, [classId, childId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }
    res.json({ message: 'Ребенок успешно удален из занятия' });
  } catch (err) {
    console.error('Ошибка удаления ребенка из занятия:', err.stack);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Get eligible children for a class (admin only)
app.get('/api/children/eligible/:classId', authenticateToken, adminOnly, async (req, res) => {
  const { classId } = req.params;
  if (!classId || isNaN(classId)) {
    return res.status(400).json({ error: 'Некорректный ID занятия' });
  }
  try {
    const [results] = await db.query(`
      SELECT children.id, children.name, children.birth_date
      FROM children
      WHERE FLOOR(DATEDIFF(CURDATE(), children.birth_date) / 365.25) BETWEEN (
        SELECT min_age FROM classes WHERE id = ?
      ) AND (
        SELECT max_age FROM classes WHERE id = ?
      )
      AND children.id NOT IN (
        SELECT child_id FROM enrollments WHERE class_id = ?
      )
    `, [classId, classId, classId]);
    res.json(results || []);
  } catch (err) {
    console.error('Ошибка получения подходящих детей:', err.stack);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Enroll a child in a class (admin only)
app.post('/api/enrollments', authenticateToken, adminOnly, async (req, res) => {
  const { classId, childId } = req.body;
  if (!classId || isNaN(classId) || !childId || isNaN(childId)) {
    return res.status(400).json({ error: 'Некорректный ID занятия или ребенка' });
  }
  try {
    // Check if class exists and get age constraints
    const [classResult] = await db.query('SELECT min_age, max_age, class_type FROM classes WHERE id = ?', [classId]);
    if (classResult.length === 0) {
      return res.status(404).json({ error: 'Занятие не найдено' });
    }
    const { min_age, max_age, class_type } = classResult[0];

    // Check if child exists and meets age requirements
    const [childResult] = await db.query(`
      SELECT FLOOR(DATEDIFF(CURDATE(), birth_date) / 365.25) AS age
      FROM children
      WHERE id = ?
    `, [childId]);
    if (childResult.length === 0) {
      return res.status(404).json({ error: 'Ребенок не найден' });
    }
    const childAge = childResult[0].age;
    if (childAge < min_age || childAge > max_age) {
      return res.status(400).json({ error: 'Ребенок не соответствует возрастным ограничениям' });
    }

    // Check for existing enrollment
    const [existingEnrollment] = await db.query(`
      SELECT id FROM enrollments WHERE class_id = ? AND child_id = ?
    `, [classId, childId]);
    if (existingEnrollment.length > 0) {
      return res.status(400).json({ error: 'Ребенок уже записан на это занятие' });
    }

    // Check for individual class capacity
    if (class_type === 'individual') {
      const [enrollmentCount] = await db.query(`
        SELECT COUNT(*) AS count FROM enrollments WHERE class_id = ?
      `, [classId]);
      if (enrollmentCount[0].count > 0) {
        return res.status(400).json({ error: 'Индивидуальное занятие уже занято' });
      }
    }

    // Enroll the child
    await db.query('INSERT INTO enrollments (class_id, child_id) VALUES (?, ?)', [classId, childId]);
    res.status(201).json({ message: 'Ребенок успешно записан на занятие' });
  } catch (err) {
    console.error('Ошибка записи ребенка на занятие:', err.stack);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Ребенок уже записан на это занятие' });
    } else {
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
});

// Get teacher statistics (admin only)
app.get('/api/statistics/teachers', authenticateToken, adminOnly, async (req, res) => {
  const { month } = req.query;
  try {
    let query = `
      SELECT u.username AS teacher_name, s.name AS subject_name,
             COUNT(DISTINCT c.id) AS class_count,
             COUNT(e.id) AS total_students,
             SUM(c.price) AS total_revenue,
             SUM(c.price * 0.5) AS teacher_salary
      FROM classes c
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN subjects s ON c.subject_id = s.id
      LEFT JOIN enrollments e ON c.id = e.class_id
      WHERE c.completed = TRUE
    `;
    const params = [];

    if (month) {
      query += ' AND DATE_FORMAT(c.schedule, "%Y-%m") = ?';
      params.push(month);
    }

    query += ' GROUP BY u.id, s.id';

    const [results] = await db.query(query, params);
    res.json(results);
  } catch (err) {
    console.error('Ошибка получения статистики:', err.stack);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});