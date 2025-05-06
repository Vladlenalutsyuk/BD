const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({ origin: ['http://localhost:5173'] }));

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'vladlena121512',
  database: 'children_center',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const db = mysql.createPool(dbConfig);

const JWT_SECRET = 'your_jwt_secret';

const initializeDatabase = async () => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });

    await connection.query('CREATE DATABASE IF NOT EXISTS children_center');
    await connection.query('USE children_center');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'parent', 'teacher') NOT NULL
      )
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
      )
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS parents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        phone VARCHAR(15),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    await connection.query(`
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
    await connection.query(`
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
    await connection.query(`
      CREATE TABLE IF NOT EXISTS children (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        birth_date DATE NOT NULL,
        parent_id INT NOT NULL,
        FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
      )
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE
      )
    `);
    await connection.query(`
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
    await connection.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        child_id INT NOT NULL,
        class_id INT NOT NULL,
        FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
        UNIQUE(child_id, class_id)
      )
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        parent_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    await connection.query(`
      DROP PROCEDURE IF EXISTS EnrollChild;
    `);
    await connection.query(`
      CREATE PROCEDURE EnrollChild(
        IN p_class_id INT,
        IN p_child_id INT,
        OUT p_message VARCHAR(255)
      )
      BEGIN
        DECLARE v_min_age INT;
        DECLARE v_max_age INT;
        DECLARE v_class_type ENUM('group', 'individual');
        DECLARE v_birth_date DATE;
        DECLARE v_child_age INT;
        DECLARE v_class_exists INT;

        SELECT COUNT(*) INTO v_class_exists FROM classes WHERE id = p_class_id;
        IF v_class_exists = 0 THEN
          SET p_message = 'Занятие не найдено';
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Занятие не найдено';
        END IF;
        SELECT min_age, max_age, class_type
        INTO v_min_age, v_max_age, v_class_type
        FROM classes
        WHERE id = p_class_id;
        SELECT birth_date
        INTO v_birth_date
        FROM children
        WHERE id = p_child_id;

        SET v_child_age = TIMESTAMPDIFF(YEAR, v_birth_date, CURDATE());

        IF v_class_type = 'group' AND (v_child_age < v_min_age OR v_child_age > v_max_age) THEN
          SET p_message = 'Возраст ребёнка не соответствует возрастным ограничениям группы';
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = p_message;
        END IF;

        INSERT INTO enrollments(child_id, class_id)
        VALUES (p_child_id, p_class_id);

        SET p_message = 'Ребёнок успешно записан на занятие';
      END
    `);

    const [admin] = await db.query('SELECT * FROM users WHERE role = "admin"');
    if (admin.length === 0) {
      const hashedPassword = await bcrypt.hash('SecureAdmin2025!', 10);
      await db.query(`
        INSERT INTO users (username, email, password, role)
        VALUES ('admin', 'admin@example.com', ?, 'admin')
      `, [hashedPassword]);
    }

    const [parents] = await db.query('SELECT * FROM users WHERE role = "parent"');
    let parentId = 1;
    if (parents.length === 0) {
      const hashedPassword = await bcrypt.hash('SecureParent2025!', 10);
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
      parentId = parentResult[0]?.id || 1;
    }

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

    const [teachers] = await db.query('SELECT * FROM teachers');
    let teacherId = null;
    if (teachers.length === 0) {
      const hashedPassword = await bcrypt.hash('SecureTeacher2025!', 10);
      await db.query(`
        INSERT INTO users (username, email, password, role)
        VALUES ('teacher1', 'teacher1@example.com', ?, 'teacher')
      `, [hashedPassword]);

      const [userResult] = await db.query('SELECT id FROM users WHERE username = "teacher1"');
      const userId = userResult[0].id;

      const [subjectResult] = await db.query('SELECT id FROM subjects WHERE name = "Математика"');
      const subjectId = subjectResult[0].id;

      await db.query(`
        INSERT INTO teachers (user_id, subject_id, phone, education, experience)
        VALUES (?, ?, '9876543210', 'Педагогическое образование', 5)
      `, [userId, subjectId]);

      const [teacherResult] = await db.query('SELECT id FROM teachers WHERE user_id = ?', [userId]);
      teacherId = teacherResult[0].id;
    } else {
      teacherId = teachers[0].id;
    }

    const [classes] = await db.query('SELECT * FROM classes');
    if (classes.length === 0) {
      const [subjectResult] = await db.query('SELECT id FROM subjects WHERE name = "Математика"');
      const subjectId = subjectResult[0].id;
      const [roomResult] = await db.query('SELECT id FROM rooms WHERE name = "Кабинет 101"');
      const roomId = roomResult[0].id;

      await db.query(`
        INSERT INTO classes (subject_id, schedule, teacher_id, room_id, price, class_type, min_age, max_age)
        VALUES
        (?, '2025-05-01 10:00:00', ?, ?, 500.00, 'group', 6, 12),
        (?, '2025-05-02 14:00:00', ?, ?, 1000.00, 'individual', 3, 16)
      `, [subjectId, teacherId, roomId, subjectId, teacherId, roomId]);
    }

    const [children] = await db.query('SELECT * FROM children');
    if (children.length === 0) {
      await db.query(`
        INSERT INTO children (name, birth_date, parent_id)
        VALUES ('Иван Иванов', '2015-01-01', ?)
      `, [parentId]);
    }

    const [reviews] = await db.query('SELECT * FROM reviews');
    if (reviews.length === 0) {
      const [userResult] = await db.query('SELECT id FROM users WHERE username = "parent1"');
      const userId = userResult[0].id;
      await db.query(`
        INSERT INTO reviews (parent_id, content, created_at)
        VALUES
        (?, 'Отличный центр, ребёнок в восторге!', NOW()),
        (?, 'Учителя очень внимательные, рекомендуем!', NOW())
      `, [userId, userId]);
    }

    await connection.query(`
      CREATE OR REPLACE VIEW child_statistics AS
      SELECT
          c.id AS child_id,
          c.name AS child_name,
          TIMESTAMPDIFF(YEAR, c.birth_date, CURDATE()) AS child_age,
          COUNT(e.id) AS classes_attended
      FROM children c
      LEFT JOIN enrollments e ON c.id = e.child_id
      LEFT JOIN classes cl ON e.class_id = cl.id
      WHERE cl.completed = TRUE OR cl.id IS NULL
      GROUP BY c.id, c.name, c.birth_date
      ORDER BY classes_attended DESC;
    `);

   // Обновление вью teacher_statistics в initializeDatabase
await connection.query(`
  CREATE OR REPLACE VIEW teacher_statistics AS
  SELECT
      t.id AS teacher_id,
      u.username AS teacher_name,
      s.name AS subject_name,
      COUNT(DISTINCT cl.id) AS class_count,
      COALESCE(SUM(e.enrolled_count), 0) AS total_students,
      COALESCE(SUM(cl.price * e.enrolled_count), 0) AS total_revenue,
      COALESCE(SUM(cl.price * e.enrolled_count * 0.4), 0) AS teacher_salary
  FROM teachers t
  JOIN users u ON t.user_id = u.id
  LEFT JOIN subjects s ON t.subject_id = s.id
  LEFT JOIN classes cl ON t.id = cl.teacher_id
  LEFT JOIN (
      SELECT class_id, COUNT(*) AS enrolled_count
      FROM enrollments
      GROUP BY class_id
  ) e ON cl.id = e.class_id
  WHERE cl.completed = TRUE OR cl.id IS NULL
  GROUP BY t.id, u.username, s.name
  ORDER BY total_revenue DESC;
`);

    await connection.query(`
      CREATE OR REPLACE VIEW child_schedule AS
      SELECT
          ch.id AS child_id,
          ch.name AS child_name,
          s.name AS subject_name,
          cl.schedule,
          cl.class_type,
          r.name AS room_name,
          u.username AS teacher_name
      FROM enrollments e
      JOIN children ch ON e.child_id = ch.id
      JOIN classes cl ON e.class_id = cl.id
      JOIN subjects s ON cl.subject_id = s.id
      LEFT JOIN rooms r ON cl.room_id = r.id
      LEFT JOIN teachers t ON cl.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE cl.schedule >= NOW() AND cl.completed = FALSE
      ORDER BY ch.name, cl.schedule;
    `);

    console.log('База данных успешно инициализирована');
  } catch (err) {
    console.error('Ошибка инициализации базы данных:', err.stack);
    throw err;
  } finally {
    if (connection) await connection.end();
  }
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Токен отсутствует' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Недействительный токен' });
    req.user = user;
    next();
  });
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Доступ только для администраторов' });
  next();
};

const parentOnly = (req, res, next) => {
  if (req.user.role !== 'parent') return res.status(403).json({ error: 'Доступ только для родителей' });
  next();
};

const teacherOnly = (req, res, next) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Доступ только для учителей' });
  next();
};

app.get('/api/auth/validate', authenticateToken, async (req, res) => {
  try {
    res.json({ valid: true, role: req.user.role });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/users/teachers', authenticateToken, adminOnly, async (req, res) => {
  try {
    const [teachers] = await db.query(`
      SELECT t.id, u.id AS user_id, u.username, u.email, t.phone, s.name AS subject_name
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN subjects s ON t.subject_id = s.id
    `);
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/classes', authenticateToken, adminOnly, async (req, res) => {
  try {
    const [classes] = await db.query(`
      SELECT c.id, s.name AS subject, c.schedule, c.class_type, c.min_age, c.max_age, c.price, r.name AS room,
             u.username AS teacher_name, c.subject_id, c.teacher_id, c.room_id, c.completed,
             (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id) AS enrolled_count
      FROM classes c
      JOIN subjects s ON c.subject_id = s.id
      LEFT JOIN rooms r ON c.room_id = r.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
    `);
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Функция проверки конфликтов учителя или кабинета
const checkScheduleConflict = async (schedule, teacher_id, room_id, excludeClassId = null) => {
  const scheduleTime = new Date(schedule);
  const timeBuffer = 5 * 60 * 1000; // 5 минут для упрощения проверки
  const startTime = new Date(scheduleTime.getTime() - timeBuffer).toISOString();
  const endTime = new Date(scheduleTime.getTime() + timeBuffer).toISOString();

  let query = `
    SELECT id
    FROM classes
    WHERE schedule BETWEEN ? AND ?
    AND completed = FALSE
  `;
  const params = [startTime, endTime];

  if (teacher_id) {
    query += ' AND teacher_id = ?';
    params.push(teacher_id);
  }
  if (room_id) {
    query += ' AND room_id = ?';
    params.push(room_id);
  }
  if (excludeClassId) {
    query += ' AND id != ?';
    params.push(excludeClassId);
  }

  const [conflicts] = await db.query(query, params);
  return conflicts.length > 0;
};



// Обновлённый маршрут POST /api/classes
app.post('/api/classes', authenticateToken, adminOnly, async (req, res) => {
  const { subject_id, teacher_id, schedule, room_id, price, class_type, min_age, max_age } = req.body;
  try {
    if (!subject_id || !teacher_id || !schedule || !price || !class_type) {
      return res.status(400).json({ error: 'Все поля (subject_id, teacher_id, schedule, price, class_type) обязательны' });
    }
    const [subjects] = await db.query('SELECT id FROM subjects WHERE id = ?', [subject_id]);
    if (subjects.length === 0) return res.status(400).json({ error: 'Предмет не найден' });
    const [teachers] = await db.query('SELECT id FROM teachers WHERE id = ?', [teacher_id]);
    if (teachers.length === 0) return res.status(400).json({ error: 'Учитель не найден' });
    if (room_id) {
      const [rooms] = await db.query('SELECT id FROM rooms WHERE id = ?', [room_id]);
      if (rooms.length === 0) return res.status(400).json({ error: 'Кабинет не найден' });
    }
    if (!['group', 'individual'].includes(class_type)) return res.status(400).json({ error: 'Неверный тип занятия' });
    if (min_age < 3 || max_age > 16 || min_age > max_age) return res.status(400).json({ error: 'Неверный диапазон возраста' });

    // Проверка конфликтов
    const hasConflict = await checkScheduleConflict(schedule, teacher_id, room_id);
    if (hasConflict) {
      return res.status(409).json({ error: 'Конфликт расписания: учитель или кабинет заняты в это время' });
    }

    await db.query(`
      INSERT INTO classes (subject_id, teacher_id, schedule, room_id, price, class_type, min_age, max_age)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [subject_id, teacher_id, schedule, room_id || null, price, class_type, min_age, max_age]);
    res.status(201).json({ message: 'Занятие создано' });
  } catch (err) {
    res.status(400).json({ error: err.sqlMessage || 'Ошибка создания занятия' });
  }
});

