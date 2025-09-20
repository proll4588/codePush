import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
});

export interface Bundle {
  id: number;
  filename: string;
  bundleVersion: string;
  platform: 'ios' | 'android' | 'all';
  description: string;
  compatibleVersions: string[];
  size: number;
  is_test_only: boolean;
  createdAt: string;
}

export const getBundles = async (): Promise<Bundle[]> => {
  const response = await apiClient.get('/updates');
  // compatibleVersions хранится как JSON-строка в SQLite
  return response.data.updates.map((bundle: any) => ({
    ...bundle,
    compatibleVersions: typeof bundle.compatibleVersions === 'string' 
      ? JSON.parse(bundle.compatibleVersions) 
      : bundle.compatibleVersions,
  }));
};

export const uploadBundle = async (formData: FormData): Promise<any> => {
  const response = await apiClient.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteBundle = async (id: number): Promise<any> => {
  const response = await apiClient.delete(`/updates/${id}`);
  return response.data;
};

// --- App Versions API ---

export interface AppVersion {
  id: number;
  version: string;
}

export const getAppVersions = async (): Promise<AppVersion[]> => {
  const response = await apiClient.get('/app-versions');
  return response.data;
};

export const addAppVersion = async (version: string): Promise<AppVersion> => {
  const response = await apiClient.post('/app-versions', { version });
  return response.data;
};

export const deleteAppVersion = async (id: number): Promise<any> => {
  const response = await apiClient.delete(`/app-versions/${id}`);
  return response.data;
};

export const promoteBundle = async (id: number): Promise<any> => {
  const response = await apiClient.post(`/bundles/${id}/promote`);
  return response.data;
};

// --- Build Artifacts API ---

export interface BuildArtifact {
  id: number;
  app_version_id: number;
  app_version_string: string;
  platform: 'ios' | 'android';
  filename: string;
  original_filename: string;
  size: number;
  notes: string;
  createdAt: string;
}

export const getArtifacts = async (): Promise<BuildArtifact[]> => {
  const response = await apiClient.get('/artifacts');
  return response.data;
};

export const uploadArtifact = async (formData: FormData): Promise<any> => {
  const response = await apiClient.post('/artifacts/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteArtifact = async (id: number): Promise<any> => {
  const response = await apiClient.delete(`/artifacts/${id}`);
  return response.data;
};
