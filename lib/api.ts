import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  register: (data: { email: string; password: string }) =>
    api.post("/auth/register", data).then((r) => r.data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
};

// Folders
export const foldersApi = {
  create: (data: { name: string; parentId?: string }) =>
    api.post("/folders", data).then((r) => r.data),
  getTree: () => api.get("/folders/tree").then((r) => r.data),
  getAccessibleRoots: () => api.get("/folders/accessible").then((r) => r.data),
  getById: (id: string) => api.get(`/folders/${id}`).then((r) => r.data),
  getChildren: (id: string) => api.get(`/folders/${id}/children`).then((r) => r.data),
  getBreadcrumbs: (id: string) => api.get(`/folders/${id}/breadcrumbs`).then((r) => r.data),
  rename: (id: string, name: string) =>
    api.patch(`/folders/${id}`, { name }).then((r) => r.data),
  delete: (id: string) => api.delete(`/folders/${id}`).then((r) => r.data),
  restore: (id: string) => api.post(`/folders/${id}/restore`).then((r) => r.data),
  permanentDelete: (id: string) => api.delete(`/folders/${id}/permanent`).then((r) => r.data),
  getTrash: () => api.get("/folders/trash").then((r) => r.data),
  getFiles: (id: string) => api.get(`/folders/${id}/files`).then((r) => r.data),
};

// Files
export const filesApi = {
  upload: (formData: FormData) =>
    api.post("/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),
  getDownloadUrl: (id: string) => `/api/files/${id}/download`,
  getPreviewUrl: (id: string) => `/api/files/${id}/preview`,
  rename: (id: string, name: string) =>
    api.patch(`/files/${id}`, { name }).then((r) => r.data),
  delete: (id: string) => api.delete(`/files/${id}`).then((r) => r.data),
  restore: (id: string) => api.post(`/files/${id}/restore`).then((r) => r.data),
  permanentDelete: (id: string) => api.delete(`/files/${id}/permanent`).then((r) => r.data),
  getTrash: () => api.get("/files/trash").then((r) => r.data),
};

// Search
export const searchApi = {
  search: (q: string) => api.get(`/search?q=${encodeURIComponent(q)}`).then((r) => r.data),
};

// Users
export const usersApi = {
  getAll: () => api.get("/users").then((r) => r.data),
};

// Library Columns types
export type ColumnType = 'text' | 'integer' | 'float' | 'enum';

export interface LibraryColumn {
  id: string;
  libraryId: string;
  name: string;
  type: ColumnType;
  enumOptions: string[] | null;
  defaultValue: string | null;
  position: number;
  createdAt: string;
}

export interface ColumnValuesResponse {
  columns: LibraryColumn[];
  values: Record<string, string | null>;
}

export interface ColumnValueEntry {
  columnId: string;
  value: string | null;
}

export interface CreateColumnPayload {
  name: string;
  type: ColumnType;
  enumOptions?: string[];
  defaultValue?: string;
}

export interface UpdateColumnPayload {
  name?: string;
  type?: ColumnType;
  enumOptions?: string[];
  defaultValue?: string;
  position?: number;
}

export const libraryColumnsApi = {
  getColumns: (libraryId: string): Promise<LibraryColumn[]> =>
    api.get(`/folders/${libraryId}/columns`).then((r) => r.data),

  createColumn: (libraryId: string, data: CreateColumnPayload): Promise<LibraryColumn> =>
    api.post(`/folders/${libraryId}/columns`, data).then((r) => r.data),

  updateColumn: (
    libraryId: string,
    columnId: string,
    data: UpdateColumnPayload,
  ): Promise<LibraryColumn> =>
    api.patch(`/folders/${libraryId}/columns/${columnId}`, data).then((r) => r.data),

  deleteColumn: (libraryId: string, columnId: string): Promise<{ success: boolean }> =>
    api.delete(`/folders/${libraryId}/columns/${columnId}`).then((r) => r.data),

  getFolderColumnValues: (folderId: string): Promise<ColumnValuesResponse> =>
    api.get(`/folders/${folderId}/column-values`).then((r) => r.data),

  setFolderColumnValues: (
    folderId: string,
    values: ColumnValueEntry[],
  ): Promise<{ success: boolean }> =>
    api.put(`/folders/${folderId}/column-values`, { values }).then((r) => r.data),

  getFileColumnValues: (fileId: string): Promise<ColumnValuesResponse> =>
    api.get(`/files/${fileId}/column-values`).then((r) => r.data),

  setFileColumnValues: (
    fileId: string,
    values: ColumnValueEntry[],
  ): Promise<{ success: boolean }> =>
    api.put(`/files/${fileId}/column-values`, { values }).then((r) => r.data),
};

// Folder sharing / visibility
export const folderVisibilityApi = {
  setVisibility: (id: string, visibility: "public" | "private") =>
    api.patch(`/folders/${id}/visibility`, { visibility }).then((r) => r.data),
  getShares: (id: string) => api.get(`/folders/${id}/shares`).then((r) => r.data),
  addShares: (id: string, userIds: string[]) =>
    api.post(`/folders/${id}/shares`, { userIds }).then((r) => r.data),
  removeShare: (id: string, sharedUserId: string) =>
    api.delete(`/folders/${id}/shares/${sharedUserId}`).then((r) => r.data),
};