// Обновлённый маршрут PUT /api/classes/:id
app.put('/api/classes/:id', authenticateToken, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { subject_id, teacher_id, schedule, room_id, price, class_type, min_age, max_age } = req.body;
  try {
    if (!id || isNaN(id)) return res.status(400).json({ error: 'Неверный ID занятия' });
    if (!subject_id || !teacher_id || !schedule || !price || !class_type) {
      return res.status(400).json({ error: 'Все поля (subject_id, teacher_id, schedule, price, class_type) обязательны' });
    }
    const [classes] = await db.query('SELECT id FROM classes WHERE id = ?', [id]);
    if (classes.length === 0) return res.status(404).json({ error: 'Занятие не найдено' });
    const [subjects] = await db.query('SELECT id FROM subjects WHERE id = ?', [subject_id]);
    if (subjects.length === 0) return res.status(400).json({ error: 'Предмет не найден' });
    const [teachers] = await db.query('SELECT id FROM teachers WHERE id = ?', [teacher_id]);
    if (teachers.length === 0) return res.status(400).json({ error: 'Учитель не найден' });
    if (room_id) {
      const [rooms] = await db.query('SELECT id FROM rooms WHERE id = ?', [room_id]);
      if (rooms.length === 0) return res.status(400).json({ error: 'Кабинет не найден' });
    }
    if (!['group', 'individual'].includes(class_type)) return res.status(400).json({ error: 'Неверный тип занятия' });
    if (min_age < 3 || max_age > 16 || min_age > max_age) return res.status(400).json({ error: 'Неверный диапазон возраста' });

    // Проверка конфликтов, исключая текущее занятие
    const hasConflict = await checkScheduleConflict(schedule, teacher_id, room_id, id);
    if (hasConflict) {
      return res.status(409).json({ error: 'Конфликт расписания: учитель или кабинет заняты в это время' });
    }

    await db.query(`
      UPDATE classes
      SET subject_id = ?, teacher_id = ?, schedule = ?, room_id = ?, price = ?, class_type = ?, min_age = ?, max_age = ?
      WHERE id = ?
    `, [subject_id, teacher_id, schedule, room_id || null, price, class_type, min_age, max_age, id]);
    res.json({ message: 'Занятие обновлено' });
  } catch (err) {
    res.status(400).json({ error: err.sqlMessage || 'Ошибка обновления занятия' });
  }
});

