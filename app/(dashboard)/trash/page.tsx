"use client";

import { useQuery } from "@tanstack/react-query";
import { filesApi, foldersApi } from "@/lib/api";
import { useRestoreFile, usePermanentDeleteFile } from "@/hooks/use-files";
import { useRestoreFolder, usePermanentDeleteFolder } from "@/hooks/use-folders";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, RotateCcw, File, Folder, Trash } from "lucide-react";
import { formatDate, formatBytes } from "@/lib/utils";
import { FileIcon } from "@/components/files/file-icon";

export default function TrashPage() {
  const { data: trashedFiles = [], isLoading: filesLoading } = useQuery({
    queryKey: ["files", "trash"],
    queryFn: filesApi.getTrash,
  });

  const { data: trashedFolders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ["folders", "trash"],
    queryFn: foldersApi.getTrash,
  });

  const restoreFile = useRestoreFile();
  const permanentDeleteFile = usePermanentDeleteFile();
  const restoreFolder = useRestoreFolder();
  const permanentDeleteFolder = usePermanentDeleteFolder();

  const isLoading = filesLoading || foldersLoading;
  const isEmpty = trashedFiles.length === 0 && trashedFolders.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trash2 className="w-6 h-6" />
            Trash
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Items in trash can be restored or permanently deleted
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      )}

      {!isLoading && isEmpty && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Trash className="w-12 h-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">Trash is empty</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Deleted files and folders will appear here
          </p>
        </div>
      )}

      {trashedFolders.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Folders ({trashedFolders.length})
          </p>
          <div className="rounded-xl border overflow-hidden">
            {(trashedFolders as any[]).map((folder, i) => (
              <div
                key={folder.id}
                className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-muted/30"
              >
                <Folder className="w-5 h-5 text-yellow-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{folder.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Deleted {formatDate(folder.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => restoreFolder.mutate(folder.id)}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Restore
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => permanentDeleteFolder.mutate(folder.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {trashedFiles.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Files ({trashedFiles.length})
          </p>
          <div className="rounded-xl border overflow-hidden">
            {(trashedFiles as any[]).map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-muted/30"
              >
                <FileIcon mimeType={file.mimeType} className="w-5 h-5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size)} · Deleted {formatDate(file.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => restoreFile.mutate(file.id)}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Restore
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => permanentDeleteFile.mutate(file.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
