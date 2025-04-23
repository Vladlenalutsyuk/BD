const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;
const JWT_SECRET = 'your-secret-key'; // Замени на безопасный ключ в продакшене

app.use(cors());
app.use(bodyParser.json());

// Подключение к базе данных
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'vladlena121512', // Замени на свой пароль
  database: 'children_center',
});

db.connect((err) => {
  if (err) {
    console.error('❌ Ошибка подключения к базе данных:', err);
    throw err;
  }
  console.log('✅ Подключение к базе прошло успешно!');
});

// Middleware для проверки JWT
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).send('Токен не предоставлен');

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send('Неверный токен');
    req.user = user;
    next();
  });
};

// 📌 Регистрация
app.post('/api/register', (req, res) => {
  const { username, email, password, role, phone, subject_id } = req.body;

  if (!username || !email || !password || !role) {
    return res.status(400).send('Все поля (username, email, password, role) обязательны');
  }
  if (username.length > 50) return res.status(400).send('Имя пользователя не должно превышать 50 символов');
  if (email.length > 100) return res.status(400).send('Email не должен превышать 100 символов');
  if (!['admin', 'parent', 'teacher'].includes(role)) return res.status(400).send('Некорректная роль');

  if ((role === 'parent' || role === 'teacher') && (!phone || phone.length > 15)) {
    return res.status(400).send('Поле "Телефон" обязательно и не должно превышать 15 символов');
  }

  if (role === 'teacher' && !subject_id) {
    return res.status(400).send('Поле "Предмет" обязательно для учителя');
  }

  // Проверяем существование subject_id
  const checkSubject = (callback) => {
    if (role !== 'teacher') return callback();
    db.query('SELECT id FROM subjects WHERE id = ?', [subject_id], (err, results) => {
      if (err) {
        console.error('Ошибка при проверке предмета:', err);
        return res.status(500).send('Ошибка сервера');
      }
      if (results.length === 0) return res.status(400).send('Указанный предмет не существует');
      callback();
    });
  };

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      console.error('Ошибка хеширования пароля:', err);
      return res.status(500).send('Ошибка хеширования пароля');
    }

    db.beginTransaction((err) => {
      if (err) {
        console.error('Ошибка начала транзакции:', err);
        return res.status(500).send('Ошибка сервера');
      }

      db.query(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username, email, hash, role],
        (err, result) => {
          if (err) {
            const errorMsg =
              err.code === 'ER_DUP_ENTRY'
                ? err.message.includes('username')
                  ? 'Имя пользователя уже занято'
                  : 'Email уже зарегистрирован'
                : err.message;
            console.error('Ошибка при добавлении пользователя:', err);
            return db.rollback(() => res.status(500).send(errorMsg));
          }

          const userId = result.insertId;

          const finalize = () =>
            db.commit((err) => {
              if (err) {
                console.error('Ошибка фиксации транзакции:', err);
                return db.rollback(() => res.status(500).send('Ошибка сервера'));
              }
              res.status(201).send(`${role[0].toUpperCase() + role.slice(1)} зарегистрирован`);
            });

          checkSubject(() => {
            if (role === 'teacher') {
              db.query(
                'INSERT INTO teachers (user_id, subject_id, phone) VALUES (?, ?, ?)',
                [userId, subject_id, phone],
                (err) =>
                  err
                    ? db.rollback(() => {
                        console.error('Ошибка добавления учителя:', err);
                        res.status(500).send('Ошибка добавления учителя');
                      })
                    : finalize()
              );
            } else if (role === 'parent') {
              db.query(
                'INSERT INTO parents (user_id, phone) VALUES (?, ?)',
                [userId, phone],
                (err) =>
                  err
                    ? db.rollback(() => {
                        console.error('Ошибка добавления родителя:', err);
                        res.status(500).send('Ошибка добавления родителя');
                      })
                    : finalize()
              );
            } else {
              finalize();
            }
          });
        }
      );
    });
  });
});

// 🔐 Вход
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) {
      console.error('Ошибка при поиске пользователя:', err);
      return res.status(500).send('Ошибка сервера');
    }
    if (results.length === 0) return res.status(401).send('Пользователь не найден');

    const user = results[0];
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error('Ошибка сравнения пароля:', err);
        return res.status(500).send('Ошибка сравнения пароля');
      }
      if (!isMatch) return res.status(401).send('Неверный пароль');

      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
      res.json({ user: { id: user.id, email: user.email, role: user.role, username: user.username }, token });
    });
  });
});

