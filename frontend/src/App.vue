<template>
  <div id="app">
    <nav v-if="user">
      <router-link v-if="user.role === 'parent'" to="/parent">Родитель</router-link>
      <router-link v-if="user.role === 'teacher'" to="/teacher">Учитель</router-link>
      <router-link v-if="user.role === 'admin'" to="/admin">Администратор</router-link>
      <button @click="logout">Выйти</button>
    </nav>
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'App',
  computed: {
    user() {
      return JSON.parse(localStorage.getItem('user')) || null;
    },
  },
  methods: {
    logout() {
      localStorage.removeItem('user');
      this.$router.push('/login');
    },
  },
};
</script>

<style>
nav {
  margin-bottom: 20px;
}
nav a {
  margin-right: 15px;
}
</style>