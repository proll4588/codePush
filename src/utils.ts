import {
  ServerCheckUpdateResponse,
  ServerUploadResponse,
  ServerStatusResponse,
} from './types';

// Конфигурация сервера
export const SERVER_CONFIG = {
  baseURL: 'http://localhost:3000',
  timeout: 30000, // 30 секунд
  retryAttempts: 3,
  retryDelay: 1000, // 1 секунда
};

// Утилиты для работы с сервером
export class ServerUtils {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${SERVER_CONFIG.baseURL}${endpoint}`;

    const defaultOptions: RequestInit = {
      timeout: SERVER_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const requestOptions = { ...defaultOptions, ...options };

    for (let attempt = 1; attempt <= SERVER_CONFIG.retryAttempts; attempt++) {
      try {
        console.log(`ServerUtils: Запрос к ${url} (попытка ${attempt})`);

        const response = await fetch(url, requestOptions);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`ServerUtils: Успешный ответ от ${url}:`, data);
        return data;
      } catch (error) {
        console.error(
          `ServerUtils: Ошибка при запросе к ${url} (попытка ${attempt}):`,
          error,
        );

        if (attempt === SERVER_CONFIG.retryAttempts) {
          throw error;
        }

        // Ждем перед следующей попыткой
        await new Promise(resolve =>
          setTimeout(resolve, SERVER_CONFIG.retryDelay * attempt),
        );
      }
    }

    throw new Error('Все попытки запроса исчерпаны');
  }

  // Проверить статус сервера
  static async checkServerStatus(): Promise<ServerStatusResponse> {
    return this.makeRequest<ServerStatusResponse>('/api/status');
  }

  // Проверить наличие обновлений
  static async checkForUpdate(
    currentVersion: string,
    platform: string = 'all',
  ): Promise<ServerCheckUpdateResponse> {
    const endpoint = `/api/check-update?currentVersion=${encodeURIComponent(
      currentVersion,
    )}&platform=${encodeURIComponent(platform)}`;
    return this.makeRequest<ServerCheckUpdateResponse>(endpoint);
  }

  // Загрузить bundle на сервер
  static async uploadBundle(
    bundleFile: File,
    version?: string,
    platform: string = 'all',
    description?: string,
  ): Promise<ServerUploadResponse> {
    const formData = new FormData();
    formData.append('bundle', bundleFile);

    if (version) {
      formData.append('version', version);
    }

    formData.append('platform', platform);

    if (description) {
      formData.append('description', description);
    }

    return this.makeRequest<ServerUploadResponse>('/api/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Убираем Content-Type, чтобы браузер установил правильный boundary
    });
  }

  // Скачать bundle с сервера
  static async downloadBundle(downloadUrl: string): Promise<Blob> {
    const url = `${SERVER_CONFIG.baseURL}${downloadUrl}`;

    for (let attempt = 1; attempt <= SERVER_CONFIG.retryAttempts; attempt++) {
      try {
        console.log(
          `ServerUtils: Скачивание bundle с ${url} (попытка ${attempt})`,
        );

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        console.log(
          `ServerUtils: Bundle успешно скачан, размер: ${blob.size} байт`,
        );
        return blob;
      } catch (error) {
        console.error(
          `ServerUtils: Ошибка при скачивании bundle (попытка ${attempt}):`,
          error,
        );

        if (attempt === SERVER_CONFIG.retryAttempts) {
          throw error;
        }

        // Ждем перед следующей попыткой
        await new Promise(resolve =>
          setTimeout(resolve, SERVER_CONFIG.retryDelay * attempt),
        );
      }
    }

    throw new Error('Все попытки скачивания исчерпаны');
  }
}

// Утилиты для работы с версиями
export class VersionUtils {
  // Создать timestamp версию
  static createTimestampVersion(): string {
    return Date.now().toString();
  }

  // Сравнить версии
  static compareVersions(version1: string, version2: string): number {
    // Если версии - это timestamp, сравниваем как числа
    if (/^\d+$/.test(version1) && /^\d+$/.test(version2)) {
      const v1 = parseInt(version1, 10);
      const v2 = parseInt(version2, 10);
      return v1 - v2;
    }

    // Иначе сравниваем как строки
    return version1.localeCompare(version2);
  }

  // Проверить, является ли версия более новой
  static isNewerVersion(newVersion: string, currentVersion: string): boolean {
    return this.compareVersions(newVersion, currentVersion) > 0;
  }
}

// Утилиты для работы с файлами
export class FileUtils {
  // Проверить, является ли файл JavaScript bundle
  static isJavaScriptBundle(filename: string): boolean {
    const validExtensions = ['.js', '.jsbundle', '.bundle'];
    return validExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  // Получить размер файла в читаемом формате
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Создать имя файла с версией
  static createVersionedFilename(
    version: string,
    extension: string = '.js',
  ): string {
    return `bundle-${version}${extension}`;
  }
}

// Утилиты для логирования
export class Logger {
  private static prefix = 'CodePush';

  static log(message: string, ...args: any[]): void {
    console.log(`[${this.prefix}] ${message}`, ...args);
  }

  static warn(message: string, ...args: any[]): void {
    console.warn(`[${this.prefix}] ⚠️ ${message}`, ...args);
  }

  static error(message: string, ...args: any[]): void {
    console.error(`[${this.prefix}] ❌ ${message}`, ...args);
  }

  static success(message: string, ...args: any[]): void {
    console.log(`[${this.prefix}] ✅ ${message}`, ...args);
  }

  static info(message: string, ...args: any[]): void {
    console.info(`[${this.prefix}] ℹ️ ${message}`, ...args);
  }
}