// 🧑‍🏫 Список предметов (без авторизации для регистрации)
app.get('/api/subjects', (req, res) => {
  db.query('SELECT * FROM subjects', (err, results) => {
    if (err) {
      console.error('Ошибка при получении предметов:', err);
      return res.status(500).send('Ошибка при получении предметов');
    }
    res.json(results);
  });
});

// 📍 Список кабинетов
app.get('/api/rooms', authenticateToken, (req, res) => {
  db.query('SELECT * FROM rooms', (err, results) => {
    if (err) {
      console.error('Ошибка при получении кабинетов:', err);
      return res.status(500).send('Ошибка при получении кабинетов');
    }
    res.json(results);
  });
});

// 📥 Список преподавателей с их предметами
app.get('/api/teachers', authenticateToken, (req, res) => {
  db.query(
    `
    SELECT teachers.id, users.username AS name, subjects.name AS subject
    FROM teachers
    JOIN users ON teachers.user_id = users.id
    JOIN subjects ON teachers.subject_id = subjects.id
    `,
    (err, results) => {
      if (err) {
        console.error('Ошибка при получении преподавателей:', err);
        return res.status(500).send('Ошибка при получении преподавателей');
      }
      res.json(results);
    }
  );
});

// 📅 Список всех занятий (для админа и учителей)
app.get('/api/classes', authenticateToken, (req, res) => {
  if (req.user.role === 'teacher') {
    const userId = req.user.id;
    db.query('SELECT id FROM teachers WHERE user_id = ?', [userId], (err, teacherResults) => {
      if (err) {
        console.error('Ошибка при поиске учителя:', err);
        return res.status(500).send('Ошибка сервера');
      }
      if (teacherResults.length === 0) return res.status(403).send('Преподаватель не найден');

      const teacherId = teacherResults[0].id;
      db.query(
        `
        SELECT classes.id, subjects.name AS subject, classes.schedule, rooms.name AS room, classes.price
        FROM classes
        JOIN subjects ON classes.subject_id = subjects.id
        LEFT JOIN rooms ON classes.room_id = rooms.id
        WHERE teacher_id = ?
        `,
        [teacherId],
        (err, classResults) => {
          if (err) {
            console.error('Ошибка при получении занятий:', err);
            return res.status(500).send('Ошибка при получении занятий');
          }
          res.json(classResults);
        }
      );
    });
  } else if (req.user.role === 'admin' || req.user.role === 'parent') {
    db.query(
      `
      SELECT classes.id, subjects.name AS subject, classes.schedule, rooms.name AS room, classes.price, users.username AS teacher_name
      FROM classes
      JOIN subjects ON classes.subject_id = subjects.id
      LEFT JOIN rooms ON classes.room_id = rooms.id
      LEFT JOIN teachers ON classes.teacher_id = teachers.id
      LEFT JOIN users ON teachers.user_id = users.id
      `,
      (err, classResults) => {
        if (err) {
          console.error('Ошибка при получении занятий:', err);
          return res.status(500).send('Ошибка при получении занятий');
        }
        res.json(classResults);
      }
    );
  } else {
    return res.status(403).send('Доступ запрещён');
  }
});

// 📌 Добавление занятия (для админа)
app.post('/api/classes', authenticateToken, (req, res) => {
  const { subject_id, schedule, teacher_id, room_id, price } = req.body;

  if (req.user.role !== 'admin') {
    return res.status(403).send('Доступ запрещён');
  }

  if (!subject_id || !schedule || !teacher_id) {
    return res.status(400).send('Поля subject_id, schedule и teacher_id обязательны');
  }

  db.query(
    'INSERT INTO classes (subject_id, schedule, teacher_id, room_id, price) VALUES (?, ?, ?, ?, ?)',
    [subject_id, schedule, teacher_id, room_id, price || 0.00],
    (err) => {
      if (err) {
        console.error('Ошибка при добавлении занятия:', err);
        return res.status(500).send('Ошибка при добавлении занятия');
      }
      res.status(201).send('Занятие добавлено');
    }
  );
});

// 🗑️ Удаление занятия
app.delete('/api/classes/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).send('Доступ запрещён');
  }

  const classId = req.params.id;
  db.query('DELETE FROM classes WHERE id = ?', [classId], (err) => {
    if (err) {
      console.error('Ошибка при удалении занятия:', err);
      return res.status(500).send('Ошибка при удалении занятия');
    }
    res.status(200).send('Занятие удалено');
  });
});

