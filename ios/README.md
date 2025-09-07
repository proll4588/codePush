# Code Push iOS Module

Нативный модуль для iOS, реализующий функциональность Code Push в React Native приложении.

## Структура файлов

```
ios/codePush/CodePushManager/
├── CodePushManager.swift    # Основной Swift модуль
└── CodePushManager.m        # Objective-C мост
```

## Возможности

- ✅ **Проверка обновлений** - проверка наличия новых версий на сервере
- ✅ **Загрузка обновлений** - скачивание JavaScript bundle файлов
- ✅ **Управление версиями** - отслеживание текущей версии приложения
- ✅ **Кеширование** - сохранение обновлений в локальной файловой системе
- ✅ **Fallback** - автоматический возврат к встроенному bundle при ошибках
- ✅ **Метаданные** - сохранение информации об обновлениях

## API

### Методы

#### `checkForUpdate()`

Проверяет наличие обновлений на сервере.

**Возвращает:** `Promise<CodePushUpdate>`

```typescript
{
  hasUpdate: boolean;
  version?: string;
  downloadUrl?: string;
  size?: number;
  createdAt?: string;
  description?: string;
  message?: string;
}
```

#### `downloadUpdate()`

Скачивает доступное обновление.

**Возвращает:** `Promise<CodePushDownloadResult>`

```typescript
{
  success: boolean;
  message: string;
  version?: string;
}
```

#### `getCurrentVersion()`

Получает информацию о текущей версии.

**Возвращает:** `Promise<CodePushVersionInfo>`

```typescript
{
  version: string;
  hasUpdate: boolean;
}
```

#### `getBundlePath()`

Получает путь к текущему bundle файлу.

**Возвращает:** `Promise<string | null>`

#### `clearUpdates()`

Удаляет все загруженные обновления.

**Возвращает:** `Promise<CodePushDownloadResult>`

### Константы

#### `getConstants()`

Возвращает константы модуля.

```typescript
{
  serverURL: string; // URL сервера Code Push
  codePushPath: string; // Путь к папке с обновлениями
}
```

## Установка в Xcode

### 1. Добавление файлов в проект

1. Откройте проект в Xcode
2. Перетащите папку `CodePushManager` в проект
3. Убедитесь, что файлы добавлены в target приложения

### 2. Настройка AppDelegate

Модифицированный `AppDelegate.swift` автоматически:

- Проверяет наличие Code Push обновлений при запуске
- Загружает обновленный bundle вместо встроенного
- Использует fallback на встроенный bundle при ошибках

### 3. Настройка Info.plist

Добавьте разрешения для сетевых запросов:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

## Структура данных

### Папка с обновлениями

```
Documents/CodePush/
├── main.jsbundle      # JavaScript bundle
└── metadata.json      # Метаданные обновления
```

### Метаданные (metadata.json)

```json
{
  "version": "1703123456789",
  "downloadUrl": "/api/download/bundle-1703123456789.js",
  "size": 1024000,
  "createdAt": "2023-12-21T10:30:00.000Z",
  "description": "Обновление JavaScript кода"
}
```

## Логика работы

### 1. При запуске приложения

1. `AppDelegate` проверяет наличие Code Push bundle
2. Если найден - загружает его
3. Если нет - использует встроенный bundle

### 2. При проверке обновлений

1. Отправляется запрос на сервер с текущей версией
2. Сервер сравнивает версии
3. Возвращается информация о доступных обновлениях

### 3. При загрузке обновления

1. Скачивается новый bundle с сервера
2. Сохраняется в папку `Documents/CodePush/`
3. Обновляются метаданные
4. При следующем запуске будет использован новый bundle

## Обработка ошибок

- **Сетевые ошибки**: Retry логика с экспоненциальной задержкой
- **Ошибки файловой системы**: Fallback на встроенный bundle
- **Ошибки парсинга**: Логирование и возврат к предыдущей версии
- **Ошибки загрузки**: Сохранение предыдущего bundle

## Безопасность

- Валидация размера файлов (максимум 50MB)
- Проверка MIME-типа файлов
- Безопасное сохранение в Documents директории
- Автоматическая очистка при ошибках

## Отладка

### Логи

Все операции логируются с префиксом `CodePush:`:

```
CodePush: Проверка обновлений для версии: 0, платформа: ios
CodePush: Загружаем bundle из Code Push: /path/to/bundle
CodePush: Ошибка создания папки: ...
```

### Проверка состояния

```swift
// Проверить наличие bundle
let bundlePath = getBundlePath()
print("Bundle path: \(bundlePath?.path ?? "not found")")

// Проверить метаданные
let metadata = loadMetadata()
print("Metadata: \(metadata ?? [:])")
```

## Тестирование

### 1. Локальное тестирование

```bash
# Запустить сервер
cd server && npm start

# Загрузить тестовый bundle
curl -X POST -F "bundle=@test-bundle.js" \
  -F "version=1703123456789" \
  -F "platform=ios" \
  http://localhost:3000/api/upload
```

### 2. Тестирование в приложении

1. Запустить приложение
2. Нажать "Проверить обновления"
3. Скачать обновление
4. Перезапустить приложение
5. Проверить, что загрузился новый bundle

## Ограничения

- Работает только в Release режиме (в Debug используется Metro bundler)
- Требует перезапуск приложения для применения обновлений
- Поддерживает только JavaScript обновления (не нативный код)
- Размер обновления ограничен 50MB

## Совместимость

- **iOS**: 11.0+
- **React Native**: 0.60+
- **Xcode**: 12.0+
- **Swift**: 5.0+
