<template>
  <div class="login-page">
    <div class="form-container card shadow-lg p-4">
      <h1 class="mb-4 text-center text-success">Вход</h1>
      <form @submit.prevent="loginUser">
        <div class="mb-3">
          <label for="email" class="form-label">Электронная почта</label>
          <input v-model="email" type="email" id="email" class="form-control" required />
        </div>
        <div class="mb-3">
          <label for="password" class="form-label">Пароль</label>
          <input v-model="password" type="password" id="password" class="form-control" required />
        </div>
        <div class="mb-3">
          <label for="role" class="form-label">Роль</label>
          <select v-model="role" id="role" class="form-select" required>
            <option value="" disabled>Выберите роль</option>
            <option value="parent">Родитель</option>
            <option value="teacher">Учитель</option>
            <option value="admin">Администратор</option>
          </select>
        </div>
        <button type="submit" class="btn btn-dark-green w-100 mt-3" :disabled="isLoading">
          {{ isLoading ? 'Вход...' : 'Войти' }}
        </button>
        <p class="mt-3 text-center">
          Нет аккаунта? <router-link to="/register" class="text-success fw-bold">Зарегистрируйтесь</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'LoginPage',
  data() {
    return {
      email: '',
      password: '',
      role: '',
      isLoading: false,
    };
  },
  methods: {
    async loginUser() {
      console.log('Попытка входа...');
      console.log('Данные формы:', { email: this.email, password: this.password, role: this.role });

      if (!this.email || !this.password || !this.role) {
        alert('Пожалуйста, заполните все поля.');
        return;
      }

      this.isLoading = true;

      const loginData = {
        email: this.email,
        password: this.password,
      };

      console.log('Данные для входа:', loginData);

      try {
        const response = await axios.post('http://localhost:3000/api/login', loginData);
        console.log('Ответ от сервера:', response);

        const { user, token } = response.data;
        if (!user) {
          console.error('Пользователь не найден');
          alert('Пользователь не найден.');
          this.isLoading = false;
          return;
        }

        console.log(`Роль пользователя: ${user.role}, выбранная роль: ${this.role}`);
        if (user.role !== this.role) {
          alert('Роль не совпадает с введённой.');
          this.isLoading = false;
          return;
        }

        // Сохраняем user и token отдельно в localStorage
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);

        console.log('Данные сохранены в localStorage:', { user, token });

        // Перенаправляем в зависимости от роли
        if (user.role === 'parent') {
          this.$router.push('/parent');
        } else if (user.role === 'teacher') {
          this.$router.push('/teacher');
        } else if (user.role === 'admin') {
          this.$router.push('/admin');
        }

        this.isLoading = false;
      } catch (error) {
        console.error('Ошибка при входе:', error.response || error.message);
        alert('Ошибка при входе: ' + (error.response?.data || error.message));
        this.isLoading = false;
      }
    },
  },
};
</script>

<style scoped>
.login-page {
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
  transition: background-color 0.3s ease;
}

.btn-dark-green:hover {
  background-color: #256528;
}

.btn-dark-green:active {
  background-color: #1b4b1e;
  transform: scale(0.98);
}

.btn-dark-green:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>