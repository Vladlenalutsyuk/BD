<template>
  <div class="admin-page">
    <div class="header">
      <h1 class="mb-4 text-center text-success">Панель администратора</h1>
      <button @click="logout" class="btn btn-dark-green logout-btn">Выйти</button>
    </div>

    <!-- Вкладки -->
    <ul class="nav nav-tabs mb-4">
      <li class="nav-item">
        <a class="nav-link" :class="{ active: activeTab === 'classes' }" @click="activeTab = 'classes'">Занятия</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" :class="{ active: activeTab === 'teachers' }" @click="activeTab = 'teachers'">Учителя</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" :class="{ active: activeTab === 'parentsChildren' }" @click="activeTab = 'parentsChildren'">Родители и дети</a>
      </li>
    </ul>

    <!-- Вкладка: Занятия -->
    <div v-if="activeTab === 'classes'">
      <!-- Кнопка добавления занятия -->
      <button class="btn btn-primary mb-3" @click="showAddForm = true">Добавить занятие</button>

      <!-- Фильтр по предмету -->
      <div class="mb-4">
        <label class="me-2">Фильтр по предмету:</label>
        <select v-model="selectedSubjectFilter" @change="filterCalendarEvents" class="form-select d-inline-block w-auto">
          <option value="">Все предметы</option>
          <option v-for="subject in subjects" :key="subject.id" :value="subject.id">{{ subject.name }}</option>
        </select>
      </div>

      <!-- Календарь -->
      <div class="calendar-container">
        <FullCalendar :options="calendarOptions" />
      </div>

      <!-- Форма добавления/редактирования занятия -->
      <div v-if="showAddForm" class="mt-4 card shadow-lg p-4">
        <h2>{{ isEditing ? 'Редактировать занятие' : 'Добавить занятие' }}</h2>
        <form @submit.prevent="isEditing ? updateClass() : addClass()">
          <div class="mb-3">
            <label for="subject" class="form-label">Предмет</label>
            <select v-model="newClass.subject_id" @change="onSubjectChange" class="form-select" id="subject" required>
              <option value="">Выберите предмет</option>
              <option v-for="subject in subjects" :key="subject.id" :value="subject.id">{{ subject.name }}</option>
            </select>
          </div>
          <div class="mb-3">
            <label for="teacher" class="form-label">Преподаватель</label>
            <select v-model="newClass.teacher_id" class="form-select" id="teacher" required :disabled="!newClass.subject_id || availableTeachers.length === 0">
              <option value="">Выберите преподавателя</option>
              <option v-for="teacher in availableTeachers" :key="teacher.id" :value="teacher.id">{{ teacher.username }}</option>
            </select>
            <small v-if="newClass.subject_id && availableTeachers.length === 0" class="text-danger">
              Нет доступных преподавателей для этого предмета
            </small>
          </div>
          <div class="mb-3">
            <label for="schedule" class="form-label">Дата и время</label>
            <input v-model="newClass.schedule" type="datetime-local" class="form-control" id="schedule" required />
          </div>
          <div class="mb-3">
            <label for="room" class="form-label">Кабинет</label>
            <select v-model="newClass.room_id" class="form-select" id="room">
              <option value="">Без кабинета</option>
              <option v-for="room in rooms" :key="room.id" :value="room.id">{{ room.name }}</option>
            </select>
          </div>
          <div class="mb-3">
            <label for="price" class="form-label">Стоимость</label>
            <input v-model="newClass.price" type="number" step="0.01" class="form-control" id="price" placeholder="0.00" required />
          </div>
          <div class="mb-3">
            <label for="class_type" class="form-label">Тип занятия</label>
            <select v-model="newClass.class_type" class="form-select" id="class_type" required @change="onClassTypeChange">
              <option value="">Выберите тип</option>
              <option value="group">Групповое</option>
              <option value="individual">Индивидуальное</option>
            </select>
          </div>
          <div class="mb-3" v-if="newClass.class_type === 'group'">
            <label for="age_group" class="form-label">Возрастная группа</label>
            <select v-model="newClass.age_group" class="form-select" id="age_group" required>
              <option value="">Выберите возрастную группу</option>
              <option value="3-6">3-6 лет</option>
              <option value="7-11">7-11 лет</option>
              <option value="12-16">12-16 лет</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary">{{ isEditing ? 'Сохранить' : 'Добавить' }}</button>
          <button type="button" class="btn btn-secondary ms-2" @click="resetForm">Отмена</button>
        </form>
      </div>

      <!-- Модальное окно для деталей занятия -->
      <div v-if="selectedClass" class="modal fade show d-block" tabindex="-1" style="background: rgba(0, 0, 0, 0.5);">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content shadow-lg">
            <div class="modal-header bg-success text-white">
              <h5 class="modal-title">Детали занятия: {{ selectedClass.subject }}</h5>
              <button type="button" class="btn-close btn-close-white" @click="clearSelection"></button>
            </div>
            <div class="modal-body">
              <p><strong>Тип занятия:</strong> 
                <span :class="selectedClass.class_type === 'individual' ? 'badge bg-primary' : 'badge bg-success'">
                  {{ selectedClass.class_type === 'individual' ? 'Индивидуальное' : 'Групповое' }}
                </span>
              </p>
              <p v-if="selectedClass.class_type === 'group'"><strong>Возрастная группа:</strong> {{ selectedClass.min_age }}-{{ selectedClass.max_age }} лет</p>
              <p><strong>Время:</strong> {{ new Date(selectedClass.schedule).toLocaleString('ru-RU') }}</p>
              <p><strong>Кабинет:</strong> {{ selectedClass.room || 'Не указан' }}</p>
              <p><strong>Стоимость:</strong> {{ selectedClass.price || 0 }} руб.</p>
              <h6>Записанные дети:</h6>
              <ul class="list-group">
                <li v-for="child in enrolledChildren" :key="child.id" class="list-group-item">
                  {{ child.name }} (Дата рождения: {{ new Date(child.birth_date).toLocaleDateString('ru-RU') }})
                </li>
                <li v-if="!enrolledChildren.length" class="list-group-item text-muted">Нет записанных детей</li>
              </ul>
            </div>
            <div class="modal-footer">
              <button class="btn btn-primary" @click="editClass">Редактировать</button>
              <button class="btn btn-danger" @click="deleteClass(selectedClass.id)">Удалить</button>
              <button class="btn btn-secondary" @click="clearSelection">Закрыть</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Вкладка: Учителя -->
    <div v-if="activeTab === 'teachers'">
      <!-- Форма добавления учителя -->
      <div class="card shadow-lg p-4 mb-4">
        <h2>Добавить нового учителя</h2>
        <form @submit.prevent="addTeacher">
          <div class="mb-3">
            <label for="teacherUsername" class="form-label">Имя пользователя</label>
            <input v-model="newTeacher.username" type="text" id="teacherUsername" class="form-control" required />
          </div>
          <div class="mb-3">
            <label for="teacherEmail" class="form-label">Email</label>
            <input v-model="newTeacher.email" type="email" id="teacherEmail" class="form-control" required />
          </div>
          <div class="mb-3">
            <label for="teacherPassword" class="form-label">Пароль</label>
            <input v-model="newTeacher.password" type="password" id="teacherPassword" class="form-control" required />
          </div>
          <button type="submit" class="btn btn-primary">Создать учителя</button>
        </form>
      </div>

      <!-- Список учителей -->
      <h2>Список преподавателей</h2>
      <table class="table table-striped shadow-lg">
        <thead class="table-success">
          <tr>
            <th>Имя</th>
            <th>Email</th>
            <th>Предмет</th>
            <th>Телефон</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="teacher in teachersList" :key="teacher.id">
            <td>{{ teacher.username }}</td>
            <td>{{ teacher.email }}</td>
            <td>{{ teacher.subject_name || 'Не указан' }}</td>
            <td>{{ teacher.phone || 'Не указан' }}</td>
            <td>
              <button class="btn btn-danger btn-sm" @click="deleteTeacher(teacher.user_id)">Удалить</button>
            </td>
          </tr>
          <tr v-if="!teachersList.length">
            <td colspan="5" class="text-center">Преподаватели не найдены</td>
          </tr>
        </tbody>
      </table>

      <!-- Статистика учителей -->
      <h2 class="mt-4">Статистика преподавателей</h2>
      <button class="btn btn-primary mb-3" @click="exportTeacherStatsToCSV">Экспорт в CSV</button>
      <div class="row">
        <div v-for="stat in teacherStats" :key="stat.teacher_name + stat.subject_name" class="col-md-4 mb-3">
          <div class="card shadow-lg h-100">
            <div class="card-body text-center">
              <h5 class="card-title">{{ stat.teacher_name }}</h5>
              <p class="card-text"><strong>Предмет:</strong> {{ stat.subject_name }}</p>
              <p class="card-text"><strong>Занятий:</strong> {{ stat.class_count }}</p>
              <p class="card-text"><strong>Учеников:</strong> {{ stat.total_students }}</p>
              <p class="card-text"><strong>Выручка:</strong> {{ stat.total_revenue }} руб.</p>
            </div>
          </div>
        </div>
        <div v-if="!teacherStats.length" class="col-12 text-center">
          <p class="text-muted">Статистика недоступна</p>
        </div>
      </div>
    </div>

    <!-- Вкладка: Родители и дети -->
    <div v-if="activeTab === 'parentsChildren'">
      <h2 class="mt-4">Родители и дети</h2>
      <!-- Поиск -->
      <div class="mb-4">
        <label class="me-2">Поиск по имени:</label>
        <input v-model="searchQuery" type="text" class="form-control d-inline-block w-50" placeholder="Введите имя родителя или ребёнка..." />
      </div>

      <!-- Список родителей и детей -->
      <div v-for="parent in filteredParentsChildren" :key="parent.id" class="card shadow-lg mb-3">
        <div class="card-body">
          <h4 class="card-title text-success">{{ parent.username }}</h4>
          <p><strong>Email:</strong> {{ parent.email }}</p>
          <p><strong>Телефон:</strong> {{ parent.phone }}</p>
          <h5 class="mt-3">Дети:</h5>
          <table class="table table-striped">
            <thead>
              <tr>
                <th>Имя</th>
                <th>Дата рождения</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="child in parent.children" :key="child.id">
                <td>{{ child.name }}</td>
                <td>{{ new Date(child.birth_date).toLocaleDateString('ru-RU') }}</td>
              </tr>
              <tr v-if="!parent.children.length">
                <td colspan="2" class="text-center">Нет детей</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-if="!filteredParentsChildren.length" class="text-center text-muted">
        <p>Родители не найдены</p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';

