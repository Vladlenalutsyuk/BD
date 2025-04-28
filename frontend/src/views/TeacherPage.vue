<template>
  <div class="teacher-page">
    <div class="header">
      <p>Добро пожаловать, {{ user?.username }}!</p>
      <button @click="logout" class="btn btn-dark-green logout-btn">Выйти</button>
    </div>

    <div class="container-fluid">
      <div class="row">
        <!-- Sidebar -->
        <nav class="col-md-3 col-lg-2 sidebar">
          <ul class="nav flex-column">
            <li class="nav-item">
              <a class="nav-link" :class="{ active: activeTab === 'profile' }" @click="setActiveTab('profile')">Личный кабинет</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" :class="{ active: activeTab === 'salary' }" @click="setActiveTab('salary')">Зарплата</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" :class="{ active: activeTab === 'schedule' }" @click="setActiveTab('schedule')">Расписание</a>
            </li>
          </ul>
        </nav>

        <!-- Main content -->
        <main class="col-md-9 col-lg-10 main-content">
          <!-- Profile Tab -->
          <div v-if="activeTab === 'profile'">
            <h2>Личный кабинет</h2>
            <div class="card shadow-sm p-4">
              <h4>Информация о преподавателе</h4>
              <p><strong>Имя:</strong> {{ profile.username }}</p>
              <p><strong>Email:</strong> {{ profile.email }}</p>
              <p><strong>Телефон:</strong> {{ profile.phone || 'Не указан' }}</p>
              <p><strong>Образование:</strong> {{ profile.education || 'Не указано' }}</p>
              <p><strong>Опыт работы:</strong> {{ profile.experience ? profile.experience + ' лет' : 'Не указан' }}</p>
              <p><strong>Предмет:</strong> {{ profile.subject_name || 'Не указан' }}</p>
              <button class="btn btn-dark-green mt-3" @click="openEditModal">Редактировать данные</button>
            </div>
          </div>

          <!-- Salary Tab -->
          <div v-if="activeTab === 'salary'">
            <h2>Зарплата</h2>
            <div v-if="salary.length > 0">
              <table class="table table-bordered">
                <thead>
                  <tr>
                    <th>Месяц</th>
                    <th>Количество занятий</th>
                    <th>Выручка (40%)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in salary" :key="index">
                    <td>{{ formatMonth(item.month) }}</td>
                    <td>{{ item.class_count }}</td>
                    <td>{{ item.total_salary.toFixed(2) }} ₽</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else>
              <p>Данные о зарплате отсутствуют.</p>
            </div>
          </div>

          <!-- Schedule Tab -->
          <div v-if="activeTab === 'schedule'">
            <h2>Расписание</h2>
            <div v-if="classes.length > 0">
              <table class="table table-bordered">
                <thead>
                  <tr>
                    <th>Занятие</th>
                    <th>Время</th>
                    <th>Кабинет</th>
                    <th>Цена</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(classItem, index) in classes" :key="index">
                    <td>{{ classItem.subject }}</td>
                    <td>{{ new Date(classItem.schedule).toLocaleString() }}</td>
                    <td>{{ classItem.room || 'Не указан' }}</td>
                    <td>{{ classItem.price }} ₽</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else>
              <p>Расписание не найдено.</p>
            </div>
          </div>
        </main>
      </div>
    </div>

    <!-- Modal for Profile Completion -->
    <div class="modal fade" id="profileModal" tabindex="-1" aria-labelledby="profileModalLabel" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="profileModalLabel">Завершение профиля</h5>
          </div>
          <div class="modal-body">
            <p>Пожалуйста, заполните данные вашего профиля.</p>
            <form @submit.prevent="submitProfile">
              <div class="mb-3">
                <label for="phone" class="form-label">Телефон</label>
                <input v-model="form.phone" type="text" id="phone" class="form-control" required @input="validatePhone" />
                <small v-if="phoneError" class="text-danger">{{ phoneError }}</small>
              </div>
              <div class="mb-3">
                <label for="education" class="form-label">Образование</label>
                <input v-model="form.education" type="text" id="education" class="form-control" required />
              </div>
              <div class="mb-3">
                <label for="experience" class="form-label">Опыт работы (лет)</label>
                <input v-model.number="form.experience" type="number" id="experience" class="form-control" required min="0" />
              </div>
              <div class="mb-3">
                <label for="subject_id" class="form-label">Предмет</label>
                <select v-model="form.subject_id" id="subject_id" class="form-select" required>
                  <option value="" disabled>Выберите предмет</option>
                  <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
                    {{ subject.name }}
                  </option>
                </select>
              </div>
              <button type="submit" class="btn btn-dark-green w-100">Сохранить</button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal for Editing Profile -->
    <div class="modal fade" id="editProfileModal" tabindex="-1" aria-labelledby="editProfileModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="editProfileModalLabel">Редактировать профиль</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="updateProfile">
              <div class="mb-3">
                <label for="edit-phone" class="form-label">Телефон</label>
                <input v-model="form.phone" type="text" id="edit-phone" class="form-control" required @input="validatePhone" />
                <small v-if="phoneError" class="text-danger">{{ phoneError }}</small>
              </div>
              <div class="mb-3">
                <label for="edit-education" class="form-label">Образование</label>
                <input v-model="form.education" type="text" id="edit-education" class="form-control" required />
              </div>
              <div class="mb-3">
                <label for="edit-experience" class="form-label">Опыт работы (лет)</label>
                <input v-model.number="form.experience" type="number" id="edit-experience" class="form-control" required min="0" />
              </div>
              <div class="mb-3">
                <label for="edit-subject_id" class="form-label">Предмет</label>
                <select v-model="form.subject_id" id="edit-subject_id" class="form-select" required>
                  <option value="" disabled>Выберите предмет</option>
                  <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
                    {{ subject.name }}
                  </option>
                </select>
              </div>
              <button type="submit" class="btn btn-dark-green w-100">Сохранить изменения</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { Modal } from 'bootstrap';

