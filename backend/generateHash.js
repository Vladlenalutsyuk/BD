const bcrypt = require('bcrypt');

(async () => {
  try {
    const hash = await bcrypt.hash('123', 10);
    console.log('Сгенерированный хеш:', hash);
  } catch (error) {
    console.error('Ошибка при генерации хеша:', error);
  }
})();