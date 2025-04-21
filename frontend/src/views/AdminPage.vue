<template>
  <div>
    <h1>Администратор</h1>
    <h2>Управление занятиями</h2>
    <form @submit.prevent="addClass">
      <input v-model="newClassName" placeholder="Название занятия" required />
      <input v-model="newClassSchedule" type="datetime-local" required />
      <button type="submit">Добавить занятие</button>
    </form>
    <div v-for="classItem in classes" :key="classItem.id">
      <h3>{{ classItem.name }}</h3>
      <button @click="deleteClass(classItem.id)">Удалить занятие</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'AdminPage',
  data() {
    return {
      classes: [],
      newClassName: '',
      newClassSchedule: ''
    };
  },
  mounted() {
    this.fetchClasses();
  },
  methods: {
    fetchClasses() {
      axios.get('http://localhost:3000/classes')
        .then(response => {
          this.classes = response.data;
        })
        .catch(error => {
          console.error("Ошибка при получении занятий:", error);
        });
    },
    addClass() {
      const newClass = {
        name: this.newClassName,
        schedule: this.newClassSchedule,
        teacher_id: 1 // Замените на ID учителя, который будет вести занятие
      };
      axios.post('http://localhost:3000/classes', newClass)
        .then(() => {
          this.fetchClasses();
          this.newClassName = '';
          this.newClassSchedule = '';
        })
        .catch(error => {
          console.error("Ошибка при добавлении занятия:", error);
        });
    },
    deleteClass(classId) {
      axios.delete(`http://localhost:3000/classes/${classId}`)
        .then(() => {
          this.fetchClasses();
        })
        .catch(error => {
          console.error("Ошибка при удалении занятия:", error);
        });
    }
  }
};
</script>

<style scoped>
/* Добавьте стили по желанию */
</style>