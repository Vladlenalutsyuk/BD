<template>
  <div class="admin-page">
    <!-- Sidebar -->
    <div class="sidebar">
      <h3 class="mb-4">Меню</h3>
      <div class="nav-link" :class="{ active: activeTab === 'dashboard' }" @click="activeTab = 'dashboard'">
        <i class="bi bi-house-door"></i> Главная
      </div>
      <div class="nav-link" :class="{ active: activeTab === 'teachers' }" @click="activeTab = 'teachers'">
        <i class="bi bi-person"></i> Управление учителями
      </div>
      <div class="nav-link" :class="{ active: activeTab === 'classes' }" @click="activeTab = 'classes'">
        <i class="bi bi-calendar"></i> Управление занятиями
      </div>
      <div class="nav-link" :class="{ active: activeTab === 'parents' }" @click="activeTab = 'parents'">
        <i class="bi bi-people"></i> Родители и дети
      </div>
      <div class="nav-link" :class="{ active: activeTab === 'statistics' }" @click="activeTab = 'statistics'">
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
    <button class="btn btn-dark-green btn-lg" data-bs-toggle="modal" data-bs-target="#addTeacherModal">
      Добавить учителя
    </button>
  </div>

  <!-- Переключение между активными и удалёнными учителями -->
  <div class="mb-4">
    <div class="btn-group" role="group">
      <button
        type="button"
        class="btn"
        :class="teacherView === 'active' ? 'btn-dark-green' : 'btn-outline-dark-green'"
        @click="teacherView = 'active'"
      >
        Активные учителя
      </button>
      <button
        type="button"
        class="btn"
        :class="teacherView === 'deleted' ? 'btn-dark-green' : 'btn-outline-dark-green'"
        @click="teacherView = 'deleted'; fetchDeletedTeachers()"
      >
        Удалённые учителя
      </button>
    </div>
  </div>

  <!-- Список активных учителей -->
  <div v-if="teacherView === 'active'">
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
              <button class="btn btn-danger btn-sm" @click="deleteTeacher(teacher.user_id)">Удалить</button>
            </td>
          </tr>
          <tr v-if="teachers.length === 0">
            <td colspan="5" class="text-center">Нет активных учителей.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Список удалённых учителей -->
  <div v-else-if="teacherView === 'deleted'">
    <h3>Список удалённых учителей</h3>
    <div class="table-responsive">
      <table class="table table-striped">
        <thead class="table-success">
          <tr>
            <th>Имя</th>
            <th>Email</th>
            <th>Телефон</th>
            <th>Предмет</th>
            <th>Дата удаления</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="teacher in deletedTeachers" :key="teacher.user_id">
            <td>{{ teacher.username }}</td>
            <td>{{ teacher.email }}</td>
            <td>{{ teacher.phone || 'Не указан' }}</td>
            <td>{{ teacher.subject_name || 'Не указан' }}</td>
            <td>{{ new Date(teacher.deleted_at).toLocaleDateString('ru-RU') }}</td>
            <td>
              <button class="btn btn-success btn-sm" @click="restoreTeacher(teacher.user_id)">Восстановить</button>
            </td>
          </tr>
          <tr v-if="deletedTeachers.length === 0">
            <td colspan="6" class="text-center">Нет удалённых учителей.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
      <!-- Manage Classes Tab -->
      <div v-else-if="activeTab === 'classes'">
        <h2>Управление занятиями</h2>
        <div class="mb-4">
          <button class="btn btn-dark-green btn-lg" data-bs-toggle="modal" data-bs-target="#addClassModal">
            Добавить занятие
          </button>
        </div>

        <!-- Фильтр по предметам -->
        <div class="mb-4">
          <label for="subject-filter" class="form-label">Фильтр по предметам</label>
          <select id="subject-filter" class="form-select w-auto" v-model="subjectFilter" @change="filterClasses">
            <option value="">Все предметы</option>
            <option v-for="subject in subjects" :key="subject.id" :value="subject.id">{{ subject.name }}</option>
          </select>
        </div>

        <!-- Переключение вида расписания -->
        <div class="mb-4">
          <label class="form-label">Вид расписания</label>
          <div class="btn-group" role="group">
            <button
              type="button"
              class="btn"
              :class="scheduleView === 'day' ? 'btn-dark-green' : 'btn-outline-dark-green'"
              @click="updateScheduleView('day')"
            >
              День
            </button>
            <button
              type="button"
              class="btn"
              :class="scheduleView === 'week' ? 'btn-dark-green' : 'btn-outline-dark-green'"
              @click="updateScheduleView('week')"
            >
              Неделя
            </button>
            <button
              type="button"
              class="btn"
              :class="scheduleView === 'month' ? 'btn-dark-green' : 'btn-outline-dark-green'"
              @click="updateScheduleView('month')"
            >
              Месяц
            </button>
          </div>
        </div>

        <!-- Фильтр по дате -->
        <div class="mb-4 row">
          <div class="col-md-4">
            <label class="form-label">Выберите дату</label>
            <input
              type="date"
              class="form-control w-auto"
              v-model="selectedDate"
              @change="updateScheduleView(scheduleView)"
            />
          </div>
          <div class="col-md-8 d-flex align-items-end">
            <button class="btn btn-outline-dark-green me-2" @click="changeDate(-1)">Предыдущий</button>
            <button class="btn btn-outline-dark-green" @click="changeDate(1)">Следующий</button>
          </div>
        </div>

        <!-- Day View -->
        <div v-if="scheduleView === 'day'">
          <h3>Предстоящие занятия на {{ new Date(selectedDate).toLocaleDateString('ru-RU') }}</h3>
          <div class="table-responsive">
            <table class="table table-striped">
              <thead class="table-success">
                <tr>
                  <th>Предмет</th>
                  <th>Тип</th>
                  <th>Учитель</th>
                  <th>Время</th>
                  <th>Кабинет</th>
                  <th>Цена (руб.)</th>
                  <th>Кол-во детей</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredDayClasses.length === 0">
                  <td colspan="8" class="text-center">Предстоящих занятий на этот день нет.</td>
                </tr>
                <template v-for="classItem in filteredDayClasses" :key="classItem.id">
                  <tr v-if="!classItem.completed" @click="toggleEnrolledChildren(classItem.id)" class="class-row">
                    <td>{{ classItem.subject }}</td>
                    <td>{{ classItem.class_type === 'group' ? 'Групповое' : 'Индивидуальное' }}</td>
                    <td>{{ classItem.teacher_name || 'Не назначен' }}</td>
                    <td>{{ new Date(classItem.schedule).toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</td>
                    <td>{{ classItem.room || 'Не указан' }}</td>
                    <td>{{ classItem.price }}</td>
                    <td>{{ classItem.enrolled_count || 0 }}</td>
                    <td>
                      <button class="btn btn-dark-green btn-sm me-2" @click.stop="openEditClassModal(classItem)">Редактировать</button>
                      <button class="btn btn-primary btn-sm me-2" @click.stop="fetchEligibleChildren(classItem.id)">Добавить ребенка</button>
                      <button class="btn btn-success btn-sm me-2" @click.stop="markClassCompleted(classItem.id)">Завершить</button>
                      <button class="btn btn-danger btn-sm" @click.stop="deleteClass(classItem.id)">Удалить</button>
                    </td>
                  </tr>
                  <tr v-if="expandedClass === classItem.id" class="enrolled-row">
                    <td colspan="8">
                      <div class="enrolled-list p-3">
                        <h5>Записанные дети</h5>
                        <div v-if="enrolledChildren[classItem.id]?.length">
                          <ul class="list-group">
                            <li v-for="child in enrolledChildren[classItem.id]" :key="child.id" class="list-group-item d-flex justify-content-between align-items-center">
                              <span>{{ child.name }} (Дата рождения: {{ new Date(child.birth_date).toLocaleDateString('ru-RU') }})</span>
                              <button class="btn btn-danger btn-sm" @click="removeChildFromClass(classItem.id, child.id)">Удалить</button>
                            </li>
                          </ul>
                        </div>
                        <p v-else>Нет записанных детей.</p>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>

          <!-- Завершенные занятия -->
          <h3 class="mt-5">Завершенные занятия на {{ new Date(selectedDate).toLocaleDateString('ru-RU') }}</h3>
          <div class="table-responsive">
            <table class="table table-striped">
              <thead class="table-success">
                <tr>
                  <th>Предмет</th>
                  <th>Тип</th>
                  <th>Учитель</th>
                  <th>Время</th>
                  <th>Кабинет</th>
                  <th>Цена (руб.)</th>
                  <th>Кол-во детей</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="completedDayClasses.length === 0">
                  <td colspan="8" class="text-center">Завершенных занятий на этот день нет.</td>
                </tr>
                <template v-for="classItem in completedDayClasses" :key="classItem.id">
                  <tr @click="toggleEnrolledChildren(classItem.id)" class="class-row completed-class">
                    <td>{{ classItem.subject }}</td>
                    <td>{{ classItem.class_type === 'group' ? 'Групповое' : 'Индивидуальное' }}</td>
                    <td>{{ classItem.teacher_name || 'Не назначен' }}</td>
                    <td>{{ new Date(classItem.schedule).toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</td>
                    <td>{{ classItem.room || 'Не указан' }}</td>
                    <td>{{ classItem.price }}</td>
                    <td>{{ classItem.enrolled_count || 0 }}</td>
                    <td>
                      <button class="btn btn-danger btn-sm" @click.stop="deleteClass(classItem.id)">Удалить</button>
                    </td>
                  </tr>
                  <tr v-if="expandedClass === classItem.id" class="enrolled-row">
                    <td colspan="8">
                      <div class="enrolled-list p-3">
                        <h5>Записанные дети</h5>
                        <div v-if="enrolledChildren[classItem.id]?.length">
                          <ul class="list-group">
                            <li v-for="child in enrolledChildren[classItem.id]" :key="child.id" class="list-group-item d-flex justify-content-between align-items-center">
                              <span>{{ child.name }} (Дата рождения: {{ new Date(child.birth_date).toLocaleDateString('ru-RU') }})</span>
                            </li>
                          </ul>
                        </div>
                        <p v-else>Нет записанных детей.</p>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Week View -->
        <div v-else-if="scheduleView === 'week'">
          <h3>Предстоящие занятия на неделю с {{ new Date(weekStart).toLocaleDateString('ru-RU') }} по {{ new Date(weekEnd).toLocaleDateString('ru-RU') }}</h3>
          <div v-for="day in weekDays" :key="day.date.toISOString()" class="mb-4">
            <h4>{{ day.date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }) }}</h4>
            <div class="table-responsive">
              <table class="table table-striped">
                <thead class="table-success">
                  <tr>
                    <th>Предмет</th>
                    <th>Тип</th>
                    <th>Учитель</th>
                    <th>Время</th>
                    <th>Кабинет</th>
                    <th>Цена (руб.)</th>
                    <th>Кол-во детей</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="classItem in day.classes" :key="classItem.id">
                    <tr v-if="!classItem.completed" @click="toggleEnrolledChildren(classItem.id)" class="class-row">
                      <td>{{ classItem.subject }}</td>
                      <td>{{ classItem.class_type === 'group' ? 'Групповое' : 'Индивидуальное' }}</td>
                      <td>{{ classItem.teacher_name || 'Не назначен' }}</td>
                      <td>{{ new Date(classItem.schedule).toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</td>
                      <td>{{ classItem.room || 'Не указан' }}</td>
                      <td>{{ classItem.price }}</td>
                      <td>{{ classItem.enrolled_count || 0 }}</td>
                      <td>
                        <button class="btn btn-dark-green btn-sm me-2" @click.stop="openEditClassModal(classItem)">Редактировать</button>
                        <button class="btn btn-primary btn-sm me-2" @click.stop="fetchEligibleChildren(classItem.id)">Добавить ребенка</button>
                        <button class="btn btn-success btn-sm me-2" @click.stop="markClassCompleted(classItem.id)">Завершить</button>
                        <button class="btn btn-danger btn-sm" @click.stop="deleteClass(classItem.id)">Удалить</button>
                      </td>
                    </tr>
                    <tr v-if="expandedClass === classItem.id" class="enrolled-row">
                      <td colspan="8">
                        <div class="enrolled-list p-3">
                          <h5>Записанные дети</h5>
                          <div v-if="enrolledChildren[classItem.id]?.length">
                            <ul class="list-group">
                              <li v-for="child in enrolledChildren[classItem.id]" :key="child.id" class="list-group-item d-flex justify-content-between align-items-center">
                                <span>{{ child.name }} (Дата рождения: {{ new Date(child.birth_date).toLocaleDateString('ru-RU') }})</span>
                                <button class="btn btn-danger btn-sm" @click="removeChildFromClass(classItem.id, child.id)">Удалить</button>
                              </li>
                            </ul>
                          </div>
                          <p v-else>Нет записанных детей.</p>
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>
          <p v-if="weekDays.length === 0" class="text-center">Предстоящих занятий на эту неделю нет.</p>

          <!-- Завершенные занятия на неделю -->
          <h3 class="mt-5">Завершенные занятия на неделю с {{ new Date(weekStart).toLocaleDateString('ru-RU') }} по {{ new Date(weekEnd).toLocaleDateString('ru-RU') }}</h3>
          <div v-for="day in completedWeekDays" :key="day.date.toISOString()" class="mb-4">
            <h4>{{ day.date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }) }}</h4>
            <div class="table-responsive">
              <table class="table table-striped">
                <thead class="table-success">
                  <tr>
                    <th>Предмет</th>
                    <th>Тип</th>
                    <th>Учитель</th>
                    <th>Время</th>
                    <th>Кабинет</th>
                    <th>Цена (руб.)</th>
                    <th>Кол-во детей</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="classItem in day.classes" :key="classItem.id">
                    <tr @click="toggleEnrolledChildren(classItem.id)" class="class-row completed-class">
                      <td>{{ classItem.subject }}</td>
                      <td>{{ classItem.class_type === 'group' ? 'Групповое' : 'Индивидуальное' }}</td>
                      <td>{{ classItem.teacher_name || 'Не назначен' }}</td>
                      <td>{{ new Date(classItem.schedule).toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</td>
                      <td>{{ classItem.room || 'Не указан' }}</td>
                      <td>{{ classItem.price }}</td>
                      <td>{{ classItem.enrolled_count || 0 }}</td>
                      <td>
                        <button class="btn btn-danger btn-sm" @click.stop="deleteClass(classItem.id)">Удалить</button>
                      </td>
                    </tr>
                    <tr v-if="expandedClass === classItem.id" class="enrolled-row">
                      <td colspan="8">
                        <div class="enrolled-list p-3">
                          <h5>Записанные дети</h5>
                          <div v-if="enrolledChildren[classItem.id]?.length">
                            <ul class="list-group">
                              <li v-for="child in enrolledChildren[classItem.id]" :key="child.id" class="list-group-item d-flex justify-content-between align-items-center">
                                <span>{{ child.name }} (Дата рождения: {{ new Date(child.birth_date).toLocaleDateString('ru-RU') }})</span>
                              </li>
                            </ul>
                          </div>
                          <p v-else>Нет записанных детей.</p>
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>
          <p v-if="completedWeekDays.length === 0" class="text-center">Завершенных занятий на эту неделю нет.</p>
        </div>

        <!-- Month View (Calendar) -->
        <div v-else-if="scheduleView === 'month'">
          <h3>Расписание на {{ new Date(selectedDate).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }) }}</h3>

          <!-- Calendar Grid -->
          <div class="calendar-container">
            <div class="calendar-header">
              <div class="calendar-day-header" v-for="day in ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']" :key="day">
                {{ day }}
              </div>
            </div>
            <div class="calendar-body">
              <!-- Empty cells before the first day -->
              <div
                v-for="n in firstDayOffset"
                :key="'empty-' + n"
                class="calendar-day empty"
              ></div>
              <!-- Days of the month -->
              <div
                v-for="day in calendarDays"
                :key="day.date.toISOString()"
                class="calendar-day"
                :class="{ 'has-classes': day.classes.length > 0, 'current-day': isCurrentDay(day.date) }"
                @click="selectCalendarDay(day.date)"
              >
                <div class="day-number">{{ day.date.getDate() }}</div>
                <div class="class msgs">
                  <span class="upcoming-count" v-if="day.upcomingCount > 0">{{ day.upcomingCount }} предстоящих</span>
                  <span class="completed-count" v-if="day.completedCount > 0">{{ day.completedCount }} завершенных</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Selected Day Details -->
          <div v-if="selectedCalendarDay" class="mt-4">
            <h4>Занятия на {{ selectedCalendarDay.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' }) }}</h4>

            <!-- Предстоящие занятия -->
            <h5>Предстоящие занятия</h5>
            <div class="table-responsive">
              <table class="table table-striped">
                <thead class="table-success">
                  <tr>
                    <th>Предмет</th>
                    <th>Тип</th>
                    <th>Учитель</th>
                    <th>Время</th>
                    <th>Кабинет</th>
                    <th>Цена (руб.)</th>
                    <th>Кол-во детей</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="selectedDayUpcomingClasses.length === 0">
                    <td colspan="8" class="text-center">Предстоящих занятий нет.</td>
                  </tr>
                  <template v-for="classItem in selectedDayUpcomingClasses" :key="classItem.id">
                    <tr @click="toggleEnrolledChildren(classItem.id)" class="class-row">
                      <td>{{ classItem.subject }}</td>
                      <td>{{ classItem.class_type === 'group' ? 'Групповое' : 'Индивидуальное' }}</td>
                      <td>{{ classItem.teacher_name || 'Не назначен' }}</td>
                      <td>{{ new Date(classItem.schedule).toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</td>
                      <td>{{ classItem.room || 'Не указан' }}</td>
                      <td>{{ classItem.price }}</td>
                      <td>{{ classItem.enrolled_count || 0 }}</td>
                      <td>
                        <button class="btn btn-dark-green btn-sm me-2" @click.stop="openEditClassModal(classItem)">Редактировать</button>
                        <button class="btn btn-primary btn-sm me-2" @click.stop="fetchEligibleChildren(classItem.id)">Добавить ребенка</button>
                        <button class="btn btn-success btn-sm me-2" @click.stop="markClassCompleted(classItem.id)">Завершить</button>
                        <button class="btn btn-danger btn-sm" @click.stop="deleteClass(classItem.id)">Удалить</button>
                      </td>
                    </tr>
                    <tr v-if="expandedClass === classItem.id" class="enrolled-row">
                      <td colspan="8">
                        <div class="enrolled-list p-3">
                          <h5>Записанные дети</h5>
                          <div v-if="enrolledChildren[classItem.id]?.length">
                            <ul class="list-group">
                              <li v-for="child in enrolledChildren[classItem.id]" :key="child.id" class="list-group-item d-flex justify-content-between align-items-center">
                                <span>{{ child.name }} (Дата рождения: {{ new Date(child.birth_date).toLocaleDateString('ru-RU') }})</span>
                                <button class="btn btn-danger btn-sm" @click="removeChildFromClass(classItem.id, child.id)">Удалить</button>
                              </li>
                            </ul>
                          </div>
                          <p v-else>Нет записанных детей.</p>
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>

            <!-- Завершенные занятия -->
            <h5 class="mt-4">Завершенные занятия</h5>
            <div class="table-responsive">
              <table class="table table-striped">
                <thead class="table-success">
                  <tr>
                    <th>Предмет</th>
                    <th>Тип</th>
                    <th>Учитель</th>
                    <th>Время</th>
                    <th>Кабинет</th>
                    <th>Цена (руб.)</th>
                    <th>Кол-во детей</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="selectedDayCompletedClasses.length === 0">
                    <td colspan="8" class="text-center">Завершенных занятий нет.</td>
                  </tr>
                  <template v-for="classItem in selectedDayCompletedClasses" :key="classItem.id">
                    <tr @click="toggleEnrolledChildren(classItem.id)" class="class-row completed-class">
                      <td>{{ classItem.subject }}</td>
                      <td>{{ classItem.class_type === 'group' ? 'Групповое' : 'Индивидуальное' }}</td>
                      <td>{{ classItem.teacher_name || 'Не назначен' }}</td>
                      <td>{{ new Date(classItem.schedule).toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</td>
                      <td>{{ classItem.room || 'Не указан' }}</td>
                      <td>{{ classItem.price }}</td>
                      <td>{{ classItem.enrolled_count || 0 }}</td>
                      <td>
                        <button class="btn btn-danger btn-sm" @click.stop="deleteClass(classItem.id)">Удалить</button>
                      </td>
                    </tr>
                    <tr v-if="expandedClass === classItem.id" class="enrolled-row">
                      <td colspan="8">
                        <div class="enrolled-list p-3">
                          <h5>Записанные дети</h5>
                          <div v-if="enrolledChildren[classItem.id]?.length">
                            <ul class="list-group">
                              <li v-for="child in enrolledChildren[classItem.id]" :key="child.id" class="list-group-item d-flex justify-content-between align-items-center">
                                <span>{{ child.name }} (Дата рождения: {{ new Date(child.birth_date).toLocaleDateString('ru-RU') }})</span>
                              </li>
                            </ul>
                          </div>
                          <p v-else>Нет записанных детей.</p>
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Manage Parents Tab -->
      <div v-else-if="activeTab === 'parents'">
        <h2>Управление родителями</h2>
        <h3>Список родителей и детей</h3>
        <div class="mb-4">
          <label for="search-parents" class="form-label">Поиск по имени родителя или ребёнка</label>
          <input type="text" class="form-control w-auto" id="search-parents" v-model="searchQuery" placeholder="Введите имя..." />
        </div>
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
              <tr v-for="parent in filteredParents" :key="parent.user_id">
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

          
          <h2>Статистика по учителям</h2>
          <div class="table-responsive statistics-table">
            <table class="table table-striped table-hover">
  <thead class="table-success">
    <tr>
      <th>Учитель</th>
      <th>Предмет</th>
      <th>Количество занятий</th>
      <th>Количество учеников</th>
      <th>Доход</th>
      <th>Зарплата учителя</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="stat in statistics" :key="stat.teacher_name">
      <td>{{ stat.teacher_name }}</td>
      <td>{{ stat.subject_name }}</td>
      <td>{{ stat.class_count }}</td>
      <td>{{ stat.total_students }}</td>
      <td>{{ stat.total_revenue }}</td>
      <td>{{ stat.teacher_salary }}</td>
    </tr>
    <tr v-if="!statistics.length">
          <td colspan="6" class="text-center">Нет данных за выбранный период.</td>
        </tr>
  </tbody>
</table>
</div>
</div>
</div>
      

      <!-- Modal for Adding Teacher -->
      <div class="modal fade" id="addTeacherModal" tabindex="-1" aria-labelledby="addTeacherModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="addTeacherModalLabel">Добавить нового учителя</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="createTeacher">
                <div class="row">
                  <div class="col-md-4 mb-3">
                    <label for="teacher-username" class="form-label">Имя пользователя</label>
                    <input type="text" class="form-control" id="teacher-username" v-model="newTeacher.username" required />
                  </div>
                  <div class="col-md-4 mb-3">
                    <label for="teacher-email" class="form-label">Email</label>
                    <input type="email" class="form-control" id="teacher-email" v-model="newTeacher.email" required />
                  </div>
                  <div class="col-md-4 mb-3">
                    <label for="teacher-password" class="form-label">Пароль</label>
                    <input type="password" class="form-control" id="teacher-password" v-model="newTeacher.password" required />
                  </div>
                </div>
                <button type="submit" class="btn btn-dark-green" data-bs-dismiss="modal">Добавить учителя</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal for Adding Class -->
      <div class="modal fade" id="addClassModal" tabindex="-1" aria-labelledby="addClassModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="addClassModalLabel">Добавить новое занятие</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="createClass">
                <div class="mb-3">
                  <label for="subject" class="form-label">Предмет</label>
                  <select class="form-select" v-model="newClass.subject_id" required @change="fetchTeachersBySubject">
                    <option value="" disabled>Выберите предмет</option>
                    <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
                      {{ subject.name }}
                    </option>
                  </select>
                </div>
                <div class="mb-3">
                  <label for="teacher" class="form-label">Учитель</label>
                  <select class="form-select" v-model="newClass.teacher_id" required>
                    <option value="" disabled>Выберите учителя</option>
                    <option v-for="teacher in filteredTeachers" :key="teacher.id" :value="teacher.id">
                      {{ teacher.username }}
                    </option>
                  </select>
                </div>
                <div class="mb-3">
                  <label for="schedule" class="form-label">Дата и время</label>
                  <input type="datetime-local" class="form-control" v-model="newClass.schedule" required />
                </div>
                <div class="mb-3">
                  <label for="room" class="form-label">Кабинет</label>
                  <select class="form-select" v-model="newClass.room_id">
                    <option value="">Без кабинета</option>
                    <option v-for="room in rooms" :key="room.id" :value="room.id">
                      {{ room.name }}
                    </option>
                  </select>
                </div>
                <div class="mb-3">
                  <label for="price" class="form-label">Цена (руб.)</label>
                  <input type="number" class="form-control" v-model.number="newClass.price" required min="0" />
                </div>
                <div class="mb-3">
                  <label for="class-type" class="form-label">Тип занятия</label>
                  <select class="form-select" v-model="newClass.class_type" required>
                    <option value="" disabled>Выберите тип</option>
                    <option value="group">Групповое</option>
                    <option value="individual">Индивидуальное</option>
                  </select>
                </div>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="min-age" class="form-label">Минимальный возраст</label>
                    <input type="number" class="form-control" v-model.number="newClass.min_age" min="3" max="15" />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label for="max-age" class="form-label">Максимальный возраст</label>
                    <input type="number" class="form-control" v-model.number="newClass.max_age" min="4" max="16" />
                  </div>
                </div>
                <button type="submit" class="btn btn-dark-green" data-bs-dismiss="modal">Добавить занятие</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal for Editing Class -->
      <div class="modal fade" id="editClassModal" tabindex="-1" aria-labelledby="editClassModalLabel" aria-hidden="true" ref="editClassModal">
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
                  <select class="form-select" v-model="editClass.subject_id" required @change="fetchTeachersBySubject">
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
                    <option v-for="teacher in filteredTeachers" :key="teacher.id" :value="teacher.id">
                      {{ teacher.username }}
                    </option>
                  </select>
                </div>
                <div class="mb-3">
                  <label for="edit-schedule" class="form-label">Дата и время</label>
                  <input type="datetime-local" class="form-control" v-model="editClass.schedule" required />
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
                  <input type="number" class="form-control" v-model.number="editClass.price" required min="0" />
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
                    <input type="number" class="form-control" v-model.number="editClass.min_age" min="3" max="15" />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label for="edit-max-age" class="form-label">Максимальный возраст</label>
                    <input type="number" class="form-control" v-model.number="editClass.max_age" min="4" max="16" />
                  </div>
                </div>
                <button type="submit" class="btn btn-dark-green" data-bs-dismiss="modal">Сохранить</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal for Adding Child to Class -->
      <div class="modal fade" id="addChildModal" tabindex="-1" aria-labelledby="addChildModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="addChildModalLabel">Добавить ребенка на занятие</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div v-if="eligibleChildren.length > 0">
                <h6>Подходящие дети:</h6>
                <ul class="list-group">
                  <li v-for="child in eligibleChildren" :key="child.id" class="list-group-item d-flex justify-content-between align-items-center">
                    <span>{{ child.name }} (Дата рождения: {{ new Date(child.birth_date).toLocaleDateString('ru-RU') }})</span>
                    <button class="btn btn-dark-green btn-sm" @click="enrollChild(child.id)" data-bs-dismiss="modal">Записать</button>
                  </li>
                </ul>
              </div>
              <p v-else>Нет подходящих детей для этого занятия.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>

  <script lang="ts">
  import { defineComponent, ref, computed, onMounted } from 'vue';
  import axios from 'axios';
  import { AxiosError } from 'axios';
  import { Modal } from 'bootstrap';
  import { useRouter } from 'vue-router';
  import { useToast } from 'vue-toastification';

  interface Teacher {
    user_id: string;
    id: string;
    username: string;
    email: string;
    phone?: string;
    subject_name?: string;
  }

  interface DeletedTeacher extends Teacher {
  deleted_at: string;
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
    enrolled_count: number;
  }

  interface Child {
    id: string;
    name: string;
    birth_date: string;
  }

  interface EligibleChild {
    id: string;
    name: string;
    birth_date: string;
  }

  interface Parent {
    user_id: string;
    username: string;
    email: string;
    phone?: string;
    children: Child[];
  }

  interface Statistic {
    teacher_name: string;
    subject_name?: string;
    class_count: number;
    total_students: number;
    total_revenue?: number;
    teacher_salary?: number;
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
    class_type: 'group' | 'individual';
    min_age: number;
    max_age: number;
  }

  interface EditClass {
    id: string;
    subject_id: string;
    teacher_id: string;
    schedule: string;
    room_id: string;
    price: number;
    class_type: 'group' | 'individual';
    min_age: number;
    max_age: number;
  }

  interface DaySchedule {
    date: Date;
    classes: ClassItem[];
    upcomingCount: number;
    completedCount: number;
  }

  export default defineComponent({
    name: 'AdminPage',
    setup() {
      const router = useRouter();
      const toast = useToast();
      

      // Reactive state
      const activeTab = ref<'dashboard' | 'teachers' | 'classes' | 'parents' | 'statistics'>('dashboard');
      const isLoading = ref(true);
      const hasError = ref(false);
      const errorMessage = ref('');
      const teachers = ref<Teacher[]>([]);
      const classes = ref<ClassItem[]>([]);
      const parents = ref<Parent[]>([]);
      const statistics = ref<Statistic[]>([]);
      const subjects = ref<Subject[]>([]);
      const rooms = ref<Room[]>([]);
      const newTeacher = ref<NewTeacher>({ username: '', email: '', password: '' });
      const newClass = ref<NewClass>({
        subject_id: '',
        teacher_id: '',
        schedule: '',
        room_id: '',
        price: 0,
        class_type: 'group',
        min_age: 3,
        max_age: 16,
      });
      const editClass = ref<EditClass>({
        id: '',
        subject_id: '',
        teacher_id: '',
        schedule: '',
        room_id: '',
        price: 0,
        class_type: 'group',
        min_age: 3,
        max_age: 16,
      });
      const filteredTeachers = ref<Teacher[]>([]);
      const scheduleView = ref<'day' | 'week' | 'month'>('day');
      const selectedDate = ref<string>(new Date().toISOString().split('T')[0]);
      const selectedMonth = ref<string>(new Date().toISOString().slice(0, 7));
      const subjectFilter = ref<string>('');
      const searchQuery = ref<string>('');
      const filteredDayClasses = ref<ClassItem[]>([]);
      const completedDayClasses = ref<ClassItem[]>([]);
      const weekStart = ref<Date>(new Date());
      const weekEnd = ref<Date>(new Date());
      const weekDays = ref<DaySchedule[]>([]);
      const completedWeekDays = ref<DaySchedule[]>([]);
      const calendarDays = ref<DaySchedule[]>([]);
      const selectedCalendarDay = ref<Date | null>(null);
      const selectedDayUpcomingClasses = ref<ClassItem[]>([]);
      const selectedDayCompletedClasses = ref<ClassItem[]>([]);
      const expandedClass = ref<string | null>(null);
      const enrolledChildren = ref<{ [key: string]: Child[] }>({});
      const eligibleChildren = ref<EligibleChild[]>([]);
      const selectedClassId = ref<string | null>(null);
      const teacherView = ref<'active' | 'deleted'>('active');
      const deletedTeachers = ref<DeletedTeacher[]>([]);

      // Computed properties
      const filteredParents = computed<Parent[]>(() => {
        if (!searchQuery.value) return parents.value;
        const query = searchQuery.value.toLowerCase();
        return parents.value.filter(
          (parent) =>
            parent.username.toLowerCase().includes(query) ||
            parent.children.some((child) => child.name.toLowerCase().includes(query))
        );
      });

      const firstDayOffset = computed<number>(() => {
        const selected = new Date(selectedDate.value);
        const monthStart = new Date(selected.getFullYear(), selected.getMonth(), 1);
        return (monthStart.getDay() + 6) % 7;
      });

      // Methods
      // Обновим handleError для обработки конфликтов
const handleError = (err, defaultMessage) => {
  let message = defaultMessage;
  if (err instanceof AxiosError) {
    if (err.response) {
      message = err.response.data?.error || defaultMessage;
      if (err.response.status === 409) {
        message = 'Конфликт расписания: учитель или кабинет заняты в это время';
      }
    } else if (err.request) {
      message = 'Нет ответа от сервера. Проверьте ваше интернет-соединение.';
    } else {
      message = err.message || defaultMessage;
    }
  } else if (err instanceof Error) {
    message = err.message || defaultMessage;
  }
  toast.error(message);
  if (message.includes('токен') || message.includes('доступ')) {
    hasError.value = true;
    errorMessage.value = message;
    isLoading.value = false;
  }
};

      const validateToken = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) throw new Error('Токен отсутствует');

          const response = await axios.get('http://localhost:3000/api/auth/validate', {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.data.valid || response.data.role !== 'admin') {
            throw new Error('Недействительный токен или недостаточно прав');
          }

          await fetchData();
          isLoading.value = false;
        } catch (err) {
          handleError(err, 'Ошибка проверки токена');
        }
      };

      const fetchData = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Токен отсутствует. Пожалуйста, войдите снова.');
      logout();
      return;
    }
    const [teachersRes, classesRes, parentsRes, subjectsRes, roomsRes, deletedTeachersRes] = await Promise.all([
      axios.get<Teacher[]>('http://localhost:3000/api/users/teachers', {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get<ClassItem[]>('http://localhost:3000/api/classes', {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get<Parent[]>('http://localhost:3000/api/users/parents-children', {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get<Subject[]>('http://localhost:3000/api/subjects', {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get<Room[]>('http://localhost:3000/api/rooms', {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get<DeletedTeacher[]>('http://localhost:3000/api/deleted_teachers', {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    teachers.value = teachersRes.data;
    classes.value = classesRes.data;
    parents.value = parentsRes.data;
    subjects.value = subjectsRes.data;
    rooms.value = roomsRes.data;
    deletedTeachers.value = deletedTeachersRes.data;

    filterClasses();
    await fetchStatistics();
  } catch (err) {
    handleError(err, 'Ошибка загрузки данных');
  }
};

      const fetchTeachersBySubject = async () => {
        try {
          const subjectId = newClass.value.subject_id || editClass.value.subject_id;
          if (!subjectId) {
            filteredTeachers.value = [];
            return;
          }
          const token = localStorage.getItem('token');
          if (!token) {
            toast.error('Токен отсутствует. Пожалуйста, войдите снова.');
            logout();
            return;
          }
          const response = await axios.get<Teacher[]>(`http://localhost:3000/api/teachers/by-subject/${subjectId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          filteredTeachers.value = response.data;
        } catch (err) {
          handleError(err, 'Ошибка загрузки учителей по предмету');
        }
      };

      const createTeacher = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            toast.error('Токен отсутствует. Пожалуйста, войдите снова.');
            logout();
            return;
          }
          await axios.post('http://localhost:3000/api/teachers', newTeacher.value, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toast.success('Учитель успешно добавлен');
          newTeacher.value = { username: '', email: '', password: '' };
          await fetchData();
        } catch (err) {
          handleError(err, 'Ошибка при добавлении учителя');
        }
      };

      const deleteTeacher = async (userId: string) => {
        if (!confirm('Вы уверены, что хотите удалить этого учителя?')) return;
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            toast.error('Токен отсутствует. Пожалуйста, войдите снова.');
            logout();
            return;
          }
          await axios.delete(`http://localhost:3000/api/teachers/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toast.success('Учитель успешно удален');
          await fetchData();
        } catch (err) {
          handleError(err, 'Ошибка при удалении учителя');
        }
      };

      const createClass = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Токен отсутствует. Пожалуйста, войдите снова.');
      logout();
      return;
    }
    await axios.post('http://localhost:3000/api/classes', newClass.value, {
      headers: { Authorization: `Bearer ${token}` },
    });
    toast.success('Занятие успешно добавлено');
    newClass.value = {
      subject_id: '',
      teacher_id: '',
      schedule: '',
      room_id: '',
      price: 0,
      class_type: 'group',
      min_age: 3,
      max_age: 16,
    };
    await fetchData();
  } catch (err) {
    handleError(err, 'Ошибка при добавлении занятия');
  }
};

      const openEditClassModal = (classItem: ClassItem) => {
        editClass.value = {
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
        fetchTeachersBySubject();
        const modalElement = document.getElementById('editClassModal');
        if (modalElement) {
          const modal = new Modal(modalElement);
          modal.show();
        }
      };

      const updateClass = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Токен отсутствует. Пожалуйста, войдите снова.');
      logout();
      return;
    }
    await axios.put(`http://localhost:3000/api/classes/${editClass.value.id}`, editClass.value, {
      headers: { Authorization: `Bearer ${token}` },
    });
    toast.success('Занятие успешно обновлено');
    await fetchData();
  } catch (err) {
    handleError(err, 'Ошибка при обновлении занятия');
  }
};

      const deleteClass = async (classId: string) => {
        if (!confirm('Вы уверены, что хотите удалить это занятие?')) return;
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            toast.error('Токен отсутствует. Пожалуйста, войдите снова.');
            logout();
            return;
          }
          await axios.delete(`http://localhost:3000/api/classes/${classId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toast.success('Занятие успешно удалено');
          await fetchData();
        } catch (err) {
          handleError(err, 'Ошибка при удалении занятия');
        }
      };

      const markClassCompleted = async (classId: string) => {
        if (!confirm('Вы уверены, что хотите отметить это занятие как завершенное?')) return;
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            toast.error('Токен отсутствует. Пожалуйста, войдите снова.');
            logout();
            return;
          }
          await axios.put(`http://localhost:3000/api/classes/${classId}/complete`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toast.success('Занятие отмечено как завершенное');
          await fetchData();
        } catch (err) {
          handleError(err, 'Ошибка при отметке занятия как завершенного');
        }
      };

      const fetchStatistics = async () => {
  console.log('Selected month:', selectedMonth.value);
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Токен отсутствует. Пожалуйста, войдите снова.');
      logout();
      return;
    }
    const response = await axios.get('http://localhost:3000/api/statistics/teachers', {
      params: { month: selectedMonth.value || undefined },
      headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
    });
    console.log('Statistics response:', response.data);
    statistics.value = response.data || [];
    if (!response.data.length) {
      toast.info('Нет данных за выбранный период.');
    }
  } catch (err) {
    handleError(err, 'Ошибка загрузки статистики');
  }
};
      const filterClasses = () => {
        const selected = new Date(selectedDate.value);
        let filteredClasses = subjectFilter.value
          ? classes.value.filter((c) => c.subject_id === subjectFilter.value)
          : classes.value;

        if (scheduleView.value === 'day') {
          filteredDayClasses.value = filteredClasses.filter(
            (c) =>
              new Date(c.schedule).toISOString().split('T')[0] ===
              selected.toISOString().split('T')[0] && !c.completed
          );
          completedDayClasses.value = filteredClasses.filter(
            (c) =>
              new Date(c.schedule).toISOString().split('T')[0] ===
              selected.toISOString().split('T')[0] && c.completed
          );
        } else if (scheduleView.value === 'week') {
          weekStart.value = new Date(selected);
          weekStart.value.setDate(selected.getDate() - selected.getDay() + 1);
          weekEnd.value = new Date(weekStart.value);
          weekEnd.value.setDate(weekStart.value.getDate() + 6);

          const weekClasses = filteredClasses.filter(
            (c) =>
              new Date(c.schedule) >= weekStart.value && new Date(c.schedule) <= weekEnd.value
          );

          weekDays.value = [];
          for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart.value);
            day.setDate(weekStart.value.getDate() + i);
            const dayClasses = weekClasses.filter(
              (c) => new Date(c.schedule).toISOString().split('T')[0] === day.toISOString().split('T')[0] && !c.completed
            );
            if (dayClasses.length > 0) {
              weekDays.value.push({ date: day, classes: dayClasses, upcomingCount: dayClasses.length, completedCount: 0 });
            }
          }

          completedWeekDays.value = [];
          for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart.value);
            day.setDate(weekStart.value.getDate() + i);
            const dayClasses = weekClasses.filter(
              (c) => new Date(c.schedule).toISOString().split('T')[0] === day.toISOString().split('T')[0] && c.completed
            );
            if (dayClasses.length > 0) {
              completedWeekDays.value.push({ date: day, classes: dayClasses, upcomingCount: 0, completedCount: dayClasses.length });
            }
          }
        } else if (scheduleView.value === 'month') {
          const monthStart = new Date(selected.getFullYear(), selected.getMonth(), 1);
          const monthEnd = new Date(selected.getFullYear(), selected.getMonth() + 1, 0);

          const monthClasses = filteredClasses.filter(
            (c) =>
              new Date(c.schedule) >= monthStart && new Date(c.schedule) <= monthEnd
          );

          calendarDays.value = [];
          for (let i = 1; i <= monthEnd.getDate(); i++) {
            const day = new Date(selected.getFullYear(), selected.getMonth(), i);
            const dayClasses = monthClasses.filter(
              (c) => new Date(c.schedule).toISOString().split('T')[0] === day.toISOString().split('T')[0]
            );
            const upcomingClasses = dayClasses.filter(c => !c.completed);
            const completedClasses = dayClasses.filter(c => c.completed);
            calendarDays.value.push({
              date: day,
              classes: dayClasses,
              upcomingCount: upcomingClasses.length,
              completedCount: completedClasses.length,
            });
          }

          if (selectedCalendarDay.value instanceof Date) {
            const selectedDayStr = selectedCalendarDay.value.toISOString().split('T')[0];
            selectedDayUpcomingClasses.value = monthClasses.filter(
              (c) =>
                new Date(c.schedule).toISOString().split('T')[0] === selectedDayStr && !c.completed
            );
            selectedDayCompletedClasses.value = monthClasses.filter(
              (c) =>
                new Date(c.schedule).toISOString().split('T')[0] === selectedDayStr && c.completed
            );
          }
        }
      };

      const updateScheduleView = (view: 'day' | 'week' | 'month') => {
        scheduleView.value = view;
        expandedClass.value = null;
        enrolledChildren.value = {};
        selectedCalendarDay.value = null;
        selectedDayUpcomingClasses.value = [];
        selectedDayCompletedClasses.value = [];
        filterClasses();
      };

      const changeDate = (direction: number) => {
        const currentDate = new Date(selectedDate.value);
        if (scheduleView.value === 'day') {
          currentDate.setDate(currentDate.getDate() + direction);
        } else if (scheduleView.value === 'week') {
          currentDate.setDate(currentDate.getDate() + direction * 7);
        } else if (scheduleView.value === 'month') {
          currentDate.setMonth(currentDate.getMonth() + direction);
        }
        selectedDate.value = currentDate.toISOString().split('T')[0];
        updateScheduleView(scheduleView.value);
      };

      const selectCalendarDay = (date: Date) => {
        selectedCalendarDay.value = date;
        filterClasses();
      };

      const isCurrentDay = (date: Date): boolean => {
        const today = new Date();
        return (
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear()
        );
      };

      const toggleEnrolledChildren = async (classId: string) => {
        if (expandedClass.value === classId) {
          expandedClass.value = null;
          return;
        }
        expandedClass.value = classId;
        if (!enrolledChildren.value[classId]) {
          try {
            const token = localStorage.getItem('token');
            if (!token) {
              toast.error('Токен отсутствует. Пожалуйста, войдите снова.');
              logout();
              return;
            }
            const response = await axios.get<Child[]>(`http://localhost:3000/api/enrollments/${classId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            enrolledChildren.value = { ...enrolledChildren.value, [classId]: response.data };
          } catch (err) {
            handleError(err, 'Ошибка загрузки списка детей');
          }
        }
      };

      const removeChildFromClass = async (classId: string, childId: string) => {
        if (!confirm('Вы уверены, что хотите удалить этого ребенка из занятия?')) return;
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            toast.error('Токен отсутствует. Пожалуйста, войдите снова.');
            logout();
            return;
          }
          await axios.delete(`http://localhost:3000/api/enrollments/${classId}/${childId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toast.success('Ребенок успешно удален из занятия');
          enrolledChildren.value[classId] = enrolledChildren.value[classId].filter(
            (child) => child.id !== childId
          );
          classes.value = classes.value.map((c) =>
            c.id === classId ? { ...c, enrolled_count: (c.enrolled_count || 1) - 1 } : c
          );
          filterClasses();
        } catch (err) {
          handleError(err, 'Ошибка при удалении ребенка из занятия');
        }
      };

      const fetchEligibleChildren = async (classId: string) => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            toast.error('Токен отсутствует. Пожалуйста, войдите снова.');
            logout();
            return;
          }
          const response = await axios.get<EligibleChild[]>(`http://localhost:3000/api/children/eligible/${classId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          eligibleChildren.value = response.data;
          selectedClassId.value = classId;
          const modalElement = document.getElementById('addChildModal');
          if (modalElement) {
            const modal = new Modal(modalElement);
            modal.show();
          }
        } catch (err) {
          handleError(err, 'Ошибка загрузки списка подходящих детей');
        }
      };

      const enrollChild = async (childId: string) => {
        if (!selectedClassId.value) return;
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            toast.error('Токен отсутствует. Пожалуйста, войдите снова.');
            logout();
            return;
          }
          await axios.post('http://localhost:3000/api/enrollments', {
            classId: selectedClassId.value,
            childId,
          }, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toast.success('Ребенок успешно записан на занятие');
          eligibleChildren.value = eligibleChildren.value.filter(child => child.id !== childId);
          await fetchData();
          await toggleEnrolledChildren(selectedClassId.value);
        } catch (err) {
          handleError(err, 'Ошибка записи ребенка на занятие');
        }
      };

      const logout = () => {
        localStorage.removeItem('token');
        router.push('/login');
      };

      const fetchDeletedTeachers = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Токен отсутствует. Пожалуйста, войдите снова.');
      logout();
      return;
    }
    const response = await axios.get<DeletedTeacher[]>('http://localhost:3000/api/deleted_teachers', {
      headers: { Authorization: `Bearer ${token}` },
    });
    deletedTeachers.value = response.data;
  } catch (err) {
    handleError(err, 'Ошибка загрузки списка удалённых учителей');
  }
};

const restoreTeacher = async (userId: string) => {
  if (!confirm('Вы уверены, что хотите восстановить этого учителя?')) return;
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Токен отсутствует. Пожалуйста, войдите снова.');
      logout();
      return;
    }
    await axios.post(`http://localhost:3000/api/teachers/restore/${userId}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    toast.success('Учитель успешно восстановлен');
    await fetchData(); // Обновляем список активных учителей
    await fetchDeletedTeachers(); // Обновляем список удалённых учителей
  } catch (err) {
    handleError(err, 'Ошибка при восстановлении учителя');
  }
};

      // Lifecycle hook
      onMounted(() => {
        validateToken();
      });

      return {
        activeTab,
        isLoading,
        hasError,
        errorMessage,
        teachers,
        classes,
        parents,
        statistics,
        subjects,
        rooms,
        newTeacher,
        newClass,
        editClass,
        filteredTeachers,
        scheduleView,
        selectedDate,
        selectedMonth,
        subjectFilter,
        searchQuery,
        filteredDayClasses,
        completedDayClasses,
        weekStart,
        weekEnd,
        weekDays,
        completedWeekDays,
        calendarDays,
        selectedCalendarDay,
        selectedDayUpcomingClasses,
        selectedDayCompletedClasses,
        expandedClass,
        enrolledChildren,
        eligibleChildren,
        selectedClassId,
        filteredParents,
        firstDayOffset,
        validateToken,
        fetchData,
        fetchTeachersBySubject,
        createTeacher,
        deleteTeacher,
        createClass,
        openEditClassModal,
        updateClass,
        deleteClass,
        markClassCompleted,
        fetchStatistics,
        filterClasses,
        updateScheduleView,
        changeDate,
        selectCalendarDay,
        isCurrentDay,
        toggleEnrolledChildren,
        removeChildFromClass,
        fetchEligibleChildren,
        enrollChild,
        logout,
        teacherView,
        deletedTeachers,
        fetchDeletedTeachers,
        restoreTeacher,
      };
    },
  });
  </script>

  <style scoped>
  .admin-page {
    display: flex;
    min-height: 100vh;
  }

  .sidebar {
    width: 250px;
    background-color: #f8f9fa;
    padding: 20px;
    border-right: 1px solid #dee2e6;
  }

  .nav-link {
    padding: 10px;
    cursor: pointer;
    border-radius: 5px;
    margin-bottom: 5px;
  }

  .nav-link:hover {
    background-color: #e9ecef;
  }

  .nav-link.active {
    background-color: #28a745;
    color: white;
  }

  .nav-link i {
    margin-right: 10px;
  }

  .main-content {
    flex: 1;
    padding: 20px;
  }

  .card {
    background-color: #fff;
    border: 1px solid #dee2e6;
    border-radius: 5px;
  }

  .table-success th {
    background-color: #28a745;
    color: white;
  }

  .class-row {
    cursor: pointer;
  }

  .class-row:hover {
    background-color: #f1f1f1;
  }

  .completed-class {
    background-color: #e9ecef;
  }

  .enrolled-row {
    background-color: #f8f9fa;
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

  .btn-primary {
    background-color: #007bff;
    border-color: #007bff;
    color: white;
  }

  .btn-primary:hover {
    background-color: #0056b3;
    border-color: #004085;
  }

  .btn-outline-dark-green {
    border-color: #28a745;
    color: #28a745;
  }

  .btn-outline-dark-green:hover {
    background-color: #28a745;
    color: white;
  }

  .calendar-container {
    max-width: 100%;
    margin: 0 auto;
  }

  .calendar-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background-color: #28a745;
    color: white;
    font-weight: bold;
    text-align: center;
    padding: 10px 0;
  }

  .calendar-day-header {
    padding: 5px;
  }

  .calendar-body {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    background-color: #dee2e6;
  }

  .calendar-day {
    background-color: white;
    padding: 10px;
    min-height: 100px;
    position: relative;
    border: 1px solid #dee2e6;
    cursor: pointer;
  }

  .calendar-day.empty {
    background-color: #f8f9fa;
  }

  .calendar-day:hover {
    background-color: #f1f1f1;
  }

  .day-number {
    font-weight: bold;
  }

  .class-summary {
    margin-top: 5px;
    font-size: 0.9em;
  }

  .upcoming-count {
    color: #28a745;
    display: block;
  }

  .completed-count {
    color: #6c757d;
    display: block;
  }

  .current-day {
    border: 2px solid #28a745;
    background-color: #e6f4ea;
  }

  .has-classes {
    background-color: #f8f9fa;
  }
  </style>