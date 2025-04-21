<template>
  <div>
    <h1>Учитель</h1>
    <h2>Ваши занятия</h2>
    <div v-for="classItem in classes" :key="classItem.id">
      <h3>{{ classItem.name }}</h3>
      <p>Расписание: {{ classItem.schedule }}</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'TeacherPage',
  data() {
    return {
      classes: []
    };
  },
  mounted() {
    this.fetchClasses();
  },
  methods: {
    fetchClasses() {
      axios.get('http://localhost:3000/classes') // Замените на ваш API для получения занятий учителя
        .then(response => {
          this.classes = response.data;
        })
        .catch(error => {
          console.error("Ошибка при получении занятий:", error);
        });
    }
  }
};
</script>

<style scoped>
/* Добавьте стили по желанию */
</style>