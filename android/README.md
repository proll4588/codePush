# Code Push Android Module

Нативный модуль для Android, реализующий функциональность Code Push в React Native приложении.

## Структура файлов

```
android/app/src/main/java/com/codepush/
├── codepushmanager/
│   ├── CodePushManagerModule.kt    # Основной Kotlin модуль
│   └── CodePushManagerPackage.kt   # Пакет для регистрации модуля
├── CodePushBundleManager.kt        # Менеджер для управления bundle
├── MainActivity.kt                 # Модифицированная MainActivity
└── MainApplication.kt              # Модифицированная MainApplication
```

## Возможности

- ✅ **Проверка обновлений** - проверка наличия новых версий на сервере
- ✅ **Загрузка обновлений** - скачивание JavaScript bundle файлов
- ✅ **Управление версиями** - отслеживание текущей версии приложения
- ✅ **Кеширование** - сохранение обновлений в локальной файловой системе
- ✅ **Fallback** - автоматический возврат к встроенному bundle при ошибках
- ✅ **Метаданные** - сохранение информации об обновлениях
- ✅ **Корутины** - асинхронная обработка сетевых запросов

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

## Установка

### 1. Автоматическая установка

Модуль автоматически регистрируется в `MainApplication.kt`:

```kotlin
override fun getPackages(): List<ReactPackage> =
    PackageList(this).packages.apply {
      add(CodePushManagerPackage())
    }
```

### 2. Разрешения

В `AndroidManifest.xml` добавлены необходимые разрешения:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

### 3. Настройка MainActivity

`MainActivity.kt` модифицирована для поддержки Code Push:

- Проверка наличия обновлений при запуске
- Логирование информации о bundle
- Кастомный `ReactActivityDelegate`

## Структура данных

### Папка с обновлениями

```
/data/data/com.codepush/files/CodePush/
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

1. `MainActivity` проверяет наличие Code Push bundle
2. `CodePushBundleManager` определяет приоритет bundle
3. Логируется информация о используемом bundle

### 2. При проверке обновлений

1. Отправляется HTTP запрос на сервер с текущей версией
2. Сервер сравнивает версии
3. Возвращается информация о доступных обновлениях

### 3. При загрузке обновления

1. Скачивается новый bundle с сервера
2. Сохраняется в папку `files/CodePush/`
3. Обновляются метаданные
4. При следующем запуске будет использован новый bundle

## Технические детали

### Корутины

Все сетевые операции выполняются в корутинах:

```kotlin
CoroutineScope(Dispatchers.IO).launch {
    // Сетевые операции
}
```

### HTTP клиент

Используется стандартный `HttpURLConnection`:

- Таймауты: 30 секунд
- Retry логика: 3 попытки
- Обработка ошибок

### Файловая система

- Используется внутренняя папка приложения
- Автоматическое создание директорий
- Безопасное сохранение файлов

## Обработка ошибок

- **Сетевые ошибки**: Retry логика с экспоненциальной задержкой
- **Ошибки файловой системы**: Fallback на встроенный bundle
- **Ошибки парсинга**: Логирование и возврат к предыдущей версии
- **Ошибки загрузки**: Сохранение предыдущего bundle

## Безопасность

- Валидация размера файлов (максимум 50MB)
- Проверка HTTP статус кодов
- Безопасное сохранение в internal storage
- Автоматическая очистка при ошибках

## Отладка

### Логи

Все операции логируются с тегом `CodePushManager`:

```
D/CodePushManager: Проверка обновлений...
D/CodePushManager: Bundle успешно скачан: /path/to/bundle
E/CodePushManager: Ошибка при скачивании bundle
```

### Проверка состояния

```kotlin
// Проверить наличие bundle
val bundlePath = CodePushBundleManager.getBundlePath(context)
Log.d("DEBUG", "Bundle path: $bundlePath")

// Проверить информацию о Code Push
val info = CodePushBundleManager.getCodePushInfo(context)
Log.d("DEBUG", "Code Push info: $info")
```

## Тестирование

### 1. Локальное тестирование

```bash
# Запустить сервер
cd server && npm start

# Загрузить тестовый bundle
curl -X POST -F "bundle=@test.bundle" \
  -F "version=1703123456789" \
  -F "platform=android" \
  http://localhost:3000/api/upload
```

### 2. Тестирование в приложении

1. Запустить приложение
2. Нажать "Проверить обновления"
3. Скачать обновление
4. Перезапустить приложение
5. Проверить, что загрузился новый bundle

### 3. Проверка логов

```bash
# Просмотр логов Android
adb logcat | grep CodePush
```

## Ограничения

- Работает только в Release режиме (в Debug используется Metro bundler)
- Требует перезапуск приложения для применения обновлений
- Поддерживает только JavaScript обновления (не нативный код)
- Размер обновления ограничен 50MB
- Требует разрешения на запись в файловую систему

## Совместимость

- **Android**: API 21+ (Android 5.0+)
- **React Native**: 0.60+
- **Kotlin**: 1.8+
- **Gradle**: 7.0+

## Производительность

- Асинхронная загрузка в фоне
- Минимальное влияние на UI
- Эффективное использование памяти
- Оптимизированная работа с файлами

## Troubleshooting

### Проблема: Модуль не найден

**Решение**: Убедитесь, что `CodePushManagerPackage` добавлен в `MainApplication.kt`

### Проблема: Ошибки сети

**Решение**: Проверьте разрешения в `AndroidManifest.xml` и доступность сервера

### Проблема: Файлы не сохраняются

**Решение**: Проверьте разрешения на запись в файловую систему

### Проблема: Bundle не загружается

**Решение**: Проверьте логи и убедитесь, что сервер возвращает корректный bundle
