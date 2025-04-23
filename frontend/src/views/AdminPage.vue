<template>
  <div>
    <h1>Администратор</h1>
    <h2>Управление занятиями</h2>

    <button @click="showAddForm = !showAddForm" class="toggle-form-btn">
      {{ showAddForm ? 'Отмена' : 'Добавить занятие' }}
    </button>

    <form v-if="showAddForm" @submit.prevent="addClass" class="add-class-form">
      <div class="dropdown">
        <button type="button" @click="showSubjectDropdown = !showSubjectDropdown" class="dropdown-btn">
          {{ selectedSubject ? selectedSubject.name : 'Предмет' }}
        </button>
        <ul v-if="showSubjectDropdown" class="dropdown-menu">
          <li v-for="subject in subjects" :key="subject.id" @click="selectSubject(subject)">
            {{ subject.name }}
          </li>
        </ul>
      </div>

      <div class="input-wrapper">
        <input v-model="newClassSchedule" type="datetime-local" required class="datetime-input" />
        <span class="calendar-icon"></span>
      </div>

      <div class="dropdown">
        <button type="button" @click="showRoomDropdown = !showRoomDropdown" class="dropdown-btn">
          {{ selectedRoom ? selectedRoom.name : 'Кабинет' }}
        </button>
        <ul v-if="showRoomDropdown" class="dropdown-menu">
          <li v-for="room in rooms" :key="room.id" @click="selectRoom(room)">
            {{ room.name }}
          </li>
        </ul>
      </div>

      <button type="submit" class="submit-btn">Сохранить занятие</button>
    </form>

    <div v-for="classItem in classes" :key="classItem.id" class="class-item">
      <h3>{{ classItem.subject }}</h3>
      <p>Время: {{ new Date(classItem.schedule).toLocaleString() }}</p>
      <p>Кабинет: {{ classItem.room }}</p>
      <p>Учитель: {{ classItem.teacher_name || 'Не назначен' }}</p>
      <button @click="deleteClass(classItem.id)" class="delete-btn">Удалить занятие</button>
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
      subjects: [],
      rooms: [],
      showAddForm: false,
      showSubjectDropdown: false,
      showRoomDropdown: false,
      selectedSubject: null,
      selectedRoom: null,
      newClassSchedule: ''
    };
  },
  mounted() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user || !user.token) {
      console.warn('Токен отсутствует, перенаправляем на страницу логина');
      this.$router.push('/login');
      return;
    }
    this.fetchClasses();
    this.fetchSubjects();
    this.fetchRooms();
  },
  methods: {
    getToken() {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      return user ? user.token : null;
    },
    fetchClasses() {
      const token = this.getToken();
      if (!token) {
        this.$router.push('/login');
        return;
      }
      axios.get('http://localhost:3000/api/classes', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        this.classes = response.data;
      })
      .catch(error => {
        console.error("Ошибка при получении занятий:", error);
        if (error.response && error.response.status === 403) {
          this.$router.push('/login');
        }
      });
    },
    fetchSubjects() {
      const token = this.getToken();
      if (!token) {
        this.$router.push('/login');
        return;
      }
      axios.get('http://localhost:3000/api/subjects', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        this.subjects = response.data;
        if (this.subjects.length === 0) {
          console.warn("Список предметов пуст. Убедитесь, что таблица subjects заполнена.");
        }
      })
      .catch(error => {
        console.error("Ошибка при получении предметов:", error);
        if (error.response && error.response.status === 403) {
          this.$router.push('/login');
        }
      });
    },
    fetchRooms() {
      const token = this.getToken();
      if (!token) {
        this.$router.push('/login');
        return;
      }
      axios.get('http://localhost:3000/api/rooms', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        this.rooms = response.data;
        if (this.rooms.length === 0) {
          console.warn("Список кабинетов пуст. Убедитесь, что таблица rooms заполнена.");
        }
      })
      .catch(error => {
        console.error("Ошибка при получении кабинетов:", error);
        if (error.response && error.response.status === 403) {
          this.$router.push('/login');
        }
      });
    },
    selectSubject(subject) {
      this.selectedSubject = subject;
      this.showSubjectDropdown = false;
    },
    selectRoom(room) {
      this.selectedRoom = room;
      this.showRoomDropdown = false;
    },
    addClass() {
      if (!this.selectedSubject) {
        alert('Выберите предмет');
        return;
      }
      if (!this.selectedRoom) {
        alert('Выберите кабинет');
        return;
      }
      const token = this.getToken();
      if (!token) {
        this.$router.push('/login');
        return;
      }
      const newClass = {
        subject_id: this.selectedSubject.id,
        schedule: this.newClassSchedule,
        teacher_id: null,
        room_id: this.selectedRoom.id,
        price: 0.00
      };
      axios.post('http://localhost:3000/api/classes', newClass, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(() => {
        this.fetchClasses();
        this.resetForm();
      })
      .catch(error => {
        console.error("Ошибка при добавлении занятия:", error);
        if (error.response && error.response.status === 403) {
          this.$router.push('/login');
        }
      });
    },
    resetForm() {
      this.selectedSubject = null;
      this.selectedRoom = null;
      this.newClassSchedule = '';
      this.showAddForm = false;
      this.showSubjectDropdown = false;
      this.showRoomDropdown = false;
    },
    deleteClass(classId) {
      const token = this.getToken();
      if (!token) {
        this.$router.push('/login');
        return;
      }
      axios.delete(`http://localhost:3000/api/classes/${classId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(() => {
        this.fetchClasses();
      })
      .catch(error => {
        console.error("Ошибка при удалении занятия:", error);
        if (error.response && error.response.status === 403) {
          this.$router.push('/login');
        }
      });
    }
  }
};
</script>

<style scoped>
h1 {
  font-size: 2em;
  font-weight: bold;
  margin-bottom: 10px;
}

h2 {
  font-size: 1.5em;
  font-weight: bold;
  margin-bottom: 20px;
}

.toggle-form-btn {
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-bottom: 20px;
}

.toggle-form-btn:hover {
  background-color: #0056b3;
}

.add-class-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-width: 400px;
  margin: 0 auto 30px;
}

.dropdown {
  position: relative;
}

.dropdown-btn {
  width: 100%;
  padding: 12px;
  background: #e9ecef;
  border: 1px solid #ced4da;
  border-radius: 5px;
  text-align: left;
  font-size: 16px;
  color: #495057;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #ced4da;
  border-radius: 5px;
  max-height: 200px;
  overflow-y: auto;
  list-style: none;
  padding: 0;
  margin: 0;
  z-index: 10;
}

.dropdown-menu li {
  padding: 10px;
  cursor: pointer;
}

.dropdown-menu li:hover {
  background: #f0f0f0;
}

.input-wrapper {
  position: relative;
}

.datetime-input {
  width: 100%;
  padding: 12px;
  padding-right: 40px;
  background: #e9ecef;
  border: 1px solid #ced4da;
  border-radius: 5px;
  font-size: 16px;
  color: #495057;
}

.calendar-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V8h14v12z"/></svg>') no-repeat center;
  background-size: contain;
}

.submit-btn {
  background-color: #007bff;
  color: white;
  padding: 12px;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
}

.submit-btn:hover {
  background-color: #0056b3;
}

.class-item {
  border: 1px solid #ddd;
  padding: 15px;
  margin: 10px 0;
  border-radius: 5px;
  background: #f8f9fa;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
  padding: 8px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.delete-btn:hover {
  background-color: #c82333;
}
</style>