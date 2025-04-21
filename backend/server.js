const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // ваш пользователь MySQL
    password: 'vladlena121512', // ваш пароль MySQL
    database: 'children_center'
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to the database');
});

app.get('/', (req, res) => {
    res.send('API is running');
});

// Регистрация пользователя
app.post('/api/register', async (req, res) => {
    const { username, email, password, role } = req.body; // Убедитесь, что email тоже обрабатывается
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [username, email, hashedPassword, role], (err, results) => {
      if (err) {
        return res.status(500).send('Error registering user');
      }
      res.status(201).send('User registered');
    });
  });

// Вход пользователя
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Поиск пользователя по email
        db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
            if (err || results.length === 0) {
                return res.status(401).send('Invalid credentials'); // Не найден пользователь
            }
            const user = results[0];
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).send('Invalid credentials'); // Неверный пароль
            }
            // Успешный вход
            res.status(200).send({ user });
        });
    } catch (error) {
        console.error('Ошибка при входе:', error);
        res.status(500).send('Ошибка при входе');
    }
});

// Пример маршрута для получения всех занятий
app.get('/classes', (req, res) => {
    db.query('SELECT * FROM classes', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});