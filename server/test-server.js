const fs = require('fs');
const path = require('path');

// Создаем тестовый bundle файл
const testBundleContent = `
// Тестовый React Native bundle
console.log('Hello from Code Push!');

// Простой компонент для тестирования
const TestComponent = () => {
  return {
    type: 'View',
    props: {
      style: { flex: 1, justifyContent: 'center', alignItems: 'center' }
    },
    children: [
      {
        type: 'Text',
        props: { style: { fontSize: 18, color: 'blue' } },
        children: ['Code Push работает!']
      }
    ]
  };
};

module.exports = TestComponent;
`;

// Создаем тестовый bundle файл
const testBundlePath = path.join(__dirname, 'test-bundle.js');
fs.writeFileSync(testBundlePath, testBundleContent);

console.log('✅ Тестовый bundle файл создан:', testBundlePath);
console.log('📝 Содержимое файла:');
console.log(testBundleContent);
console.log('\n🚀 Теперь можно запустить сервер командой: npm start');
console.log('📤 И загрузить тестовый bundle через API или curl');