export default {
  components: { FullCalendar },
  data() {
    return {
      activeTab: 'classes',
      classes: [],
      subjects: [],
      rooms: [],
      teachers: [],
      availableTeachers: [],
      teachersList: [],
      teacherStats: [],
      parentsChildren: [],
      searchQuery: '',
      showAddForm: false,
      isEditing: false,
      editingClassId: null,
      newClass: {
        subject_id: '',
        teacher_id: '',
        schedule: '',
        room_id: '',
        price: '',
        class_type: '',
        age_group: '',
      },
      selectedClass: null,
      selectedEvent: null,
      selectedSubjectFilter: '',
      enrolledChildren: [],
      newTeacher: {
        username: '',
        email: '',
        password: '',
      },
      calendarOptions: {
        plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
        initialView: 'dayGridMonth',
        events: [],
        editable: true,
        selectable: true,
        eventClick: this.handleEventClick,
        eventDrop: this.handleEventDrop,
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
        },
        locale: 'ru',
        buttonText: {
          today: 'Сегодня',
          month: 'Месяц',
          week: 'Неделя',
          day: 'День',
          list: 'Список',
        },
        height: 'auto',
        contentHeight: 'auto',
        eventBackgroundColor: '#2e7d32',
        eventBorderColor: '#256528',
      },
    };
  },
  computed: {
    filteredParentsChildren() {
      if (!this.searchQuery) return this.parentsChildren;
      const query = this.searchQuery.toLowerCase();
      return this.parentsChildren.filter(parent => {
        const parentMatch = parent.username.toLowerCase().includes(query);
        const childMatch = parent.children.some(child => child.name.toLowerCase().includes(query));
        return parentMatch || childMatch;
      });
    },
  },
  methods: {
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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
    async fetchClasses() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        const response = await axios.get('http://localhost:3000/api/classes', { headers });
        this.classes = response.data;
        this.updateCalendarEvents();
      } catch (error) {
        this.handleError(error, 'Ошибка при загрузке занятий');
      }
    },
    async fetchSubjects() {
      try {
        const response = await axios.get('http://localhost:3000/api/subjects');
        this.subjects = response.data;
      } catch (error) {
        this.showToast('Ошибка при загрузке предметов: ' + (error.response?.data?.error || error.message), 'error');
      }
    },
    async fetchRooms() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        const response = await axios.get('http://localhost:3000/api/rooms', { headers });
        this.rooms = response.data;
      } catch (error) {
        this.handleError(error, 'Ошибка при загрузке кабинетов');
      }
    },
    async fetchTeachers() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        const response = await axios.get('http://localhost:3000/api/teachers', { headers });
        this.teachers = response.data;
      } catch (error) {
        this.handleError(error, 'Ошибка при загрузке преподавателей');
      }
    },
    async fetchTeachersBySubject(subjectId) {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        const response = await axios.get(`http://localhost:3000/api/teachers/by-subject/${subjectId}`, { headers });
        this.availableTeachers = response.data;
        if (this.availableTeachers.length > 0 && !this.newClass.teacher_id) {
          this.newClass.teacher_id = this.availableTeachers[0].id;
        } else if (this.availableTeachers.length === 0) {
          this.newClass.teacher_id = '';
        }
      } catch (error) {
        this.handleError(error, 'Ошибка при загрузке преподавателей по предмету');
        this.availableTeachers = [];
        this.newClass.teacher_id = '';
      }
    },
    async fetchTeachersList() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        const response = await axios.get('http://localhost:3000/api/users/teachers', { headers });
        this.teachersList = response.data;
      } catch (error) {
        this.handleError(error, 'Ошибка при загрузке списка преподавателей');
      }
    },
    async fetchTeacherStats() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        const response = await axios.get('http://localhost:3000/api/statistics/teachers', { headers });
        this.teacherStats = response.data;
      } catch (error) {
        this.handleError(error, 'Ошибка при загрузке статистики');
      }
    },
    async fetchParentsChildren() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        const response = await axios.get('http://localhost:3000/api/users/parents-children', { headers });
        this.parentsChildren = response.data;
      } catch (error) {
        this.handleError(error, 'Ошибка при загрузке списка родителей и детей');
        this.parentsChildren = [];
      }
    },
    async addClass() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        const newClass = {
          subject_id: parseInt(this.newClass.subject_id),
          teacher_id: parseInt(this.newClass.teacher_id),
          schedule: this.newClass.schedule,
          room_id: this.newClass.room_id ? parseInt(this.newClass.room_id) : null,
          price: parseFloat(this.newClass.price) || 0.00,
          class_type: this.newClass.class_type,
          min_age: this.newClass.class_type === 'group' ? parseInt(this.newClass.age_group.split('-')[0]) : 3,
          max_age: this.newClass.class_type === 'group' ? parseInt(this.newClass.age_group.split('-')[1]) : 16,
        };
        await axios.post('http://localhost:3000/api/classes', newClass, { headers });
        this.showToast('Занятие добавлено!', 'success');
        this.resetForm();
        this.fetchClasses();
      } catch (error) {
        this.handleError(error, 'Ошибка при добавлении занятия');
      }
    },
    async updateClass() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        const updatedClass = {
          subject_id: parseInt(this.newClass.subject_id),
          teacher_id: parseInt(this.newClass.teacher_id),
          schedule: this.newClass.schedule,
          room_id: this.newClass.room_id ? parseInt(this.newClass.room_id) : null,
          price: parseFloat(this.newClass.price) || 0.00,
          class_type: this.newClass.class_type,
          min_age: this.newClass.class_type === 'group' ? parseInt(this.newClass.age_group.split('-')[0]) : 3,
          max_age: this.newClass.class_type === 'group' ? parseInt(this.newClass.age_group.split('-')[1]) : 16,
        };
        await axios.put(`http://localhost:3000/api/classes/${this.editingClassId}`, updatedClass, { headers });
        this.showToast('Занятие обновлено!', 'success');
        this.resetForm();
        this.fetchClasses();
      } catch (error) {
        this.handleError(error, 'Ошибка при обновлении занятия');
      }
    },
    async deleteClass(classId) {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      if (!confirm('Вы уверены, что хотите удалить это занятие?')) return;
      try {
        await axios.delete(`http://localhost:3000/api/classes/${classId}`, { headers });
        this.showToast('Занятие удалено!', 'success');
        this.clearSelection();
        this.fetchClasses();
      } catch (error) {
        this.handleError(error, 'Ошибка при удалении занятия');
      }
    },
    async addTeacher() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      if (!this.newTeacher.username || !this.newTeacher.email || !this.newTeacher.password) {
        this.showToast('Все поля обязательны', 'error');
        return;
      }
      try {
        await axios.post('http://localhost:3000/api/teachers', this.newTeacher, { headers });
        this.showToast('Учитель создан!', 'success');
        this.newTeacher = { username: '', email: '', password: '' };
        this.fetchTeachersList();
      } catch (error) {
        this.handleError(error, 'Ошибка при создании учителя');
      }
    },
    async deleteTeacher(userId) {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      if (!confirm('Вы уверены, что хотите удалить этого учителя?')) return;
      try {
        await axios.delete(`http://localhost:3000/api/teachers/${userId}`, { headers });
        this.showToast('Учитель удалён!', 'success');
        this.fetchTeachersList();
      } catch (error) {
        this.handleError(error, 'Ошибка при удалении учителя');
      }
    },
    async fetchEnrolledChildren(classId) {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        const response = await axios.get(`http://localhost:3000/api/enrollments/${classId}`, { headers });
        this.enrolledChildren = response.data;
      } catch (error) {
        this.handleError(error, 'Ошибка при загрузке списка учеников');
      }
    },
    handleEventClick(info) {
      const event = info.event;
      this.selectedClass = this.classes.find(cls => cls.id == event.id);
      this.selectedEvent = event;
      this.fetchEnrolledChildren(event.id);
    },
    editClass() {
      if (!this.selectedEvent || !this.selectedClass) return;
      const props = this.selectedEvent.extendedProps;
      this.newClass = {
        subject_id: props.subject_id,
        teacher_id: props.teacher_id,
        schedule: this.selectedEvent.start.toISOString().slice(0, 16),
        room_id: props.room_id || '',
        price: props.price || '',
        class_type: this.selectedClass.class_type,
        age_group: this.selectedClass.class_type === 'group' ? `${this.selectedClass.min_age}-${this.selectedClass.max_age}` : '',
      };
      this.isEditing = true;
      this.editingClassId = this.selectedEvent.id;
      this.showAddForm = true;
      this.clearSelection();
      if (this.newClass.subject_id) {
        this.fetchTeachersBySubject(this.newClass.subject_id);
      }
    },
    clearSelection() {
      this.selectedClass = null;
      this.selectedEvent = null;
      this.enrolledChildren = [];
    },
    handleEventDrop(info) {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        const classId = info.event.id;
        const newSchedule = info.event.start.toISOString();
        axios.put(`http://localhost:3000/api/classes/${classId}`, { schedule: newSchedule }, { headers })
          .then(() => {
            this.showToast('Расписание обновлено!', 'success');
            this.fetchClasses();
          })
          .catch(error => {
            this.handleError(error, 'Ошибка при обновлении расписания');
            info.revert();
          });
      } catch (error) {
        this.handleError(error, 'Ошибка при обновлении расписания');
        info.revert();
      }
    },
    resetForm() {
      this.showAddForm = false;
      this.isEditing = false;
      this.editingClassId = null;
      this.newClass = {
        subject_id: '',
        teacher_id: '',
        schedule: '',
        room_id: '',
        price: '',
        class_type: '',
        age_group: '',
      };
      this.availableTeachers = [];
    },
    onClassTypeChange() {
      if (this.newClass.class_type !== 'group') {
        this.newClass.age_group = '';
      }
    },
    onSubjectChange() {
      if (this.newClass.subject_id) {
        this.fetchTeachersBySubject(this.newClass.subject_id);
      } else {
        this.availableTeachers = [];
        this.newClass.teacher_id = '';
      }
    },
    handleError(error, defaultMessage) {
      if (error.response?.status === 403) {
        this.showToast('Сессия истекла, войдите снова', 'error');
        this.logout();
      } else if (error.response?.status === 400 && error.response.data?.error?.includes('Конфликт расписания')) {
        this.showToast(error.response.data.error, 'error');
      } else {
        this.showToast(`${defaultMessage}: ${error.response?.data?.error || error.message}`, 'error');
      }
    },
    showToast(message, type = 'error') {
      if (this.$toast) {
        this.$toast[type](message);
      } else {
        console[type === 'error' ? 'error' : 'log'](`Toast (${type}): ${message}`);
      }
    },
    exportTeacherStatsToCSV() {
      const headers = ['Преподаватель', 'Предмет', 'Количество занятий', 'Количество учеников', 'Общая выручка'];
      const rows = this.teacherStats.map(stat => [
        stat.teacher_name,
        stat.subject_name,
        stat.class_count,
        stat.total_students,
        stat.total_revenue,
      ]);
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(',')),
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'teacher_stats.csv';
      link.click();
    },
    updateCalendarEvents() {
      let filteredClasses = this.classes;
      if (this.selectedSubjectFilter) {
        filteredClasses = this.classes.filter(cls => cls.subject_id === parseInt(this.selectedSubjectFilter));
      }
      this.calendarOptions.events = filteredClasses.map(cls => ({
        id: cls.id,
        title: `${cls.subject} (${cls.teacher_name || 'Нет преподавателя'}) - ${cls.class_type === 'individual' ? 'Индивидуальное' : `Групповое (${cls.min_age}-${cls.max_age} лет)`} - ${cls.price || 0} руб.`,
        start: cls.schedule,
        backgroundColor: cls.class_type === 'individual' ? '#007bff' : '#2e7d32',
        borderColor: cls.class_type === 'individual' ? '#0056b3' : '#256528',
        extendedProps: {
          room_id: cls.room_id,
          room: cls.room,
          price: cls.price,
          subject_id: cls.subject_id,
          teacher_id: cls.teacher_id,
        },
      }));
    },
    filterCalendarEvents() {
      this.updateCalendarEvents();
    },
  },
  watch: {
    classes() {
      this.updateCalendarEvents();
    },
  },
  mounted() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const token = localStorage.getItem('token');
    if (!user || !token || user.role !== 'admin') {
      this.showToast('Сессия истекла или доступ запрещён, войдите снова', 'error');
      this.logout();
      return;
    }
    this.fetchClasses();
    this.fetchSubjects();
    this.fetchRooms();
    this.fetchTeachers();
    this.fetchTeachersList();
    this.fetchTeacherStats();
    this.fetchParentsChildren();
  },
};
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background-color: #d5f7d5;
  padding: 20px;
  font-family: 'Comic Sans MS', 'Segoe UI', sans-serif;
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

