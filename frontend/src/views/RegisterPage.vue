<template>
  <div class="registration-page">
    <div class="form-container card shadow-lg p-4">
      <h1 class="mb-4 text-center text-success">Регистрация</h1>
      <form @submit.prevent="register">
        <div class="mb-3">
          <label for="username" class="form-label">Имя пользователя</label>
          <input v-model="username" type="text" id="username" class="form-control" required />
        </div>
        <div class="mb-3">
          <label for="email" class="form-label">Email</label>
          <input v-model="email" type="email" id="email" class="form-control" required />
        </div>
        <div class="mb-3">
          <label for="password" class="form-label">Пароль</label>
          <input v-model="password" type="password" id="password" class="form-control" required />
        </div>
        <div class="mb-3">
          <label for="role" class="form-label">Роль</label>
          <select v-model="role" id="role" class="form-select" required @change="resetPhone">
            <option value="" disabled>Выберите роль</option>
            <option value="parent">Родитель</option>
            <option value="teacher">Учитель</option>
            <option value="admin">Администратор</option>
          </select>
        </div>
        <div v-if="role === 'parent' || role === 'teacher'" class="mb-3">
          <label for="phone" class="form-label">Телефон</label>
          <input
            v-model="phone"
            type="text"
            id="phone"
            class="form-control"
            required
            placeholder="+1234567890"
            @input="validatePhone"
          />
          <small v-if="phoneError" class="text-danger">{{ phoneError }}</small>
        </div>
        <div v-if="role === 'teacher'" class="mb-3">
          <label for="subject_id" class="form-label">Предмет</label>
          <select v-model="subject_id" id="subject_id" class="form-select" required>
            <option value="" disabled>Выберите предмет</option>
            <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
              {{ subject.name }}
            </option>
          </select>
        </div>
        <button type="submit" class="btn btn-dark-green w-100 mt-3">Зарегистрироваться</button>
        <p class="mt-3 text-center">
          Уже есть аккаунт? <router-link to="/login" class="text-success fw-bold">Войти</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      username: '',
      email: '',
      password: '',
      role: '',
      phone: '',
      subject_id: '',
      subjects: [],
      phoneError: '',
    };
  },
  methods: {
    resetPhone() {
      this.phone = '';
      this.phoneError = '';
      this.subject_id = '';
      if (this.role === 'teacher') {
        this.loadSubjects();
      }
    },
    validatePhone() {
      const phonePattern = /^\+\d{10,15}$/;
      if (!this.phone) {
        this.phoneError = 'Поле "Телефон" обязательно';
      } else if (!phonePattern.test(this.phone)) {
        this.phoneError = 'Введите телефон в формате +1234567890 (10-15 цифр)';
      } else if (this.phone.length > 15) {
        this.phoneError = 'Телефон не должен превышать 15 символов';
      } else {
        this.phoneError = '';
      }
    },
    async loadSubjects() {
      try {
        const response = await axios.get('http://localhost:3000/api/subjects', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        this.subjects = response.data;
      } catch (error) {
        this.showToast('Ошибка загрузки предметов: ' + (error.response?.data || error.message));
      }
    },
    showToast(message, type = 'error') {
      if (this.$toast) {
        if (type === 'error') {
          this.$toast.error(message);
        } else if (type === 'success') {
          this.$toast.success(message);
        }
      } else {
        console[type === 'error' ? 'error' : 'log'](`Toast (${type}): ${message}`);
      }
    },
    async register() {
      // Проверяем обязательные поля
      if (!this.username || !this.email || !this.password || !this.role) {
        this.showToast('Все поля (имя пользователя, email, пароль, роль) обязательны');
        return;
      }

      // Проверяем дополнительные поля в зависимости от роли
      if (this.role === 'parent' || this.role === 'teacher') {
        if (!this.phone) {
          this.showToast('Поле "Телефон" обязательно для родителей и учителей');
          return;
        }
        if (this.phoneError) {
          this.showToast(this.phoneError);
          return;
        }
      }

      if (this.role === 'teacher' && !this.subject_id) {
        this.showToast('Поле "Предмет" обязательно для учителя');
        return;
      }

      // Формируем данные для отправки
      const userData = {
        username: this.username,
        email: this.email,
        password: this.password,
        role: this.role,
      };

      if (this.role === 'parent' || this.role === 'teacher') {
        userData.phone = this.phone;
      }
      if (this.role === 'teacher') {
        userData.subject_id = this.subject_id;
      }

      try {
        await axios.post('http://localhost:3000/api/register', userData);
        this.showToast('Регистрация прошла успешно! Войдите в систему.', 'success');
        this.$router.push('/login');
      } catch (error) {
        console.error('Ошибка при регистрации:', error.response || error);
        this.showToast('Ошибка при регистрации: ' + (error.response?.data || error.message));
      }
    },
  },
};
</script>

<style scoped>
.registration-page {
  min-height: 100vh;
  background-color: #d5f7d5;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Comic Sans MS', 'Segoe UI', sans-serif;
}

.form-container {
  width: 100%;
  max-width: 500px;
  background-color: #fff;
  border-radius: 1rem;
}

.btn-dark-green {
  background-color: #2e7d32;
  color: white;
  border: none;
}

.btn-dark-green:hover {
  background-color: #256528;
}
</style>