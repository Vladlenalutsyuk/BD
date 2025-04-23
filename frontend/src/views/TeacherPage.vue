<template>
  <div class="teacher-page">
    <div class="header">
      <p>Добро пожаловать, {{ user?.username }}!</p>
      <button @click="logout" class="btn btn-dark-green logout-btn">Выйти</button>
    </div>

    <div v-if="classes.length > 0">
      <h2>Ваше расписание:</h2>
      <table>
        <thead>
          <tr>
            <th>Занятие</th>
            <th>Время</th>
            <th>Кабинет</th>
            <th>Цена</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(classItem, index) in classes" :key="index">
            <td>{{ classItem.subject }}</td>
            <td>{{ new Date(classItem.schedule).toLocaleString() }}</td>
            <td>{{ classItem.room || 'Не указан' }}</td>
            <td>{{ classItem.price }} ₽</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else>
      <p>Расписание не найдено.</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'TeacherPage',
  data() {
    return {
      user: null,
      classes: [],
    };
  },
  mounted() {
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!this.user || this.user.role !== 'teacher') {
      this.$router.push('/login');
    } else {
      this.fetchClasses();
    }
  },
  methods: {
    async fetchClasses() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.$router.push('/login');
          return;
        }
        const response = await axios.get('http://localhost:3000/api/classes', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        this.classes = response.data;
      } catch (error) {
        console.error('Ошибка при получении расписания:', error);
        this.$toast?.error('Ошибка при получении расписания: ' + (error.response?.data || error.message));
      }
    },
    logout() {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      this.$router.push('/login');
    },
  },
};
</script>

<style scoped>
.teacher-page {
  min-height: 100vh;
  background-color: #d5f7d5;
  font-family: 'Comic Sans MS', 'Segoe UI', sans-serif;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.logout-btn {
  background-color: #2e7d32;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.logout-btn:hover {
  background-color: #256528;
}

.logout-btn:active {
  background-color: #1b4b1e;
  transform: scale(0.98);
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th,
td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
}
</style>