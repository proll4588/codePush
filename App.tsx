/**
 * Code Push Test App
 * Тестирование собственной реализации Code Push
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  StatusBar,
  useColorScheme,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Logger, CodePush } from './src';
import { isNativeModuleAvailable } from './src/CodePushManager';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [currentVersion, setCurrentVersion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [platformInfo, setPlatformInfo] = useState<any>(null);

  useEffect(() => {
    initializeCodePush();
  }, []);

  const initializeCodePush = async () => {
    try {
      console.log('🔍 App: Инициализация Code Push...');
      Logger.info('Инициализация Code Push...');

      // Получаем информацию о платформе
      console.log('🔍 App: Получаем информацию о платформе...');
      const platform = CodePush.getPlatformInfo();
      console.log('🔍 App: Платформа:', platform);
      setPlatformInfo(platform);

      // Получаем текущую версию
      console.log('🔍 App: Получаем текущую версию...');
      const version = await CodePush.getCurrentVersion();
      console.log('🔍 App: Версия:', version);
      setCurrentVersion(version);

      Logger.success('Code Push инициализирован');
    } catch (error) {
      console.error('🔍 App: Ошибка инициализации:', error);
      Logger.error('Ошибка инициализации:', error);
    }
  };

  const handleCheckUpdate = async () => {
    console.log('🔍 App: Начинаем проверку обновлений...');
    setIsLoading(true);
    try {
      Logger.info('Проверка обновлений...');
      console.log('🔍 App: Вызываем CodePush.checkForUpdate()...');
      const update = await CodePush.checkForUpdate();
      console.log('🔍 App: Получен результат:', update);
      setUpdateInfo(update);

      if (update.hasUpdate) {
        Alert.alert(
          'Обновление найдено!',
          `Версия: ${update.version}\nРазмер: ${
            update.size ? (update.size / 1024).toFixed(1) + ' KB' : 'неизвестно'
          }\nОписание: ${update.description || 'Нет описания'}`,
          [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Скачать', onPress: handleDownloadUpdate },
          ],
        );
      } else {
        Alert.alert(
          'Обновления не найдены',
          update.message || 'У вас уже установлена последняя версия',
        );
      }
    } catch (error) {
      Logger.error('Ошибка при проверке обновлений:', error);
      Alert.alert('Ошибка', `Ошибка при проверке обновлений: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadUpdate = async () => {
    setIsLoading(true);
    try {
      Logger.info('Загрузка обновления...');
      const result = await CodePush.downloadUpdate();

      if (result.success) {
        Alert.alert(
          'Обновление загружено!',
          `Версия: ${result.version}\n${result.message}\n\nПерезапустите приложение для применения обновления.`,
          [{ text: 'OK' }],
        );

        // Обновляем информацию о версии
        const version = await CodePush.getCurrentVersion();
        setCurrentVersion(version);
      } else {
        Alert.alert('Ошибка загрузки', result.message);
      }
    } catch (error) {
      Logger.error('Ошибка при загрузке обновления:', error);
      Alert.alert('Ошибка', `Ошибка при загрузке обновления: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      Logger.info('Синхронизация...');
      await CodePush.sync();
      Alert.alert(
        'Синхронизация завершена',
        'Проверьте консоль для подробностей',
      );
    } catch (error) {
      Logger.error('Ошибка при синхронизации:', error);
      Alert.alert('Ошибка', `Ошибка при синхронизации: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearUpdates = async () => {
    Alert.alert(
      'Очистить обновления',
      'Вы уверены, что хотите удалить все загруженные обновления?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await CodePush.clearUpdates();
              if (result.success) {
                Alert.alert('Успешно', result.message);
                setCurrentVersion(await CodePush.getCurrentVersion());
                setUpdateInfo(null);
              } else {
                Alert.alert('Ошибка', result.message);
              }
            } catch (error) {
              Alert.alert('Ошибка', `Ошибка при очистке: ${error}`);
            }
          },
        },
      ],
    );
  };

  const handleGetBundlePath = async () => {
    try {
      const path = await CodePush.getBundlePath();
      Alert.alert(
        'Путь к bundle',
        path
          ? `Bundle найден:\n${path}`
          : 'Bundle не найден (используется встроенный)',
      );
    } catch (error) {
      Alert.alert('Ошибка', `Ошибка при получении пути: ${error}`);
    }
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: safeAreaInsets.top }]}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Code Push Test {String(isNativeModuleAvailable)} v3
        </Text>

        {/* Информация о платформе */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Информация о платформе</Text>
          <Text style={styles.infoText}>
            Платформа: {platformInfo?.platform || 'неизвестно'}
          </Text>
          <Text style={styles.infoText}>
            Нативный модуль:{' '}
            {platformInfo?.isNative ? '✅ Доступен' : '❌ Недоступен'}
          </Text>
        </View>

        {/* Текущая версия */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Текущая версия</Text>
          <Text style={styles.infoText}>
            Версия: {currentVersion?.version || 'неизвестно'}
          </Text>
          <Text style={styles.infoText}>
            Есть обновление: {currentVersion?.hasUpdate ? '✅ Да' : '❌ Нет'}
          </Text>
        </View>

        {/* Информация об обновлении */}
        {updateInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Информация об обновлении</Text>
            <Text style={styles.infoText}>
              Есть обновление: {updateInfo.hasUpdate ? '✅ Да' : '❌ Нет'}
            </Text>
            {updateInfo.version && (
              <Text style={styles.infoText}>Версия: {updateInfo.version}</Text>
            )}
            {updateInfo.size && (
              <Text style={styles.infoText}>
                Размер: {(updateInfo.size / 1024).toFixed(1)} KB
              </Text>
            )}
            {updateInfo.description && (
              <Text style={styles.infoText}>
                Описание: {updateInfo.description}
              </Text>
            )}
            {updateInfo.message && (
              <Text style={styles.infoText}>
                Сообщение: {updateInfo.message}
              </Text>
            )}
          </View>
        )}

        {/* Кнопки управления */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Управление</Text>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleCheckUpdate}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Загрузка...' : 'Проверить обновления'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonSecondary,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleSync}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
              Автосинхронизация
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonSecondary,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleGetBundlePath}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
              Путь к bundle
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonDanger,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleClearUpdates}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, styles.buttonTextDanger]}>
              Очистить обновления
            </Text>
          </TouchableOpacity>
        </View>

        {/* Инструкции */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Инструкции</Text>
          <Text style={styles.instructionText}>
            1. Запустите сервер: cd server && npm start{'\n'}
            2. Загрузите bundle на сервер через API{'\n'}
            3. Нажмите "Проверить обновления"{'\n'}
            4. Скачайте и примените обновление{'\n'}
            5. Перезапустите приложение
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  instructionText: {
    fontSize: 12,
    color: '#888',
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#34C759',
  },
  buttonDanger: {
    backgroundColor: '#FF3B30',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonTextSecondary: {
    color: 'white',
  },
  buttonTextDanger: {
    color: 'white',
  },
});

export default App;
