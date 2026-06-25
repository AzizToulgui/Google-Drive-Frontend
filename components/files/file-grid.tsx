"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Folder, FolderPlus, MoreVertical, Download, Pencil,
  Trash2, Eye, ChevronRight, Globe, Lock, Shield
} from "lucide-react";
import { cn, formatBytes, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileIcon } from "@/components/files/file-icon";
import { FilePreviewModal } from "@/components/files/file-preview-modal";
import { RenameDialog } from "@/components/files/rename-dialog";
import { CreateFolderDialog } from "@/components/folders/create-folder-dialog";
import { VisibilityDialog } from "@/components/folders/visibility-dialog";
import { UploadZone } from "@/components/upload/upload-zone";
import { useDeleteFolder, useRenameFolder } from "@/hooks/use-folders";
import { useDeleteFile, useRenameFile } from "@/hooks/use-files";
import { downloadFile } from "@/lib/download";

interface FileRecord {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  folderId?: string | null;
}

interface FolderRecord {
  id: string;
  name: string;
  createdAt: string;
  visibility?: "public" | "private";
}

interface Props {
  folders: FolderRecord[];
  files: FileRecord[];
  isLoading: boolean;
  currentFolderId: string | null;
  breadcrumbs: { id: string | null; name: string }[];
}

export function FileGrid({ folders, files, isLoading, currentFolderId, breadcrumbs }: Props) {
  const router = useRouter();
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ type: "file" | "folder"; id: string; name: string } | null>(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [visibilityTarget, setVisibilityTarget] = useState<FolderRecord | null>(null);

  const deleteFolder = useDeleteFolder();
  const renameFolder = useRenameFolder();
  const deleteFile = useDeleteFile();
  const renameFile = useRenameFile();

  const handleDownload = (file: FileRecord) => {
    downloadFile(file.id, file.name);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const isEmpty = folders.length === 0 && files.length === 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.id ?? "root"} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
            <button
              onClick={() => crumb.id ? router.push(`/folder/${crumb.id}`) : router.push("/drive")}
              className={cn(
                "transition-colors",
                i === breadcrumbs.length - 1
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {crumb.name}
            </button>
          </span>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">
          {breadcrumbs[breadcrumbs.length - 1]?.name ?? "My Drive"}
        </h2>
        <Button variant="outline" size="sm" onClick={() => setCreateFolderOpen(true)}>
          <FolderPlus className="w-4 h-4 mr-1.5" />
          New folder
        </Button>
      </div>

      {/* Upload Zone */}
      <UploadZone folderId={currentFolderId ?? undefined} />

      {/* Empty state */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Folder className="w-12 h-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">This folder is empty</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Upload files or create a folder to get started
          </p>
        </div>
      )}

      {/* Folders */}
      {folders.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Folders
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="group relative flex flex-col items-center gap-2 p-3 rounded-xl border bg-card hover:bg-muted/50 hover:border-primary/30 cursor-pointer transition-all"
                onDoubleClick={() => router.push(`/folder/${folder.id}`)}
              >
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <Folder className="w-8 h-8 text-yellow-500" />
                  {folder.visibility === "private" && (
                    <Lock className="w-3 h-3 text-primary absolute -bottom-0.5 -right-0.5" />
                  )}
                </div>
                <span className="text-xs font-medium text-center truncate w-full text-foreground">
                  {folder.name}
                </span>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/folder/${folder.id}`)}>
                      <Folder className="w-4 h-4" />
                      Open
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setRenameTarget({ type: "folder", id: folder.id, name: folder.name })}
                    >
                      <Pencil className="w-4 h-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setVisibilityTarget(folder)}>
                      <Shield className="w-4 h-4" />
                      Visibility
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => deleteFolder.mutate(folder.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Move to trash
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files */}
      {files.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Files
          </p>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Name</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-2.5 hidden sm:table-cell">Size</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-2.5 hidden md:table-cell">Modified</th>
                  <th className="w-10 px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {files.map((file, i) => (
                  <tr
                    key={file.id}
                    className={cn(
                      "border-t hover:bg-muted/30 cursor-pointer transition-colors",
                      i === 0 && "border-t-0"
                    )}
                    onDoubleClick={() => setPreviewFile(file)}
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <FileIcon mimeType={file.mimeType} className="w-4 h-4" />
                        <span className="font-medium truncate max-w-[180px]">{file.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">
                      {formatBytes(file.size)}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">
                      {formatDate(file.createdAt)}
                    </td>
                    <td className="px-4 py-2.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setPreviewFile(file)}>
                            <Eye className="w-4 h-4" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(file)}>
                            <Download className="w-4 h-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setRenameTarget({ type: "file", id: file.id, name: file.name })}
                          >
                            <Pencil className="w-4 h-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => deleteFile.mutate(file.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                            Move to trash
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <FilePreviewModal
        file={previewFile}
        open={!!previewFile}
        onOpenChange={(o) => !o && setPreviewFile(null)}
      />

      <RenameDialog
        open={!!renameTarget}
        onOpenChange={(o) => !o && setRenameTarget(null)}
        currentName={renameTarget?.name ?? ""}
        title={`Rename ${renameTarget?.type === "folder" ? "Folder" : "File"}`}
        onRename={async (name) => {
          if (!renameTarget) return;
          if (renameTarget.type === "folder") {
            await renameFolder.mutateAsync({ id: renameTarget.id, name });
          } else {
            await renameFile.mutateAsync({ id: renameTarget.id, name });
          }
        }}
      />

      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        parentId={currentFolderId}
      />

      {visibilityTarget && (
        <VisibilityDialog
          open={!!visibilityTarget}
          onOpenChange={(o) => !o && setVisibilityTarget(null)}
          folderId={visibilityTarget.id}
          folderName={visibilityTarget.name}
          currentVisibility={visibilityTarget.visibility ?? "public"}
        />
      )}
    </div>
  );
}
