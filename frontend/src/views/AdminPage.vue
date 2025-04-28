<template>
  <div class="admin-page">
    <!-- Sidebar -->
    <div class="sidebar">
      <h3 class="mb-4">Меню</h3>
      <div
        class="nav-link"
        :class="{ active: activeTab === 'dashboard' }"
        @click="activeTab = 'dashboard'"
      >
        <i class="bi bi-house-door"></i> Главная
      </div>
      <div
        class="nav-link"
        :class="{ active: activeTab === 'teachers' }"
        @click="activeTab = 'teachers'"
      >
        <i class="bi bi-person"></i> Управление учителями
      </div>
      <div
        class="nav-link"
        :class="{ active: activeTab === 'classes' }"
        @click="activeTab = 'classes'"
      >
        <i class="bi bi-calendar"></i> Управление занятиями
      </div>
      <div
        class="nav-link"
        :class="{ active: activeTab === 'parents' }"
        @click="activeTab = 'parents'"
      >
        <i class="bi bi-people"></i> Родители и дети
      </div>
      <div
        class="nav-link"
        :class="{ active: activeTab === 'statistics' }"
        @click="activeTab = 'statistics'"
      >
        <i class="bi bi-bar-chart"></i> Статистика
      </div>
      <div class="nav-link text-danger" @click="logout">
        <i class="bi bi-box-arrow-right"></i> Выйти
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center">
        <h3>Загрузка данных...</h3>
      </div>

      <!-- Error State -->
      <div v-else-if="hasError" class="text-center">
        <h3>Ошибка загрузки данных</h3>
        <p>{{ errorMessage }}</p>
        <button class="btn btn-dark-green" @click="logout">Выйти и войти снова</button>
      </div>

      <!-- Dashboard Tab -->
      <div v-else-if="activeTab === 'dashboard'">
        <h1>Добро пожаловать, администратор!</h1>
        <div class="row">
          <div class="col-md-4 mb-4">
            <div class="card p-3">
              <h3>Всего учителей</h3>
              <p class="display-6">{{ teachers.length }}</p>
            </div>
          </div>
          <div class="col-md-4 mb-4">
            <div class="card p-3">
              <h3>Всего занятий</h3>
              <p class="display-6">{{ classes.length }}</p>
            </div>
          </div>
          <div class="col-md-4 mb-4">
            <div class="card p-3">
              <h3>Всего родителей</h3>
              <p class="display-6">{{ parents.length }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Manage Teachers Tab -->
      <div v-else-if="activeTab === 'teachers'">
        <h2>Управление учителями</h2>
        <div class="mb-4">
          <h3>Добавить нового учителя</h3>
          <form @submit.prevent="createTeacher">
            <div class="row">
              <div class="col-md-4 mb-3">
                <label for="teacher-username" class="form-label">Имя пользователя</label>
                <input
                  type="text"
                  class="form-control"
                  id="teacher-username"
                  v-model="newTeacher.username"
                  required
                />
              </div>
              <div class="col-md-4 mb-3">
                <label for="teacher-email" class="form-label">Email</label>
                <input
                  type="email"
                  class="form-control"
                  id="teacher-email"
                  v-model="newTeacher.email"
                  required
                />
              </div>
              <div class="col-md-4 mb-3">
                <label for="teacher-password" class="form-label">Пароль</label>
                <input
                  type="password"
                  class="form-control"
                  id="teacher-password"
                  v-model="newTeacher.password"
                  required
                />
              </div>
            </div>
            <button type="submit" class="btn btn-dark-green">Добавить учителя</button>
          </form>
        </div>
        <h3>Список учителей</h3>
        <div class="table-responsive">
          <table class="table table-striped">
            <thead class="table-success">
              <tr>
                <th>Имя</th>
                <th>Email</th>
                <th>Телефон</th>
                <th>Предмет</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="teacher in teachers" :key="teacher.user_id">
                <td>{{ teacher.username }}</td>
                <td>{{ teacher.email }}</td>
                <td>{{ teacher.phone || 'Не указан' }}</td>
                <td>{{ teacher.subject_name || 'Не указан' }}</td>
                <td>
                  <button
                    class="btn btn-danger btn-sm"
                    @click="deleteTeacher(teacher.user_id)"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Manage Classes Tab -->
      <div v-else-if="activeTab === 'classes'">
        <h2>Управление занятиями</h2>
        <div class="mb-4">
          <h3>Добавить новое занятие</h3>
          <form @submit.prevent="createClass">
            <div class="row">
              <div class="col-md-4 mb-3">
                <label for="subject" class="form-label">Предмет</label>
                <select class="form-select" v-model="newClass.subject_id" required>
                  <option value="" disabled>Выберите предмет</option>
                  <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
                    {{ subject.name }}
                  </option>
                </select>
              </div>
              <div class="col-md-4 mb-3">
                <label for="teacher" class="form-label">Учитель</label>
                <select class="form-select" v-model="newClass.teacher_id" required>
                  <option value="" disabled>Выберите учителя</option>
                  <option v-for="teacher in filteredTeachers" :key="teacher.user_id" :value="teacher.user_id">
                    {{ teacher.username }}
                  </option>
                </select>
              </div>
              <div class="col-md-4 mb-3">
                <label for="schedule" class="form-label">Дата и время</label>
                <input
                  type="datetime-local"
                  class="form-control"
                  v-model="newClass.schedule"
                  required
                />
              </div>
            </div>
            <div class="row">
              <div class="col-md-4 mb-3">
                <label for="room" class="form-label">Кабинет</label>
                <select class="form-select" v-model="newClass.room_id">
                  <option value="">Без кабинета</option>
                  <option v-for="room in rooms" :key="room.id" :value="room.id">
                    {{ room.name }}
                  </option>
                </select>
              </div>
              <div class="col-md-4 mb-3">
                <label for="price" class="form-label">Цена (руб.)</label>
                <input
                  type="number"
                  class="form-control"
                  v-model.number="newClass.price"
                  required
                />
              </div>
              <div class="col-md-4 mb-3">
                <label for="class-type" class="form-label">Тип занятия</label>
                <select class="form-select" v-model="newClass.class_type" required>
                  <option value="" disabled>Выберите тип</option>
                  <option value="group">Групповое</option>
                  <option value="individual">Индивидуальное</option>
                </select>
              </div>
            </div>
            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="min-age" class="form-label">Минимальный возраст</label>
                <input
                  type="number"
                  class="form-control"
                  v-model.number="newClass.min_age"
                  min="3"
                  max="15"
                />
              </div>
              <div class="col-md-6 mb-3">
                <label for="max-age" class="form-label">Максимальный возраст</label>
                <input
                  type="number"
                  class="form-control"
                  v-model.number="newClass.max_age"
                  min="4"
                  max="16"
                />
              </div>
            </div>
            <button type="submit" class="btn btn-dark-green">Добавить занятие</button>
          </form>
        </div>
        <h3>Список занятий</h3>
        <div class="table-responsive">
          <table class="table table-striped">
            <thead class="table-success">
              <tr>
                <th>Предмет</th>
                <th>Учитель</th>
                <th>Дата и время</th>
                <th>Кабинет</th>
                <th>Цена (руб.)</th>
                <th>Тип</th>
                <th>Возраст</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="classItem in classes" :key="classItem.id">
                <td>{{ classItem.subject }}</td>
                <td>{{ classItem.teacher_name || 'Не назначен' }}</td>
                <td>{{ new Date(classItem.schedule).toLocaleString('ru-RU') }}</td>
                <td>{{ classItem.room || 'Не указан' }}</td>
                <td>{{ classItem.price }}</td>
                <td>{{ classItem.class_type === 'group' ? 'Групповое' : 'Индивидуальное' }}</td>
                <td>{{ classItem.min_age }} - {{ classItem.max_age }}</td>
                <td>
                  <span class="badge" :class="classItem.completed ? 'bg-success' : 'bg-warning'">
                    {{ classItem.completed ? 'Завершено' : 'Ожидается' }}
                  </span>
                </td>
                <td>
                  <button
                    class="btn btn-dark-green btn-sm me-2"
                    @click="openEditClassModal(classItem)"
                  >
                    Редактировать
                  </button>
                  <button
                    v-if="!classItem.completed"
                    class="btn btn-success btn-sm me-2"
                    @click="markClassCompleted(classItem.id)"
                  >
                    Завершить
                  </button>
                  <button
                    class="btn btn-danger btn-sm"
                    @click="deleteClass(classItem.id)"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Manage Parents Tab -->
      <div v-else-if="activeTab === 'parents'">
        <h2>Управление родителями</h2>
        <h3>Список родителей и детей</h3>
        <div class="table-responsive">
          <table class="table table-striped">
            <thead class="table-success">
              <tr>
                <th>Имя родителя</th>
                <th>Email</th>
                <th>Телефон</th>
                <th>Дети</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="parent in parents" :key="parent.user_id">
                <td>{{ parent.username }}</td>
                <td>{{ parent.email }}</td>
                <td>{{ parent.phone || 'Не указан' }}</td>
                <td>
                  <ul class="mb-0">
                    <li v-for="child in parent.children" :key="child.id">
                      {{ child.name }} ({{ new Date(child.birth_date).toLocaleDateString('ru-RU') }})
                    </li>
                    <li v-if="parent.children.length === 0">Нет детей</li>
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Statistics Tab -->
      <div v-else-if="activeTab === 'statistics'">
        <h2>Статистика</h2>
        <h3>Статистика по учителям</h3>
        <div class="table-responsive">
          <table class="table table-striped">
            <thead class="table-success">
              <tr>
                <th>Учитель</th>
                <th>Предмет</th>
                <th>Количество занятий</th>
                <th>Количество учеников</th>
                <th>Общий доход (руб.)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="stat in statistics" :key="stat.teacher_name">
                <td>{{ stat.teacher_name }}</td>
                <td>{{ stat.subject_name || 'Не указан' }}</td>
                <td>{{ stat.class_count }}</td>
                <td>{{ stat.total_students }}</td>
                <td>{{ stat.total_revenue || 0 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal for Editing Class -->
    <div
      class="modal fade"
      id="editClassModal"
      tabindex="-1"
      aria-labelledby="editClassModalLabel"
      aria-hidden="true"
      ref="editClassModal"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="editClassModalLabel">Редактировать занятие</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="updateClass">
              <div class="mb-3">
                <label for="edit-subject" class="form-label">Предмет</label>
                <select class="form-select" v-model="editClass.subject_id" required>
                  <option value="" disabled>Выберите предмет</option>
                  <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
                    {{ subject.name }}
                  </option>
                </select>
              </div>
              <div class="mb-3">
                <label for="edit-teacher" class="form-label">Учитель</label>
                <select class="form-select" v-model="editClass.teacher_id" required>
                  <option value="" disabled>Выберите учителя</option>
                  <option v-for="teacher in filteredTeachers" :key="teacher.user_id" :value="teacher.user_id">
                    {{ teacher.username }}
                  </option>
                </select>
              </div>
              <div class="mb-3">
                <label for="edit-schedule" class="form-label">Дата и время</label>
                <input
                  type="datetime-local"
                  class="form-control"
                  v-model="editClass.schedule"
                  required
                />
              </div>
              <div class="mb-3">
                <label for="edit-room" class="form-label">Кабинет</label>
                <select class="form-select" v-model="editClass.room_id">
                  <option value="">Без кабинета</option>
                  <option v-for="room in rooms" :key="room.id" :value="room.id">
                    {{ room.name }}
                  </option>
                </select>
              </div>
              <div class="mb-3">
                <label for="edit-price" class="form-label">Цена (руб.)</label>
                <input
                  type="number"
                  class="form-control"
                  v-model.number="editClass.price"
                  required
                />
              </div>
              <div class="mb-3">
                <label for="edit-class-type" class="form-label">Тип занятия</label>
                <select class="form-select" v-model="editClass.class_type" required>
                  <option value="" disabled>Выберите тип</option>
                  <option value="group">Групповое</option>
                  <option value="individual">Индивидуальное</option>
                </select>
              </div>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="edit-min-age" class="form-label">Минимальный возраст</label>
                  <input
                    type="number"
                    class="form-control"
                    v-model.number="editClass.min_age"
                    min="3"
                    max="15"
                  />
                </div>
                <div class="col-md-6 mb-3">
                  <label for="edit-max-age" class="form-label">Максимальный возраст</label>
                  <input
                    type="number"
                    class="form-control"
                    v-model.number="editClass.max_age"
                    min="4"
                    max="16"
                  />
                </div>
              </div>
              <button type="submit" class="btn btn-dark-green" data-bs-dismiss="modal">Сохранить</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import axios from 'axios';
import Toast from 'vue-toastification';
import { AxiosError } from 'axios';

interface Teacher {
  user_id: string;
  username: string;
  email: string;
  phone?: string;
  subject_name?: string;
}

interface ClassItem {
  id: string;
  subject: string;
  teacher_name?: string;
  schedule: string;
  room?: string;
  price: number;
  class_type: 'group' | 'individual';
  min_age: number;
  max_age: number;
  completed: boolean;
  subject_id: string;
  teacher_id: string;
  room_id?: string;
}

interface Parent {
  user_id: string;
  username: string;
  email: string;
  phone?: string;
  children: Child[];
}

interface Child {
  id: string;
  name: string;
  birth_date: string;
}

interface Statistic {
  teacher_name: string;
  subject_name?: string;
  class_count: number;
  total_students: number;
  total_revenue?: number;
}

interface Subject {
  id: string;
  name: string;
}

interface Room {
  id: string;
  name: string;
}

interface NewTeacher {
  username: string;
  email: string;
  password: string;
}

interface NewClass {
  subject_id: string;
  teacher_id: string;
  schedule: string;
  room_id: string;
  price: number;
  class_type: string;
  min_age: number;
  max_age: number;
}

interface EditClass {
  id: string | null;
  subject_id: string;
  teacher_id: string;
  schedule: string;
  room_id: string;
  price: number;
  class_type: string;
  min_age: number;
  max_age: number;
}

export default defineComponent({
  name: 'AdminPage',
  data() {
    return {
      activeTab: 'dashboard' as 'dashboard' | 'teachers' | 'classes' | 'parents' | 'statistics',
      isLoading: true,
      hasError: false,
      errorMessage: '',
      teachers: [] as Teacher[],
      classes: [] as ClassItem[],
      parents: [] as Parent[],
      statistics: [] as Statistic[],
      subjects: [] as Subject[],
      rooms: [] as Room[],
      filteredTeachers: [] as Teacher[],
      newTeacher: {
        username: '',
        email: '',
        password: '',
      } as NewTeacher,
      newClass: {
        subject_id: '',
        teacher_id: '',
        schedule: '',
        room_id: '',
        price: 0,
        class_type: '',
        min_age: 3,
        max_age: 16,
      } as NewClass,
      editClass: {
        id: null,
        subject_id: '',
        teacher_id: '',
        schedule: '',
        room_id: '',
        price: 0,
        class_type: '',
        min_age: 3,
        max_age: 16,
      } as EditClass,
    };
  },
  methods: {
    handleError(error: unknown, defaultMessage: string): string {
      const err = error as AxiosError<{ error?: string }>;
      console.error(defaultMessage, err.response?.data?.error || err.message);
      const errorMessage =
        err.response?.data?.error || err.message || 'Неизвестная ошибка';
      return `${defaultMessage}: ${errorMessage}`;
    },

    async validateToken(): Promise<boolean> {
      const token = localStorage.getItem('token');
      if (!token) {
        this.showToast('error', 'Токен отсутствует. Пожалуйста, войдите снова.');
        this.logout();
        return false;
      }

      try {
        const response = await axios.get('/api/auth/validate', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.data.valid) {
          this.showToast('error', 'Недействительный токен. Пожалуйста, войдите снова.');
          this.logout();
          return false;
        }

        if (response.data.role !== 'admin') {
          this.showToast('error', 'Доступ запрещён: требуется роль администратора.');
          this.logout();
          return false;
        }

        return true;
      } catch (err) {
        const errorMessage = this.handleError(err, 'Ошибка проверки токена');
        this.showToast('error', errorMessage);
        this.logout();
        return false;
      }
    },

    async fetchTeachers(): Promise<void> {
      try {
        const response = await axios.get('/api/users/teachers', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        console.log('Teachers response:', response.data);
        this.teachers = Array.isArray(response.data) ? response.data : [];
      } catch (err) {
        this.teachers = [];
        throw new Error(this.handleError(err, 'Ошибка при загрузке учителей'));
      }
    },

    async fetchClasses(): Promise<void> {
      try {
        const response = await axios.get('/api/classes', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        console.log('Classes response:', response.data);
        this.classes = Array.isArray(response.data) ? response.data : [];
      } catch (err) {
        this.classes = [];
        throw new Error(this.handleError(err, 'Ошибка при загрузке занятий'));
      }
    },

    async fetchParents(): Promise<void> {
      try {
        const response = await axios.get('/api/users/parents-children', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        console.log('Parents response:', response.data);
        this.parents = Array.isArray(response.data) ? response.data : [];
      } catch (err) {
        this.parents = [];
        throw new Error(this.handleError(err, 'Ошибка при загрузке родителей'));
      }
    },

    async fetchStatistics(): Promise<void> {
      try {
        const response = await axios.get('/api/statistics/teachers', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        console.log('Statistics response:', response.data);
        this.statistics = Array.isArray(response.data) ? response.data : [];
      } catch (err) {
        this.statistics = [];
        throw new Error(this.handleError(err, 'Ошибка при загрузке статистики'));
      }
    },

    async fetchSubjects(): Promise<void> {
      try {
        const response = await axios.get('/api/subjects');
        console.log('Subjects response:', response.data);
        this.subjects = Array.isArray(response.data) ? response.data : [];
      } catch (err) {
        this.subjects = [];
        throw new Error(this.handleError(err, 'Ошибка при загрузке предметов'));
      }
    },

    async fetchRooms(): Promise<void> {
      try {
        const response = await axios.get('/api/rooms', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        console.log('Rooms response:', response.data);
        this.rooms = Array.isArray(response.data) ? response.data : [];
      } catch (err) {
        this.rooms = [];
        throw new Error(this.handleError(err, 'Ошибка при загрузке кабинетов'));
      }
    },

    async fetchTeachersBySubject(subjectId: string): Promise<void> {
      if (!subjectId) {
        this.filteredTeachers = [];
        return;
      }
      try {
        const response = await axios.get(`/api/teachers/by-subject/${subjectId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        console.log('Filtered teachers response:', response.data);
        this.filteredTeachers = Array.isArray(response.data) ? response.data : [];
      } catch (err) {
        this.filteredTeachers = [];
        const errorMessage = this.handleError(err, 'Ошибка при загрузке учителей по предмету');
        this.showToast('error', errorMessage);
      }
    },

    async createTeacher(): Promise<void> {
      try {
        await axios.post('/api/teachers', this.newTeacher, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        this.showToast('success', 'Учитель успешно добавлен!');
        this.newTeacher = { username: '', email: '', password: '' };
        await this.fetchTeachers();
      } catch (err) {
        const errorMessage = this.handleError(err, 'Ошибка при добавлении учителя');
        this.showToast('error', errorMessage);
      }
    },

    async deleteTeacher(userId: string): Promise<void> {
      if (confirm('Вы уверены, что хотите удалить этого учителя?')) {
        try {
          await axios.delete(`/api/teachers/${userId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          });
          this.showToast('success', 'Учитель успешно удалён!');
          await this.fetchTeachers();
        } catch (err) {
          const errorMessage = this.handleError(err, 'Ошибка при удалении учителя');
          this.showToast('error', errorMessage);
        }
      }
    },

    async createClass(): Promise<void> {
      try {
        await axios.post('/api/classes', this.newClass, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        this.showToast('success', 'Занятие успешно добавлено!');
        this.newClass = {
          subject_id: '',
          teacher_id: '',
          schedule: '',
          room_id: '',
          price: 0,
          class_type: '',
          min_age: 3,
          max_age: 16,
        };
        this.filteredTeachers = [];
        await this.fetchClasses();
      } catch (err) {
        const errorMessage = this.handleError(err, 'Ошибка при добавлении занятия');
        this.showToast('error', errorMessage);
      }
    },

    async updateClass(): Promise<void> {
      try {
        await axios.put(`/api/classes/${this.editClass.id}`, this.editClass, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        this.showToast('success', 'Занятие успешно обновлено!');
        await this.fetchClasses();
      } catch (err) {
        const errorMessage = this.handleError(err, 'Ошибка при обновлении занятия');
        this.showToast('error', errorMessage);
      }
    },

    async deleteClass(classId: string): Promise<void> {
      if (confirm('Вы уверены, что хотите удалить это занятие?')) {
        try {
          await axios.delete(`/api/classes/${classId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          });
          this.showToast('success', 'Занятие успешно удалено!');
          await this.fetchClasses();
        } catch (err) {
          const errorMessage = this.handleError(err, 'Ошибка при удалении занятия');
          this.showToast('error', errorMessage);
        }
      }
    },

    async markClassCompleted(classId: string): Promise<void> {
      try {
        await axios.put(`/api/classes/${classId}/complete`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        this.showToast('success', 'Занятие отмечено как завершённое!');
        await this.fetchClasses();
      } catch (err) {
        const errorMessage = this.handleError(err, 'Ошибка при завершении занятия');
        this.showToast('error', errorMessage);
      }
    },

    openEditClassModal(classItem: ClassItem): void {
      try {
        this.editClass = {
          id: classItem.id,
          subject_id: classItem.subject_id,
          teacher_id: classItem.teacher_id,
          schedule: new Date(classItem.schedule).toISOString().slice(0, 16),
          room_id: classItem.room_id || '',
          price: classItem.price,
          class_type: classItem.class_type,
          min_age: classItem.min_age,
          max_age: classItem.max_age,
        };
        this.fetchTeachersBySubject(classItem.subject_id);
        const modal = new window.bootstrap.Modal(this.$refs.editClassModal as HTMLElement);
        modal.show();
      } catch (error) {
        console.error('Ошибка при открытии модального окна:', error);
        this.showToast('error', 'Не удалось открыть модальное окно для редактирования.');
      }
    },

    logout(): void {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      this.$emit('user-updated');
      this.$router.push('/login');
    },

    showToast(type: string, message: string): void {
      this.$toast[type](message);
    },
  },
  async mounted() {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    const isTokenValid = await this.validateToken();
    if (!isTokenValid) {
      this.isLoading = false;
      return;
    }

    try {
      await Promise.all([
        this.fetchTeachers(),
        this.fetchClasses(),
        this.fetchParents(),
        this.fetchStatistics(),
        this.fetchSubjects(),
        this.fetchRooms(),
      ]);

      console.log('After fetch - teachers:', this.teachers);
      console.log('After fetch - classes:', this.classes);
      console.log('After fetch - parents:', this.parents);
    } catch (err) {
      const errorMessage = this.handleError(err, 'Ошибка при загрузке данных');
      this.hasError = true;
      this.errorMessage = errorMessage;
    } finally {
      this.isLoading = false;
    }
  },
  watch: {
    'newClass.subject_id'(newVal: string) {
      this.fetchTeachersBySubject(newVal);
    },
    'editClass.subject_id'(newVal: string) {
      this.fetchTeachersBySubject(newVal);
    },
  },
});
</script>

<style scoped>
/* General layout */
.admin-page {
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

.btn-dark-green:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.btn-danger {
  border-radius: 8px;
}

.btn-success {
  border-radius: 8px;
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
  .btn-danger,
  .btn-success {
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