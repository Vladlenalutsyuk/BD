<template>
  <div class="teacher-page d-flex">
    <!-- Sidebar -->
    <aside class="sidebar bg-white shadow-sm">
      <h3 class="text-center text-success mb-4">Меню</h3>
      <ul class="nav flex-column">
        <li class="nav-item">
          <a class="nav-link" :class="{ active: activeTab === 'profile' }" @click="setActiveTab('profile')"><i class="fas fa-user me-2"></i> Профиль</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" :class="{ active: activeTab === 'salary' }" @click="setActiveTab('salary')"><i class="fas fa-money-bill-wave me-2"></i> Зарплата</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" :class="{ active: activeTab === 'schedule' }" @click="setActiveTab('schedule')"><i class="fas fa-calendar-alt me-2"></i> Расписание</a>
        </li>
        <li class="nav-item">
          <a class="nav-link text-danger" @click="logout"><i class="fas fa-sign-out-alt me-2"></i> Выйти</a>
        </li>
      </ul>
    </aside>

    <!-- Main content -->
    <main class="main-content p-4 flex-grow-1">
      

      <!-- Profile Tab -->
      <section v-if="activeTab === 'profile'">
        <h2>Профиль</h2>
        <div class="card shadow-sm p-4 mb-4">
          <h3>Информация</h3>
          <ul class="list-group list-group-flush">
            <li class="list-group-item"><strong>Имя:</strong> {{ profile.username || 'Не указано' }}</li>
            <li class="list-group-item"><strong>Email:</strong> {{ profile.email || 'Не указано' }}</li>
            <li class="list-group-item"><strong>Телефон:</strong> {{ profile.phone || 'Не указано' }}</li>
            <li class="list-group-item"><strong>Образование:</strong> {{ profile.education || 'Не указано' }}</li>
            <li class="list-group-item"><strong>Опыт:</strong> {{ profile.experience ? profile.experience + ' лет' : 'Не указано' }}</li>
            <li class="list-group-item"><strong>Предмет:</strong> {{ profile.subject_name || 'Не указано' }}</li>
          </ul>
          <button class="btn btn-success mt-3" @click="openEditModal"><i class="fas fa-edit me-2"></i> Редактировать</button>
        </div>
      </section>

      <!-- Salary Tab -->
      <section v-if="activeTab === 'salary'">
        <h2>Зарплата</h2>
        <div class="card shadow-sm p-4 mb-4">
          <div class="mb-3">
            <label for="monthSelect" class="form-label">Выберите месяц</label>
            <select v-model="selectedMonth" id="monthSelect" class="form-select" @change="fetchSalary">
              <option value="">Все месяцы</option>
              <option v-for="month in availableMonths" :key="month" :value="month">{{ formatMonth(month) }}</option>
            </select>
          </div>
          <div v-if="salary.length > 0" class="table-responsive">
            <table class="table table-striped table-hover">
              <thead class="table-success">
                <tr>
                  <th>Месяц</th>
                  <th>Занятий</th>
                  <th>Зарплата (40%)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in salary" :key="index">
                  <td>{{ formatMonth(item.month) }}</td>
                  <td>{{ item.class_count }}</td>
                  <td>{{ formatSalary(item.total_salary) }} ₽</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="text-center text-muted p-4">
            <i class="fas fa-info-circle me-2"></i> Нет данных о зарплате. Возможно, занятия не отмечены как завершенные.
          </div>
        </div>
      </section>

      <!-- Schedule Tab -->
      <section v-if="activeTab === 'schedule'">
        <h2>Расписание</h2>

        <!-- Today's Schedule -->
        <div class="card shadow-sm p-4 mb-4">
          <h3>Сегодня</h3>
          <div v-if="dailyClasses.length > 0" class="table-responsive">
            <table class="table table-striped table-hover">
              <thead class="table-success">
                <tr>
                  <th>Занятие</th>
                  <th>Тип</th>
                  <th>Время</th>
                  <th>Кабинет</th>
                  <th>Цена</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(classItem, index) in dailyClasses" :key="index">
                  <td><a href="#" @click.prevent="showEnrolledStudents(classItem.id)">{{ classItem.subject }}</a></td>
                  <td>{{ classItem.class_type === 'group' ? 'Групповое' : 'Индивидуальное' }}</td>
                  <td>{{ formatTime(classItem.schedule) }}</td>
                  <td>{{ classItem.room || 'Не указан' }}</td>
                  <td>{{ classItem.price }} ₽</td>
                  <td>{{ classItem.completed ? 'Завершено' : 'Ожидается' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="text-center text-muted p-4">
            <i class="fas fa-calendar-times me-2"></i> Сегодня нет занятий.
          </div>
        </div>

        <!-- Upcoming Classes -->
        <div class="card shadow-sm p-4 mb-4">
          <h3>Предстоящие занятия</h3>
          <div class="mb-3 d-flex justify-content-between align-items-center">
            <div>
              <button class="btn btn-success me-2" :class="{ active: scheduleView === 'list' }" @click="setScheduleView('list')">Общее</button>
              <button class="btn btn-success" :class="{ active: scheduleView === 'weekly' }" @click="setScheduleView('weekly')">Неделя</button>
            </div>
            <input v-if="scheduleView === 'weekly'" type="date" v-model="weekStart" @change="fetchWeeklySchedule('upcoming')" class="form-control w-auto" />
          </div>

          <!-- List View (Upcoming) -->
          <div v-if="scheduleView === 'list'" class="table-responsive">
            <div v-if="upcomingClasses.length > 0">
              <table class="table table-striped table-hover">
                <thead class="table-success">
                  <tr>
                    <th>Занятие</th>
                    <th>Тип</th>
                    <th>Дата и время</th>
                    <th>Кабинет</th>
                    <th>Цена</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(classItem, index) in upcomingClasses" :key="index">
                    <td><a href="#" @click.prevent="showEnrolledStudents(classItem.id)">{{ classItem.subject }}</a></td>
                    <td>{{ classItem.class_type === 'group' ? 'Групповое' : 'Индивидуальное' }}</td>
                    <td>{{ formatDateTime(classItem.schedule) }}</td>
                    <td>{{ classItem.room || 'Не указан' }}</td>
                    <td>{{ classItem.price }} ₽</td>
                    <td>{{ classItem.completed ? 'Завершено' : 'Ожидается' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="text-center text-muted p-4">
              <i class="fas fa-calendar-times me-2"></i> Нет предстоящих занятий.
            </div>
          </div>

          <!-- Weekly View (Upcoming) -->
          <div v-if="scheduleView === 'weekly'" class="table-responsive">
            <div v-if="weeklyClasses.upcoming.length > 0">
              <table class="table table-striped table-hover">
                <thead class="table-success">
                  <tr>
                    <th>Занятие</th>
                    <th>Тип</th>
                    <th>Дата и время</th>
                    <th>Кабинет</th>
                    <th>Цена</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(classItem, index) in weeklyClasses.upcoming" :key="index">
                    <td><a href="#" @click.prevent="showEnrolledStudents(classItem.id)">{{ classItem.subject }}</a></td>
                    <td>{{ classItem.class_type === 'group' ? 'Групповое' : 'Индивидуальное' }}</td>
                    <td>{{ formatDateTime(classItem.schedule) }}</td>
                    <td>{{ classItem.room || 'Не указан' }}</td>
                    <td>{{ classItem.price }} ₽</td>
                    <td>{{ classItem.completed ? 'Завершено' : 'Ожидается' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="text-center text-muted p-4">
              <i class="fas fa-calendar-times me-2"></i> На этой неделе нет предстоящих занятий.
            </div>
          </div>
        </div>

        <!-- Completed Classes -->
        <div class="card shadow-sm p-4">
          <h3>Завершенные занятия</h3>
          <div class="mb-3 d-flex justify-content-between align-items-center">
            <div>
              <button class="btn btn-success me-2" :class="{ active: scheduleView === 'list' }" @click="setScheduleView('list')">Общее</button>
              <button class="btn btn-success" :class="{ active: scheduleView === 'weekly' }" @click="setScheduleView('weekly')">Неделя</button>
            </div>
            <input v-if="scheduleView === 'weekly'" type="date" v-model="weekStart" @change="fetchWeeklySchedule('completed')" class="form-control w-auto" />
          </div>

          <!-- List View (Completed) -->
          <div v-if="scheduleView === 'list'" class="table-responsive">
            <div v-if="completedClasses.length > 0">
              <table class="table table-striped table-hover">
                <thead class="table-success">
                  <tr>
                    <th>Занятие</th>
                    <th>Тип</th>
                    <th>Дата и время</th>
                    <th>Кабинет</th>
                    <th>Цена</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(classItem, index) in completedClasses" :key="index">
                    <td><a href="#" @click.prevent="showEnrolledStudents(classItem.id)">{{ classItem.subject }}</a></td>
                    <td>{{ classItem.class_type === 'group' ? 'Групповое' : 'Индивидуальное' }}</td>
                    <td>{{ formatDateTime(classItem.schedule) }}</td>
                    <td>{{ classItem.room || 'Не указан' }}</td>
                    <td>{{ classItem.price }} ₽</td>
                    <td>{{ classItem.completed ? 'Завершено' : 'Ожидается' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="text-center text-muted p-4">
              <i class="fas fa-calendar-times me-2"></i> Нет завершенных занятий.
            </div>
          </div>

          <!-- Weekly View (Completed) -->
          <div v-if="scheduleView === 'weekly'" class="table-responsive">
            <div v-if="weeklyClasses.completed.length > 0">
              <table class="table table-striped table-hover">
                <thead class="table-success">
                  <tr>
                    <th>Занятие</th>
                    <th>Тип</th>
                    <th>Дата и время</th>
                    <th>Кабинет</th>
                    <th>Цена</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(classItem, index) in weeklyClasses.completed" :key="index">
                    <td><a href="#" @click.prevent="showEnrolledStudents(classItem.id)">{{ classItem.subject }}</a></td>
                    <td>{{ classItem.class_type === 'group' ? 'Групповое' : 'Индивидуальное' }}</td>
                    <td>{{ formatDateTime(classItem.schedule) }}</td>
                    <td>{{ classItem.room || 'Не указан' }}</td>
                    <td>{{ classItem.price }} ₽</td>
                    <td>{{ classItem.completed ? 'Завершено' : 'Ожидается' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="text-center text-muted p-4">
              <i class="fas fa-calendar-times me-2"></i> На этой неделе нет завершенных занятий.
            </div>
          </div>
        </div>
      </section>

      <!-- Profile Completion Modal -->
      <div class="modal fade" id="profileModal" tabindex="-1" aria-labelledby="profileModalLabel" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-success text-white">
              <h5 class="modal-title" id="profileModalLabel">Завершение профиля</h5>
            </div>
            <div class="modal-body">
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
                  <label for="experience" class="form-label">Опыт (лет)</label>
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
                <button type="submit" class="btn btn-success w-100"><i class="fas fa-save me-2"></i> Сохранить</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Profile Modal -->
      <div class="modal fade" id="editProfileModal" tabindex="-1" aria-labelledby="editProfileModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-success text-white">
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
                  <label for="edit-experience" class="form-label">Опыт (лет)</label>
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
                <button type="submit" class="btn btn-success w-100"><i class="fas fa-save me-2"></i> Сохранить</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Enrolled Students Modal -->
      <div class="modal fade" id="enrolledStudentsModal" tabindex="-1" aria-labelledby="enrolledStudentsModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-success text-white">
              <h5 class="modal-title" id="enrolledStudentsModalLabel">Ученики</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div v-if="enrolledStudents.length > 0" class="table-responsive">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>Имя</th>
                      <th>Дата рождения</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(student, index) in enrolledStudents" :key="index">
                      <td>{{ student.name }}</td>
                      <td>{{ formatDate(student.birth_date) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="text-center text-muted p-4">
                <i class="fas fa-users-slash me-2"></i> Нет записанных учеников.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
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
      upcomingClasses: [],
      completedClasses: [],
      weeklyClasses: { upcoming: [], completed: [] },
      dailyClasses: [],
      salary: [],
      subjects: [],
      enrolledStudents: [],
      activeTab: 'profile',
      scheduleView: 'list',
      selectedMonth: '',
      weekStart: new Date().toISOString().split('T')[0],
      availableMonths: [],
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
      this.showToast('Сессия истекла или доступ запрещён', 'error');
      this.$router.push('/login');
      return;
    }
    this.fetchProfile();
    this.fetchUpcomingClasses();
    this.fetchCompletedClasses();
    this.fetchDailySchedule();
    this.fetchSalary();
    this.fetchSubjects();
    this.fetchAvailableMonths();
  },
  methods: {
    async fetchProfile() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        const response = await axios.get('http://localhost:3000/api/teachers/profile', { headers });
        this.profile = response.data;
        if (!this.profile.subject_id) {
          this.openProfileModal();
        }
      } catch (error) {
        this.handleError(error, 'Ошибка загрузки профиля');
      }
    },
    async fetchUpcomingClasses() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        const response = await axios.get('http://localhost:3000/api/classes/upcoming', { headers });
        this.upcomingClasses = response.data;
      } catch (error) {
        this.handleError(error, 'Ошибка загрузки предстоящих занятий');
      }
    },
    async fetchCompletedClasses() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        const response = await axios.get('http://localhost:3000/api/classes/completed', { headers });
        this.completedClasses = response.data;
      } catch (error) {
        this.handleError(error, 'Ошибка загрузки завершенных занятий');
      }
    },
    async fetchWeeklySchedule(type) {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        const endpoint = type === 'upcoming' ? '/api/classes/upcoming/weekly' : '/api/classes/completed/weekly';
        const response = await axios.get(`http://localhost:3000${endpoint}`, {
          headers,
          params: { startDate: this.weekStart },
        });
        this.weeklyClasses[type] = response.data;
      } catch (error) {
        this.handleError(error, `Ошибка загрузки недельного расписания (${type === 'upcoming' ? 'предстоящих' : 'завершенных'})`);
      }
    },
    async fetchDailySchedule() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await axios.get('http://localhost:3000/api/classes/daily', {
          headers,
          params: { date: today },
        });
        this.dailyClasses = response.data;
      } catch (error) {
        this.handleError(error, 'Ошибка загрузки расписания на сегодня');
      }
    },
    async fetchSalary() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        const params = this.selectedMonth ? { month: this.selectedMonth } : {};
        const response = await axios.get('http://localhost:3000/api/teachers/salary', { headers, params });
        this.salary = response.data;
      } catch (error) {
        this.handleError(error, 'Ошибка загрузки зарплаты');
      }
    },
    async fetchAvailableMonths() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        const response = await axios.get('http://localhost:3000/api/teachers/salary', { headers });
        this.availableMonths = response.data.map(item => item.month);
      } catch (error) {
        this.handleError(error, 'Ошибка загрузки месяцев');
      }
    },
    async fetchSubjects() {
      try {
        const response = await axios.get('http://localhost:3000/api/subjects');
        this.subjects = response.data;
      } catch (error) {
        this.handleError(error, 'Ошибка загрузки предметов');
      }
    },
    async showEnrolledStudents(classId) {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        const response = await axios.get(`http://localhost:3000/api/enrollments/${classId}`, { headers });
        this.enrolledStudents = response.data;
        const modal = new Modal(document.getElementById('enrolledStudentsModal'));
        modal.show();
      } catch (error) {
        this.handleError(error, 'Ошибка загрузки списка учеников');
      }
    },
    validatePhone() {
      const phonePattern = /^\+\d{10,15}$/;
      this.phoneError = !this.form.phone
        ? 'Телефон обязателен'
        : !phonePattern.test(this.form.phone)
        ? 'Формат: +1234567890 (10-15 цифр)'
        : '';
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
        this.showToast('Заполните все поля корректно', 'error');
        return;
      }
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        await axios.put('http://localhost:3000/api/teachers/profile', this.form, { headers });
        this.showToast('Профиль сохранён', 'success');
        await this.fetchProfile();
        const modal = Modal.getInstance(document.getElementById('profileModal'));
        modal.hide();
      } catch (error) {
        this.handleError(error, 'Ошибка сохранения профиля');
      }
    },
    async updateProfile() {
      if (this.phoneError || !this.form.phone || !this.form.education || !this.form.experience || !this.form.subject_id) {
        this.showToast('Заполните все поля корректно', 'error');
        return;
      }
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        await axios.put('http://localhost:3000/api/teachers/profile', this.form, { headers });
        this.showToast('Профиль обновлён', 'success');
        await this.fetchProfile();
        const modal = Modal.getInstance(document.getElementById('editProfileModal'));
        modal.hide();
      } catch (error) {
        this.handleError(error, 'Ошибка обновления профиля');
      }
    },
    setActiveTab(tab) {
      this.activeTab = tab;
      if (tab === 'schedule') {
        this.fetchUpcomingClasses();
        this.fetchCompletedClasses();
        this.fetchDailySchedule();
      }
      if (tab === 'salary') {
        this.fetchSalary();
        this.fetchAvailableMonths();
      }
    },
    setScheduleView(view) {
      this.scheduleView = view;
      if (view === 'weekly') {
        this.fetchWeeklySchedule('upcoming');
        this.fetchWeeklySchedule('completed');
      }
    },
    formatMonth(month) {
      const [year, monthNum] = month.split('-');
      return new Date(year, monthNum - 1).toLocaleString('ru-RU', { year: 'numeric', month: 'long' });
    },
    formatDateTime(date) {
      return new Date(date).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
    },
    formatTime(date) {
      return new Date(date).toLocaleTimeString('ru-RU', { timeStyle: 'short' });
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString('ru-RU');
    },
    formatSalary(salary) {
      return Number(salary).toFixed(2);
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
    logout() {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      this.$router.push('/login');
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
    'form.phone': 'validatePhone',
  },
};
</script>

