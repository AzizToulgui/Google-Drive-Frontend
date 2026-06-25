"use client";

import { createContext, useContext, useState } from "react";
import { FilePreviewModal } from "@/components/files/file-preview-modal";

export interface PreviewFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
}

interface FilePreviewContextValue {
  openPreview: (file: PreviewFile) => void;
}

const FilePreviewContext = createContext<FilePreviewContextValue>({
  openPreview: () => {},
});

export function FilePreviewProvider({ children }: { children: React.ReactNode }) {
  const [file, setFile] = useState<PreviewFile | null>(null);

  return (
    <FilePreviewContext.Provider value={{ openPreview: setFile }}>
      {children}
      <FilePreviewModal
        file={file}
        open={!!file}
        onOpenChange={(o) => { if (!o) setFile(null); }}
      />
    </FilePreviewContext.Provider>
  );
}

export function useFilePreview() {
  return useContext(FilePreviewContext);
}
