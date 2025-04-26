<template>
  <div class="parent-page">
    <h1 class="mb-4 text-center text-success">Панель родителя</h1>
    <!-- Кнопка добавления ребёнка -->
    <div class="mb-4">
      <button @click="showAddChildForm = !showAddChildForm" class="btn btn-primary">
        {{ showAddChildForm ? 'Отмена' : 'Добавить ребёнка' }}
      </button>
    </div>
    <!-- Форма добавления ребёнка -->
    <div v-if="showAddChildForm" class="card shadow-lg p-4 mb-5">
      <h2>Добавить ребёнка</h2>
      <form @submit.prevent="addChild" class="add-child-form">
        <div class="mb-3">
          <label for="child_name" class="form-label">Имя ребёнка</label>
          <input
            v-model="newChild.name"
            type="text"
            id="child_name"
            class="form-control"
            placeholder="Введите имя"
            required
          />
        </div>
        <div class="mb-3">
          <label for="birth_date" class="form-label">Дата рождения</label>
          <input
            v-model="newChild.birth_date"
            type="date"
            id="birth_date"
            class="form-control"
            required
          />
        </div>
        <button type="submit" class="btn btn-dark-green w-100">Добавить ребёнка</button>
      </form>
    </div>
    <!-- Доступные занятия -->
    <h2>Запись на занятия</h2>
    <div class="mb-4">
      <select v-model="selectedChild" class="form-select">
        <option value="" disabled>Выберите ребенка</option>
        <option v-for="child in children" :key="child.id" :value="child.id">
          {{ child.name }} (Дата рождения: {{ formatDate(child.birth_date) }})
        </option>
      </select>
    </div>
    <table class="table table-striped mb-5">
      <thead>
        <tr>
          <th>Предмет</th>
          <th>Дата и время</th>
          <th>Учитель</th>
          <th>Кабинет</th>
          <th>Цена (₽)</th>
          <th>Действие</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="classItem in classes" :key="classItem.id">
          <td>{{ classItem.subject }}</td>
          <td>{{ formatDate(classItem.schedule) }}</td>
          <td>{{ classItem.teacher_name || 'Не указан' }}</td>
          <td>{{ classItem.room || 'Не указан' }}</td>
          <td>{{ classItem.price || '0.00' }}</td>
          <td>
            <button
              @click="enroll(classItem.id)"
              :disabled="!selectedChild || isChildEnrolled(classItem.id)"
              class="btn btn-primary btn-sm"
            >
              {{ isChildEnrolled(classItem.id) ? 'Уже записан' : 'Записать' }}
            </button>
          </td>
        </tr>
        <tr v-if="!classes.length">
          <td colspan="6" class="text-center">Нет доступных занятий</td>
        </tr>
      </tbody>
    </table>
    <!-- Детское расписание -->
    <h3>Детское расписание</h3>
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Ребёнок</th>
          <th>Предмет</th>
          <th>Дата и время</th>
          <th>Учитель</th>
          <th>Кабинет</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="schedule in childSchedule" :key="schedule.id" :class="getScheduleClass(schedule.schedule)">
          <td>{{ schedule.child_name }}</td>
          <td>{{ schedule.subject }}</td>
          <td>{{ formatDate(schedule.schedule) }}</td>
          <td>{{ schedule.teacher || 'Не указан' }}</td>
          <td>{{ schedule.room || 'Не указан' }}</td>
        </tr>
        <tr v-if="!childSchedule.length">
          <td colspan="5" class="text-center">Расписание пусто</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ParentPage',
  data() {
    return {
      classes: [],
      children: [],
      selectedChild: '',
      childSchedule: [],
      showAddChildForm: false,
      newChild: {
        name: '',
        birth_date: '',
      },
    };
  },
  mounted() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user || !localStorage.getItem('token')) {
      console.warn('Токен отсутствует, перенаправляем на страницу входа');
      this.$router.push('/login');
      return;
    }
    this.fetchClasses();
    this.fetchChildren();
    this.fetchChildSchedule();
  },
  methods: {
    showToast(message, type = 'error') {
      if (this.$toast) {
        if (type === 'error') {
          this.$toast.error(message);
        } else if (type === 'success') {
          this.$toast.success(message);
        }
      } else {
        console[type === 'error' ? 'error' : 'log'](`Тост (${type}): ${message}`);
      }
    },
    async fetchClasses() {
      try {
        const response = await axios.get('http://localhost:3000/api/classes', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        this.classes = response.data;
      } catch (error) {
        this.showToast('Не удалось загрузить занятия: ' + (error.response?.data || error.message));
        if (error.response?.status === 403) {
          this.$router.push('/login');
        }
      }
    },
    async fetchChildren() {
      try {
        const response = await axios.get('http://localhost:3000/api/children', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        this.children = response.data;
      } catch (error) {
        this.showToast('Не удалось загрузить детей: ' + (error.response?.data || error.message));
        if (error.response?.status === 403) {
          this.$router.push('/login');
        }
      }
    },
    async fetchChildSchedule() {
      try {
        const response = await axios.get('http://localhost:3000/api/child-schedule', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        this.childSchedule = response.data;
      } catch (error) {
        this.showToast('Не удалось загрузить расписание: ' + (error.response?.data || error.message));
        if (error.response?.status === 403) {
          this.$router.push('/login');
        }
      }
    },
    async addChild() {
      try {
        await axios.post('http://localhost:3000/api/children', this.newChild, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        this.showToast('Ребёнок добавлен!', 'success');
        this.newChild = { name: '', birth_date: '' };
        this.showAddChildForm = false;
        this.fetchChildren();
      } catch (error) {
        this.showToast('Ошибка при добавлении ребёнка: ' + (error.response?.data || error.message));
        if (error.response?.status === 403) {
          this.$router.push('/login');
        }
      }
    },
    async enroll(classId) {
      if (!this.selectedChild) {
        this.showToast('Выберите ребенка');
        return;
      }
      if (confirm('Записать ребенка на это занятие?')) {
        try {
          await axios.post(
            'http://localhost:3000/api/enrollments',
            { child_id: this.selectedChild, class_id: classId },
            { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
          );
          this.showToast('Ребёнок записан на занятие!', 'success');
          this.fetchChildSchedule();
        } catch (error) {
          this.showToast('Ошибка при записи: ' + (error.response?.data || error.message));
          if (error.response?.status === 403) {
            this.$router.push('/login');
          }
        }
      }
    },
    isChildEnrolled(classId) {
      return this.childSchedule.some(schedule => schedule.class_id === classId && schedule.child_id === this.selectedChild);
    },
    getScheduleClass(scheduleDate) {
      const now = new Date();
      const scheduleTime = new Date(scheduleDate);
      return scheduleTime > now ? 'future-schedule' : 'past-schedule';
    },
    formatDate(date) {
      return new Date(date).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    },
  },
};
</script>

<style scoped>
.parent-page {
  min-height: 100vh;
  background-color: #d5f7d5;
  padding: 20px;
  font-family: 'Comic Sans MS', 'Segoe UI', sans-serif;
}
.add-child-form {
  max-width: 500px;
  margin: 0 auto;
}
.btn-dark-green {
  background-color: #2e7d32;
  color: white;
  border: none;
}
.btn-dark-green:hover {
  background-color: #256528;
}
.table {
  background: #f8f9fa;
  border-radius: 5px;
}
.table-striped tbody tr:nth-of-type(odd) {
  background-color: rgba(0, 0, 0, 0.05);
}
.future-schedule {
  background-color: rgba(46, 125, 50, 0.1);
}
.past-schedule {
  background-color: rgba(0, 0, 0, 0.1);
  color: #6c757d;
}
</style>