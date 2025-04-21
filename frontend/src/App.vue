<template>
  <div id="app">
    <nav>
      <router-link to="/parent">Родитель</router-link>
      <router-link to="/teacher">Учитель</router-link>
      <router-link to="/admin">Администратор</router-link>
    </nav>
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'App',
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