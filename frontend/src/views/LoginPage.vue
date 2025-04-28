<template>
  <div class="login-page">
    <div class="form-container card shadow-lg p-4">
      <h1 class="mb-4 text-center text-success">Вход</h1>
      <form @submit.prevent="loginUser">
        <div class="mb-3">
          <label for="email" class="form-label">Электронная почта</label>
          <input
            v-model.trim="email"
            type="email"
            id="email"
            class="form-control"
            required
            placeholder="example@domain.com"
          />
        </div>
        <div class="mb-3">
          <label for="password" class="form-label">Пароль</label>
          <input
            v-model="password"
            type="password"
            id="password"
            class="form-control"
            required
            placeholder="Введите пароль"
          />
        </div>
        <button
          type="submit"
          class="btn btn-dark-green w-100 mt-3"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Вход...' : 'Войти' }}
        </button>
        <p class="mt-3 text-center">
          Нет аккаунта? <router-link to="/register" class="text-success fw-bold">Зарегистрируйтесь</router-link>
        </p>
        <p class="mt-3 text-center">
          <router-link to="/" class="btn btn-outline-success">Вернуться на главную страницу</router-link>
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
      isLoading: false,
    };
  },
  methods: {
    async loginUser() {
      console.log('Попытка входа...');
      console.log('Данные формы:', { email: this.email, password: this.password });

      // Валидация
      if (!this.email || !this.password) {
        this.showToast('Пожалуйста, заполните все поля.', 'error');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.email)) {
        this.showToast('Введите корректный email.', 'error');
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
        console.log('Ответ от сервера:', response.data);
        const { user, token } = response.data;

        if (!user || !token) {
          console.error('Неверный формат ответа сервера');
          this.showToast('Ошибка входа: неверный ответ сервера.', 'error');
          this.isLoading = false;
          return;
        }

        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        console.log('Данные сохранены в localStorage:', { user, token });

        // Перенаправление по роли
        if (user.role === 'parent') {
          this.$router.push('/parent');
        } else if (user.role === 'teacher') {
          this.$router.push('/teacher');
        } else if (user.role === 'admin') {
          this.$router.push('/admin');
        } else {
          this.showToast('Неизвестная роль пользователя.', 'error');
        }
        this.isLoading = false;
      } catch (error) {
        console.error('Ошибка при входе:', error.response?.data || error.message);
        const errorMessage =
          error.response?.data?.error || 'Ошибка входа. Попробуйте снова.';
        this.showToast(errorMessage, 'error');
        this.isLoading = false;
      }
    },
    showToast(message, type = 'error') {
      if (this.$toast) {
        this.$toast[type](message, { timeout: 5000 });
      } else {
        console[type === 'error' ? 'error' : 'log'](`Toast (${type}): ${message}`);
        alert(message); // Fallback на alert, если vue-toastification не настроен
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