export default {
  name: 'TeacherPage',
  data() {
    return {
      user: null,
      profile: {},
      classes: [],
      salary: [],
      subjects: [],
      activeTab: 'profile',
      form: {
        phone: '',
        education: '',
        experience: 0,
        subject_id: '',
      },
      phoneError: '',
    };
  },
  mounted() {
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!this.user || this.user.role !== 'teacher') {
      this.$router.push('/login');
    } else {
      this.fetchProfile();
      this.fetchClasses();
      this.fetchSalary();
      this.fetchSubjects();
    }
  },
  methods: {
    async fetchProfile() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.$router.push('/login');
          return;
        }
        const response = await axios.get('http://localhost:3000/api/teachers/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.profile = response.data;
        if (!this.profile.subject_id) {
          this.openProfileModal();
        }
      } catch (error) {
        this.showToast('Ошибка при получении профиля: ' + (error.response?.data?.error || error.message));
      }
    },
    async fetchClasses() {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3000/api/classes', {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.classes = response.data;
      } catch (error) {
        this.showToast('Ошибка при получении расписания: ' + (error.response?.data?.error || error.message));
      }
    },
    async fetchSalary() {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3000/api/teachers/salary', {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.salary = response.data;
      } catch (error) {
        this.showToast('Ошибка при получении зарплаты: ' + (error.response?.data?.error || error.message));
      }
    },
    async fetchSubjects() {
      try {
        const response = await axios.get('http://localhost:3000/api/subjects');
        this.subjects = response.data;
      } catch (error) {
        this.showToast('Ошибка при получении предметов: ' + (error.response?.data?.error || error.message));
      }
    },
    validatePhone() {
      const phonePattern = /^\+\d{10,15}$/;
      if (!this.form.phone) {
        this.phoneError = 'Поле "Телефон" обязательно';
      } else if (!phonePattern.test(this.form.phone)) {
        this.phoneError = 'Введите номер телефона в формате +1234567890 (10-15 цифр)';
      } else if (this.form.phone.length > 15) {
        this.phoneError = 'Телефон не должен превышать 15 символов';
      } else {
        this.phoneError = '';
      }
    },
    openProfileModal() {
      this.form.phone = this.profile.phone || '';
      this.form.education = this.profile.education || '';
      this.form.experience = this.profile.experience || 0;
      this.form.subject_id = this.profile.subject_id || '';
      const modal = new Modal(document.getElementById('profileModal'));
      modal.show();
    },
    openEditModal() {
      this.form.phone = this.profile.phone || '';
      this.form.education = this.profile.education || '';
      this.form.experience = this.profile.experience || 0;
      this.form.subject_id = this.profile.subject_id || '';
      const modal = new Modal(document.getElementById('editProfileModal'));
      modal.show();
    },
    async submitProfile() {
      if (this.phoneError || !this.form.phone || !this.form.education || !this.form.experience || !this.form.subject_id) {
        this.showToast('Заполните все поля корректно');
        return;
      }
      try {
        const token = localStorage.getItem('token');
        await axios.put(
          'http://localhost:3000/api/teachers/profile',
          this.form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        this.showToast('Профиль успешно сохранён', 'success');
        await this.fetchProfile();
        const modal = Modal.getInstance(document.getElementById('profileModal'));
        modal.hide();
      } catch (error) {
        this.showToast('Ошибка при сохранении профиля: ' + (error.response?.data?.error || error.message));
      }
    },
    async updateProfile() {
      if (this.phoneError || !this.form.phone || !this.form.education || !this.form.experience || !this.form.subject_id) {
        this.showToast('Заполните все поля корректно');
        return;
      }
      try {
        const token = localStorage.getItem('token');
        await axios.put(
          'http://localhost:3000/api/teachers/profile',
          this.form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        this.showToast('Профиль успешно обновлён', 'success');
        await this.fetchProfile();
        const modal = Modal.getInstance(document.getElementById('editProfileModal'));
        modal.hide();
      } catch (error) {
        this.showToast('Ошибка при обновлении профиля: ' + (error.response?.data?.error || error.message));
      }
    },
    setActiveTab(tab) {
      this.activeTab = tab;
      if (tab === 'schedule') this.fetchClasses();
      if (tab === 'salary') this.fetchSalary();
    },
    formatMonth(month) {
      const [year, monthNum] = month.split('-');
      const date = new Date(year, monthNum - 1);
      return date.toLocaleString('ru-RU', { year: 'numeric', month: 'long' });
    },
    showToast(message, type = 'error') {
      if (this.$toast) {
        if (type === 'error') {
          this.$toast.error(message);
        } else {
          this.$toast.success(message);
        }
      } else {
        console[type === 'error' ? 'error' : 'log'](`Toast (${type}): ${message}`);
      }
    },
    logout() {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      this.$router.push('/login');
    },
  },
};
</script>

<style scoped>
.teacher-page {
  min-height: 100vh;
  background-color: #d5f7d5;
  font-family: 'Comic Sans MS', 'Segoe UI', sans-serif;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.logout-btn {
  background-color: #2e7d32;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.logout-btn:hover {
  background-color: #256528;
}

.logout-btn:active {
  background-color: #1b4b1e;
  transform: scale(0.98);
}

.sidebar {
  background-color: #f8f9fa;
  padding: 20px;
  border-right: 1px solid #ddd;
  height: 100%;
}

.nav-link {
  color: #2e7d32;
  font-weight: bold;
  padding: 10px 15px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.nav-link:hover {
  background-color: #e0f7e0;
  border-radius: 5px;
}

.nav-link.active {
  background-color: #2e7d32;
  color: white;
  border-radius: 5px;
}

.main-content {
  padding: 20px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th,
td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
}

.card {
  background-color: white;
  border-radius: 10px;
}

.btn-dark-green {
  background-color: #2e7d32;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  transition: background-color 0.3s ease;
}

.btn-dark-green:hover {
  background-color: #256528;
}

.modal-content {
  border-radius: 10px;
}

.modal-header {
  background-color: #2e7d32;
  color: white;
}

.modal-title {
  font-weight: bold;
}
</style>