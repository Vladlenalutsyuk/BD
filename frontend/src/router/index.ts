import { createRouter, createWebHistory } from 'vue-router';
import ParentPage from '../views/ParentPage.vue';
import TeacherPage from '../views/TeacherPage.vue';
import AdminPage from '../views/AdminPage.vue';
import RegisterPage from '../views/RegisterPage.vue';
import LoginPage from '../views/LoginPage.vue';
import HomePage from '../views/Home.vue';
import type { RouteRecordRaw } from 'vue-router';

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

router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');
  console.log('Проверка user:', user);
  console.log('Проверка token:', token);

  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!user || !token) {
      console.log('Нет авторизации или токена, редирект на /login');
      next({ path: '/login' });
    } else if (to.meta.role && to.meta.role !== user.role) {
      console.log('Роль не совпадает:', to.meta.role, user.role);
      next({ path: '/login' });
    } else {
      console.log('Проход по маршруту:', to.path);
      next();
    }
  } else if (to.path === '/login' && user && token) {
    // Если пользователь уже авторизован, перенаправляем на его страницу
    console.log('Пользователь уже авторизован, перенаправляем в зависимости от роли');
    if (user.role === 'parent') {
      next('/parent');
    } else if (user.role === 'teacher') {
      next('/teacher');
    } else if (user.role === 'admin') {
      next('/admin');
    } else {
      next();
    }
  } else {
    console.log('Переход без авторизации');
    next();
  }
});

export default router;