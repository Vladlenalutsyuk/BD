import { createRouter, createWebHistory } from 'vue-router';
import ParentPage from '../views/ParentPage.vue';
import TeacherPage from '../views/TeacherPage.vue';
import AdminPage from '../views/AdminPage.vue';
import RegisterPage from '../views/RegisterPage.vue';
import LoginPage from '../views/LoginPage.vue';
import HomePage from '../views/Home.vue';
import type { RouteRecordRaw } from 'vue-router';
import axios, { AxiosError } from 'axios';

// Настраиваем базовый URL для axios
axios.defaults.baseURL = 'http://localhost:3000';

const routes: RouteRecordRaw[] = [
  { path: '/', component: HomePage },
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

router.beforeEach(async (to, from, next) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');
  console.log('Проверка user:', user);
  console.log('Проверка token:', token);

  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!user || !token) {
      console.log('Нет авторизации или токена, редирект на /login');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      next({ path: '/login' });
      return;
    }

    try {
      // Проверяем токен через сервер
      const response = await axios.get('/api/auth/validate', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.data.valid) {
        console.log('Недействительный токен, редирект на /login');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        next({ path: '/login' });
        return;
      }

      const userRole = response.data.role;

      if (to.meta.role && to.meta.role !== userRole) {
        console.log('Роль не совпадает:', to.meta.role, userRole);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        next({ path: '/login' });
        return;
      }

      console.log('Проход по маршруту:', to.path);
      next();
    } catch (err) {
      const error = err as AxiosError<{ error?: string }>;
      console.error(
        'Ошибка проверки токена:',
        error.response?.data?.error || error.message || 'Неизвестная ошибка'
      );
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      next({ path: '/login' });
    }
  } else if (to.path === '/login' && user && token) {
    try {
      // Проверяем токен через сервер
      const response = await axios.get('/api/auth/validate', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.valid) {
        console.log('Пользователь уже авторизован, перенаправляем в зависимости от роли');
        const userRole = response.data.role;
        if (userRole === 'parent') {
          next('/parent');
        } else if (userRole === 'teacher') {
          next('/teacher');
        } else if (userRole === 'admin') {
          next('/admin');
        } else {
          next();
        }
      } else {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        next();
      }
    } catch (err) {
      const error = err as AxiosError<{ error?: string }>;
      console.error(
        'Ошибка проверки токена при входе:',
        error.response?.data?.error || error.message || 'Неизвестная ошибка'
      );
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      next();
    }
  } else {
    console.log('Переход без авторизации');
    next();
  }
});

export default router;