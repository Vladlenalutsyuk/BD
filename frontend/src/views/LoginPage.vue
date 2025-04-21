<template>
  <div>
    <h1>Вход</h1>
    <form @submit.prevent="loginUser">
      <input v-model="email" type="email" placeholder="Электронная почта" required />
      <input v-model="password" type="password" placeholder="Пароль" required />
      <button type="submit">Войти</button>
    </form>
    <p>Нет аккаунта? <router-link to="/register">Зарегистрируйтесь</router-link></p>
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
    };
  },
  methods: {
    loginUser() {
      const loginData = { email: this.email, password: this.password };
      console.log('Login Data:', loginData); // Логирование данных перед отправкой

      axios.post('http://localhost:3000/api/login', loginData)
        .then(response => {
          console.log('succes login');
          
          localStorage.setItem('user', JSON.stringify(response.data.user));
          alert('Вход успешен!');
          const role = response.data.user.role;
          if (role === 'parent') {
            this.$router.push('/parent');
          } else if (role === 'teacher') {
            this.$router.push('/teacher');
          } else if (role === 'admin') {
            this.$router.push('/admin');
          }
        })
        .catch(error => {
          console.log('catch in loginpage');
          console.error("Ошибка при входе:", error);
          alert('Ошибка при входе. Попробуйте еще раз.');
        });
      }
  },
};
</script>

<style scoped>
/* Добавьте стили по желанию */
</style>