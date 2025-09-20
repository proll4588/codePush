import { NativeModules, Platform } from 'react-native';
import {
  CodePushManagerInterface,
  CodePushUpdate,
  CodePushDownloadResult,
  CodePushVersionInfo,
  CodePushConstants,
  CodePushSyncResult,
  CodePushSyncStatus,
} from './types';

// Интерфейс для нативного модуля
interface CodePushNativeModule extends CodePushManagerInterface {
  getConstants(): CodePushConstants;
  checkForUpdate(): Promise<CodePushUpdate>;
  downloadUpdate(): Promise<CodePushDownloadResult>;
  getCurrentVersion(): Promise<CodePushVersionInfo>;
  getBundlePath(): Promise<string | null>;
  clearUpdates(): Promise<CodePushDownloadResult>;
  getAppVersion(): Promise<string>;
}

// Получаем нативный модуль
const { CodePushManager } = NativeModules;

// Проверяем доступность нативного модуля
export const isNativeModuleAvailable = CodePushManager != null;

// Логируем информацию о нативном модуле
console.log('🔍 CodePush: NativeModules:', Object.keys(NativeModules));
console.log('🔍 CodePush: CodePushManager:', CodePushManager);
console.log('🔍 CodePush: isNativeModuleAvailable:', isNativeModuleAvailable);

// Fallback реализация для случаев, когда нативный модуль недоступен
class CodePushManagerFallback implements CodePushManagerInterface {
  getConstants(): CodePushConstants {
    return {
      serverURL: 'http://192.168.0.160:3000',
      codePushPath: '/tmp/CodePush',
    };
  }

  async getAppVersion(): Promise<string> {
    console.warn('CodePush: Нативный модуль недоступен, getAppVersion fallback');
    return '0.0.0'; // Возвращаем запасную версию
  }

  async checkForUpdate(): Promise<CodePushUpdate> {
    console.warn(
      '🔍 CodePush: Нативный модуль недоступен, используем fallback',
    );

    try {
      const appVersion = await this.getAppVersion();
      const url =
        `http://192.168.0.160:3000/api/check-update?appVersion=${appVersion}&platform=${Platform.OS}`;
      console.log('CodePush: Отправляем запрос на:', url);

      // Пытаемся проверить обновления через fetch
      const response = await fetch(url);

      console.log(
        'CodePush: Получен ответ:',
        response.status,
        response.statusText,
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('CodePush: Fallback проверка обновлений:', data);
      return data;
    } catch (error) {
      console.error('CodePush: Ошибка fallback проверки:', error);
      return {
        hasUpdate: false,
        message: `Ошибка подключения к серверу: ${error.message}`,
      };
    }
  }

  async downloadUpdate(): Promise<CodePushDownloadResult> {
    console.warn('CodePush: Нативный модуль недоступен, используем fallback');
    return {
      success: false,
      message: 'Нативный модуль CodePush недоступен',
    };
  }

  async getCurrentVersion(): Promise<CodePushVersionInfo> {
    return {
      version: '0',
      hasUpdate: false,
    };
  }

  async getBundlePath(): Promise<string | null> {
    return null;
  }

  async clearUpdates(): Promise<CodePushDownloadResult> {
    return {
      success: false,
      message: 'Нативный модуль CodePush недоступен',
    };
  }

  applyUpdate(): void {
    console.warn(
      'CodePush: Нативный модуль недоступен, applyUpdate fallback',
    );
  }
}

// Создаем экземпляр менеджера
const codePushManager: CodePushManagerInterface = isNativeModuleAvailable
  ? (CodePushManager as CodePushNativeModule)
  : new CodePushManagerFallback();

// Основной класс CodePush
export class CodePush {
  private static instance: CodePush;
  private manager: CodePushManagerInterface;

  private constructor() {
    this.manager = codePushManager;
  }

  public static getInstance(): CodePush {
    if (!CodePush.instance) {
      CodePush.instance = new CodePush();
    }
    return CodePush.instance;
  }

  // Получить константы
  public getConstants(): CodePushConstants {
    return this.manager.getConstants();
  }