app.delete('/api/classes/:id', authenticateToken, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    if (!id || isNaN(id)) return res.status(400).json({ error: 'Неверный ID занятия' });
    const [classes] = await db.query('SELECT id FROM classes WHERE id = ?', [id]);
    if (classes.length === 0) return res.status(404).json({ error: 'Занятие не найдено' });
    await db.query('DELETE FROM classes WHERE id = ?', [id]);
    res.json({ message: 'Занятие удалено' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/users/parents-children', authenticateToken, adminOnly, async (req, res) => {
  try {
    const [parents] = await db.query(`
      SELECT u.id AS user_id, u.username, u.email, p.phone
      FROM parents p
      JOIN users u ON p.user_id = u.id
    `);
    const parentIds = parents.map(p => p.user_id);
    let children = [];
    if (parentIds.length > 0) {
      [children] = await db.query(`
        SELECT c.id, c.name, c.birth_date, c.parent_id, p.user_id
        FROM children c
        JOIN parents p ON c.parent_id = p.id
        WHERE p.user_id IN (?)
      `, [parentIds]);
    }
    const result = parents.map(parent => ({
      ...parent,
      children: children.filter(child => child.user_id === parent.user_id).map(({ id, name, birth_date }) => ({
        id,
        name,
        birth_date
      }))
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/subjects', authenticateToken, async (req, res) => {
  try {
    const [subjects] = await db.query('SELECT * FROM subjects');
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/rooms', authenticateToken, adminOnly, async (req, res) => {
  try {
    const [rooms] = await db.query('SELECT * FROM rooms');
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/register', async (req, res) => {
  const { username, email, password, role, phone } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [userResult] = await db.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role]
    );
    const userId = userResult.insertId;
    if (role === 'parent') {
      await db.query('INSERT INTO parents (user_id, phone) VALUES (?, ?)', [userId, phone]);
    } else if (role === 'teacher') {
      await db.query('INSERT INTO teachers (user_id, phone) VALUES (?, ?)', [userId, phone]);
    }
    res.status(201).json({ message: 'Пользователь зарегистрирован' });
  } catch (err) {
    res.status(400).json({ error: err.sqlMessage || 'Ошибка регистрации' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(401).json({ error: 'Пользователь не найден' });
    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Неверный пароль' });
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/teachers/profile', authenticateToken, teacherOnly, async (req, res) => {
  try {
    const [teachers] = await db.query(`
      SELECT u.id, u.username, u.email, t.phone, t.education, t.experience, t.subject_id, s.name AS subject_name
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN subjects s ON t.subject_id = s.id
      WHERE t.user_id = ?
    `, [req.user.id]);
    if (teachers.length === 0) return res.status(404).json({ error: 'Учитель не найден' });
    res.json(teachers[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/api/teachers/profile', authenticateToken, teacherOnly, async (req, res) => {
  const { phone, education, experience, subject_id } = req.body;
  const userId = req.user.id;
  try {
    if (!phone || !education || experience === undefined || !subject_id) {
      return res.status(400).json({ error: 'Все поля (phone, education, experience, subject_id) обязательны' });
    }
    const phoneRegex = /^\+\d{10,15}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Неверный формат телефона: +1234567890 (10-15 цифр)' });
    }
    const [subjects] = await db.query('SELECT id FROM subjects WHERE id = ?', [subject_id]);
    if (subjects.length === 0) return res.status(400).json({ error: 'Предмет не найден' });
    await db.query(
      'UPDATE teachers SET phone = ?, education = ?, experience = ?, subject_id = ? WHERE user_id = ?',
      [phone, education, experience, subject_id, userId]
    );
    res.json({ message: 'Профиль обновлен' });
  } catch (err) {
    res.status(err.sqlMessage ? 400 : 500).json({ error: err.sqlMessage || 'Ошибка сервера' });
  }
});

app.get('/api/classes/upcoming', authenticateToken, teacherOnly, async (req, res) => {
  try {
    const [teacher] = await db.query('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
    if (teacher.length === 0) return res.status(404).json({ error: 'Учитель не найден' });
    const teacherId = teacher[0].id;
    const [classes] = await db.query(`
      SELECT c.id, s.name AS subject, c.schedule, c.class_type, c.price, r.name AS room, c.completed
      FROM classes c
      JOIN subjects s ON c.subject_id = s.id
      LEFT JOIN rooms r ON c.room_id = r.id
      WHERE c.teacher_id = ? AND c.schedule > NOW() AND c.completed = FALSE
      ORDER BY c.schedule ASC
    `, [teacherId]);
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/classes/completed', authenticateToken, teacherOnly, async (req, res) => {
  try {
    const [teacher] = await db.query('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
    if (teacher.length === 0) return res.status(404).json({ error: 'Учитель не найден' });
    const teacherId = teacher[0].id;
    const [classes] = await db.query(`
      SELECT c.id, s.name AS subject, c.schedule, c.class_type, c.price, r.name AS room, c.completed
      FROM classes c
      JOIN subjects s ON c.subject_id = s.id
      LEFT JOIN rooms r ON c.room_id = r.id
      WHERE c.teacher_id = ? AND c.completed = TRUE
      ORDER BY c.schedule DESC
    `, [teacherId]);
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/classes/daily', authenticateToken, teacherOnly, async (req, res) => {
  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Неверный формат даты. Используйте YYYY-MM-DD' });
  }
  try {
    const [teacher] = await db.query('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
    if (teacher.length === 0) return res.status(404).json({ error: 'Учитель не найден' });
    const teacherId = teacher[0].id;
    const startDate = `${date} 00:00:00`;
    const endDate = `${date} 23:59:59`;
    const [classes] = await db.query(`
      SELECT c.id, s.name AS subject, c.schedule, c.class_type, c.price, r.name AS room, c.completed
      FROM classes c
      JOIN subjects s ON c.subject_id = s.id
      LEFT JOIN rooms r ON c.room_id = r.id
      WHERE c.teacher_id = ? AND c.schedule BETWEEN ? AND ?
      ORDER BY c.schedule ASC
    `, [teacherId, startDate, endDate]);
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/classes/upcoming/weekly', authenticateToken, teacherOnly, async (req, res) => {
  const { startDate } = req.query;
  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return res.status(400).json({ error: 'Неверный формат даты. Используйте YYYY-MM-DD' });
  }
  try {
    const [teacher] = await db.query('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
    if (teacher.length === 0) return res.status(404).json({ error: 'Учитель не найден' });
    const teacherId = teacher[0].id;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    const endDateStr = endDate.toISOString().slice(0, 10) + ' 23:59:59';
    const [classes] = await db.query(`
      SELECT c.id, s.name AS subject, c.schedule, c.class_type, c.price, r.name AS room, c.completed
      FROM classes c
      JOIN subjects s ON c.subject_id = s.id
      LEFT JOIN rooms r ON c.room_id = r.id
      WHERE c.teacher_id = ? AND c.schedule BETWEEN ? AND ? AND c.completed = FALSE
      ORDER BY c.schedule ASC
    `, [teacherId, `${startDate} 00:00:00`, endDateStr]);
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/classes/completed/weekly', authenticateToken, teacherOnly, async (req, res) => {
  const { startDate } = req.query;
  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return res.status(400).json({ error: 'Неверный формат даты. Используйте YYYY-MM-DD' });
  }
  try {
    const [teacher] = await db.query('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
    if (teacher.length === 0) return res.status(404).json({ error: 'Учитель не найден' });
    const teacherId = teacher[0].id;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    const endDateStr = endDate.toISOString().slice(0, 10) + ' 23:59:59';
    const [classes] = await db.query(`
      SELECT c.id, s.name AS subject, c.schedule, c.class_type, c.price, r.name AS room, c.completed
      FROM classes c
      JOIN subjects s ON c.subject_id = s.id
      LEFT JOIN rooms r ON c.room_id = r.id
      WHERE c.teacher_id = ? AND c.schedule BETWEEN ? AND ? AND c.completed = TRUE
      ORDER BY c.schedule DESC
    `, [teacherId, `${startDate} 00:00:00`, endDateStr]);
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/teachers/salary', authenticateToken, teacherOnly, async (req, res) => {
  const { month } = req.query;
  try {
    const [teacher] = await db.query('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
    if (teacher.length === 0) return res.status(404).json({ error: 'Учитель не найден' });
    const teacherId = teacher[0].id;
    let query = `
      SELECT 
        DATE_FORMAT(c.schedule, '%Y-%m') AS month,
        COUNT(DISTINCT c.id) AS class_count,
        COALESCE(SUM(c.price * e.enrolled_count * 0.4), 0) AS total_salary
      FROM classes c
      LEFT JOIN (
        SELECT class_id, COUNT(*) AS enrolled_count
        FROM enrollments
        GROUP BY class_id
      ) e ON c.id = e.class_id
      WHERE c.teacher_id = ? AND c.completed = TRUE
    `;
    const params = [teacherId];
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      query += ' AND DATE_FORMAT(c.schedule, "%Y-%m") = ?';
      params.push(month);
    }
    query += ' GROUP BY DATE_FORMAT(c.schedule, "%Y-%m") ORDER BY month DESC';
    const [salary] = await db.query(query, params);
    res.json(salary);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/enrollments/:classId', authenticateToken, async (req, res) => {
  const { classId } = req.params;
  try {
    if (!classId || isNaN(classId)) return res.status(400).json({ error: 'Неверный ID занятия' });
    const [classes] = await db.query('SELECT id, teacher_id FROM classes WHERE id = ?', [classId]);
    if (classes.length === 0) return res.status(404).json({ error: 'Занятие не найдено' });
    if (req.user.role === 'teacher') {
      const [teacher] = await db.query('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
      if (teacher.length === 0 || teacher[0].id !== classes[0].teacher_id) {
        return res.status(403).json({ error: 'Доступ только к своим занятиям' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ только для администраторов или учителей' });
    }
    const [enrollments] = await db.query(`
      SELECT c.id, c.name, c.birth_date
      FROM enrollments e
      JOIN children c ON e.child_id = c.id
      WHERE e.class_id = ?
    `, [classId]);
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/parent/profile', authenticateToken, parentOnly, async (req, res) => {
  try {
    const [parents] = await db.query('SELECT p.*, u.username, u.email FROM parents p JOIN users u ON p.user_id = u.id WHERE p.user_id = ?', [req.user.id]);
    if (parents.length === 0) return res.status(404).json({ error: 'Родитель не найден' });
    res.json(parents[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/api/parent/profile', authenticateToken, parentOnly, async (req, res) => {
  const { username, email, phone, password } = req.body;
  try {
    if (username || email || password) {
      const updates = {};
      if (username) updates.username = username;
      if (email) updates.email = email;
      if (password) updates.password = await bcrypt.hash(password, 10);
      const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updates);
      if (setClause) {
        await db.query(`UPDATE users SET ${setClause} WHERE id = ?`, [...values, req.user.id]);
      }
    }
    if (phone) {
      await db.query('UPDATE parents SET phone = ? WHERE user_id = ?', [phone, req.user.id]);
    }
    res.json({ message: 'Профиль обновлён' });
  } catch (err) {
    res.status(400).json({ error: err.sqlMessage || 'Ошибка обновления профиля' });
  }
});

app.get('/api/parent/children', authenticateToken, parentOnly, async (req, res) => {
  try {
    const [parents] = await db.query('SELECT id FROM parents WHERE user_id = ?', [req.user.id]);
    if (parents.length === 0) return res.status(404).json({ error: 'Родитель не найден' });
    const [children] = await db.query('SELECT * FROM children WHERE parent_id = ?', [parents[0].id]);
    res.json(children);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/parent/children', authenticateToken, parentOnly, async (req, res) => {
  const { name, birth_date } = req.body;
  try {
    const [parents] = await db.query('SELECT id FROM parents WHERE user_id = ?', [req.user.id]);
    if (parents.length === 0) return res.status(404).json({ error: 'Родитель не найден' });
    await db.query('INSERT INTO children (name, birth_date, parent_id) VALUES (?, ?, ?)', [name, birth_date, parents[0].id]);
    res.status(201).json({ message: 'Ребёнок добавлен' });
  } catch (err) {
    res.status(400).json({ error: err.sqlMessage || 'Ошибка добавления ребёнка' });
  }
});

app.put('/api/parent/children/:id', authenticateToken, parentOnly, async (req, res) => {
  const { name, birth_date } = req.body;
  const childId = req.params.id;
  try {
    const [parents] = await db.query('SELECT id FROM parents WHERE user_id = ?', [req.user.id]);
    if (parents.length === 0) return res.status(404).json({ error: 'Родитель не найден' });
    const [children] = await db.query('SELECT * FROM children WHERE id = ? AND parent_id = ?', [childId, parents[0].id]);
    if (children.length === 0) return res.status(404).json({ error: 'Ребёнок не найден' });
    await db.query('UPDATE children SET name = ?, birth_date = ? WHERE id = ?', [name, birth_date, childId]);
    res.json({ message: 'Данные ребёнка обновлены' });
  } catch (err) {
    res.status(400).json({ error: err.sqlMessage || 'Ошибка обновления ребёнка' });
  }
});

app.post('/api/enrollments', authenticateToken, async (req, res) => {
  const { classId, childId } = req.body;
  if (!classId || !childId) return res.status(400).json({ error: 'ID занятия и ребёнка обязательны' });
  try {
    const [classCheck] = await db.query('SELECT id FROM classes WHERE id = ?', [classId]);
    if (classCheck.length === 0) return res.status(400).json({ error: 'Занятие не найдено' });
    if (req.user.role === 'parent') {
      const [parents] = await db.query('SELECT id FROM parents WHERE user_id = ?', [req.user.id]);
      if (parents.length === 0) return res.status(404).json({ error: 'Родитель не найден' });
      const [children] = await db.query('SELECT id FROM children WHERE id = ? AND parent_id = ?', [childId, parents[0].id]);
      if (children.length === 0) return res.status(404).json({ error: 'Ребёнок не найден или не принадлежит вам' });
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ только для родителей или администраторов' });
    }
    if (req.user.role === 'admin') {
      const [children] = await db.query('SELECT id FROM children WHERE id = ?', [childId]);
      if (children.length === 0) return res.status(404).json({ error: 'Ребёнок не найден' });
    }
    await db.query('CALL EnrollChild(?, ?, @p_message)', [classId, childId]);
    const [result] = await db.query('SELECT @p_message AS message');
    const message = result[0].message;
    if (message.includes('успешно')) {
      res.status(201).json({ message });
    } else {
      res.status(400).json({ error: message });
    }
  } catch (err) {
    res.status(err.sqlMessage ? 400 : 500).json({ error: err.sqlMessage || 'Ошибка сервера' });
  }
});

app.get('/api/parent/schedule/:childId', authenticateToken, parentOnly, async (req, res) => {
  const childId = req.params.childId;
  const includePast = req.query.includePast === 'true';
  try {
    const [parents] = await db.query('SELECT id FROM parents WHERE user_id = ?', [req.user.id]);
    if (parents.length === 0) return res.status(404).json({ error: 'Родитель не найден' });
    let query = `
      SELECT c.id, s.name AS subject, c.schedule, c.class_type, c.min_age, c.max_age, c.price, r.name AS room, c.completed
      FROM enrollments e
      JOIN classes c ON e.class_id = c.id
      JOIN subjects s ON c.subject_id = s.id
      LEFT JOIN rooms r ON c.room_id = r.id
      WHERE e.child_id = ?
    `;
    const params = [childId];
    if (!includePast && childId !== 'all') {
      query += ' AND (c.schedule > NOW() AND c.completed = FALSE)';
    }
    if (childId === 'all') {
      query = `
        SELECT c.id, s.name AS subject, c.schedule, c.class_type, c.min_age, c.max_age, c.price, r.name AS room, c.completed
        FROM enrollments e
        JOIN classes c ON e.class_id = c.id
        JOIN subjects s ON c.subject_id = s.id
        LEFT JOIN rooms r ON c.room_id = r.id
        JOIN children ch ON e.child_id = ch.id
        WHERE ch.parent_id = ?
      `;
      if (!includePast) {
        query += ' AND (c.schedule > NOW() AND c.completed = FALSE)';
      }
      params[0] = parents[0].id;
    }
    const [schedule] = await db.query(query, params);
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.delete('/api/enrollments/:classId/:childId', authenticateToken, async (req, res) => {
  const { classId, childId } = req.params;
  try {
    if (!classId || isNaN(classId) || !childId || isNaN(childId)) {
      return res.status(400).json({ error: 'Неверный ID занятия или ребёнка' });
    }
    const [classes] = await db.query('SELECT id FROM classes WHERE id = ?', [classId]);
    if (classes.length === 0) return res.status(404).json({ error: 'Занятие не найдено' });
    const [children] = await db.query('SELECT id FROM children WHERE id = ?', [childId]);
    if (children.length === 0) return res.status(404).json({ error: 'Ребёнок не найден' });
    if (req.user.role === 'parent') {
      const [parents] = await db.query('SELECT id FROM parents WHERE user_id = ?', [req.user.id]);
      if (parents.length === 0) return res.status(404).json({ error: 'Родитель не найден' });
      const [childCheck] = await db.query('SELECT id FROM children WHERE id = ? AND parent_id = ?', [childId, parents[0].id]);
      if (childCheck.length === 0) return res.status(403).json({ error: 'Ребёнок не принадлежит вам' });
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ только для родителей или администраторов' });
    }
    const [enrollments] = await db.query('SELECT id FROM enrollments WHERE class_id = ? AND child_id = ?', [classId, childId]);
    if (enrollments.length === 0) return res.status(404).json({ error: 'Запись не найдена' });
    await db.query('DELETE FROM enrollments WHERE class_id = ? AND child_id = ?', [classId, childId]);
    res.json({ message: 'Запись отменена' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/reviews', async (req, res) => {
  try {
    const [reviews] = await db.query(`
      SELECT r.id, r.content, r.created_at, u.username AS parent_name
      FROM reviews r
      JOIN users u ON r.parent_id = u.id
    `);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/reviews', authenticateToken, parentOnly, async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Текст отзыва обязателен' });
  try {
    await db.query('INSERT INTO reviews (parent_id, content) VALUES (?, ?)', [req.user.id, content]);
    res.status(201).json({ message: 'Отзыв добавлен' });
  } catch (err) {
    res.status(400).json({ error: err.sqlMessage || 'Ошибка добавления отзыва' });
  }
});

// Обновлённый маршрут /api/statistics/teachers
app.get('/api/statistics/teachers', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { month } = req.query;
    let query = `
      SELECT
        t.id AS teacher_id,
        u.username AS teacher_name,
        s.name AS subject_name,
        COUNT(DISTINCT CASE WHEN cl.completed = TRUE THEN cl.id ELSE NULL END) AS class_count,
        COALESCE(SUM(CASE WHEN cl.completed = TRUE THEN e.enrolled_count ELSE 0 END), 0) AS total_students,
        COALESCE(SUM(CASE WHEN cl.completed = TRUE THEN cl.price * e.enrolled_count ELSE 0 END), 0) AS total_revenue,
        COALESCE(SUM(CASE WHEN cl.completed = TRUE THEN cl.price * e.enrolled_count * 0.4 ELSE 0 END), 0) AS teacher_salary
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN classes cl ON t.id = cl.teacher_id
      LEFT JOIN (
        SELECT class_id, COUNT(*) AS enrolled_count
        FROM enrollments
        GROUP BY class_id
      ) e ON cl.id = e.class_id
    `;
    const params = [];
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      query += ' WHERE (cl.completed = TRUE AND DATE_FORMAT(cl.schedule, "%Y-%m") = ?) OR cl.id IS NULL';
      params.push(month);
    }
    query += ' GROUP BY t.id, u.username, s.name ORDER BY total_revenue DESC';
    const [statistics] = await db.query(query, params);
    console.log('Statistics fetched:', statistics);
    res.json(statistics);
  } catch (err) {
    console.error('Ошибка в /api/statistics/teachers:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/parent/child-schedule/:childId', authenticateToken, parentOnly, async (req, res) => {
  const { childId } = req.params;
  try {
    const [parents] = await db.query('SELECT id FROM parents WHERE user_id = ?', [req.user.id]);
    if (parents.length === 0) return res.status(404).json({ error: 'Родитель не найден' });
    const [children] = await db.query('SELECT id FROM children WHERE id = ? AND parent_id = ?', [childId, parents[0].id]);
    if (children.length === 0) return res.status(404).json({ error: 'Ребёнок не найден или не принадлежит вам' });
    const [schedule] = await db.query('SELECT * FROM child_schedule WHERE child_id = ?', [childId]);
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/statistics/children', authenticateToken, adminOnly, async (req, res) => {
  try {
    const [statistics] = await db.query('SELECT * FROM child_statistics');
    res.json(statistics);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/children/eligible/:classId', authenticateToken, adminOnly, async (req, res) => {
  const { classId } = req.params;
  try {
    if (!classId || isNaN(classId)) return res.status(400).json({ error: 'Неверный ID занятия' });
    const [classes] = await db.query(`
      SELECT min_age, max_age
      FROM classes
      WHERE id = ?
    `, [classId]);
    if (classes.length === 0) return res.status(404).json({ error: 'Занятие не найдено' });
    const { min_age, max_age } = classes[0];
    const [children] = await db.query(`
      SELECT c.id, c.name, c.birth_date
      FROM children c
      WHERE c.id NOT IN (
        SELECT child_id
        FROM enrollments
        WHERE class_id = ?
      )
      AND TIMESTAMPDIFF(YEAR, c.birth_date, CURDATE()) BETWEEN ? AND ?
    `, [classId, min_age, max_age]);
    res.json(children);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/teachers/by-subject/:subjectId', authenticateToken, adminOnly, async (req, res) => {
  const { subjectId } = req.params;
  try {
    if (!subjectId || isNaN(subjectId)) return res.status(400).json({ error: 'Неверный ID предмета' });
    const [subjects] = await db.query('SELECT id FROM subjects WHERE id = ?', [subjectId]);
    if (subjects.length === 0) return res.status(404).json({ error: 'Предмет не найден' });
    const [teachers] = await db.query(`
      SELECT t.id, u.id AS user_id, u.username, u.email, t.phone, s.name AS subject_name
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN subjects s ON t.subject_id = s.id
      WHERE t.subject_id = ?
    `, [subjectId]);
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/api/classes/:id/complete', authenticateToken, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    if (!id || isNaN(id)) return res.status(400).json({ error: 'Неверный ID занятия' });
    const [classes] = await db.query('SELECT id FROM classes WHERE id = ?', [id]);
    if (classes.length === 0) return res.status(404).json({ error: 'Занятие не найдено' });
    await db.query('UPDATE classes SET completed = TRUE WHERE id = ?', [id]);
    res.json({ message: 'Занятие отмечено как завершенное' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.delete('/api/teachers/:userId', authenticateToken, adminOnly, async (req, res) => {
  const { userId } = req.params;
  try {
    if (!userId || isNaN(userId)) return res.status(400).json({ error: 'Неверный ID пользователя' });
    const [users] = await db.query('SELECT id, role FROM users WHERE id = ? AND role = "teacher"', [userId]);
    if (users.length === 0) return res.status(404).json({ error: 'Учитель не найден' });
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query('DELETE FROM teachers WHERE user_id = ?', [userId]);
      await connection.query('DELETE FROM users WHERE id = ?', [userId]);
      await connection.commit();
      res.json({ message: 'Учитель удалён' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/teachers', authenticateToken, adminOnly, async (req, res) => {
  const { username, email, password, phone, subject_id } = req.body;
  try {
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Все поля (username, email, password) обязательны' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Неверный формат email' });
    if (subject_id) {
      const [subjects] = await db.query('SELECT id FROM subjects WHERE id = ?', [subject_id]);
      if (subjects.length === 0) return res.status(400).json({ error: 'Предмет не найден' });
    }
    const [existing] = await db.query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existing.length > 0) return res.status(400).json({ error: 'Имя пользователя или email уже заняты' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [userResult] = await connection.query(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username, email, hashedPassword, 'teacher']
      );
      const userId = userResult.insertId;
      await connection.query(
        'INSERT INTO teachers (user_id, phone, subject_id) VALUES (?, ?, ?)',
        [userId, phone || null, subject_id || null]
      );
      await connection.commit();
      res.status(201).json({ message: 'Учитель создан' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    res.status(err.sqlMessage ? 400 : 500).json({ error: err.sqlMessage || 'Ошибка сервера' });
  }
});

app.get('/api/subjects/public', async (req, res) => {
  try {
    const [subjects] = await db.query('SELECT * FROM subjects');
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/classes/public', authenticateToken, parentOnly, async (req, res) => {
  try {
    const { subject_id, child_id } = req.query;
    let query = `
      SELECT c.id, s.name AS subject, c.schedule, c.class_type, c.min_age, c.max_age, c.price, r.name AS room,
             u.username AS teacher_name, c.completed
      FROM classes c
      JOIN subjects s ON c.subject_id = s.id
      LEFT JOIN rooms r ON c.room_id = r.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE c.schedule > NOW() AND c.completed = FALSE
    `;
    const params = [];
    if (subject_id && !isNaN(subject_id)) {
      query += ' AND c.subject_id = ?';
      params.push(subject_id);
    }
    if (child_id && !isNaN(child_id)) {
      const [parents] = await db.query('SELECT id FROM parents WHERE user_id = ?', [req.user.id]);
      if (parents.length === 0) return res.status(404).json({ error: 'Родитель не найден' });
      const [children] = await db.query('SELECT id, birth_date FROM children WHERE id = ? AND parent_id = ?', [child_id, parents[0].id]);
      if (children.length === 0) return res.status(404).json({ error: 'Ребёнок не найден или не принадлежит вам' });
      const child = children[0];
      const childAge = Math.floor((new Date() - new Date(child.birth_date)) / (365.25 * 24 * 60 * 60 * 1000));
      query += ' AND (c.class_type = "individual" OR (c.min_age <= ? AND c.max_age >= ?))';
      params.push(childAge, childAge);
      query += ' AND c.id NOT IN (SELECT class_id FROM enrollments WHERE child_id = ?)';
      params.push(child_id);
    }
    query += ' ORDER BY c.schedule ASC';
    const [classes] = await db.query(query, params);
    console.log('Fetched public classes:', classes);
    res.json(classes);
  } catch (err) {
    console.error('Ошибка в /api/classes/public:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/users/teachers/public', async (req, res) => {
  try {
    const [teachers] = await db.query(`
      SELECT t.id, u.username, u.email, t.phone, s.name AS subject, t.education, t.experience
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN subjects s ON t.subject_id = s.id
    `);
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение списка удалённых учителей
app.get('/api/deleted_teachers', authenticateToken, adminOnly, async (req, res) => {
  try {
    const [deletedTeachers] = await db.query(`
      SELECT dt.id, dt.user_id, dt.username, dt.email, dt.phone, s.name AS subject_name, dt.education, dt.experience, dt.deleted_at
      FROM deleted_teachers dt
      LEFT JOIN subjects s ON dt.subject_id = s.id
    `);
    res.json(deletedTeachers);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Восстановление удалённого учителя
app.post('/api/teachers/restore/:userId', authenticateToken, adminOnly, async (req, res) => {
  const { userId } = req.params;
  try {
    if (!userId || isNaN(userId)) return res.status(400).json({ error: 'Неверный ID пользователя' });

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Получаем данные удалённого учителя
      const [deletedTeacher] = await connection.query(`
        SELECT * FROM deleted_teachers WHERE user_id = ?
      `, [userId]);

      if (deletedTeacher.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Удалённый учитель не найден' });
      }

      const teacher = deletedTeacher[0];

      // Восстанавливаем пользователя в таблице users
      await connection.query(`
        INSERT INTO users (id, username, email, password, role)
        VALUES (?, ?, ?, ?, 'teacher')
      `, [teacher.user_id, teacher.username, teacher.email, 'RESTORED_PASSWORD', teacher.role]);

      // Восстанавливаем учителя в таблице teachers
      await connection.query(`
        INSERT INTO teachers (user_id, subject_id, phone, education, experience)
        VALUES (?, ?, ?, ?, ?)
      `, [teacher.user_id, teacher.subject_id || null, teacher.phone || null, teacher.education || null, teacher.experience || null]);

      // Удаляем запись из deleted_teachers
      await connection.query('DELETE FROM deleted_teachers WHERE user_id = ?', [userId]);

      await connection.commit();
      res.json({ message: 'Учитель успешно восстановлен' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    res.status(err.sqlMessage ? 400 : 500).json({ error: err.sqlMessage || 'Ошибка восстановления учителя' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  try {
    await initializeDatabase();
    console.log(`Сервер запущен на порту ${PORT}`);
  } catch (err) {
    console.error('Не удалось запустить сервер из-за ошибки базы данных:', err.stack);
    process.exit(1);
  }
});