<style scoped>
/* General layout */
.teacher-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #d5f7d5, #e8f5e9);
  font-family: 'Comic Sans MS', 'Segoe UI', sans-serif;
}

/* Sidebar */
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
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.sidebar h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2e7d32;
}

.nav-link {
  color: #2e7d32;
  cursor: pointer;
  font-weight: 500;
  padding: 10px 15px;
  border-radius: 5px;
  transition: background-color 0.3s ease, color 0.3s ease;
  display: flex;
  align-items: center;
}

.nav-link i {
  font-size: 1.1rem;
  margin-right: 5px;
}

.nav-link:hover {
  background-color: #e8f5e9;
}

.nav-link.active {
  background-color: #2e7d32;
  color: white;
}

.nav-link.text-danger {
  color: #dc3545;
}

.nav-link.text-danger:hover {
  background-color: #f8d7da;
}

/* Main content */
.main-content {
  margin-left: 270px;
  padding: 40px;
}

.main-content h1 {
  font-size: 2.25rem;
  font-weight: 700;
  color: #2e7d32;
}

.main-content h2 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.main-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
}

/* Cards */
.card {
  border: none;
  border-radius: 15px;
  background: linear-gradient(145deg, #ffffff, #f0f8f0);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

/* List group for profile */
.list-group-item {
  border: none;
  padding: 10px 0;
  font-size: 1rem;
  color: #333;
  background: transparent;
}

.list-group-item strong {
  color: #2e7d32;
  margin-right: 10px;
}

/* Tables */
.table {
  background: #ffffff;
  border-radius: 10px;
  overflow: hidden;
}

.table-striped tbody tr:nth-of-type(odd) {
  background-color: rgba(0, 0, 0, 0.05);
}

.table-success {
  background-color: #2e7d32 !important;
  color: white;
}

.table th {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.9rem;
  letter-spacing: 0.5px;
}

.table td {
  vertical-align: middle;
  font-size: 1rem;
  color: #333;
}

.table a {
  color: #2e7d32;
  text-decoration: none;
  font-weight: 500;
}

.table a:hover {
  text-decoration: underline;
  color: #256528;
}

/* Buttons */
.btn-dark-green {
  background-color: #2e7d32;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: 500;
  transition: background-color 0.3s ease;
}

.btn-dark-green:hover {
  background-color: #256528;
}

.btn-dark-green i {
  margin-right: 5px;
}

.btn-dark-green:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 8px;
  transition: background-color 0.3s ease;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

/* Form controls */
.form-control,
.form-select {
  border-radius: 8px;
  border: 1px solid #ced4da;
  padding: 10px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-control:focus,
.form-select:focus {
  border-color: #2e7d32;
  box-shadow: 0 0 0 0.2rem rgba(46, 125, 50, 0.25);
}

.form-label {
  font-weight: 500;
  color: #333;
}

/* Modals */
.modal-content {
  border-radius: 12px;
  border: none;
  background: linear-gradient(145deg, #ffffff, #f0f8f0);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.modal-header {
  background-color: #2e7d32;
  color: white;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

.modal-title {
  font-weight: 600;
}

.btn-close {
  filter: invert(1);
}

.modal-body {
  padding: 20px;
}

/* Badges */
.badge {
  font-size: 0.9em;
  padding: 0.3em 0.6em;
}

/* Empty state messages */
.text-muted {
  font-size: 1.1rem;
  color: #6c757d;
}

.text-muted i {
  font-size: 1.2rem;
  vertical-align: middle;
}

/* Responsive design */
@media (max-width: 992px) {
  .sidebar {
    width: 200px;
  }

  .main-content {
    margin-left: 220px;
    padding: 30px;
  }

  .main-content h1 {
    font-size: 2rem;
  }

  .main-content h2 {
    font-size: 1.5rem;
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    height: auto;
    position: static;
    border-right: none;
    border-bottom: 1px solid #ddd;
    padding: 15px;
  }

  .main-content {
    margin-left: 0;
    padding: 20px;
  }

  .nav-link {
    padding: 8px 10px;
  }

  .card {
    padding: 15px;
  }

  .table th,
  .table td {
    font-size: 0.9rem;
  }

  .btn-dark-green,
  .btn-secondary {
    padding: 6px 12px;
    font-size: 0.9rem;
  }
}

@media (max-width: 576px) {
  .main-content h1 {
    font-size: 1.75rem;
  }

  .main-content h2 {
    font-size: 1.25rem;
  }

  .table-responsive {
    font-size: 0.85rem;
  }

  .form-control,
  .form-select {
    font-size: 0.9rem;
  }

  .modal-dialog {
    margin: 10px;
  }
}
</style>