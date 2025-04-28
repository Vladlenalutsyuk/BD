import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as bootstrap from 'bootstrap'; // Импорт Bootstrap
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';
import 'animate.css';

// Расширяем интерфейс Window, чтобы TypeScript знал о window.bootstrap
declare global {
  interface Window {
    bootstrap: typeof bootstrap;
  }
}

// Делаем bootstrap доступным глобально
window.bootstrap = bootstrap;

const app = createApp(App);
app.use(router);
app.use(Toast, {
  transition: 'Vue-Toastification__bounce',
  maxToasts: 20,
  newestOnTop: true,
  position: 'top-right',
  timeout: 5000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false,
});
app.mount('#app');