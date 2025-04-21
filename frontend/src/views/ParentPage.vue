<template>
  <div>
    <h1>Родитель</h1>
    <h2>Доступные занятия</h2>
    <div v-for="classItem in classes" :key="classItem.id">
      <h3>{{ classItem.name }}</h3>
      <button @click="enroll(classItem.id)">Записать ребенка</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ParentPage',
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
      axios.get('http://localhost:3000/classes')
        .then(response => {
          this.classes = response.data;
        })
        .catch(error => {
          console.error("Ошибка при получении занятий:", error);
        });
    },
    enroll(classId) {
      // Логика записи ребенка на занятие
      alert(`Записать ребенка на занятие с ID: ${classId}`);
    }
  }
};
</script>

<style scoped>
/* Добавьте стили по желанию */
</style>