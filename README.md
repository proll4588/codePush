# Code Push для React Native

Собственная реализация системы Code Push для React Native приложений без использования сторонних пакетов.

## 🚀 Возможности

- ✅ **Серверная часть** - Node.js сервер для хранения и распространения обновлений
- ✅ **iOS модуль** - Нативный Swift модуль для iOS
- ✅ **JavaScript мост** - TypeScript интерфейс для взаимодействия
- ✅ **Автоматические обновления** - Фоновая загрузка и применение обновлений
- ✅ **Версионирование** - Управление версиями обновлений
- ✅ **Fallback** - Автоматический возврат к встроенному bundle при ошибках
- ✅ **Тестовое приложение** - Готовое приложение для тестирования

## 📁 Структура проекта

```
codePush/
├── server/                    # Серверная часть
│   ├── index.js              # Express сервер
│   ├── package.json          # Зависимости сервера
│   ├── uploads/              # Папка с bundle файлами
│   └── README.md             # Документация сервера
├── src/                      # JavaScript/TypeScript код
│   ├── CodePushManager.ts    # Основной менеджер
│   ├── types.ts              # TypeScript типы
│   ├── utils.ts              # Утилиты
│   └── index.ts              # Экспорты
├── ios/                      # iOS нативный код
│   ├── codePush/
│   │   ├── CodePushManager/  # Нативный модуль
│   │   │   ├── CodePushManager.swift
│   │   │   └── CodePushManager.m
│   │   └── AppDelegate.swift # Модифицированный AppDelegate
│   └── README.md             # Документация iOS
├── App.tsx                   # Тестовое приложение
└── README.md                 # Этот файл
```

## 🛠️ Установка и настройка

### 1. Запуск сервера

```bash
cd server
npm install
npm start
```

Сервер будет доступен по адресу: `http://localhost:3000`

### 2. Настройка iOS

1. Откройте проект в Xcode
2. Добавьте файлы из папки `ios/codePush/CodePushManager/` в проект
3. Убедитесь, что файлы добавлены в target приложения

### 3. Запуск приложения

```bash
# iOS
npx react-native run-ios

# Android (будет реализовано позже)
npx react-native run-android
```

## 📖 Использование

### Базовое использование

```typescript
import CodePush from './src';

// Проверить обновления
const updateInfo = await CodePush.checkForUpdate();
if (updateInfo.hasUpdate) {
  console.log('Найдено обновление:', updateInfo.version);

  // Скачать обновление
  const result = await CodePush.downloadUpdate();
  if (result.success) {
    console.log('Обновление загружено!');
    // Перезапустите приложение для применения
  }
}
```

### Автоматическая синхронизация

```typescript
// Автоматическая проверка и загрузка
await CodePush.sync();
```

### Получение информации

```typescript
// Текущая версия
const version = await CodePush.getCurrentVersion();

// Путь к bundle
const bundlePath = await CodePush.getBundlePath();

// Константы
const constants = CodePush.getConstants();
```

## 🔧 API

### Серверные endpoints

- `GET /api/status` - Статус сервера
- `GET /api/check-update` - Проверка обновлений
- `POST /api/upload` - Загрузка bundle
- `GET /api/download/:filename` - Скачивание bundle
- `GET /api/updates` - Список обновлений
- `DELETE /api/updates/:id` - Удаление обновления

### JavaScript API

- `checkForUpdate()` - Проверка обновлений
- `downloadUpdate()` - Загрузка обновления
- `getCurrentVersion()` - Текущая версия
- `getBundlePath()` - Путь к bundle
- `clearUpdates()` - Очистка обновлений
- `sync()` - Автосинхронизация

## 🧪 Тестирование

### 1. Создание тестового bundle

```bash
npx react-native bundle \
  --platform ios \
  --dev false \
  --entry-file index.js \
  --bundle-output server/test.bundle
```

### 2. Загрузка на сервер

```bash
curl -X POST \
  -F "bundle=@server/test.bundle" \
  -F "version=1703123456789" \
  -F "platform=ios" \
  -F "description=Тестовое обновление" \
  http://localhost:3000/api/upload
```

### 3. Тестирование в приложении

1. Запустите приложение
2. Нажмите "Проверить обновления"
3. Скачайте обновление
4. Перезапустите приложение
5. Проверьте, что загрузился новый bundle

## 📱 Тестовое приложение

Приложение включает:

- **Информация о платформе** - статус нативного модуля
- **Текущая версия** - информация о версии и обновлениях
- **Управление** - кнопки для всех операций
- **Инструкции** - пошаговое руководство

## 🔒 Безопасность

- Валидация размера файлов (50MB лимит)
- Проверка MIME-типа файлов
- Безопасное сохранение в Documents директории
- Автоматическая очистка при ошибках

## ⚠️ Ограничения

- Работает только в Release режиме (Debug использует Metro)
- Требует перезапуск приложения для применения обновлений
- Поддерживает только JavaScript обновления
- iOS и Android модули готовы

## 🚧 Roadmap

- [x] Android нативный модуль
- [ ] Автоматическое применение обновлений
- [ ] Rollback при ошибках
- [ ] A/B тестирование
- [ ] Постепенный rollout
- [ ] Шифрование обновлений

## 🤝 Вклад в проект

1. Fork проекта
2. Создайте feature branch
3. Внесите изменения
4. Добавьте тесты
5. Создайте Pull Request

## 📄 Лицензия

MIT License

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи в консоли
2. Убедитесь, что сервер запущен
3. Проверьте настройки сети
4. Создайте Issue в репозитории

---

**Примечание**: Это учебный проект для демонстрации принципов работы Code Push. Для продакшн использования рекомендуется добавить дополнительные меры безопасности и оптимизации.
