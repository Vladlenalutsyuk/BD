<template>
  <div id="app">
    <!-- Навигационное меню -->
    <nav v-if="user" class="navbar navbar-expand-lg navbar-light shadow-sm">
      <div class="container">
        <span class="navbar-brand text-success">Детский центр</span>
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
            <li class="nav-item" v-if="user?.role === 'parent'">
              <router-link class="nav-link" to="/parent">Родитель</router-link>
            </li>
            <li class="nav-item" v-if="user?.role === 'teacher'">
              <router-link class="nav-link" to="/teacher">Учитель</router-link>
            </li>
            <li class="nav-item" v-if="user?.role === 'admin'">
              <router-link class="nav-link" to="/admin">Администратор</router-link>
            </li>
          </ul>
          <div class="d-flex align-items-center">
            <span class="me-3 text-muted">Привет, {{ user?.username || 'Гость' }}!</span>
            <button @click="logout" class="btn btn-dark-green">Выйти</button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Основное содержимое -->
    <div class="content">
      <router-view @user-updated="updateUser"></router-view>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      user: null,
    };
  },
  mounted() {
    this.updateUser();
    // Слушаем изменения маршрута, чтобы обновлять пользователя
    this.$router.afterEach(() => {
      this.updateUser();
    });
  },
  methods: {
    updateUser() {
      this.user = JSON.parse(localStorage.getItem('user')) || null;
    },
    logout() {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      this.updateUser();
      this.$router.push('/login');
    },
  },
};
</script>

<style scoped>
#app {
  min-height: 100vh;
  background-color: #d5f7d5;
  font-family: 'Comic Sans MS', 'Segoe UI', sans-serif;
}

.navbar {
  background-color: #fff;
  padding: 15px 0;
  border-bottom: 1px solid #e0e0e0;
}

.navbar-brand {
  font-size: 1.5rem;
  font-weight: bold;
}

.nav-link {
  color: #2e7d32;
  font-size: 1.1rem;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: #256528;
}

.nav-link.router-link-active {
  color: #1b4b1e;
  font-weight: bold;
}

.btn-dark-green {
  background-color: #2e7d32;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 5px;
  transition: background-color 0.3s ease;
}

.btn-dark-green:hover {
  background-color: #256528;
}

.btn-dark-green:active {
  background-color: #1b4b1e;
  transform: scale(0.98);
}

.content {
  padding: 20px;
}
</style>

<style>
/* Стили для toast (если используется vue-toastification) */
.Vue-Toastification__toast--success {
  background-color: #2e7d32 !important;
}

.Vue-Toastification__toast--error {
  background-color: #dc3545 !important;
}
</style>