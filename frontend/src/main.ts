import { createApp } from 'vue';
import App from './App.vue';
import router from './router'; // Импортируйте маршрутизатор

createApp(App)
  .use(router) // Используйте маршрутизатор
  .mount('#app');