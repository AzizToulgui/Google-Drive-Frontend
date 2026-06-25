"use client";

export function downloadFile(fileId: string, fileName: string) {
  const token = localStorage.getItem("token");
  const url = `/api/files/${fileId}/download${token ? `?token=${token}` : ""}`;
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function getPreviewUrl(fileId: string): string {
  const token = localStorage.getItem("token");
  return `/api/files/${fileId}/preview${token ? `?token=${token}` : ""}`;
}
