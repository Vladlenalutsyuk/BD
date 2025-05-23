<template>
  <div class="home-page">
    <!-- Ошибка -->
    <div v-if="error" class="alert alert-danger text-center">{{ error }}</div>

    <!-- Шапка -->
    <header class="header">
      <div class="container">
        <div class="d-flex justify-content-between align-items-center py-3">
          <h2 class="text-success mb-0">Детский Центр</h2>
          <div>
            <router-link to="/register" class="btn btn-dark-green me-2">Регистрация</router-link>
            <router-link to="/login" class="btn btn-outline-success">Вход</router-link>
          </div>
        </div>
      </div>
    </header>

    <!-- Баннер -->
    <section class="hero-section text-center">
      <div class="hero-overlay">
        <h1 class="display-4 text-white mb-4 animate__animated animate__fadeInDown">Добро пожаловать в Детский Центр!</h1>
        <p class="lead text-white mb-5 animate__animated animate__fadeInUp">
          Мы помогаем детям раскрыть свой потенциал с помощью творчества, обучения и индивидуального подхода.
        </p>
        <router-link to="/register" class="btn btn-dark-green btn-lg animate__animated animate__pulse animate__infinite">
          Присоединяйтесь к нам!
        </router-link>
      </div>
    </section>

    <!-- Основной контент -->
    <div class="content-container">
      <!-- Информация о центре -->
      <section class="info-section container py-5">
        <h3 class="text-center mb-4 text-success">О нашем центре</h3>
        <div class="row">
          <div class="col-md-6 mb-4 animate__animated animate__fadeInLeft">
            <div class="card shadow-lg p-4">
              <h4>Наша миссия</h4>
              <p>
                Наша миссия — раскрывать таланты каждого ребёнка, помогая им расти уверенными, любознательными и счастливыми. Наши программы разработаны с учётом возрастных особенностей и интересов детей.
              </p>
            </div>
          </div>
          <div class="col-md-6 mb-4 animate__animated animate__fadeInRight">
            <div class="card shadow-lg p-4">
              <h4>Что мы предлагаем</h4>
              <ul class="list-unstyled">
                <li>🏫 Занятия с квалифицированными преподавателями</li>
                <li>🎨 Творческие мастер-классы</li>
                <li>👪 Индивидуальный подход к каждому ребёнку</li>
                <li>📱 Удобная система онлайн-записи и обратной связи</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- Информация об учителях -->
      <section class="teachers-section container py-5">
        <h3 class="text-center mb-4 text-success">Наши преподаватели</h3>
        <div class="row">
          <div v-for="teacher in teachers" :key="teacher.id" class="col-md-4 mb-4 animate__animated animate__zoomIn">
            <div class="card shadow-lg p-4 text-center">
              <h4>{{ teacher.username }}</h4>
              <p><strong>Предмет:</strong> {{ teacher.subject || 'Не указан' }}</p>
              <p><strong>Образование:</strong> {{ teacher.education || 'Не указано' }}</p>
              <p><strong>Опыт:</strong> {{ teacher.experience ? teacher.experience + ' лет' : 'Не указан' }}</p>
            </div>
          </div>
          <div v-if="!teachers.length" class="text-center text-muted">
            Информация об учителях временно недоступна.
          </div>
        </div>
      </section>

      <!-- Карусель отзывов -->
      <section class="reviews-section container py-5">
        <h3 class="text-center mb-4 text-success">Отзывы родителей</h3>
        <div v-if="loadingReviews" class="text-center">
          <p>Загрузка отзывов...</p>
        </div>
        <div v-else id="reviewsCarousel" class="carousel slide" data-bs-ride="carousel" data-bs-interval="5000">
          <div class="carousel-inner">
            <div v-for="(review, index) in reviews" :key="review.id" class="carousel-item" :class="{ active: index === 0 }">
              <div class="card shadow-sm p-4 text-center">
                <p class="review-text">"{{ review.content }}"</p>
                <p class="review-author">— {{ review.parent_name || 'Аноним' }}, {{ formatDate(review.created_at) }}</p>
              </div>
            </div>
            <div v-if="!reviews.length" class="carousel-item active">
              <div class="card shadow-sm p-4 text-center">
                <p class="review-text">Отзывы временно отсутствуют.</p>
              </div>
            </div>
          </div>
          <button class="carousel-control-prev" type="button" data-bs-target="#reviewsCarousel" data-bs-slide="prev">
            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Предыдущий</span>
          </button>
          <button class="carousel-control-next" type="button" data-bs-target="#reviewsCarousel" data-bs-slide="next">
            <span class="carousel-control-next-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Следующий</span>
          </button>
        </div>
        <p class="text-center mt-4">
          Хотите поделиться своим мнением? <router-link to="/login" class="text-success fw-bold">Войдите</router-link>, чтобы оставить отзыв!
        </p>
      </section>

      <!-- Ближайшие занятия -->
      
    </div>

    <!-- Футер -->
    <footer class="footer py-4 text-center">
      <p class="mb-0">© 2025 Детский Центр. Все права защищены.</p>
    </footer>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'HomePage',
  data() {
    return {
      classes: [],
      subjects: [],
      selectedSubject: '',
      reviews: [],
      teachers: [],
      error: null,
      loadingReviews: false,
    };
  },
  computed: {
    uniqueSubjects() {
      return this.subjects;
    },
    filteredClasses() {
      let filtered = this.classes;
      if (this.selectedSubject) {
        filtered = filtered.filter(cls => cls.subject_id === parseInt(this.selectedSubject));
      }
      const now = new Date();
      return filtered
        .filter(cls => new Date(cls.schedule) > now)
        .sort((a, b) => new Date(a.schedule) - new Date(b.schedule));
    },
  },
  methods: {
    async fetchSubjects() {
      try {
        const response = await axios.get('http://localhost:3000/api/subjects/public');
        this.subjects = response.data;
      } catch (error) {
        console.error('Ошибка при загрузке предметов:', error);
        this.error = 'Не удалось загрузить предметы';
      }
    },
    async fetchClasses() {
      try {
        const response = await axios.get('http://localhost:3000/api/classes/public');
        this.classes = response.data;
      } catch (error) {
        console.error('Ошибка при загрузке занятий:', error);
        this.error = 'Не удалось загрузить занятия';
      }
    },
    async fetchReviews() {
      this.loadingReviews = true;
      try {
        const response = await axios.get('http://localhost:3000/api/reviews');
        console.log('Reviews response:', response.data);
        this.reviews = response.data;
      } catch (error) {
        console.error('Ошибка при загрузке отзывов:', error);
        this.error = 'Не удалось загрузить отзывы';
      } finally {
        this.loadingReviews = false;
      }
    },
    async fetchTeachers() {
      try {
        const response = await axios.get('http://localhost:3000/api/users/teachers/public');
        this.teachers = response.data;
      } catch (error) {
        console.error('Ошибка при загрузке учителей:', error);
        this.error = 'Не удалось загрузить информацию об учителях';
      }
    },
    formatDate(date) {
      return new Date(date).toLocaleString('ru-RU');
    },
  },
  mounted() {
    this.fetchSubjects();
    this.fetchClasses();
    this.fetchReviews();
    this.fetchTeachers();
  },
};
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background-color: #f0f8f0;
  font-family: 'Comic Sans MS', 'Segoe UI', sans-serif;
}

