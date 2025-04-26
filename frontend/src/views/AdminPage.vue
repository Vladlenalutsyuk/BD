<template>
  <div class="container">
    <h1>Панель администратора</h1>

    <!-- FullCalendar -->
    <FullCalendar :options="calendarOptions" />

    <!-- Selected Event Details -->
    <div v-if="selectedClass" class="mt-4 card">
      <div class="card-body">
        <h3 class="card-title">Детали занятия: {{ selectedClass.subject }}</h3>
        <p class="card-text">
          Время: {{ new Date(selectedClass.schedule).toLocaleString('ru-RU') }}<br />
          Кабинет: {{ selectedClass.room || 'Не указан' }}<br />
          Стоимость: {{ selectedClass.price || 0 }} руб.<br />
          Записанные дети: {{ selectedClass.children || 'Нет' }}
        </p>
        <button class="btn btn-primary me-2" @click="editClass">Редактировать</button>
        <button class="btn btn-danger" @click="deleteClass(selectedClass.id)">Удалить</button>
        <button class="btn btn-secondary ms-2" @click="clearSelection">Закрыть</button>
      </div>
    </div>

    <!-- Add/Edit Class Form -->
    <div v-if="showAddForm" class="mt-4">
      <h2>{{ isEditing ? 'Редактировать занятие' : 'Добавить занятие' }}</h2>
      <form @submit.prevent="isEditing ? updateClass() : addClass()">
        <div class="mb-3">
          <label for="subject" class="form-label">Предмет</label>
          <select v-model="newClass.subject_id" class="form-select" id="subject" required>
            <option value="">Выберите предмет</option>
            <option v-for="subject in subjects" :key="subject.id" :value="subject.id">{{ subject.name }}</option>
          </select>
        </div>
        <div class="mb-3">
          <label for="teacher" class="form-label">Преподаватель</label>
          <select v-model="newClass.teacher_id" class="form-select" id="teacher" required>
            <option value="">Выберите преподавателя</option>
            <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">{{ teacher.name }}</option>
          </select>
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
          <input v-model="newClass.price" type="number" step="0.01" class="form-control" id="price" placeholder="0.00" />
        </div>
        <button type="submit" class="btn btn-primary">{{ isEditing ? 'Сохранить' : 'Добавить' }}</button>
        <button type="button" class="btn btn-secondary ms-2" @click="resetForm">Отмена</button>
      </form>
    </div>
    <button v-else class="btn btn-primary mt-3" @click="showAddForm = true">Добавить занятие</button>

    <!-- Enrolled Students -->
    <div v-if="selectedClass" class="mt-4">
      <h2>Ученики, записанные на занятие: {{ selectedClass.subject }}</h2>
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Имя</th>
            <th>Дата рождения</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="child in enrolledChildren" :key="child.id">
            <td>{{ child.name }}</td>
            <td>{{ new Date(child.birth_date).toLocaleDateString('ru-RU') }}</td>
          </tr>
          <tr v-if="!enrolledChildren.length">
            <td colspan="2" class="text-center">Нет записанных учеников</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Teachers List -->
    <h2 class="mt-4">Список преподавателей</h2>
    <button class="btn btn-primary mb-3" @click="showTeachersList = !showTeachersList">
      {{ showTeachersList ? 'Скрыть' : 'Показать' }} список преподавателей
    </button>
    <table v-if="showTeachersList" class="table table-striped">
      <thead>
        <tr>
          <th>Имя</th>
          <th>Email</th>
          <th>Предмет</th>
          <th>Телефон</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="teacher in teachersList" :key="teacher.id">
          <td>{{ teacher.username }}</td>
          <td>{{ teacher.email }}</td>
          <td>{{ teacher.subject }}</td>
          <td>{{ teacher.phone }}</td>
        </tr>
        <tr v-if="!teachersList.length">
          <td colspan="4" class="text-center">Преподаватели не найдены</td>
        </tr>
      </tbody>
    </table>

    <!-- Teacher Statistics -->
    <h2 class="mt-4">Статистика преподавателей</h2>
    <button class="btn btn-primary mb-3" @click="showTeacherStats = !showTeacherStats">
      {{ showTeacherStats ? 'Скрыть' : 'Показать' }} статистику
    </button>
    <table v-if="showTeacherStats" class="table table-striped">
      <thead>
        <tr>
          <th>Преподаватель</th>
          <th>Предмет</th>
          <th>Количество занятий</th>
          <th>Количество учеников</th>
          <th>Общая выручка</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="stat in teacherStats" :key="stat.teacher_name + stat.subject_name">
          <td>{{ stat.teacher_name }}</td>
          <td>{{ stat.subject_name }}</td>
          <td>{{ stat.class_count }}</td>
          <td>{{ stat.total_students }}</td>
          <td>{{ stat.total_revenue }}</td>
        </tr>
        <tr v-if="!teacherStats.length">
          <td colspan="5" class="text-center">Статистика недоступна</td>
        </tr>
      </tbody>
    </table>
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
      classes: [],
      subjects: [],
      rooms: [],
      teachers: [],
      teachersList: [],
      teacherStats: [],
      showAddForm: false,
      showTeachersList: false,
      showTeacherStats: false,
      isEditing: false,
      editingClassId: null,
      newClass: {
        subject_id: '',
        teacher_id: '',
        schedule: '',
        room_id: '',
        price: '',
      },
      selectedClass: null,
      selectedEvent: null, // Store the clicked event
      enrolledChildren: [],
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
      },
    };
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
        this.calendarOptions.events = this.classes.map(cls => ({
          id: cls.id,
          title: `${cls.subject} (${cls.teacher_name || 'Нет преподавателя'})`,
          start: cls.schedule,
          extendedProps: {
            room: cls.room,
            price: cls.price,
            children: cls.children,
            subject_id: cls.subject_id,
            teacher_id: cls.teacher_id,
          },
        }));
      } catch (error) {
        if (error.response?.status === 403) {
          this.showToast('Сессия истекла, войдите снова', 'error');
          this.logout();
        } else {
          this.showToast('Ошибка при загрузке занятий: ' + (error.response?.data || error.message), 'error');
        }
      }
    },
    async fetchSubjects() {
      try {
        const response = await axios.get('http://localhost:3000/api/subjects');
        this.subjects = response.data;
      } catch (error) {
        this.showToast('Ошибка при загрузке предметов: ' + (error.response?.data || error.message), 'error');
      }
    },
    async fetchRooms() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        const response = await axios.get('http://localhost:3000/api/rooms', { headers });
        this.rooms = response.data;
      } catch (error) {
        if (error.response?.status === 403) {
          this.showToast('Сессия истекла, войдите снова', 'error');
          this.logout();
        } else {
          this.showToast('Ошибка при загрузке кабинетов: ' + (error.response?.data || error.message), 'error');
        }
      }
    },
    async fetchTeachers() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        const response = await axios.get('http://localhost:3000/api/teachers', { headers });
        this.teachers = response.data;
      } catch (error) {
        if (error.response?.status === 403) {
          this.showToast('Сессия истекла, войдите снова', 'error');
          this.logout();
        } else {
          this.showToast('Ошибка при загрузке преподавателей: ' + (error.response?.data || error.message), 'error');
        }
      }
    },
    async fetchTeachersList() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        const response = await axios.get('http://localhost:3000/api/users/teachers', { headers });
        this.teachersList = response.data;
      } catch (error) {
        if (error.response?.status === 403) {
          this.showToast('Сессия истекла, войдите снова', 'error');
          this.logout();
        } else {
          this.showToast('Ошибка при загрузке списка преподавателей: ' + (error.response?.data || error.message), 'error');
        }
      }
    },
    async fetchTeacherStats() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        const response = await axios.get('http://localhost:3000/api/statistics/teachers', { headers });
        this.teacherStats = response.data;
      } catch (error) {
        if (error.response?.status === 403) {
          this.showToast('Сессия истекла, войдите снова', 'error');
          this.logout();
        } else {
          this.showToast('Ошибка при загрузке статистики: ' + (error.response?.data || error.message), 'error');
        }
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
        };
        console.log('Отправка данных для добавления занятия:', newClass);
        const response = await axios.post('http://localhost:3000/api/classes', newClass, { headers });
        console.log('Ответ сервера:', response.data);
        this.showToast('Занятие добавлено!', 'success');
        this.resetForm();
        this.fetchClasses();
      } catch (error) {
        console.error('Ошибка при добавлении занятия:', error.response?.data || error.message);
        if (error.response?.status === 403) {
          this.showToast('Сессия истекла, войдите снова', 'error');
          this.logout();
        } else {
          this.showToast('Ошибка при добавлении занятия: ' + (error.response?.data || error.message), 'error');
        }
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
        };
        console.log('Отправка данных для обновления занятия:', updatedClass);
        const response = await axios.put(`http://localhost:3000/api/classes/${this.editingClassId}`, updatedClass, { headers });
        console.log('Ответ сервера:', response.data);
        this.showToast('Занятие обновлено!', 'success');
        this.resetForm();
        this.fetchClasses();
      } catch (error) {
        console.error('Ошибка при обновлении занятия:', error.response?.data || error.message);
        if (error.response?.status === 403) {
          this.showToast('Сессия истекла, войдите снова', 'error');
          this.logout();
        } else {
          this.showToast('Ошибка при обновлении занятия: ' + (error.response?.data || error.message), 'error');
        }
      }
    },
    async deleteClass(classId) {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      if (!confirm('Вы уверены, что хотите удалить это занятие?')) return;
      try {
        console.log('Удаление занятия с ID:', classId);
        const response = await axios.delete(`http://localhost:3000/api/classes/${classId}`, { headers });
        console.log('Ответ сервера:', response.data);
        this.showToast('Занятие удалено!', 'success');
        this.clearSelection();
        this.fetchClasses();
      } catch (error) {
        console.error('Ошибка при удалении занятия:', error.response?.data || error.message);
        if (error.response?.status === 403) {
          this.showToast('Сессия истекла, войдите снова', 'error');
          this.logout();
        } else {
          this.showToast('Ошибка при удалении занятия: ' + (error.response?.data || error.message), 'error');
        }
      }
    },
    async fetchEnrolledChildren(classId) {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        const response = await axios.get(`http://localhost:3000/api/enrollments/${classId}`, { headers });
        this.enrolledChildren = response.data;
      } catch (error) {
        if (error.response?.status === 403) {
          this.showToast('Сессия истекла, войдите снова', 'error');
          this.logout();
        } else {
          this.showToast('Ошибка при загрузке списка учеников: ' + (error.response?.data || error.message), 'error');
        }
      }
    },
    handleEventClick(info) {
      const event = info.event;
      const props = event.extendedProps;
      this.selectedClass = this.classes.find(cls => cls.id == event.id);
      this.selectedEvent = event;
      this.fetchEnrolledChildren(event.id);
      const message = `
        Занятие: ${event.title}
        Время: ${new Date(event.start).toLocaleString('ru-RU')}
        Кабинет: ${props.room || 'Не указан'}
        Стоимость: ${props.price || 0} руб.
        Записанные дети: ${props.children || 'Нет'}
      `;
      this.showToast(message, 'info', { timeout: 10000 });
    },
    editClass() {
      if (!this.selectedEvent || !this.selectedClass) return;
      const props = this.selectedEvent.extendedProps;
      this.newClass = {
        subject_id: props.subject_id,
        teacher_id: props.teacher_id,
        schedule: this.selectedEvent.start.toISOString().slice(0, 16),
        room_id: props.room ? this.rooms.find(room => room.name === props.room)?.id : '',
        price: props.price || '',
      };
      this.isEditing = true;
      this.editingClassId = this.selectedEvent.id;
      this.showAddForm = true;
    },
    clearSelection() {
      this.selectedClass = null;
      this.selectedEvent = null;
      this.enrolledChildren = [];
    },
    async handleEventDrop(info) {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        const classId = info.event.id;
        const newSchedule = info.event.start.toISOString();
        await axios.put(
          `http://localhost:3000/api/classes/${classId}`,
          { schedule: newSchedule },
          { headers }
        );
        this.showToast('Расписание обновлено!', 'success');
        this.fetchClasses();
      } catch (error) {
        this.showToast('Ошибка при обновлении расписания: ' + (error.response?.data || error.message), 'error');
        info.revert();
        if (error.response?.status === 403) {
          this.showToast('Сессия истекла, войдите снова', 'error');
          this.logout();
        }
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
      };
    },
    showToast(message, type = 'error', options = {}) {
      console.log('showToast called with message:', message, 'type:', type, 'this.$toast:', this.$toast);
      if (!this.$toast) {
        console.error('Vue Toastification is not initialized. Ensure it is set up in main.ts');
        alert(message);
        return;
      }
      this.$toast(message, { type, ...options });
    },
  },
  mounted() {
    console.log('AdminPage mounted. Checking $toast:', this.$toast, 'Type:', typeof this.$toast);
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const token = localStorage.getItem('token');
    if (!user || !token) {
      this.showToast('Сессия истекла, войдите снова', 'error');
      this.logout();
      return;
    }
    this.fetchClasses();
    this.fetchSubjects();
    this.fetchRooms();
    this.fetchTeachers();
    this.fetchTeachersList();
    this.fetchTeacherStats();
  },
};
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
.card {
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
}
.card-title {
  margin-bottom: 1rem;
}
.card-text {
  margin-bottom: 1rem;
}
</style>