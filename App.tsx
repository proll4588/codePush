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
  const [currentVersion, setCurrentVersion] = useState<any>(null);
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [platformInfo, setPlatformInfo] = useState<any>(null);

  useEffect(() => {
    initializeCodePush();
  }, []);

  const initializeCodePush = async () => {
    try {
      console.log('🔍 App: Инициализация Code Push...');
      Logger.info('Инициализация Code Push...');

      const platform = CodePush.getPlatformInfo();
      setPlatformInfo(platform);

      const nativeVersion = await CodePush.getAppVersion();
      setAppVersion(nativeVersion);

      const bundleVersion = await CodePush.getCurrentVersion();
      setCurrentVersion(bundleVersion);

      Logger.success('Code Push инициализирован.');
    } catch (error) {
      console.error('🔍 App: Ошибка инициализации:', error);
      Logger.error('Ошибка инициализации:', error);
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
                Alert.alert(
                  'Успешно',
                  `${result.message}. Перезапустите приложение, чтобы вернуться к встроенной версии.`,
                );
                setCurrentVersion(await CodePush.getCurrentVersion());
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
        <Text style={styles.title}>Code Push Test v9</Text>

        {/* Информация о платформе */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Информация о платформе</Text>
          <Text style={styles.infoText}>
            Платформа: {platformInfo?.platform || 'неизвестно'}
          </Text>
          <Text style={styles.infoText}>
            Версия приложения: {appVersion || 'неизвестно'}
          </Text>
          <Text style={styles.infoText}>
            Нативный модуль:{' '}
            {platformInfo?.isNative ? '✅ Доступен' : '❌ Недоступен'}
          </Text>
        </View>

        {/* Текущая версия */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Текущая версия бандла</Text>
          <Text style={styles.infoText}>
            Версия: {currentVersion?.version || 'встроенная'}
          </Text>
          <Text style={styles.infoText}>
            Загружен: {currentVersion?.hasUpdate ? '✅ Да' : '❌ Нет'}
          </Text>
        </View>

        {/* Кнопки управления */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Управление</Text>

          <TouchableOpacity style={styles.button} onPress={handleGetBundlePath}>
            <Text style={styles.buttonText}>Путь к bundle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonDanger]}
            onPress={handleClearUpdates}
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
            1. Запустите сервер: cd server && npm start{String.fromCharCode(10)}
            2. Загрузите новый bundle на сервер через API.
            {String.fromCharCode(10)}3. Полностью перезапустите приложение (не
            через hot reload).{String.fromCharCode(10)}4. Приложение покажет
            экран загрузки, проверит и скачает обновление, а затем запустится с
            новой версией бандла.
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