.header {
  background-color: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.hero-section {
  background-image: url('https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80');
  background-size: cover;
  background-position: center;
  height: 600px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-overlay {
  background-color: rgba(0, 0, 0, 0.5);
  padding: 40px;
  border-radius: 15px;
}

.hero-section h1 {
  font-size: 3.5rem;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.hero-section p {
  font-size: 1.5rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

.content-container {
  padding: 0;
}

.alert-danger {
  font-size: 1.8rem; /* Увеличен размер шрифта для сообщения об ошибке */
  padding: 20px;
}

/* Увеличение размера шрифта для заголовков секций */
.info-section h3,
.teachers-section h3,
.reviews-section h3 {
  font-size: 2.5rem; /* Увеличен размер шрифта для заголовков */
  font-weight: bold;
}

/* Стили для секции "О нашем центре" */
.info-section .card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 3px solid #2e7d32; /* Увеличена толщина рамки */
  border-radius: 15px;
  background-color: #fff;
  padding: 20px; /* Увеличен внутренний отступ для контента */
}

.info-section .card:hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
}

.info-section .card h4 {
  font-size: 2rem; /* Увеличен размер шрифта для подзаголовков */
  margin-bottom: 15px;
}

.info-section .card p {
  font-size: 1.6rem; /* Увеличен размер шрифта для текста "Наша миссия" */
  line-height: 1.5;
}

.info-section .card ul {
  font-size: 1.6rem; /* Увеличен размер шрифта для списка "Что мы предлагаем" */
  line-height: 2;
}

.info-section .card ul li {
  margin-bottom: 10px;
}

/* Стили для других секций */
.teachers-section .card,
.reviews-section .card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: none;
  border-radius: 15px;
  background-color: #fff;
}

.teachers-section .card:hover,
.reviews-section .card:hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
}

.btn-dark-green {
  background-color: #2e7d32;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 25px;
  font-size: 1.2rem;
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.btn-dark-green:hover {
  background-color: #256528;
  transform: scale(1.05);
}

.reviews-section .carousel-item {
  transition: opacity 0.5s ease-in-out;
}

.review-text {
  font-style: italic;
  color: #555;
  font-size: 1.1rem;
}

.review-author {
  font-weight: bold;
  color: #2e7d32;
}

.carousel-control-prev,
.carousel-control-next {
  width: 5%;
}

.carousel-control-prev-icon,
.carousel-control-next-icon {
  background-color: #2e7d32;
  border-radius: 50%;
  padding: 20px;
}

.table {
  background: #f8f9fa;
  border-radius: 15px;
  overflow: hidden;
}

.table-striped tbody tr:nth-of-type(odd) {
  background-color: rgba(0, 0, 0, 0.05);
}

.table thead {
  background-color: #2e7d32;
  color: white;
}

.badge {
  font-size: 0.9em;
  padding: 0.5em 1em;
  border-radius: 20px;
}

.footer {
  background-color: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  color: #555;
}
</style>