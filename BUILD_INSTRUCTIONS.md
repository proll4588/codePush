# Инструкции по сборке приложения

Этот документ описывает, как собрать два типа **релизных** сборок для платформ Android и iOS.

- **Release (`prod`)**: Финальная сборка для публикации в Google Play или App Store. Получает только опубликованные (promoted) CodePush бандлы.
- **Test (`staging`)**: Сборка для внутреннего тестирования. Выглядит и работает как релизная, но умеет получать как тестовые, так и опубликованные CodePush бандлы.

---

## Android

Сборка для Android использует `productFlavors` (варианты продукта) в Gradle. Мы настроили два варианта: `prod` и `staging`.

### 1. Перейдите в директорию Android

Все команды должны выполняться из папки `android`.
```bash
cd android
```

### 2. Сборка Release (для Google Play)

Эта команда соберет финальную версию приложения.

**Для сборки App Bundle (.aab):**
```bash
./gradlew bundleProdRelease
```
- **Результат:** Файл `.aab` будет находиться в `android/app/build/outputs/bundle/prodRelease/`.

**Для сборки APK:**
```bash
./gradlew assembleProdRelease
```
- **Результат:** Файл `.apk` будет находиться в `android/app/build/outputs/apk/prod/release/`.


### 3. Сборка Test (для внутреннего тестирования)

Эта команда соберет тестовую релизную версию.

**Для сборки APK:**
```bash
./gradlew assembleStagingRelease
```
- **Результат:** Файл `.apk` будет находиться в `android/app/build/outputs/apk/staging/release/`.
- **ID приложения:** Будет иметь суффикс `.staging` (например, `com.codepush.staging`), что позволяет установить его на одно устройство рядом с обычной версией.

---

## iOS

Сборка для iOS использует **схемы** (`Schemes`) и **конфигурации сборки** (`Build Configurations`) в Xcode.

### 1. Откройте проект в Xcode

Откройте файл `ios/codePush.xcworkspace`.

### 2. Сборка Release (для App Store)

1.  В Xcode, вверху выберите схему **`codePush`**.
2.  В качестве устройства выберите **Any iOS Device (arm64)**.
3.  В меню выберите **Product** -> **Archive**.
4.  После завершения архивации откроется окно Organizer. Нажмите **Distribute App** для отправки в App Store Connect.

### 3. Сборка Test (для внутреннего тестирования)

1.  В Xcode, вверху выберите схему **`codePush-Test`**.
2.  В качестве устройства выберите **Any iOS Device (arm64)**.
3.  В меню выберите **Product** -> **Archive**.
4.  После завершения архивации откроется окно Organizer. Нажмите **Distribute App** и выберите метод распространения для внутреннего тестирования (например, Ad Hoc или Development).
