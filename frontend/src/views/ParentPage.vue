<template>
  <div class="parent-page d-flex">
    <!-- Боковое меню -->
    <div class="sidebar shadow-lg">
      <h3 class="text-center text-success mb-4">Меню</h3>
      <ul class="nav flex-column">
        <li class="nav-item">
          <a class="nav-link" :class="{ active: activeTab === 'centerInfo' }" @click="activeTab = 'centerInfo'"><i class="fas fa-info-circle me-2"></i> Информация о центре</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" :class="{ active: activeTab === 'personalAccount' }" @click="activeTab = 'personalAccount'"><i class="fas fa-user me-2"></i> Личный кабинет</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" :class="{ active: activeTab === 'childProfile' }" @click="activeTab = 'childProfile'"><i class="fas fa-child me-2"></i> Профиль ребёнка</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" :class="{ active: activeTab === 'enroll' }" @click="activeTab = 'enroll'"><i class="fas fa-calendar-check me-2"></i> Запись на занятия</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" :class="{ active: activeTab === 'schedule' }" @click="activeTab = 'schedule'"><i class="fas fa-calendar-alt me-2"></i> Расписание</a>
        </li>
        <li class="nav-item">
          <a class="nav-link text-danger" @click="logout"><i class="fas fa-sign-out-alt me-2"></i> Выйти</a>
        </li>
      </ul>
    </div>

    <!-- Основной контент -->
    <div class="main-content p-4 flex-grow-1">
      <h1 class="mb-4 text-center text-success">Панель родителя</h1>

      <!-- Вкладка: Информация о центре -->
      <div v-if="activeTab === 'centerInfo'">
        <h2>Информация о центре</h2>
        <div class="card shadow-lg p-4 mb-4">
          <h3>О нашем центре</h3>
          <p>
            Добро пожаловать в наш детский образовательный центр! Мы предлагаем разнообразные занятия для детей от 3 до 16 лет, включая математику, рисование и музыку. Наши профессиональные преподаватели помогут вашему ребёнку раскрыть свой потенциал.
          </p>
          <h4>Контакты</h4>
          <p><strong>Адрес:</strong> ул. Примерная, д. 123, г. Москва</p>
          <p><strong>Телефон:</strong> +7 (123) 456-78-90</p>
          <p><strong>Email:</strong> info@childrencenter.ru</p>
        </div>
        <div class="card shadow-lg p-4">
          <h3>Отзывы родителей</h3>
          <div v-for="review in reviews" :key="review.id" class="review mb-3 p-3 border rounded">
            <p><strong>{{ review.parent_name }}:</strong> {{ review.content }}</p>
            <small>{{ formatDate(review.created_at) }}</small>
          </div>
          <form @submit.prevent="submitReview" class="mt-4">
            <div class="mb-3">
              <label for="newReview" class="form-label">Оставить отзыв</label>
              <textarea v-model="newReview" id="newReview" class="form-control" rows="4" placeholder="Ваш отзыв" required></textarea>
            </div>
            <button type="submit" class="btn btn-dark-green">Отправить</button>
          </form>
        </div>
      </div>

      <!-- Вкладка: Личный кабинет -->
      <div v-if="activeTab === 'personalAccount'">
        <h2>Личный кабинет</h2>
        <div class="card shadow-lg p-4">
          <h3>Ваши данные</h3>
          <p><strong>Имя пользователя:</strong> {{ parentProfile.username }}</p>
          <p><strong>Email:</strong> {{ parentProfile.email }}</p>
          <p><strong>Телефон:</strong> {{ parentProfile.phone }}</p>

          <!-- Кнопка "Редактировать данные" -->
          <button v-if="!isEditingProfile" @click="startEditingProfile" class="btn btn-dark-green mt-3">
            <i class="fas fa-edit me-2"></i> Редактировать данные
          </button>

          <!-- Форма редактирования профиля -->
          <div v-if="isEditingProfile" class="mt-4">
            <h4>Редактировать профиль</h4>
            <form @submit.prevent="updateProfile" class="mt-3">
              <div class="mb-3">
                <label for="username" class="form-label">Имя пользователя</label>
                <input v-model="editProfile.username" type="text" id="username" class="form-control" placeholder="Новое имя пользователя" required />
              </div>
              <div class="mb-3">
                <label for="email" class="form-label">Email</label>
                <input v-model="editProfile.email" type="email" id="email" class="form-control" placeholder="Новый email" required />
              </div>
              <div class="mb-3">
                <label for="phone" class="form-label">Телефон</label>
                <input v-model="editProfile.phone" type="text" id="phone" class="form-control" placeholder="+1234567890" required />
                <small v-if="phoneError" class="text-danger">{{ phoneError }}</small>
              </div>
              <div class="mb-3">
                <label for="password" class="form-label">Новый пароль (оставьте пустым, если не хотите менять)</label>
                <input v-model="editProfile.password" type="password" id="password" class="form-control" placeholder="Новый пароль" />
              </div>
              <div class="d-flex gap-2">
                <button type="submit" class="btn btn-dark-green w-50" :disabled="!!phoneError"><i class="fas fa-save me-2"></i> Сохранить изменения</button>
                <button type="button" @click="cancelEditingProfile" class="btn btn-secondary w-50"><i class="fas fa-times me-2"></i> Отмена</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Вкладка: Профиль ребёнка -->
      <div v-if="activeTab === 'childProfile'">
        <h2 class="text-center mb-4">Профиль ребёнка</h2>
        <div class="mb-4 d-flex justify-content-between align-items-center">
          <select v-model="selectedChildForProfile" class="form-select w-auto d-inline-block animate__animated animate__fadeIn" @change="animateProfile">
            <option value="" disabled>Выберите ребенка</option>
            <option v-for="child in children" :key="child.id" :value="child.id">{{ child.name }}</option>
          </select>
          <button @click="showAddChildForm = true" class="btn btn-dark-green"><i class="fas fa-plus-circle me-2"></i> Добавить ребёнка</button>
        </div>

        <div v-if="showAddChildForm" class="card shadow-lg p-4 mb-5 animate__animated animate__zoomIn">
          <h3><i class="fas fa-child me-2"></i> Добавить ребёнка</h3>
          <form @submit.prevent="addChild" class="add-child-form">
            <div class="mb-3">
              <label for="child_name" class="form-label">Имя ребёнка</label>
              <input v-model="newChild.name" type="text" id="child_name" class="form-control" placeholder="Введите имя" required />
            </div>
            <div class="mb-3">
              <label for="birth_date" class="form-label">Дата рождения</label>
              <input v-model="newChild.birth_date" type="date" id="birth_date" class="form-control" required />
            </div>
            <div class="d-flex gap-2">
              <button type="submit" class="btn btn-dark-green w-50"><i class="fas fa-save me-2"></i> Добавить</button>
              <button type="button" @click="showAddChildForm = false" class="btn btn-secondary w-50"><i class="fas fa-times me-2"></i> Отмена</button>
            </div>
          </form>
        </div>

        <div v-if="selectedChildForProfile" class="card shadow-lg p-4 animate__animated" :class="profileAnimation">
          <div class="row align-items-center">
            <div class="col-md-3 text-center">
              <img src="https://via.placeholder.com/100?text=Child" class="rounded-circle mb-3" alt="Аватар ребёнка" />
            </div>
            <div class="col-md-6">
              <h3 class="mb-3 text-success">{{ selectedChildData.name }}</h3>
              <p><strong>Дата рождения:</strong> {{ formatDate(selectedChildData.birth_date) }}</p>
            </div>
            <div class="col-md-3 text-md-end">
              <button @click="editChild" class="btn btn-dark-green"><i class="fas fa-edit me-2"></i> Редактировать</button>
            </div>
          </div>

          <div v-if="showEditChildForm" class="mt-4">
            <h3><i class="fas fa-edit me-2"></i> Редактировать ребёнка</h3>
            <form @submit.prevent="updateChild" class="edit-child-form">
              <div class="mb-3">
                <label for="edit_child_name" class="form-label">Имя ребёнка</label>
                <input v-model="editChildData.name" type="text" id="edit_child_name" class="form-control" required />
              </div>
              <div class="mb-3">
                <label for="edit_birth_date" class="form-label">Дата рождения</label>
                <input v-model="editChildData.birth_date" type="date" id="edit_birth_date" class="form-control" required />
              </div>
              <div class="d-flex gap-2">
                <button type="submit" class="btn btn-dark-green w-50"><i class="fas fa-save me-2"></i> Сохранить</button>
                <button type="button" @click="showEditChildForm = false" class="btn btn-secondary w-50"><i class="fas fa-times me-2"></i> Отмена</button>
              </div>
            </form>
          </div>
        </div>
        <div v-else-if="!showAddChildForm && children.length" class="text-center text-muted mt-4">
          Выберите ребёнка для просмотра профиля
        </div>
        <div v-if="!children.length && !showAddChildForm" class="text-center text-muted mt-4">
          У вас нет добавленных детей. Нажмите "Добавить ребёнка", чтобы начать.
        </div>
      </div>

      <!-- Вкладка: Запись на занятия -->
      <div v-if="activeTab === 'enroll'">
        <h2 class="mb-4">Записаться на занятие</h2>
        <div class="mb-4">
          <select v-model="selectedChild" class="form-select w-auto d-inline-block me-2">
            <option value="" disabled>Выберите ребенка</option>
            <option v-for="child in children" :key="child.id" :value="child.id">{{ child.name }}</option>
          </select>
          <select v-model="selectedSubject" class="form-select w-auto d-inline-block" @change="fetchClasses">
            <option value="">Все предметы</option>
            <option v-for="subject in subjects" :key="subject.id" :value="subject.id">{{ subject.name }}</option>
          </select>
        </div>
        <table class="table table-striped shadow-lg">
          <thead class="table-success">
            <tr>
              <th>Занятие</th>
              <th>Тип</th>
              <th>Возрастная группа</th>
              <th>Время</th>
              <th>Кабинет</th>
              <th>Стоимость</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="classItem in classes" :key="classItem.id">
              <td>{{ classItem.subject }}</td>
              <td>
                <span :class="classItem.class_type === 'individual' ? 'badge bg-primary' : 'badge bg-success'">
                  {{ classItem.class_type === 'individual' ? 'Индивидуальное' : 'Групповое' }}
                </span>
              </td>
              <td>
                <span v-if="classItem.class_type === 'group'">
                  {{ classItem.min_age }}-{{ classItem.max_age }} лет
                </span>
                <span v-else>3-16 лет</span>
              </td>
              <td>{{ formatDateTime(classItem.schedule) }}</td>
              <td>{{ classItem.room || 'Не указан' }}</td>
              <td>{{ classItem.price }} руб.</td>
              <td>
                <button
                  v-if="selectedChild"
                  @click="enrollChild(classItem.id)"
                  class="btn btn-dark-green btn-sm"
                  :disabled="!selectedChild || isChildEnrolled(classItem.id)"
                >
                  {{ isChildEnrolled(classItem.id) ? 'Записан' : 'Записаться' }}
                </button>
              </td>
            </tr>
            <tr v-if="!classes.length">
              <td colspan="7" class="text-center">Занятия не найдены</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Вкладка: Расписание -->
      <div v-if="activeTab === 'schedule'">
        <h2 class="mb-4">Расписание</h2>
        <div class="mb-4">
          <select v-model="selectedChildForSchedule" class="form-select w-auto d-inline-block" @change="fetchSchedule">
            <option value="" disabled>Выберите ребенка</option>
            <option v-for="child in children" :key="child.id" :value="child.id">{{ child.name }}</option>
          </select>
        </div>
        <table class="table table-striped shadow-lg">
          <thead class="table-success">
            <tr>
              <th>Занятие</th>
              <th>Тип</th>
              <th>Возрастная группа</th>
              <th>Время</th>
              <th>Кабинет</th>
              <th>Стоимость</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="scheduleItem in schedule" :key="scheduleItem.id">
              <td>{{ scheduleItem.subject }}</td>
              <td>
                <span :class="scheduleItem.class_type === 'individual' ? 'badge bg-primary' : 'badge bg-success'">
                  {{ scheduleItem.class_type === 'individual' ? 'Индивидуальное' : 'Групповое' }}
                </span>
              </td>
              <td>
                <span v-if="scheduleItem.class_type === 'group'">
                  {{ scheduleItem.min_age }}-{{ scheduleItem.max_age }} лет
                </span>
                <span v-else>3-16 лет</span>
              </td>
              <td>{{ formatDateTime(scheduleItem.schedule) }}</td>
              <td>{{ scheduleItem.room || 'Не указан' }}</td>
              <td>{{ scheduleItem.price }} руб.</td>
              <td>
                <button
                  @click="unenrollChild(scheduleItem.id)"
                  class="btn btn-danger btn-sm"
                >
                  Отменить
                </button>
              </td>
            </tr>
            <tr v-if="!schedule.length && selectedChildForSchedule">
              <td colspan="7" class="text-center">Ребёнок не записан на занятия</td>
            </tr>
            <tr v-if="!schedule.length && !selectedChildForSchedule">
              <td colspan="7" class="text-center">Выберите ребёнка для просмотра расписания</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ParentPage',
  data() {
    return {
      activeTab: 'centerInfo',
      user: null,
      children: [],
      classes: [],
      subjects: [],
      selectedChild: '',
      selectedSubject: '',
      schedule: [],
      selectedChildForProfile: '',
      selectedChildForSchedule: '',
      reviews: [],
      newReview: '',
      parentProfile: {
        username: '',
        email: '',
        phone: '',
      },
      editProfile: {
        username: '',
        email: '',
        phone: '',
        password: '',
      },
      isEditingProfile: false,
      showAddChildForm: false,
      showEditChildForm: false,
      newChild: { name: '', birth_date: '' },
      editChildData: { id: '', name: '', birth_date: '' },
      profileAnimation: 'animate__fadeIn',
      phoneError: null,
    };
  },
  computed: {
    selectedChildData() {
      return this.children.find(child => child.id === parseInt(this.selectedChildForProfile)) || {};
    },
  },
  methods: {
    async fetchParentProfile() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        const response = await axios.get('http://localhost:3000/api/parent/profile', { headers });
        this.parentProfile = response.data;
      } catch (error) {
        this.handleError(error, 'Ошибка при загрузке профиля');
      }
    },
    async fetchClasses() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        const params = this.selectedSubject ? { subject_id: this.selectedSubject } : {};
        const response = await axios.get('http://localhost:3000/api/classes/public', { headers, params });
        this.classes = response.data;
      } catch (error) {
        this.handleError(error, 'Ошибка при получении расписания');
      }
    },
    async fetchSubjects() {
      try {
        const response = await axios.get('http://localhost:3000/api/subjects');
        this.subjects = response.data;
      } catch (error) {
        this.handleError(error, 'Ошибка при загрузке предметов');
      }
    },
    async fetchChildren() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        const response = await axios.get('http://localhost:3000/api/parent/children', { headers });
        this.children = response.data;
      } catch (error) {
        this.handleError(error, 'Ошибка при получении списка детей');
      }
    },
    async fetchSchedule() {
      if (!this.selectedChildForSchedule) {
        this.schedule = [];
        return;
      }
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        const response = await axios.get(`http://localhost:3000/api/parent/schedule/${this.selectedChildForSchedule}`, { headers });
        this.schedule = response.data;
      } catch (error) {
        this.handleError(error, 'Ошибка при получении расписания');
      }
    },
    async fetchReviews() {
      try {
        const response = await axios.get('http://localhost:3000/api/reviews');
        this.reviews = response.data;
      } catch (error) {
        this.handleError(error, 'Ошибка при загрузке отзывов');
      }
    },
    async submitReview() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        await axios.post('http://localhost:3000/api/reviews', { content: this.newReview }, { headers });
        this.showToast('Отзыв отправлен!', 'success');
        this.newReview = '';
        this.fetchReviews();
      } catch (error) {
        this.handleError(error, 'Ошибка при отправке отзыва');
      }
    },
    async addChild() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        await axios.post('http://localhost:3000/api/parent/children', this.newChild, { headers });
        this.showToast('Ребёнок добавлен!', 'success');
        this.newChild = { name: '', birth_date: '' };
        this.showAddChildForm = false;
        this.fetchChildren();
      } catch (error) {
        this.handleError(error, 'Ошибка при добавлении ребёнка');
      }
    },
    async updateChild() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        await axios.put(`http://localhost:3000/api/parent/children/${this.selectedChildForProfile}`, this.editChildData, { headers });
        this.showToast('Данные ребёнка обновлены!', 'success');
        this.showEditChildForm = false;
        this.fetchChildren();
      } catch (error) {
        this.handleError(error, 'Ошибка при обновлении ребёнка');
      }
    },
    async enrollChild(classId) {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        await axios.post('http://localhost:3000/api/enrollments', { child_id: this.selectedChild, class_id: classId }, { headers });
        this.showToast('Ребёнок записан на занятие!', 'success');
        this.fetchClasses();
        this.fetchSchedule();
      } catch (error) {
        this.handleError(error, 'Ошибка при записи на занятие');
      }
    },
    async unenrollChild(classId) {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        await axios.delete(`http://localhost:3000/api/enrollments/${this.selectedChildForSchedule}/${classId}`, { headers });
        this.showToast('Запись отменена!', 'success');
        this.fetchSchedule();
        this.fetchClasses();
      } catch (error) {
        this.handleError(error, 'Ошибка при отмене записи');
      }
    },
    startEditingProfile() {
      this.isEditingProfile = true;
      this.editProfile = { ...this.parentProfile, password: '' };
    },
    cancelEditingProfile() {
      this.isEditingProfile = false;
      this.editProfile = { username: '', email: '', phone: '', password: '' };
      this.phoneError = null;
    },
    async updateProfile() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      if (this.phoneError) {
        this.showToast('Исправьте ошибки в номере телефона', 'error');
        return;
      }
      try {
        const updateData = {};
        if (this.editProfile.username) updateData.username = this.editProfile.username;
        if (this.editProfile.email) updateData.email = this.editProfile.email;
        if (this.editProfile.phone) updateData.phone = this.editProfile.phone;
        if (this.editProfile.password) updateData.password = this.editProfile.password;
        await axios.put(`http://localhost:3000/api/parent/profile`, updateData, { headers });
        this.showToast('Профиль обновлён!', 'success');
        this.isEditingProfile = false;
        this.editProfile = { username: '', email: '', phone: '', password: '' };
        this.fetchParentProfile();
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (user) {
          const updatedUser = { ...user, ...updateData };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (error) {
        this.handleError(error, 'Ошибка при обновлении профиля');
      }
    },
    editChild() {
      this.editChildData = { ...this.selectedChildData };
      this.showEditChildForm = true;
    },
    animateProfile() {
      this.profileAnimation = 'animate__fadeOut';
      setTimeout(() => {
        this.profileAnimation = 'animate__fadeIn';
      }, 300);
    },
    validatePhone() {
      const phonePattern = /^\+\d{10,15}$/;
      if (!this.editProfile.phone) {
        this.phoneError = 'Поле "Телефон" обязательно';
      } else if (!phonePattern.test(this.editProfile.phone)) {
        this.phoneError = 'Введите номер телефона в формате +1234567890 (10-15 цифр)';
      } else {
        this.phoneError = null;
      }
    },
    logout() {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      this.$router.push('/login');
    },
    getAuthHeaders() {
      const token = localStorage.getItem('token');
      if (!token) {
        this.showToast('Сессия истекла, войдите снова', 'error');
        this.logout();
        return null;
      }
      return { Authorization: `Bearer ${token}` };
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString('ru-RU');
    },
    formatDateTime(date) {
      return new Date(date).toLocaleString('ru-RU');
    },
    isChildEnrolled(classId) {
      return this.schedule.some(item => item.id === classId && this.selectedChild === this.selectedChildForSchedule);
    },
    showToast(message, type = 'error') {
      if (this.$toast) {
        this.$toast[type](message, { timeout: 5000 });
      } else {
        console[type === 'error' ? 'error' : 'log'](`Toast (${type}): ${message}`);
        alert(message);
      }
    },
    handleError(error, defaultMessage) {
      if (error.response?.status === 403) {
        this.showToast('Сессия истекла, войдите снова', 'error');
        this.logout();
      } else {
        this.showToast(`${defaultMessage}: ${error.response?.data?.error || error.message}`, 'error');
      }
    },
  },
  watch: {
    'editProfile.phone': 'validatePhone',
  },
  mounted() {
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!this.user || this.user.role !== 'parent') {
      this.showToast('Сессия истекла или доступ запрещён', 'error');
      this.$router.push('/login');
    } else {
      this.fetchParentProfile();
      this.fetchChildren();
      this.fetchClasses();
      this.fetchSubjects();
      this.fetchReviews();
    }
  },
};
</script>

