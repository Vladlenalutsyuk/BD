import { createRouter, createWebHistory } from 'vue-router';
import ParentPage from '../views/ParentPage.vue';
import TeacherPage from '../views/TeacherPage.vue';
import AdminPage from '../views/AdminPage.vue';
import RegisterPage from '../views/RegisterPage.vue';
import LoginPage from '../views/LoginPage.vue';

const routes = [
  { path: '/parent', component: ParentPage, meta: { requiresAuth: true, role: 'parent' } },
  { path: '/teacher', component: TeacherPage, meta: { requiresAuth: true, role: 'teacher' } },
  { path: '/admin', component: AdminPage, meta: { requiresAuth: true, role: 'admin' } },
  { path: '/register', component: RegisterPage },
  { path: '/login', component: LoginPage },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Проверка доступа к маршрутам
router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem('user')); // Получаем информацию о пользователе из localStorage
  
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!user) {
      // Если пользователь не авторизован, перенаправляем на страницу входа
      next({ path: '/login' });
    } else if (to.meta.role && to.meta.role !== user.role) {
      // Если роль пользователя не соответствует требуемой роли для маршрута
      next({ path: '/login' }); // Или перенаправьте на другую страницу, например, на главную
    } else {
      next(); // Если все проверки пройдены, разрешаем доступ
    }
  } else {
    next(); // Если маршрут не требует авторизации, разрешаем доступ
  }
});

export default router;