// 📌 Получение списка детей родителя
app.get('/api/children', authenticateToken, (req, res) => {
  if (req.user.role !== 'parent') {
    return res.status(403).send('Доступ запрещён');
  }

  db.query('SELECT id FROM parents WHERE user_id = ?', [req.user.id], (err, parentResults) => {
    if (err) {
      console.error('Ошибка при поиске родителя:', err);
      return res.status(500).send('Ошибка сервера');
    }
    if (parentResults.length === 0) return res.status(403).send('Родитель не найден');

    const parentId = parentResults[0].id;
    db.query('SELECT id, name, birth_date FROM children WHERE parent_id = ?', [parentId], (err, results) => {
      if (err) {
        console.error('Ошибка при получении детей:', err);
        return res.status(500).send('Ошибка при получении детей');
      }
      res.json(results);
    });
  });
});

// 📌 Добавление ребенка (для родителя)
app.post('/api/children', authenticateToken, (req, res) => {
  if (req.user.role !== 'parent') {
    return res.status(403).send('Доступ запрещён');
  }

  const { name, birth_date } = req.body;
  if (!name || !birth_date) {
    return res.status(400).send('Поля name и birth_date обязательны');
  }
  if (name.length > 50) {
    return res.status(400).send('Имя не должно превышать 50 символов');
  }

  db.query('SELECT id FROM parents WHERE user_id = ?', [req.user.id], (err, parentResults) => {
    if (err) {
      console.error('Ошибка при поиске родителя:', err);
      return res.status(500).send('Ошибка сервера');
    }
    if (parentResults.length === 0) return res.status(403).send('Родитель не найден');

    const parentId = parentResults[0].id;
    db.query(
      'INSERT INTO children (name, birth_date, parent_id) VALUES (?, ?, ?)',
      [name, birth_date, parentId],
      (err) => {
        if (err) {
          console.error('Ошибка при добавлении ребенка:', err);
          return res.status(500).send('Ошибка при добавлении ребенка');
        }
        res.status(201).send('Ребенок добавлен');
      }
    );
  });
});

// 📅 Расписание ребенка (для родителя)
app.get('/api/child-schedule', authenticateToken, (req, res) => {
  if (req.user.role !== 'parent') {
    return res.status(403).send('Доступ запрещён');
  }

  db.query('SELECT id FROM parents WHERE user_id = ?', [req.user.id], (err, parentResults) => {
    if (err) {
      console.error('Ошибка при поиске родителя:', err);
      return res.status(500).send('Ошибка сервера');
    }
    if (parentResults.length === 0) return res.status(403).send('Родитель не найден');

    const parentId = parentResults[0].id;
    db.query(
      `
      SELECT 
        children.id AS child_id,
        children.name AS child_name,
        subjects.name AS subject,
        classes.schedule,
        rooms.name AS room,
        users.username AS teacher
      FROM enrollments
      JOIN children ON enrollments.child_id = children.id
      JOIN classes ON enrollments.class_id = classes.id
      JOIN subjects ON classes.subject_id = subjects.id
      LEFT JOIN rooms ON classes.room_id = rooms.id
      LEFT JOIN teachers ON classes.teacher_id = teachers.id
      LEFT JOIN users ON teachers.user_id = users.id
      WHERE children.parent_id = ?
      `,
      [parentId],
      (err, results) => {
        if (err) {
          console.error('Ошибка при получении расписания:', err);
          return res.status(500).send('Ошибка при получении расписания');
        }
        res.json(results);
      }
    );
  });
});

