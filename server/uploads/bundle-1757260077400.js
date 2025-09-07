
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
