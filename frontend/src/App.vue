<template>
  <div id="app">
    <!-- Навигационное меню -->
    <nav v-if="user" class="navbar navbar-expand-lg navbar-light shadow-sm">
      <div class="container-fluid">
        

        <!-- Центрированный заголовок и роль -->
        <div class="navbar-brand text-center">
          <span class="title text-success">Детский развивающий центр</span>
          <div class="role text-muted">{{ getRoleDisplay }}</div>
        </div>

        <!-- Кнопка для мобильного меню -->
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

        <!-- Приветствие справа -->
        <div class="collapse navbar-collapse" id="navbarNav">
          <div class="ms-auto d-flex align-items-center">
            <span class="welcome-text text-muted">Добро пожаловать, {{ user?.username || 'Гость' }}!</span>
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
  computed: {
    getRoleDisplay() {
      if (!this.user) return 'Гость';
      switch (this.user.role) {
        case 'parent':
          return 'Родитель';
        case 'teacher':
          return 'Учитель';
        case 'admin':
          return 'Администратор';
        default:
          return 'Гость';
      }
    },
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
  background: linear-gradient(135deg, #d5f7d5, #e8f5e9);
  font-family: 'Comic Sans MS', 'Segoe UI', sans-serif;
}

.navbar {
  background-color: #fff;
  padding: 15px 0;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.navbar-brand {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  width: auto;
}

.title {
  font-size: 1.8rem;
  font-weight: bold;
  color: #2e7d32;
}

.role {
  font-size: 1.1rem; /* Slightly larger for emphasis */
  font-weight: 700; /* Bold font */
  color: #2e7d32; /* Match the green theme for elegance */
  margin-top: 5px;
  font-family: 'Lobster', 'Comic Sans MS', 'Segoe UI', sans-serif; /* Elegant font with fallback */
  text-transform: capitalize; /* Capitalize for a polished look */
  letter-spacing: 0.5px; /* Add slight spacing for readability */
}

.nav-link {
  color: #2e7d32;
  font-size: 1.1rem;
  transition: color 0.3s ease;
  padding: 8px 15px;
}

.nav-link:hover {
  color: #256528;
}

.nav-link.router-link-active {
  color: #1b4b1e;
  font-weight: bold;
}

.welcome-text {
  font-size: 1.4rem;
  color: #2e7d32;
  font-weight: 500;
  margin-left: 20px;
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

/* Стили для toast (если используется vue-toastification) */
.Vue-Toastification__toast--success {
  background-color: #2e7d32 !important;
}

.Vue-Toastification__toast--error {
  background-color: #dc3545 !important;
}

/* Responsive design */
@media (max-width: 992px) {
  .navbar-brand {
    position: static;
    transform: none;
    margin: 0 auto;
    width: 100%;
  }

  .welcome-text {
    font-size: 1.2rem;
    margin-left: 10px;
  }

  .title {
    font-size: 1.6rem;
  }

  .role {
    font-size: 1rem;
  }

  .nav-link {
    padding: 8px 10px;
  }
}

@media (max-width: 768px) {
  .navbar {
    padding: 10px 0;
  }

  .navbar-collapse {
    margin-top: 10px;
  }

  .nav-link {
    font-size: 1rem;
    padding: 8px 0;
  }

  .welcome-text {
    font-size: 1.1rem;
    text-align: center;
    width: 100%;
    margin-top: 10px;
    margin-left: 0;
  }

  .navbar-brand {
    text-align: center;
    width: 100%;
  }
}

@media (max-width: 576px) {
  .title {
    font-size: 1.4rem;
  }

  .role {
    font-size: 0.9rem;
  }
  

  .welcome-text {
    font-size: 1rem;
  }

  .nav-link {
    font-size: 0.9rem;
  }
  
}
</style>