<style scoped>
.parent-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #d5f7d5, #e8f5e9);
  font-family: 'Comic Sans MS', 'Segoe UI', sans-serif;
}

.sidebar {
  width: 250px;
  background: #ffffff;
  padding: 20px;
  border-right: 1px solid #ddd;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  overflow-y: auto;
}

.main-content {
  margin-left: 270px;
  padding: 40px;
}

.nav-link {
  color: #2e7d32;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.nav-link.active {
  background-color: #2e7d32;
  color: white;
  border-radius: 5px;
}

.nav-link:hover {
  background-color: #e8f5e9;
}

.card {
  border-radius: 15px;
  background: linear-gradient(145deg, #ffffff, #f0f8f0);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
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

.btn-dark-green i {
  margin-right: 5px;
}

.btn-secondary {
  background-color: #6c757d;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.table {
  background: #ffffff;
  border-radius: 10px;
}

.table-striped tbody tr:nth-of-type(odd) {
  background-color: rgba(0, 0, 0, 0.05);
}

.table-success {
  background-color: #2e7d32;
  color: white;
}

.rounded-circle {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border: 3px solid #2e7d32;
}

.badge {
  font-size: 0.9em;
  padding: 0.3em 0.6em;
}

.review {
  background: #f8f9fa;
  border: 1px solid #ddd;
}

.animate__animated.animate__fadeIn {
  animation-duration: 0.5s;
}

.animate__animated.animate__zoomIn {
  animation-duration: 0.5s;
}
</style>