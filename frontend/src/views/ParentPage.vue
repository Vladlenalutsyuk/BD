<template>
  <div class="container mt-4">
    <h1 class="mb-4">Родитель</h1>

    <h2>Запись на занятия</h2>
    <div class="mb-3">
      <select v-model="selectedChild" @change="fetchChildSchedule" class="form-select">
        <option value="" disabled>Выберите ребенка</option>
        <option v-for="child in children" :key="child.id" :value="child.id">{{ child.name }}</option>
      </select>
    </div>

    <h3>Доступные занятия</h3>
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Название</th>
          <th>Дата и время</th>
          <th>Учитель</th>
          <th>Цена</th>
          <th>Действие</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="classItem in classes" :key="classItem.id">
          <td>{{ classItem.name }}</td>
          <td>{{ formatDate(classItem.schedule) }}</td>
          <td>{{ classItem.teacher_name || 'Не указан' }}</td>
          <td>{{ classItem.price || '0.00' }}</td>
          <td>
            <button @click="enroll(classItem.id)" :disabled="!selectedChild" class="btn btn-primary btn-sm">
              Записать
            </button>
          </td>
        </tr>
        <tr v-if="!classes.length">
          <td colspan="5" class="text-center">Нет доступных занятий</td>
        </tr>
      </tbody>
    </table>

    <h3>Расписание ребенка</h3>
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Название</th>
          <th>Дата и время</th>
          <th>Учитель</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="schedule in childSchedule" :key="schedule.id">
          <td>{{ schedule.name }}</td>
          <td>{{ formatDate(schedule.schedule) }}</td>
          <td>{{ schedule.teacher_name || 'Не указан' }}</td>
        </tr>
        <tr v-if="!childSchedule.length">
          <td colspan="3" class="text-center">Расписание пусто</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      classes: [],
      children: [],
      selectedChild: '',
      childSchedule: []
    };
  },
  mounted() {
    this.fetchClasses();
    this.fetchChildren();
  },
  methods: {
    async fetchClasses() {
      try {
        const response = await axios.get('http://localhost:3000/classes', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        this.classes = response.data;
      } catch (error) {
        console.error('Ошибка при загрузке занятий:', error.response || error);
        this.$toast.error('Не удалось загрузить занятия: ' + (error.response?.data || error.message));
      }
    },
    async fetchChildren() {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) throw new Error('Пользователь не авторизован');
        const response = await axios.get(`http://localhost:3000/parents/${user.id}/children`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        this.children = response.data;
      } catch (error) {
        console.error('Ошибка при загрузке детей:', error.response || error);
        this.$toast.error('Не удалось загрузить детей: ' + (error.response?.data || error.message));
      }
    },
    async fetchChildSchedule() {
      if (!this.selectedChild) return;
      try {
        const response = await axios.get(`http://localhost:3000/children/${this.selectedChild}/schedule`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        this.childSchedule = response.data;
      } catch (error) {
        console.error('Ошибка при загрузке расписания:', error.response || error);
        this.$toast.error('Не удалось загрузить расписание: ' + (error.response?.data || error.message));
      }
    },
    async enroll(classId) {
      if (!this.selectedChild) return this.$toast.error('Выберите ребенка');
      try {
        await axios.post('http://localhost:3000/enrollments', {
          child_id: this.selectedChild,
          class_id: classId
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        this.fetchChildSchedule();
        this.$toast.success('Ребенок записан на занятие');
      } catch (error) {
        console.error('Ошибка при записи на занятие:', error.response || error);
        this.$toast.error('Ошибка при записи: ' + (error.response?.data || error.message));
      }
    },
    formatDate(date) {
      return new Date(date).toLocaleString();
    }
  }
};
</script>