// 📌 Запись ребенка на занятие
app.post('/api/enrollments', authenticateToken, (req, res) => {
  if (req.user.role !== 'parent') {
    return res.status(403).send('Доступ запрещён');
  }

  const { child_id, class_id } = req.body;
  if (!child_id || !class_id) {
    return res.status(400).send('Поля child_id и class_id обязательны');
  }

  // Проверяем, что ребенок принадлежит родителю
  db.query('SELECT id FROM parents WHERE user_id = ?', [req.user.id], (err, parentResults) => {
    if (err) {
      console.error('Ошибка при поиске родителя:', err);
      return res.status(500).send('Ошибка сервера');
    }
    if (parentResults.length === 0) return res.status(403).send('Родитель не найден');

    const parentId = parentResults[0].id;
    db.query(
      'SELECT id FROM children WHERE id = ? AND parent_id = ?',
      [child_id, parentId],
      (err, childResults) => {
        if (err) {
          console.error('Ошибка при проверке ребенка:', err);
          return res.status(500).send('Ошибка сервера');
        }
        if (childResults.length === 0) return res.status(403).send('Ребенок не найден');

        // Проверяем существование занятия
        db.query('SELECT id FROM classes WHERE id = ?', [class_id], (err, classResults) => {
          if (err) {
            console.error('Ошибка при проверке занятия:', err);
            return res.status(500).send('Ошибка сервера');
          }
          if (classResults.length === 0) return res.status(404).send('Занятие не найдено');

          // Проверяем, не записан ли ребенок уже на это занятие
          db.query(
            'SELECT id FROM enrollments WHERE child_id = ? AND class_id = ?',
            [child_id, class_id],
            (err, enrollmentResults) => {
              if (err) {
                console.error('Ошибка при проверке записи:', err);
                return res.status(500).send('Ошибка сервера');
              }
              if (enrollmentResults.length > 0) {
                return res.status(400).send('Ребенок уже записан на это занятие');
              }

              // Добавляем запись
              db.query(
                'INSERT INTO enrollments (child_id, class_id) VALUES (?, ?)',
                [child_id, class_id],
                (err) => {
                  if (err) {
                    console.error('Ошибка при записи на занятие:', err);
                    return res.status(500).send('Ошибка при записи на занятие');
                  }
                  res.status(201).send('Ребенок записан на занятие');
                }
              );
            }
          );
        });
      }
    );
  });
});

// 📌 Добавление предмета (для админа)
app.post('/api/subjects', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Доступ запрещён');
  const { name } = req.body;
  if (!name || name.length > 100) {
    return res.status(400).send('Название предмета обязательно и не должно превышать 100 символов');
  }
  db.query('INSERT INTO subjects (name) VALUES (?)', [name], (err) => {
    if (err) {
      console.error('Ошибка при добавлении предмета:', err);
      return res.status(500).send('Ошибка при добавления предмета');
    }
    res.status(201).send('Предмет добавлен');
  });
});

// 📊 Статистика учителей (для админа)
app.get('/api/statistics/teachers', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).send('Доступ запрещён');
  }

  db.query(
    `
    SELECT 
      teacher_name,
      subject_name,
      class_count,
      total_students,
      total_revenue
    FROM teacher_statistics
    `,
    (err, results) => {
      if (err) {
        console.error('Ошибка при получении статистики учителей:', err);
        return res.status(500).send('Ошибка при получении статистики учителей');
      }
      res.json(results);
    }
  );
});

// 📊 Статистика детей (для родителя)
app.get('/api/statistics/children', authenticateToken, (req, res) => {
  if (req.user.role !== 'parent') {
    return res.status(403).send('Доступ запрещён');
  }

  db.query('SELECT id FROM parents WHERE user_id = ?', [req.user.id], (err, parentResults) => {
    if (err) {
      console.error('Ошибка при поиске родителя:', err);
      return res.status(500).send('Ошибка сервера');
    }
    if (parentResults.length === 0) return res.status(403).send('Родитель не найден');

    const parentId = parentResults[0].id;
    db.query(
      `
      SELECT 
        child_name,
        class_count,
        total_cost
      FROM child_statistics
      WHERE parent_id = ?
      `,
      [parentId],
      (err, results) => {
        if (err) {
          console.error('Ошибка при получении статистики детей:', err);
          return res.status(500).send('Ошибка при получении статистики детей');
        }
        res.json(results);
      }
    );
  });
});

// 📋 Список всех учителей (для админа)
app.get('/api/users/teachers', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).send('Доступ запрещён');
  }

  db.query(
    `
    SELECT 
      users.id,
      users.username,
      users.email,
      subjects.name AS subject,
      teachers.phone
    FROM users
    JOIN teachers ON users.id = teachers.user_id
    JOIN subjects ON teachers.subject_id = subjects.id
    WHERE users.role = 'teacher'
    `,
    (err, results) => {
      if (err) {
        console.error('Ошибка при получении списка учителей:', err);
        return res.status(500).send('Ошибка при получении списка учителей');
      }
      res.json(results);
    }
  );
});

// 🚀 Запуск сервера
app.listen(port, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${port}`);
});