.btn-primary {
  background-color: #2e7d32;
  border: none;
}
.btn-primary:hover {
  background-color: #256528;
}

.btn-danger {
  background-color: #d32f2f;
}
.btn-danger:hover {
  background-color: #b71c1c;
}

.btn-secondary {
  background-color: #6c757d;
}
.btn-secondary:hover {
  background-color: #5a6268;
}

.table {
  background: #f8f9fa;
  border-radius: 5px;
}
.table-striped tbody tr:nth-of-type(odd) {
  background-color: rgba(0, 0, 0, 0.05);
}

.nav-tabs .nav-link.active {
  background-color: #2e7d32;
  color: white;
}

.calendar-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 10px;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  border: 1px solid #2e7d32;
}

:deep(.fc) {
  font-family: 'Comic Sans MS', 'Segoe UI', sans-serif;
}

:deep(.fc .fc-toolbar) {
  background: #2e7d32;
  color: white;
  border-radius: 5px 5px 0 0;
  padding: 10px;
}

:deep(.fc .fc-toolbar-title) {
  font-size: 1.2rem;
}

:deep(.fc .fc-button) {
  background-color: #256528;
  border: none;
  color: white;
}

:deep(.fc .fc-button:hover) {
  background-color: #1b4b1e;
}

:deep(.fc .fc-daygrid-day) {
  background: #f8f9fa;
}

:deep(.fc .fc-daygrid-day:hover) {
  background: #e0f7fa;
}

:deep(.fc .fc-daygrid-day-number) {
  color: #2e7d32;
}

:deep(.fc .fc-day-today) {
  background: #ffeb3b !important;
}

:deep(.fc .fc-day-today .fc-daygrid-day-number) {
  color: #2e7d32 !important;
  font-weight: bold;
}

:deep(.fc .fc-event) {
  border-radius: 5px;
  font-size: 0.9rem;
}

.modal-content {
  border-radius: 10px;
  border: none;
}

.modal-header {
  border-bottom: none;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  border-top: none;
}

.list-group-item {
  border: none;
  padding: 10px 0;
}

.card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.card-title {
  color: #2e7d32;
}

.badge {
  font-size: 0.9em;
  padding: 0.3em 0.6em;
}
</style>