# Code Push Server

Серверная часть для системы Code Push в React Native приложениях.

## Возможности

- ✅ Загрузка JavaScript bundle файлов
- ✅ Проверка доступных обновлений
- ✅ Скачивание обновлений
- ✅ Управление версиями
- ✅ Поддержка множественных платформ
- ✅ RESTful API

## Установка

```bash
cd server
npm install
```

## Запуск

### Режим разработки

```bash
npm run dev
```

### Продакшн режим

```bash
npm start
```

Сервер будет доступен по адресу: `http://localhost:3000`

## API Endpoints

### Проверка обновлений

```
GET /api/check-update?currentVersion=1234567890&platform=ios
```

**Параметры:**

- `currentVersion` - текущая версия приложения (timestamp)
- `platform` - платформа (ios, android, all)

**Ответ:**

```json
{
  "hasUpdate": true,
  "version": "1703123456789",
  "downloadUrl": "/api/download/bundle-1703123456789.js",
  "size": 1024000,
  "createdAt": "2023-12-21T10:30:00.000Z",
  "description": "Обновление JavaScript кода"
}
```

### Загрузка bundle

```
POST /api/upload
```

**Параметры (multipart/form-data):**

- `bundle` - файл JavaScript bundle
- `version` - версия обновления (опционально)
- `platform` - платформа (ios, android, all)
- `description` - описание обновления
- `uploadedBy` - кто загрузил

### Скачивание обновления

```
GET /api/download/:filename
```

### Список всех обновлений

```
GET /api/updates
```

### Удаление обновления

```
DELETE /api/updates/:id
```

### Статус сервера

```
GET /api/status
```

## Структура файлов

```
server/
├── index.js          # Основной файл сервера
├── package.json      # Зависимости
├── uploads/          # Папка с загруженными bundle
└── README.md         # Документация
```

## Примеры использования

### Загрузка bundle через curl

```bash
curl -X POST \
  http://localhost:3000/api/upload \
  -F "bundle=@index.bundle" \
  -F "version=1703123456789" \
  -F "platform=all" \
  -F "description=Исправление багов в UI"
```

### Проверка обновлений

```bash
curl "http://localhost:3000/api/check-update?currentVersion=1703000000000&platform=ios"
```

## Конфигурация

Переменные окружения:

- `PORT` - порт сервера (по умолчанию 3000)

## Безопасность

⚠️ **Внимание**: Данная реализация предназначена для разработки и тестирования. Для продакшн использования необходимо добавить:

- Аутентификацию
- Авторизацию
- HTTPS
- Валидацию файлов
- Rate limiting
- Логирование
