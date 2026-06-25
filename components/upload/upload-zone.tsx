"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, FolderUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUploadFiles } from "@/hooks/use-files";

interface Props {
  folderId?: string;
  onUploadComplete?: () => void;
}

async function readAllEntries(
  reader: FileSystemDirectoryReader,
): Promise<FileSystemEntry[]> {
  const all: FileSystemEntry[] = [];
  const readBatch = () =>
    new Promise<FileSystemEntry[]>((res) => reader.readEntries(res));
  // readEntries returns max 100 at a time — keep reading until empty
  while (true) {
    const batch = await readBatch();
    if (batch.length === 0) break;
    all.push(...batch);
  }
  return all;
}

async function collectEntries(
  entry: FileSystemEntry,
  parentPath: string,
  files: File[],
  filePaths: string[],
  dirPaths: Set<string>,
): Promise<void> {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve) =>
      (entry as FileSystemFileEntry).file(resolve),
    );
    files.push(file);
    filePaths.push(parentPath ? `${parentPath}/${file.name}` : file.name);
  } else if (entry.isDirectory) {
    const currentPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;
    dirPaths.add(currentPath);
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const children = await readAllEntries(reader);
    for (const child of children) {
      await collectEntries(child, currentPath, files, filePaths, dirPaths);
    }
  }
}

export function UploadZone({ folderId, onUploadComplete }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadFiles();

  const submitUpload = useCallback(
    (files: File[], filePaths?: string[], emptyFolderPaths?: string[]) => {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      if (folderId) formData.append("folderId", folderId);
      if (filePaths) filePaths.forEach((p) => formData.append("paths", p));
      if (emptyFolderPaths)
        emptyFolderPaths.forEach((p) => formData.append("emptyFolders", p));
      upload.mutate(formData, { onSuccess: onUploadComplete });
    },
    [folderId, upload, onUploadComplete],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const items = Array.from(e.dataTransfer.items);
      const files: File[] = [];
      const filePaths: string[] = [];
      const dirPaths = new Set<string>();

      for (const item of items) {
        const entry = item.webkitGetAsEntry();
        if (entry) await collectEntries(entry, "", files, filePaths, dirPaths);
      }

      // Folders that contain no files at all are in dirPaths but not referenced by filePaths
      const referencedDirs = new Set(
        filePaths
          .map((p) => {
            const parts = p.split("/");
            return parts.length > 1 ? parts.slice(0, -1).join("/") : null;
          })
          .filter(Boolean) as string[],
      );
      // Also collect all ancestor paths of referenced dirs
      for (const rp of [...referencedDirs]) {
        const parts = rp.split("/");
        for (let i = 1; i <= parts.length; i++) {
          referencedDirs.add(parts.slice(0, i).join("/"));
        }
      }
      const emptyFolderPaths = [...dirPaths].filter(
        (d) => !referencedDirs.has(d),
      );

      if (files.length === 0 && emptyFolderPaths.length === 0) return;

      submitUpload(
        files,
        filePaths.length ? filePaths : undefined,
        emptyFolderPaths.length ? emptyFolderPaths : undefined,
      );
    },
    [submitUpload],
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    submitUpload(files);
    e.target.value = "";
  };

  const handleFolderInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const paths = files.map((f) => (f as any).webkitRelativePath || f.name);
    // webkitdirectory can't detect empty folders — browser only gives us files
    submitUpload(files, paths);
    e.target.value = "";
  };

  return (
    <div
      className={cn(
        "relative rounded-xl border-2 border-dashed transition-all",
        isDragging
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-border hover:border-primary/50 hover:bg-muted/30",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
        {upload.isPending ? (
          <>
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-sm font-medium">Uploading...</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium mb-1">
              {isDragging
                ? "Drop files here"
                : "Drag & drop files or folders here"}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Supports all file types up to 100MB each.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-1.5" />
                Upload Files
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => folderInputRef.current?.click()}
              >
                <FolderUp className="w-4 h-4 mr-1.5" />
                Upload Folder
              </Button>
            </div>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInput}
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-ignore
        webkitdirectory=""
        multiple
        className="hidden"
        onChange={handleFolderInput}
      />
    </div>
  );
}
