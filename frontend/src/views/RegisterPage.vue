<template>
  <div>
    <h1>Регистрация</h1>
    <form @submit.prevent="registerUser">
      <input v-model="username" placeholder="Имя пользователя" required />
      <input v-model="email" type="email" placeholder="Электронная почта" required />
      <input v-model="password" type="password" placeholder="Пароль" required />
      <select v-model="role" required>
        <option value="" disabled>Выберите роль</option>
        <option value="parent">Родитель</option>
        <option value="teacher">Учитель</option>
        <option value="admin">Администратор</option>
      </select>
      <button type="submit">Зарегистрироваться</button>
    </form>
    <p>Уже есть аккаунт? <router-link to="/login">Войдите</router-link></p>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'RegisterPage',
  data() {
    return {
      username: '',
      email: '',
      password: '',
      role: '',
    };
  },
  methods: {
    registerUser() {
      const userData = {
        username: this.username,
        email: this.email,
        password: this.password,
        role: this.role,
      };
      axios.post('http://localhost:3000/api/register', userData) // Измените URL на /api/register
        .then(response => {
          alert('Регистрация успешна!');
          this.$router.push('/login'); // Перенаправление на страницу входа
        })
        .catch(error => {
          console.error("Ошибка при регистрации:", error);
          alert('Ошибка при регистрации. Попробуйте еще раз.');
        });
    },
  },
};
</script>

<style scoped>
/* Добавьте стили по желанию */
</style>