  // Проверить наличие обновлений
  public async checkForUpdate(): Promise<CodePushUpdate> {
    try {
      console.log('🔍 CodePush: Проверка обновлений...');
      const result = await this.manager.checkForUpdate();
      console.log('🔍 CodePush: Результат проверки:', result);
      return result;
    } catch (error) {
      console.error('🔍 CodePush: Ошибка при проверке обновлений:', error);
      return {
        hasUpdate: false,
        message: `Ошибка: ${error}`,
      };
    }
  }

  // Скачать обновление
  public async downloadUpdate(): Promise<CodePushDownloadResult> {
    try {
      console.log('CodePush: Начинаем загрузку обновления...');
      const result = await this.manager.downloadUpdate();
      console.log('CodePush: Результат загрузки:', result);
      return result;
    } catch (error) {
      console.error('CodePush: Ошибка при загрузке обновления:', error);
      return {
        success: false,
        message: `Ошибка: ${error}`,
      };
    }
  }

  // Получить текущую версию
  public async getCurrentVersion(): Promise<CodePushVersionInfo> {
    try {
      const result = await this.manager.getCurrentVersion();
      console.log('CodePush: Текущая версия:', result);
      return result;
    } catch (error) {
      console.error('CodePush: Ошибка при получении версии:', error);
      return {
        version: '0',
        hasUpdate: false,
      };
    }
  }

  // Получить путь к bundle
  public async getBundlePath(): Promise<string | null> {
    try {
      const result = await this.manager.getBundlePath();
      console.log('CodePush: Путь к bundle:', result);
      return result;
    } catch (error) {
      console.error('CodePush: Ошибка при получении пути к bundle:', error);
      return null;
    }
  }

  // Очистить обновления
  public async clearUpdates(): Promise<CodePushDownloadResult> {
    try {
      console.log('CodePush: Очистка обновлений...');
      const result = await this.manager.clearUpdates();
      console.log('CodePush: Результат очистки:', result);
      return result;
    } catch (error) {
      console.error('CodePush: Ошибка при очистке обновлений:', error);
      return {
        success: false,
        message: `Ошибка: ${error}`,
      };
    }
  }

  // Получить нативную версию приложения
  public async getAppVersion(): Promise<string> {
    try {
      const version = await this.manager.getAppVersion();
      console.log('CodePush: Нативная версия приложения:', version);
      return version;
    } catch (error) {
      console.error('CodePush: Ошибка при получении нативной версии:', error);
      return 'unknown';
    }
  }

  // Автоматическая проверка и загрузка обновлений
  public async sync(): Promise<CodePushSyncResult> {
    try {
      console.log('CodePush: Начинаем синхронизацию...');
      const updateInfo = await this.checkForUpdate();

      if (updateInfo.hasUpdate) {
        console.log('CodePush: Найдено обновление, начинаем загрузку...');
        const downloadResult = await this.downloadUpdate();

        if (downloadResult.success) {
          console.log('CodePush: Обновление успешно загружено!');
          return {
            status: CodePushSyncStatus.UPDATE_DOWNLOADED,
            message: `Обновление ${downloadResult.version} загружено.`,
          };
        } else {
          console.error(
            'CodePush: Ошибка при загрузке обновления:',
            downloadResult.message,
          );
          return {
            status: CodePushSyncStatus.ERROR,
            message: `Ошибка загрузки: ${downloadResult.message}`,
          };
        }
      } else {
        console.log('CodePush: Обновления не найдены');
        return {
          status: CodePushSyncStatus.UP_TO_DATE,
          message: updateInfo.message || 'Приложение уже обновлено.',
        };
      }
    } catch (error) {
      console.error('CodePush: Ошибка при синхронизации:', error);
      return {
        status: CodePushSyncStatus.ERROR,
        message: `Критическая ошибка: ${error.message}`,
      };
    }
  }

  // Применить обновление
  public applyUpdate(): void {
    if (!isNativeModuleAvailable) {
      console.warn('CodePush: Нативный модуль недоступен, applyUpdate невозможен');
      return;
    }
    console.log('CodePush: Запрос на перезагрузку бандла...');
    this.manager.applyUpdate();
  }

  // Проверить доступность нативного модуля
  public isNativeModuleAvailable(): boolean {
    return isNativeModuleAvailable;
  }

  // Получить информацию о платформе
  public getPlatformInfo(): { platform: string; isNative: boolean } {
    return {
      platform: Platform.OS,
      isNative: isNativeModuleAvailable,
    };
  }
}

// Экспортируем синглтон
export default CodePush.getInstance();
