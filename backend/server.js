const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = 3000;
const JWT_SECRET = 'your_jwt_secret_key'; // Замените на безопасный ключ в продакшене

// Middleware
app.use(cors());
app.use(express.json());

// Подключение к базе данных
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'vladlena121512',
  database: 'children_center'
});

// Инициализация базы данных и таблиц
const initializeDatabase = async () => {
  try {
    await db.promise().query('CREATE DATABASE IF NOT EXISTS children_center');
    await db.promise().query('USE children_center');

    // Таблица users
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'parent', 'teacher') NOT NULL
      )
    `);

    // Таблица subjects
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
      )
    `);

    // Таблица parents
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS parents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        phone VARCHAR(15),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Таблица teachers
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

    // Таблица deleted_teachers
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

    // Таблица children
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS children (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        birth_date DATE NOT NULL,
        parent_id INT NOT NULL,
        FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
      )
    `);

    // Таблица rooms
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE
      )
    `);

    // Таблица classes
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
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
      )
    `);

    // Таблица enrollments
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

    // Таблица reviews
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        parent_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Триггер для архивации удалённых учителей
    await db.promise().query(`
      CREATE TRIGGER IF NOT EXISTS archive_teacher
      BEFORE DELETE ON teachers
      FOR EACH ROW
      BEGIN
        INSERT INTO deleted_teachers (user_id, subject_id, phone, education, experience, deleted_at)
        VALUES (OLD.user_id, OLD.subject_id, OLD.phone, OLD.education, OLD.experience, NOW());
      END
    `);

    console.log('✅ База данных и таблицы успешно инициализированы');
  } catch (err) {
    console.error('❌ Ошибка при инициализации базы данных:', err.message);
    process.exit(1);
  }
};

// Middleware для аутентификации
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Токен не предоставлен' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Недействительный токен' });
    req.user = user;
    next();
  });
};

// Запуск сервера
const startServer = async () => {
  await initializeDatabase();
  db.connect(err => {
    if (err) {
      console.error('❌ Ошибка подключения к базе данных:', err.message);
      process.exit(1);
    }
    console.log('✅ Подключение к базе данных успешно установлено');
  });

  // Регистрация (только для родителей)
  app.post('/api/register', async (req, res) => {
    const { username, email, password, phone } = req.body;
    if (!username || !email || !password || !phone) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }
    if (username.length > 50) return res.status(400).json({ error: 'Имя пользователя не должно превышать 50 символов' });
    if (email.length > 100) return res.status(400).json({ error: 'Email не должен превышать 100 символов' });
    if (phone.length > 15) return res.status(400).json({ error: 'Телефон не должен превышать 15 символов' });

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
        res.status(201).json({ message: 'Родитель зарегистрирован' });
      } catch (err) {
        await db.promise().query('ROLLBACK');
        const errorMsg =
          err.code === 'ER_DUP_ENTRY'
            ? err.message.includes('username')
              ? 'Имя пользователя уже занято'
              : 'Email уже зарегистрирован'
            : 'Ошибка при регистрации';
        res.status(400).json({ error: errorMsg });
      }
    } catch (err) {
      console.error('Ошибка сервера:', err.message);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Вход
  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }
    try {
      const [results] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
      if (results.length === 0) return res.status(401).json({ error: 'Пользователь не найден' });
      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ error: 'Неверный пароль' });
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
      res.json({ user: { id: user.id, email: user.email, role: user.role, username: user.username }, token });
    } catch (err) {
      console.error('Ошибка сервера:', err.message);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Получение списка предметов
  app.get('/api/subjects', async (req, res) => {
    try {
      const [results] = await db.promise().query('SELECT * FROM subjects');
      res.json(results);
    } catch (err) {
      console.error('Ошибка при получении предметов:', err.message);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Публичный эндпоинт для получения занятий
  app.get('/api/classes/public', async (req, res) => {
    const { subject_id } = req.query;
    try {
      let query = `
        SELECT classes.id, classes.schedule, classes.price, classes.class_type, classes.min_age, classes.max_age,
               subjects.name AS subject, teachers.id AS teacher_id, users.username AS teacher_name,
               rooms.name AS room, classes.subject_id, classes.room_id
        FROM classes
        JOIN subjects ON classes.subject_id = subjects.id
        LEFT JOIN teachers ON classes.teacher_id = teachers.id
        LEFT JOIN users ON teachers.user_id = users.id
        LEFT JOIN rooms ON classes.room_id = rooms.id
        WHERE classes.schedule > NOW()
      `;
      const params = [];
      if (subject_id) {
        query += ' AND classes.subject_id = ?';
        params.push(subject_id);
      }
      const [results] = await db.promise().query(query, params);
      res.json(results);
    } catch (err) {
      console.error('Ошибка при получении публичных занятий:', err.message);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Публичный эндпоинт для получения отзывов
  app.get('/api/reviews', async (req, res) => {
    try {
      const [results] = await db.promise().query(`
        SELECT reviews.id, reviews.content, reviews.created_at, users.username AS parent_name
        FROM reviews
        JOIN users ON reviews.parent_id = users.id
        WHERE users.role = 'parent'
      `);
      res.json(results);
    } catch (err) {
      console.error('Ошибка при получении отзывов:', err.message);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Добавление отзыва
  app.post('/api/reviews', authenticateToken, async (req, res) => {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Текст отзыва обязателен' });
    }
    try {
      await db.promise().query('INSERT INTO reviews (parent_id, content) VALUES (?, ?)', [req.user.id, content]);
      res.status(201).json({ message: 'Отзыв добавлен' });
    } catch (err) {
      console.error('Ошибка при добавлении отзыва:', err.message);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Публичный эндпоинт для получения учителей
  app.get('/api/users/teachers/public', async (req, res) => {
    try {
      const [results] = await db.promise().query(`
        SELECT users.id, users.username, subjects.name AS subject, teachers.education, teachers.experience
        FROM users
        JOIN teachers ON users.id = teachers.user_id
        LEFT JOIN subjects ON teachers.subject_id = subjects.id
        WHERE users.role = 'teacher'
      `);
      res.json(results);
    } catch (err) {
      console.error('Ошибка при получении публичных данных учителей:', err.message);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Получение списка кабинетов
  app.get('/api/rooms', authenticateToken, async (req, res) => {
    try {
      const [results] = await db.promise().query('SELECT * FROM rooms');
      res.json(results);
    } catch (err) {
      console.error('Ошибка при получении кабинетов:', err.message);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Получение списка всех учителей (для админа)
  app.get('/api/teachers', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }
    try {
      const [results] = await db.promise().query(`
        SELECT teachers.id, users.username, subjects.name AS subject_name
        FROM teachers
        JOIN users ON teachers.user_id = users.id
        LEFT JOIN subjects ON teachers.subject_id = subjects.id
      `);
      res.json(results);
    } catch (err) {
      console.error('Ошибка при получении учителей:', err.message);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Получение учителей по предмету
  app.get('/api/teachers/by-subject/:subjectId', authenticateToken, async (req, res) => {
    const { subjectId } = req.params;
    try {
      const [results] = await db.promise().query(`
        SELECT teachers.id, users.username
        FROM teachers
        JOIN users ON teachers.user_id = users.id
        WHERE teachers.subject_id = ?
      `, [subjectId]);
      res.json(results);
    } catch (err) {
      console.error('Ошибка при получении учителей по предмету:', err.message);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Получение списка учителей для админ-панели
  app.get('/api/users/teachers', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }
    try {
      const [results] = await db.promise().query(`
        SELECT users.id AS user_id, users.username, users.email, subjects.name AS subject_name, teachers.phone
        FROM users
        JOIN teachers ON users.id = teachers.user_id
        LEFT JOIN subjects ON teachers.subject_id = subjects.id
        WHERE users.role = 'teacher'
      `);
      res.json(results);
    } catch (err) {
      console.error('Ошибка при получении списка учителей:', err.message);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Создание нового учителя (админ)
  app.post('/api/teachers', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Имя, email и пароль обязательны' });
    }
    if (username.length > 50) return res.status(400).json({ error: 'Имя пользователя не должно превышать 50 символов' });
    if (email.length > 100) return res.status(400).json({ error: 'Email не должен превышать 100 символов' });

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
        res.status(201).json({ message: 'Учитель создан' });
      } catch (err) {
        await db.promise().query('ROLLBACK');
        const errorMsg =
          err.code === 'ER_DUP_ENTRY'
            ? err.message.includes('username')
              ? 'Имя пользователя уже занято'
              : 'Email уже зарегистрирован'
            : 'Ошибка при создании учителя';
        res.status(400).json({ error: errorMsg });
      }
    } catch (err) {
      console.error('Ошибка сервера:', err.message);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Удаление учителя (админ)
  app.delete('/api/teachers/:userId', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }
    const { userId } = req.params;
    try {
      const [result] = await db.promise().query('DELETE FROM users WHERE id = ? AND role = ?', [userId, 'teacher']);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Учитель не найден' });
      }
      res.json({ message: 'Учитель удалён' });
    } catch (err) {
      console.error('Ошибка при удалении учителя:', err.message);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Получение профиля учителя
  app.get('/api/teachers/profile', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }
    try {
      const [results] = await db.promise().query(`
        SELECT users.username, users.email, teachers.phone, teachers.education, teachers.experience, subjects.name AS subject_name, teachers.subject_id
        FROM users
        JOIN teachers ON users.id = teachers.user_id
        LEFT JOIN subjects ON teachers.subject_id = subjects.id
        WHERE users.id = ?
      `, [req.user.id]);
      if (results.length === 0) return res.status(404).json({ error: 'Учитель не найден' });
      res.json(results[0]);
    } catch (err) {
      console.error('Ошибка при получении профиля:', err.message);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Обновление профиля учителя
  app.put('/api/teachers/profile', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }
    const { phone, education, experience, subject_id } = req.body;
    if (!phone || phone.length > 15) {
      return res.status(400).json({ error: 'Телефон обязателен и не должен превышать 15 символов' });
    }
    try {
      const [result] = await db.promise().query(
        'UPDATE teachers SET phone = ?, education = ?, experience = ?, subject_id = ? WHERE user_id = ?',
        [phone, education || null, experience || null, subject_id || null, req.user.id]
      );
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Учитель не найден' });
      res.json({ message: 'Профиль обновлён' });
    } catch (err) {
      console.error('Ошибка при обновлении профиля:', err.message);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Получение зарплаты учителя
  app.get('/api/teachers/salary', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }
    try {
      const [teacher] = await db.promise().query('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
      if (teacher.length === 0) return res.status(404).json({ error: 'Учитель не найден' });
      const teacherId = teacher[0].id;
      const [results] = await db.promise().query(`
        SELECT DATE_FORMAT(schedule, '%Y-%m') AS month, COUNT(*) AS class_count, SUM(price * 0.4) AS total_salary
        FROM classes
        WHERE teacher_id = ? AND schedule <= NOW()
        GROUP BY DATE_FORMAT(schedule, '%Y-%m')
        ORDER BY month DESC
      `, [teacherId]);
      res.json(results);
    } catch (err) {
      console.error('Ошибка при получении зарплаты:', err.message);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Получение списка занятий
  app.get('/api/classes', authenticateToken, async (req, res) => {
    try {
      let query = `
        SELECT classes.id, classes.schedule, classes.price, classes.class_type, classes.min_age, classes.max_age,
               subjects.name AS subject, teachers.id AS teacher_id, users.username AS teacher_name,
               rooms.name AS room, classes.subject_id, classes.room_id
        FROM classes
        JOIN subjects ON classes.subject_id = subjects.id
        LEFT JOIN teachers ON classes.teacher_id = teachers.id
        LEFT JOIN users ON teachers.user_id = users.id
        LEFT JOIN rooms ON classes.room_id = rooms.id
      `;
      let params = [];

      if (req.user.role === 'teacher') {
        const [teacher] = await db.promise().query('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
        if (teacher.length === 0) return res.status(404).json({ error: 'Преподаватель не найден' });
        query += ' WHERE classes.teacher_id = ?';
        params.push(teacher[0].id);
      }

      const [results] = await db.promise().query(query, params);
      res.json(results);
    } catch (err) {
      console.error('Ошибка при получении занятий:', err.message);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Добавление занятия (админ)
  app.post('/api/classes', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }
    const { subject_id, teacher_id, schedule, room_id, price, class_type, min_age, max_age } = req.body;
    if (!subject_id || !teacher_id || !schedule || !class_type || price == null) {
      return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
    }
    try {
      const [conflicts] = await db.promise().query(`
        SELECT id FROM classes
        WHERE teacher_id = ? AND schedule = ?
      `, [teacher_id, schedule]);
      if (conflicts.length > 0) {
        return res.status(400).json({ error: 'Конфликт расписания: преподаватель уже занят в это время' });
      }
      await db.promise().query(`
        INSERT INTO classes (subject_id, teacher_id, schedule, room_id, price, class_type, min_age, max_age)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [subject_id, teacher_id, schedule, room_id || null, price, class_type, min_age || 3, max_age || 16]);
      res.status(201).json({ message: 'Занятие добавлено' });
    } catch (err) {
      console.error('Ошибка при добавлении занятия:', err.message);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Обновление занятия (админ)
  app.put('/api/classes/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }
    const { id } = req.params;
    const { subject_id, teacher_id, schedule, room_id, price, class_type, min_age, max_age } = req.body;
    if (!subject_id || !teacher_id || !schedule || !class_type || price == null) {
      return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
    }
    try {
      const [conflicts] = await db.promise().query(`
        SELECT id FROM classes
        WHERE teacher_id = ? AND schedule = ? AND id != ?
      `, [teacher_id, schedule, id]);
      if (conflicts.length > 0) {
        return res.status(400).json({ error: 'Конфликт расписания: преподаватель уже занят в это время' });
      }
      const [result] = await db.promise().query(`
        UPDATE classes SET subject_id = ?, teacher_id = ?, schedule = ?, room_id = ?, price = ?, class_type = ?, min_age = ?, max_age = ?
        WHERE id = ?
      `, [subject_id, teacher_id, schedule, room_id || null, price, class_type, min_age || 3, max_age || 16, id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Занятие не найдено' });
      res.json({ message: 'Занятие обновлено' });
    } catch (err) {
      console.error('Ошибка при обновлении занятия:', err.message);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Удаление занятия (админ)
  app.delete('/api/classes/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }
    const { id } = req.params;
    try {
      const [result] = await db.promise().query('DELETE FROM classes WHERE id = ?', [id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Занятие не найдено' });
      res.json({ message: 'Занятие удалено' });
    } catch (err) {
      console.error('Ошибка при удалении занятия:', err.message);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Получение записанных детей на занятие
  app.get('/api/enrollments/:classId', authenticateToken, async (req, res) => {
    const { classId } = req.params;
    try {
      const [results] = await db.promise().query(`
        SELECT children.id, children.name, children.birth_date
        FROM enrollments
        JOIN children ON enrollments.child_id = children.id
        WHERE enrollments.class_id = ?
      `, [classId]);
      res.json(results);
    } catch (err) {
      console.error('Ошибка при получении записанных детей:', err.message);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Статистика учителей (админ)
  app.get('/api/statistics/teachers', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещён' });
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
      res.json(results);
    } catch (err) {
      console.error('Ошибка при получении статистики:', err.message);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Получение списка родителей и их детей (админ)
  app.get('/api/users/parents-children', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }
    try {
      const [results] = await db.promise().query(`
        SELECT users.id, users.username, users.email, parents.phone,
               COALESCE(
                 (
                   SELECT JSON_ARRAYAGG(
                     JSON_OBJECT(
                       'id', children.id,
                       'name', children.name,
                       'birth_date', children.birth_date
                     )
                   )
                   FROM children
                   WHERE children.parent_id = parents.id
                 ),
                 '[]'
               ) AS children
        FROM users
        JOIN parents ON users.id = parents.user_id
        WHERE users.role = 'parent'
      `);
      const parents = results.map(parent => ({
        id: parent.id,
        username: parent.username,
        email: parent.email,
        phone: parent.phone,
        children: JSON.parse(parent.children)
      }));
      res.json(parents);
    } catch (err) {
      console.error('Ошибка при получении родителей и детей:', err.message);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Получение профиля родителя
  app.get('/api/parent/profile', authenticateToken, async (req, res) => {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }
    try {
      const [results] = await db.promise().query(`
        SELECT users.username, users.email, parents.phone
        FROM users
        JOIN parents ON users.id = parents.user_id
        WHERE users.id = ?
      `, [req.user.id]);
      if (results.length === 0) return res.status(404).json({ error: 'Родитель не найден' });
      res.json(results[0]);
    } catch (err) {
      console.error('Ошибка при получении профиля:', err.message);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Обновление профиля родителя
  app.put('/api/parent/profile', authenticateToken, async (req, res) => {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }
    const { username, email, phone, password } = req.body;
    try {
      await db.promise().query('START TRANSACTION');
      const userUpdate = {};
      if (username) userUpdate.username = username;
      if (email) userUpdate.email = email;
      if (password) userUpdate.password = await bcrypt.hash(password, 10);
      if (Object.keys(userUpdate).length > 0) {
        const fields = Object.keys(userUpdate).map(field => `${field} = ?`).join(', ');
        const values = Object.values(userUpdate);
        values.push(req.user.id);
        await db.promise().query(`UPDATE users SET ${fields} WHERE id = ?`, values);
      }
      if (phone) {
        await db.promise().query('UPDATE parents SET phone = ? WHERE user_id = ?', [phone, req.user.id]);
      }
      await db.promise().query('COMMIT');
      res.json({ message: 'Профиль обновлён' });
    } catch (err) {
      await db.promise().query('ROLLBACK');
      console.error('Ошибка при обновлении профиля:', err.message);
      const errorMsg =
        err.code === 'ER_DUP_ENTRY'
          ? err.message.includes('username')
            ? 'Имя пользователя уже занято'
            : 'Email уже зарегистрирован'
          : 'Ошибка при обновлении профиля';
      res.status(400).json({ error: errorMsg });
    }
  });

  // Получение детей родителя
  app.get('/api/parent/children', authenticateToken, async (req, res) => {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }
    try {
      const [results] = await db.promise().query(`
        SELECT children.id, children.name, children.birth_date
        FROM children
        JOIN parents ON children.parent_id = parents.id
        WHERE parents.user_id = ?
      `, [req.user.id]);
      res.json(results);
    } catch (err) {
      console.error('Ошибка при получении детей:', err.message);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Добавление ребёнка
  app.post('/api/parent/children', authenticateToken, async (req, res) => {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }
    const { name, birth_date } = req.body;
    if (!name || !birth_date) {
      return res.status(400).json({ error: 'Имя и дата рождения обязательны' });
    }
    try {
      const [parent] = await db.promise().query('SELECT id FROM parents WHERE user_id = ?', [req.user.id]);
      if (parent.length === 0) return res.status(404).json({ error: 'Родитель не найден' });
      await db.promise().query('INSERT INTO children (name, birth_date, parent_id) VALUES (?, ?, ?)', [name, birth_date, parent[0].id]);
      res.status(201).json({ message: 'Ребёнок добавлен' });
    } catch (err) {
      console.error('Ошибка при добавлении ребёнка:', err.message);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Обновление ребёнка
  app.put('/api/parent/children/:childId', authenticateToken, async (req, res) => {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }
    const { childId } = req.params;
    const { name, birth_date } = req.body;
    if (!name || !birth_date) {
      return res.status(400).json({ error: 'Имя и дата рождения обязательны' });
    }
    try {
      const [parent] = await db.promise().query('SELECT id FROM parents WHERE user_id = ?', [req.user.id]);
      if (parent.length === 0) return res.status(404).json({ error: 'Родитель не найден' });
      const [result] = await db.promise().query(
        'UPDATE children SET name = ?, birth_date = ? WHERE id = ? AND parent_id = ?',
        [name, birth_date, childId, parent[0].id]
      );
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Ребёнок не найден' });
      res.json({ message: 'Данные ребёнка обновлены' });
    } catch (err) {
      console.error('Ошибка при обновлении ребёнка:', err.message);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Получение расписания ребёнка
  app.get('/api/parent/schedule/:childId', authenticateToken, async (req, res) => {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }
    const { childId } = req.params;
    try {
      const [parent] = await db.promise().query('SELECT id FROM parents WHERE user_id = ?', [req.user.id]);
      if (parent.length === 0) return res.status(404).json({ error: 'Родитель не найден' });
      const [results] = await db.promise().query(`
        SELECT classes.id, classes.schedule, classes.price, classes.class_type, classes.min_age, classes.max_age,
               subjects.name AS subject, rooms.name AS room
        FROM enrollments
        JOIN classes ON enrollments.class_id = classes.id
        JOIN subjects ON classes.subject_id = subjects.id
        LEFT JOIN rooms ON classes.room_id = rooms.id
        WHERE enrollments.child_id = ? AND classes.schedule > NOW()
      `, [childId]);
      res.json(results);
    } catch (err) {
      console.error('Ошибка при получении расписания:', err.message);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Запись ребёнка на занятие
  app.post('/api/enrollments', authenticateToken, async (req, res) => {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }
    const { child_id, class_id } = req.body;
    if (!child_id || !class_id) {
      return res.status(400).json({ error: 'ID ребёнка и занятия обязательны' });
    }
    try {
      const [parent] = await db.promise().query('SELECT id FROM parents WHERE user_id = ?', [req.user.id]);
      if (parent.length === 0) return res.status(404).json({ error: 'Родитель не найден' });
      const [child] = await db.promise().query('SELECT id, birth_date FROM children WHERE id = ? AND parent_id = ?', [child_id, parent[0].id]);
      if (child.length === 0) return res.status(404).json({ error: 'Ребёнок не найден' });
      const [classData] = await db.promise().query('SELECT min_age, max_age, class_type FROM classes WHERE id = ?', [class_id]);
      if (classData.length === 0) return res.status(404).json({ error: 'Занятие не найдено' });
      const age = Math.floor((new Date() - new Date(child[0].birth_date)) / (1000 * 60 * 60 * 24 * 365.25));
      if (classData[0].class_type === 'group' && (age < classData[0].min_age || age > classData[0].max_age)) {
        return res.status(400).json({ error: `Возраст ребёнка (${age} лет) не соответствует возрастной группе занятия (${classData[0].min_age}-${classData[0].max_age} лет)` });
      }
      await db.promise().query('INSERT INTO enrollments (child_id, class_id) VALUES (?, ?)', [child_id, class_id]);
      res.status(201).json({ message: 'Ребёнок записан на занятие' });
    } catch (err) {
      console.error('Ошибка при записи на занятие:', err.message);
      const errorMsg = err.code === 'ER_DUP_ENTRY' ? 'Ребёнок уже записан на это занятие' : 'Ошибка при записи на занятие';
      res.status(400).json({ error: errorMsg });
    }
  });

  // Отмена записи ребёнка
  app.delete('/api/enrollments/:childId/:classId', authenticateToken, async (req, res) => {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }
    const { childId, classId } = req.params;
    try {
      const [parent] = await db.promise().query('SELECT id FROM parents WHERE user_id = ?', [req.user.id]);
      if (parent.length === 0) return res.status(404).json({ error: 'Родитель не найден' });
      const [result] = await db.promise().query(
        'DELETE enrollments FROM enrollments JOIN children ON enrollments.child_id = children.id WHERE enrollments.child_id = ? AND enrollments.class_id = ? AND children.parent_id = ?',
        [childId, classId, parent[0].id]
      );
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Запись не найдена' });
      res.json({ message: 'Запись отменена' });
    } catch (err) {
      console.error('Ошибка при отмене записи:', err.message);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Запуск сервера
  app.listen(port, () => {
    console.log(`✅ Сервер запущен на http://localhost:${port}`);
  });
};

// Обработка ошибок при запуске
startServer().catch(err => {
  console.error('❌ Ошибка при запуске сервера:', err.message);
  process.exit(1);
});