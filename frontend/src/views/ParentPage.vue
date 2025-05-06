<template>
  <div class="parent-page d-flex">
    <!-- Sidebar -->
    <div class="sidebar shadow-lg">
      <h3 class="text-center text-success mb-4">Меню</h3>
      <ul class="nav flex-column">
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{ active: activeTab === 'centerInfo' }"
            @click="activeTab = 'centerInfo'"
          >
            <i class="fas fa-info-circle me-2"></i> Информация о центре
          </a>
        </li>
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{ active: activeTab === 'personalAccount' }"
            @click="activeTab = 'personalAccount'"
          >
            <i class="fas fa-user me-2"></i> Личный кабинет
          </a>
        </li>
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{ active: activeTab === 'enroll' }"
            @click="activeTab = 'enroll'"
          >
            <i class="fas fa-calendar-check me-2"></i> Запись на занятия
          </a>
        </li>
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{ active: activeTab === 'schedule' }"
            @click="activeTab = 'schedule'"
          >
            <i class="fas fa-calendar-alt me-2"></i> Расписание
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link text-danger" @click="logout">
            <i class="fas fa-sign-out-alt me-2"></i> Выйти
          </a>
        </li>
      </ul>
    </div>

    <!-- Main Content -->
    <div class="main-content p-4 flex-grow-1">
      <h1 class="mb-4 text-center text-success">Панель родителя</h1>

      <!-- Center Info Tab -->
      <div v-if="activeTab === 'centerInfo'">
        <h2>Информация о центре</h2>
        <div class="card shadow-lg p-4 mb-4">
          <h3>О нашем центре</h3>
          <p>
            Добро пожаловать в наш детский образовательный центр! Мы предлагаем
            разнообразные занятия для детей от 3 до 16 лет, включая математику,
            рисование и музыку. Наши профессиональные преподаватели помогут вашему
            ребёнку раскрыть свой потенциал.
          </p>
          <h4>Контакты</h4>
          <p><strong>Адрес:</strong> ул. Ленина, д. 123, г. Симферополь</p>
          <p><strong>Телефон:</strong> +7 (123) 456-78-90</p>
          <p><strong>Email:</strong> info@childrencenter.ru</p>
        </div>
        <div class="card shadow-lg p-4 mb-4">
          <h3>Наши преподаватели</h3>
          <div class="row">
            <div
              v-for="teacher in teachers"
              :key="teacher.id"
              class="col-md-4 mb-3"
            >
              <div class="card h-100">
                <div class="card-body">
                  <h5 class="card-title">{{ teacher.username }}</h5>
                  <p class="card-text">
                    <strong>Предмет:</strong>
                    {{ teacher.subject || "Не указан" }}<br />
                    <strong>Опыт:</strong>
                    {{
                      teacher.experience
                        ? `${teacher.experience} лет`
                        : "Не указан"
                    }}<br />
                    <strong>Образование:</strong>
                    {{ teacher.education || "Не указано" }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="card shadow-lg p-4">
          <h3>Отзывы родителей</h3>
          <div
            v-for="review in reviews"
            :key="review.id"
            class="review mb-3 p-3 border rounded"
          >
            <p>
              <strong>{{ review.parent_name }}:</strong> {{ review.content }}
            </p>
            <small>{{ formatDate(review.created_at) }}</small>
          </div>
          <form @submit.prevent="submitReview" class="mt-4">
            <div class="mb-3">
              <label for="newReview" class="form-label">Оставить отзыв</label>
              <textarea
                v-model="newReview"
                id="newReview"
                class="form-control"
                rows="4"
                placeholder="Ваш отзыв"
                required
              ></textarea>
            </div>
            <button type="submit" class="btn btn-dark-green">
              Отправить
            </button>
          </form>
        </div>
      </div>

      <!-- Personal Account Tab -->
      <div v-if="activeTab === 'personalAccount'">
        <h2>Личный кабинет</h2>
        <div class="card shadow-lg p-4 mb-4">
          <h3>Ваши данные</h3>
          <p>
            <strong>Имя пользователя:</strong>
            {{ parentProfile.username || "Загрузка..." }}
          </p>
          <p>
            <strong>Email:</strong>
            {{ parentProfile.email || "Загрузка..." }}
          </p>
          <p>
            <strong>Телефон:</strong>
            {{ parentProfile.phone || "Загрузка..." }}
          </p>
          <button
            v-if="!isEditingProfile"
            @click="startEditingProfile"
            class="btn btn-dark-green mt-3"
          >
            <i class="fas fa-edit me-2"></i> Редактировать данные
          </button>
          <div v-if="isEditingProfile" class="mt-4">
            <h4>Редактировать профиль</h4>
            <form @submit.prevent="updateProfile" class="mt-3">
              <div class="mb-3">
                <label for="username" class="form-label"
                  >Имя пользователя</label
                >
                <input
                  v-model="editProfile.username"
                  type="text"
                  id="username"
                  class="form-control"
                  placeholder="Новое имя пользователя"
                  required
                />
              </div>
              <div class="mb-3">
                <label for="email" class="form-label">Email</label>
                <input
                  v-model="editProfile.email"
                  type="email"
                  id="email"
                  class="form-control"
                  placeholder="Новый email"
                  required
                />
              </div>
              <div class="mb-3">
                <label for="phone" class="form-label">Телефон</label>
                <input
                  v-model="editProfile.phone"
                  type="text"
                  id="phone"
                  class="form-control"
                  placeholder="+1234567890"
                  required
                  @input="validatePhone"
                />
                <small v-if="phoneError" class="text-danger">{{
                  phoneError
                }}</small>
              </div>
              <div class="mb-3">
                <label for="password" class="form-label"
                  >Новый пароль (оставьте пустым, если не хотите менять)</label
                >
                <input
                  v-model="editProfile.password"
                  type="password"
                  id="password"
                  class="form-control"
                  placeholder="Новый пароль"
                />
              </div>
              <div class="d-flex gap-2">
                <button
                  type="submit"
                  class="btn btn-dark-green w-50"
                  :disabled="isLoading || !!phoneError"
                >
                  <i class="fas fa-save me-2"></i>
                  {{ isLoading ? "Сохранение..." : "Сохранить изменения" }}
                </button>
                <button
                  type="button"
                  @click="cancelEditingProfile"
                  class="btn btn-secondary w-50"
                >
                  <i class="fas fa-times me-2"></i> Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
        <div class="card shadow-lg p-4">
          <h3>Ваши дети</h3>
          <button
            @click="showAddChildForm = true"
            class="btn btn-dark-green mb-3"
          >
            <i class="fas fa-plus-circle me-2"></i> Добавить ребёнка
          </button>
          <div v-if="showAddChildForm" class="mb-4">
            <h4>Добавить ребёнка</h4>
            <form @submit.prevent="addChild" class="add-child-form">
              <div class="mb-3">
                <label for="child_name" class="form-label">Имя ребёнка</label>
                <input
                  v-model="newChild.name"
                  type="text"
                  id="child_name"
                  class="form-control"
                  placeholder="Введите ФИО ребенка"
                  required
                />
              </div>
              <div class="mb-3">
                <label for="birth_date" class="form-label"
                  >Дата рождения</label
                >
                <input
                  v-model="newChild.birth_date"
                  type="date"
                  id="birth_date"
                  class="form-control"
                  required
                />
              </div>
              <div class="d-flex gap-2">
                <button
                  type="submit"
                  class="btn btn-dark-green w-50"
                  :disabled="isLoading"
                >
                  {{ isLoading ? "Добавление..." : "Добавить" }}
                </button>
                <button
                  type="button"
                  @click="showAddChildForm = false"
                  class="btn btn-secondary w-50"
                >
                  <i class="fas fa-times me-2"></i> Отмена
                </button>
              </div>
            </form>
          </div>
          <div v-if="children.length" class="row">
            <div
              v-for="child in children"
              :key="child.id"
              class="col-md-4 mb-3"
            >
              <div class="card h-100">
                <div class="card-body">
                  <h5 class="card-title">{{ child.name }}</h5>
                  <p class="card-text">
                    <strong>Дата рождения:</strong>
                    {{ formatDate(child.birth_date) }}
                  </p>
                  <button
                    @click="editChild(child)"
                    class="btn btn-dark-green btn-sm"
                  >
                    <i class="fas fa-edit me-2"></i> Редактировать
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-else-if="!showAddChildForm" class="text-center text-muted">
            У вас нет добавленных детей. Нажмите "Добавить ребёнка", чтобы начать.
          </div>
          <div v-if="showEditChildForm" class="mt-4">
            <h4>Редактировать данные ребёнка</h4>
            <form @submit.prevent="updateChild" class="edit-child-form">
              <div class="mb-3">
                <label for="edit_child_name" class="form-label"
                  >Имя ребёнка</label
                >
                <input
                  v-model="editChildData.name"
                  type="text"
                  id="edit_child_name"
                  class="form-control"
                  required
                />
              </div>
              <div class="mb-3">
                <label for="edit_birth_date" class="form-label"
                  >Дата рождения</label
                >
                <input
                  v-model="editChildData.birth_date"
                  type="date"
                  id="edit_birth_date"
                  class="form-control"
                  required
                />
              </div>
              <div class="d-flex gap-2">
                <button
                  type="submit"
                  class="btn btn-dark-green w-50"
                  :disabled="isLoading"
                >
                  {{ isLoading ? "Сохранение..." : "Сохранить" }}
                </button>
                <button
                  type="button"
                  @click="showEditChildForm = false"
                  class="btn btn-secondary w-50"
                >
                  <i class="fas fa-times me-2"></i> Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Enroll Tab -->
      <div v-if="activeTab === 'enroll'">
  <h2 class="mb-4">Записаться на занятие</h2>
  <div class="mb-4">
    <select
      v-model="selectedChild"
      class="form-select w-auto d-inline-block me-2"
      @change="fetchClasses"
    >
      <option value="" disabled>Выберите ребенка</option>
      <option v-for="child in children" :key="child.id" :value="child.id">
        {{ child.name }} ({{ getChildAge(child.birth_date) }} лет)
      </option>
    </select>
    <select
      v-model="selectedSubject"
      class="form-select w-auto d-inline-block"
      :disabled="!selectedChild"
      @change="fetchClasses"
    >
      <option value="">Все предметы</option>
      <option
        v-for="subject in subjects"
        :key="subject.id"
        :value="subject.id"
      >
        {{ subject.name }}
      </option>
    </select>
  </div>
  <div v-if="!selectedChild" class="alert alert-info text-center">
    Пожалуйста, выберите ребенка, чтобы увидеть доступные занятия.
  </div>
  <table v-else class="table table-striped shadow-lg">
    <thead class="table-success">
      <tr>
        <th>Занятие</th>
        <th>Тип</th>
        <th>Возрастная группа</th>
        <th>Время</th>
        <th>Кабинет</th>
        <th>Стоимость</th>
        <th>Действие</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="classItem in classes" :key="classItem.id">
        <td>{{ classItem.subject }}</td>
        <td>
          <span
            :class="
              classItem.class_type === 'individual'
                ? 'badge bg-primary'
                : 'badge bg-success'
            "
          >
            {{
              classItem.class_type === "individual"
                ? "Индивидуальное"
                : "Групповое"
            }}
          </span>
        </td>
        <td>
          <span v-if="classItem.class_type === 'group'">
            {{ classItem.min_age }}-{{ classItem.max_age }} лет
          </span>
          <span v-else>3-16 лет</span>
        </td>
        <td>{{ formatDateTime(classItem.schedule) }}</td>
        <td>{{ classItem.room || "Не указан" }}</td>
        <td>{{ classItem.price }} руб.</td>
        <td>
          <button
            @click="enrollChild(classItem.id)"
            class="btn btn-dark-green btn-sm"
            :disabled="isChildEnrolled(classItem.id)"
          >
            {{ isChildEnrolled(classItem.id) ? "Записан" : "Записаться" }}
          </button>
        </td>
      </tr>
      <tr v-if="!classes.length">
        <td colspan="7" class="text-center">Занятия не найдены</td>
      </tr>
    </tbody>
  </table>
</div>

      <!-- Schedule Tab -->
      <div v-if="activeTab === 'schedule'">
        <h2 class="mb-4">Расписание</h2>
        <div class="mb-4">
          <select
            v-model="selectedChildForSchedule"
            class="form-select w-auto d-inline-block me-2"
            @change="fetchSchedule"
          >
            <option value="" disabled>Выберите ребенка</option>
            <option value="all">Все дети</option>
            <option v-for="child in children" :key="child.id" :value="child.id">
              {{ child.name }}
            </option>
          </select>
          <button
            @click="togglePastClasses"
            class="btn btn-dark-green btn-sm"
          >
            {{ showPastClasses ? "Скрыть прошедшие" : "Показать прошедшие" }}
          </button>
        </div>
        <!-- Future Classes -->
        <h3>Будущие занятия</h3>
        <table class="table table-striped shadow-lg">
          <thead class="table-success">
            <tr>
              <th>Занятие</th>
              <th>Тип</th>
              <th>Возрастная группа</th>
              <th>Время</th>
              <th>Кабинет</th>
              <th>Стоимость</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="scheduleItem in futureSchedule" :key="scheduleItem.id">
              <td>{{ scheduleItem.subject }}</td>
              <td>
                <span
                  :class="
                    scheduleItem.class_type === 'individual'
                      ? 'badge bg-primary'
                      : 'badge bg-success'
                  "
                >
                  {{
                    scheduleItem.class_type === "individual"
                      ? "Индивидуальное"
                      : "Групповое"
                  }}
                </span>
              </td>
              <td>
                <span v-if="scheduleItem.class_type === 'group'">
                  {{ scheduleItem.min_age }}-{{ scheduleItem.max_age }} лет
                </span>
                <span v-else>3-16 лет</span>
              </td>
              <td>{{ formatDateTime(scheduleItem.schedule) }}</td>
              <td>{{ scheduleItem.room || "Не указан" }}</td>
              <td>{{ scheduleItem.price }} руб.</td>
              <td>
                <button
                  @click="unenrollChild(scheduleItem.id)"
                  class="btn btn-danger btn-sm"
                >
                  Отменить
                </button>
              </td>
            </tr>
            <tr v-if="!futureSchedule.length && selectedChildForSchedule">
              <td colspan="7" class="text-center">
                Ребёнок не записан на будущие занятия
              </td>
            </tr>
            <tr v-if="!futureSchedule.length && !selectedChildForSchedule">
              <td colspan="7" class="text-center">
                Выберите ребёнка для просмотра расписания
              </td>
            </tr>
          </tbody>
        </table>
        <!-- Past Classes -->
        <div v-if="showPastClasses">
          <h3 class="mt-4">Прошедшие занятия</h3>
          <table class="table table-striped shadow-lg">
            <thead class="table-success">
              <tr>
                <th>Занятие</th>
                <th>Тип</th>
                <th>Возрастная группа</th>
                <th>Время</th>
                <th>Кабинет</th>
                <th>Стоимость</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="scheduleItem in pastSchedule" :key="scheduleItem.id">
                <td>{{ scheduleItem.subject }}</td>
                <td>
                  <span
                    :class="
                      scheduleItem.class_type === 'individual'
                        ? 'badge bg-primary'
                        : 'badge bg-success'
                    "
                  >
                    {{
                      scheduleItem.class_type === "individual"
                        ? "Индивидуальное"
                        : "Групповое"
                    }}
                  </span>
                </td>
                <td>
                  <span v-if="scheduleItem.class_type === 'group'">
                    {{ scheduleItem.min_age }}-{{ scheduleItem.max_age }} лет
                  </span>
                  <span v-else>3-16 лет</span>
                </td>
                <td>{{ formatDateTime(scheduleItem.schedule) }}</td>
                <td>{{ scheduleItem.room || "Не указан" }}</td>
                <td>{{ scheduleItem.price }} руб.</td>
              </tr>
              <tr v-if="!pastSchedule.length && selectedChildForSchedule">
                <td colspan="6" class="text-center">Нет прошедших занятий</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "ParentPage",
  data() {
    return {
      activeTab: "centerInfo",
      user: null,
      children: [],
      classes: [],
      subjects: [],
      selectedChild: "",
      selectedSubject: "",
      schedule: [],
      selectedChildForSchedule: "",
      reviews: [],
      teachers: [],
      newReview: "",
      parentProfile: {
        username: "",
        email: "",
        phone: "",
      },
      editProfile: {
        username: "",
        email: "",
        phone: "",
        password: "",
      },
      isEditingProfile: false,
      showAddChildForm: false,
      showEditChildForm: false,
      newChild: { name: "", birth_date: "" },
      editChildData: { id: "", name: "", birth_date: "" },
      phoneError: null,
      showPastClasses: false,
      isLoading: false,
    };
  },
  computed: {
    futureSchedule() {
      return this.schedule.filter(
        (item) => new Date(item.schedule) > new Date() && !item.completed
      );
    },
    pastSchedule() {
      return this.schedule.filter(
        (item) => new Date(item.schedule) <= new Date() || item.completed
      );
    },
    selectedChildAge() {
  if (!this.selectedChild) return null;
  const child = this.children.find((c) => c.id === this.selectedChild);
  if (!child || !child.birth_date) return null;
  const birthDate = new Date(child.birth_date);
  const today = new Date();
  return Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
},
  },
  methods: 
  {
    getChildAge(birthDate) {
  const birth = new Date(birthDate);
  const today = new Date();
  return Math.floor((today - birth) / (365.25 * 24 * 60 * 60 * 1000));
},
    async fetchParentProfile() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        this.isLoading = true;
        const response = await axios.get(
          "http://localhost:3000/api/parent/profile",
          { headers }
        );
        this.parentProfile = response.data;
      } catch (error) {
        this.handleError(error, "Ошибка при загрузке профиля");
      } finally {
        this.isLoading = false;
      }
    },
    async fetchTeachers() {
      try {
        this.isLoading = true;
        const response = await axios.get(
          "http://localhost:3000/api/users/teachers/public"
        );
        this.teachers = response.data;
      } catch (error) {
        this.handleError(error, "Ошибка при загрузке данных учителей");
      } finally {
        this.isLoading = false;
      }
    },
    async fetchClasses() {
  if (!this.selectedChild) {
    this.classes = [];
    return;
  }
  try {
    this.isLoading = true;
    const headers = this.getAuthHeaders();
    if (!headers) return;
    const params = {};
    if (this.selectedSubject) params.subject_id = this.selectedSubject;
    if (this.selectedChild) params.child_id = this.selectedChild;
    const response = await axios.get("http://localhost:3000/api/classes/public", {
      params,
      headers,
    });
    this.classes = response.data || [];
    console.log("Fetched classes:", this.classes);
    if (!this.classes.length) {
      this.showToast("Нет доступных занятий для выбранных фильтров", "info");
    }
  } catch (error) {
    this.handleError(error, "Ошибка при получении расписания");
  } finally {
    this.isLoading = false;
  }
},


    async fetchSubjects() {
      try {
        this.isLoading = true;
        const response = await axios.get(
          "http://localhost:3000/api/subjects/public"
        );
        this.subjects = response.data;
      } catch (error) {
        this.handleError(error, "Ошибка при загрузке предметов");
      } finally {
        this.isLoading = false;
      }
    },
    async fetchChildren() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        this.isLoading = true;
        const response = await axios.get(
          "http://localhost:3000/api/parent/children",
          { headers }
        );
        this.children = response.data;
        if (this.children.length && !this.selectedChild) {
          this.selectedChild = this.children[0].id;
          await this.fetchClasses();
        }
      } catch (error) {
        this.handleError(error, "Ошибка при получении списка детей");
      } finally {
        this.isLoading = false;
      }
    },
    async fetchSchedule() {
      if (!this.selectedChildForSchedule) {
        this.schedule = [];
        return;
      }
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        this.isLoading = true;
        const params = this.showPastClasses ? { includePast: true } : {};
        const response = await axios.get(
          `http://localhost:3000/api/parent/schedule/${this.selectedChildForSchedule}`,
          { headers, params }
        );
        this.schedule = response.data;
      } catch (error) {
        this.handleError(error, "Ошибка при получении расписания");
      } finally {
        this.isLoading = false;
      }
    },
    async fetchReviews() {
      try {
        this.isLoading = true;
        const response = await axios.get("http://localhost:3000/api/reviews");
        this.reviews = response.data;
      } catch (error) {
        this.handleError(error, "Ошибка при загрузке отзывов");
      } finally {
        this.isLoading = false;
      }
    },
    async submitReview() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        this.isLoading = true;
        await axios.post(
          "http://localhost:3000/api/reviews",
          { content: this.newReview },
          { headers }
        );
        this.showToast("Отзыв отправлен!", "success");
        this.newReview = "";
        await this.fetchReviews();
      } catch (error) {
        this.handleError(error, "Ошибка при отправке отзыва");
      } finally {
        this.isLoading = false;
      }
    },
    async addChild() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        this.isLoading = true;
        await axios.post(
          "http://localhost:3000/api/parent/children",
          this.newChild,
          { headers }
        );
        this.showToast("Ребёнок добавлен!", "success");
        this.newChild = { name: "", birth_date: "" };
        this.showAddChildForm = false;
        await this.fetchChildren();
      } catch (error) {
        this.handleError(error, "Ошибка при добавлении ребёнка");
      } finally {
        this.isLoading = false;
      }
    },
    async updateChild() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        this.isLoading = true;
        await axios.put(
          `http://localhost:3000/api/parent/children/${this.editChildData.id}`,
          this.editChildData,
          { headers }
        );
        this.showToast("Данные ребёнка обновлены!", "success");
        this.showEditChildForm = false;
        await this.fetchChildren();
      } catch (error) {
        this.handleError(error, "Ошибка при обновлении ребёнка");
      } finally {
        this.isLoading = false;
      }
    },
    async enrollChild(classId) {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      if (!classId || !this.selectedChild) {
        this.showToast("Выберите занятие и ребёнка", "error");
        return;
      }
      console.log('Attempting to enroll:', { classId, childId: this.selectedChild }); // Debugging log
      try {
        this.isLoading = true;
        await axios.post(
          "http://localhost:3000/api/enrollments",
          { child_id: this.selectedChild, class_id: classId },
          { headers }
        );
        this.showToast("Ребёнок записан на занятие!", "success");
        await Promise.all([this.fetchClasses(), this.fetchSchedule()]);
      } catch (error) {
        this.handleError(error, "Ошибка при записи на занятие");
      } finally {
        this.isLoading = false;
      }
    },
    async unenrollChild(classId) {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      try {
        this.isLoading = true;
        await axios.delete(
          `http://localhost:3000/api/enrollments/${this.selectedChildForSchedule}/${classId}`,
          { headers }
        );
        this.showToast("Запись отменена!", "success");
        await Promise.all([this.fetchSchedule(), this.fetchClasses()]);
      } catch (error) {
        this.handleError(error, "Ошибка при отмене записи");
      } finally {
        this.isLoading = false;
      }
    },
    startEditingProfile() {
      this.isEditingProfile = true;
      this.editProfile = { ...this.parentProfile, password: "" };
      this.validatePhone();
    },
    cancelEditingProfile() {
      this.isEditingProfile = false;
      this.editProfile = { username: "", email: "", phone: "", password: "" };
      this.phoneError = null;
    },
    async updateProfile() {
      const headers = this.getAuthHeaders();
      if (!headers) return;
      if (this.phoneError) {
        this.showToast("Исправьте ошибки в номере телефона", "error");
        return;
      }
      try {
        this.isLoading = true;
        const updateData = {};
        if (this.editProfile.username)
          updateData.username = this.editProfile.username;
        if (this.editProfile.email) updateData.email = this.editProfile.email;
        if (this.editProfile.phone) updateData.phone = this.editProfile.phone;
        if (this.editProfile.password)
          updateData.password = this.editProfile.password;
        await axios.put(
          "http://localhost:3000/api/parent/profile",
          updateData,
          { headers }
        );
        this.showToast("Профиль обновлён!", "success");
        this.isEditingProfile = false;
        this.editProfile = {
          username: "",
          email: "",
          phone: "",
          password: "",
        };
        await this.fetchParentProfile();
        const user = JSON.parse(localStorage.getItem("user") || "null");
        if (user) {
          const updatedUser = { ...user, ...updateData };
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      } catch (error) {
        this.handleError(error, "Ошибка при обновлении профиля");
      } finally {
        this.isLoading = false;
      }
    },
    editChild(child) {
      this.editChildData = { ...child };
      this.showEditChildForm = true;
    },
    togglePastClasses() {
      this.showPastClasses = !this.showPastClasses;
      this.fetchSchedule();
    },
    validatePhone() {
      const phonePattern = /^\+\d{10,15}$/;
      if (!this.editProfile.phone) {
        this.phoneError = 'Поле "Телефон" обязательно';
      } else if (!phonePattern.test(this.editProfile.phone)) {
        this.phoneError =
          "Введите номер телефона в формате +1234567890 (10-15 цифр)";
      } else {
        this.phoneError = null;
      }
    },
    logout() {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      this.$router.push("/login");
    },
    getAuthHeaders() {
      const token = localStorage.getItem("token");
      if (!token) {
        this.showToast("Сессия истекла, войдите снова", "error");
        this.logout();
        return null;
      }
      return { Authorization: `Bearer ${token}` };
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString("ru-RU");
    },
    formatDateTime(date) {
      return new Date(date).toLocaleString("ru-RU");
    },
    isChildEnrolled(classId) {
      return this.schedule.some((item) => item.id === classId);
    },
    showToast(message, type = "error") {
      if (this.$toast) {
        this.$toast[type](message, { timeout: 5000 });
      } else {
        console[type === "error" ? "error" : "log"](`Toast (${type}): ${message}`);
        alert(message);
      }
    },
    handleError(error, defaultMessage) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        this.showToast("Сессия истекла, войдите снова", "error");
        this.logout();
      } else {
        this.showToast(
          `${defaultMessage}: ${error.response?.data?.error || error.message}`,
          "error"
        );
      }
    },
  },

  watch: {
  "editProfile.phone": "validatePhone",
  selectedChild() {
    this.fetchClasses();
  },
  selectedSubject() {
    this.fetchClasses();
  },
},


  async mounted() {
    this.user = JSON.parse(localStorage.getItem("user") || "null");
    if (!this.user || this.user.role !== "parent") {
      this.showToast("Доступ запрещён", "error");
      this.$router.push("/login");
      return;
    }
    try {
      await Promise.all([
        this.fetchParentProfile(),
        this.fetchChildren(),
        this.fetchSubjects(),
        this.fetchTeachers(),
        this.fetchReviews(),
      ]);
    } catch (error) {
      this.handleError(error, "Ошибка при инициализации страницы");
    }
  },
};
</script>

<style scoped>
.parent-page {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.sidebar {
  width: 250px;
  background-color: #ffffff;
  padding: 20px;
  border-right: 1px solid #dee2e6;
}

.nav-link {
  color: #333;
  cursor: pointer;
  padding: 10px;
  border-radius: 5px;
  transition: background-color 0.3s;
}

.nav-link:hover {
  background-color: #e9ecef;
}

.nav-link.active {
  background-color: #28a745;
  color: white !important;
}

.main-content {
  background-color: #ffffff;
  border-radius: 10px;
  margin: 20px;
}

.card {
  border: none;
  border-radius: 10px;
}

.btn-dark-green {
  background-color: #28a745;
  border-color: #28a745;
  color: white;
}

.btn-dark-green:hover {
  background-color: #218838;
  border-color: #1e7e34;
}

.table-success {
  background-color: #d4edda;
}

.badge.bg-primary {
  background-color: #007bff !important;
}

.badge.bg-success {
  background-color: #28a745 !important;
}

.review {
  background-color: #f8f9fa;
}
</style>