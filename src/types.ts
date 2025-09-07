// Типы для Code Push системы

export interface CodePushUpdate {
  hasUpdate: boolean;
  version?: string;
  downloadUrl?: string;
  size?: number;
  createdAt?: string;
  description?: string;
  message?: string;
}

export interface CodePushDownloadResult {
  success: boolean;
  message: string;
  version?: string;
}

export interface CodePushVersionInfo {
  version: string;
  hasUpdate: boolean;
}

export interface CodePushConstants {
  serverURL: string;
  codePushPath: string;
}

// Интерфейс для нативного модуля
export interface CodePushManagerInterface {
  // Константы
  getConstants(): CodePushConstants;

  // Методы
  checkForUpdate(): Promise<CodePushUpdate>;
  downloadUpdate(): Promise<CodePushDownloadResult>;
  getCurrentVersion(): Promise<CodePushVersionInfo>;
  getBundlePath(): Promise<string | null>;
  clearUpdates(): Promise<CodePushDownloadResult>;
}

// Типы для серверных запросов
export interface ServerCheckUpdateResponse {
  hasUpdate: boolean;
  version?: string;
  downloadUrl?: string;
  size?: number;
  createdAt?: string;
  description?: string;
  message?: string;
}

export interface ServerUploadResponse {
  success: boolean;
  message: string;
  update?: {
    id: number;
    version: string;
    filename: string;
    originalName: string;
    size: number;
    platform: string;
    description: string;
    createdAt: string;
    uploadedBy: string;
  };
}

export interface ServerStatusResponse {
  status: string;
  version: string;
  uptime: number;
  updatesCount: number;
  timestamp: string;
}
