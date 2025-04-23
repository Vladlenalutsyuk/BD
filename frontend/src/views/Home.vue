<template>
    <div class="home-page">
      <div class="content-container card shadow-lg p-5">
        <h1 class="text-center text-success mb-4">Добро пожаловать в Детский Центр</h1>
        <p class="lead text-center">
          Мы — команда педагогов, психологов и наставников, помогающих детям раскрыть свой потенциал.
        </p>
  
        <div class="info mt-4">
          <h3>Что мы предлагаем:</h3>
          <ul class="list-unstyled">
            <li>👨‍🏫 Уроки с квалифицированными учителями</li>
            <li>🎨 Творческие мастер-классы</li>
            <li>🤝 Индивидуальный подход к каждому ребёнку</li>
            <li>📱 Удобная система онлайн-записи и обратной связи</li>
          </ul>
        </div>
  
        <div class="text-center mt-4">
          <router-link to="/register" class="btn btn-dark-green me-2">Зарегистрироваться</router-link>
          <router-link to="/login" class="btn btn-outline-success">Войти</router-link>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'HomePage'
  };
  </script>
  
  <style scoped>
  .home-page {
    min-height: 100vh;
    background-color: #d5f7d5;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: "Comic Sans MS", "Segoe UI", sans-serif;
  }
  
  .content-container {
    max-width: 800px;
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
  