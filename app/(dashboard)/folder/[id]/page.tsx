"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Folder,
  FolderPlus,
  MoreVertical,
  Download,
  Pencil,
  Trash2,
  Eye,
  ChevronRight,
  Lock,
  Shield,
  Users,
  LayoutGrid,
  List,
  Upload,
  ChevronDown,
  ArrowUpDown,
  Share2,
  Plus,
} from "lucide-react";
import { foldersApi } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import { cn, formatBytes, formatDate } from "@/lib/utils";

interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  userId: string;
  visibility: "public" | "private";
  createdAt: string;
  ownerEmail: string;
  isOwner: boolean;
}

interface FileItem {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  userId?: string;
}

interface Breadcrumb {
  id: string;
  name: string;
  isOwner: boolean;
}

type ViewMode = "list" | "grid";

function ownerInitials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

function ownerColor(email: string) {
  const colors = [
    "bg-violet-500", "bg-blue-500", "bg-emerald-500",
    "bg-rose-500", "bg-amber-500", "bg-cyan-500", "bg-fuchsia-500",
  ];
  let hash = 0;
  for (const c of email) hash = (hash * 31 + c.charCodeAt(0)) % colors.length;
  return colors[hash];
}

export default function FolderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const currentUser = getStoredUser();

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showUpload, setShowUpload] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ type: "file" | "folder"; id: string; name: string } | null>(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [visibilityTarget, setVisibilityTarget] = useState<FolderItem | null>(null);

  const deleteFolder = useDeleteFolder();
  const renameFolder = useRenameFolder();
  const deleteFile = useDeleteFile();
  const renameFile = useRenameFile();

  const { data: breadcrumbs = [], isLoading: crumbsLoading } = useQuery<Breadcrumb[]>({
    queryKey: ["folders", id, "breadcrumbs"],
    queryFn: () => foldersApi.getBreadcrumbs(id),
    enabled: !!id,
  });

  const { data: subFolders = [], isLoading: subLoading } = useQuery<FolderItem[]>({
    queryKey: ["folders", id, "children"],
    queryFn: () => foldersApi.getChildren(id),
    enabled: !!id,
  });

  const { data: files = [], isLoading: filesLoading } = useQuery<FileItem[]>({
    queryKey: ["folders", id, "files"],
    queryFn: () => foldersApi.getFiles(id),
    enabled: !!id,
  });

  const isLoading = crumbsLoading || subLoading || filesLoading;
  const currentFolderIsOwner = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].isOwner : false;
  const currentFolderName = breadcrumbs[breadcrumbs.length - 1]?.name ?? "Folder";
  const isEmpty = subFolders.length === 0 && files.length === 0;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Command bar */}
      <div className="flex items-center gap-1 pb-3 border-b border-border">
        {currentFolderIsOwner && (
          <>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-muted rounded text-sm font-semibold text-primary transition-colors"
              onClick={() => setCreateFolderOpen(true)}
            >
              <Plus className="w-4 h-4" /> New Folder
            </button>

            <button
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 hover:bg-muted rounded text-sm font-semibold text-primary transition-colors",
                showUpload && "bg-muted",
              )}
              onClick={() => setShowUpload((v) => !v)}
            >
              <Upload className="w-4 h-4" /> Upload <ChevronDown className={cn("w-3 h-3 transition-transform", showUpload && "rotate-180")} />
            </button>

            <div className="h-5 w-px bg-border mx-1" />
          </>
        )}

        <button className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-muted rounded text-sm text-muted-foreground transition-colors">
          <Share2 className="w-4 h-4" /> Share
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-muted rounded text-sm text-muted-foreground transition-colors">
          <Download className="w-4 h-4" /> Download
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-muted rounded text-sm text-muted-foreground transition-colors">
            <ArrowUpDown className="w-4 h-4" /> Sort
          </button>
          <div className="flex items-center rounded border border-border overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center justify-center w-8 h-7 transition-colors",
                viewMode === "list" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted",
              )}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center justify-center w-8 h-7 border-l border-border transition-colors",
                viewMode === "grid" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted",
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground py-2 border-b border-border">
        <button
          onClick={() => router.push("/drive")}
          className="hover:text-primary transition-colors"
        >
          My Files
        </button>
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.id} className="flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
            <button
              onClick={() => i < breadcrumbs.length - 1 && router.push(`/folder/${crumb.id}`)}
              className={cn(
                "transition-colors",
                i === breadcrumbs.length - 1
                  ? "font-semibold text-foreground cursor-default"
                  : "hover:text-primary",
              )}
            >
              {crumb.name}
            </button>
          </span>
        ))}
        {!currentFolderIsOwner && (
          <span className="ml-2 flex items-center gap-1 text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border">
            <Users className="w-3 h-3" /> Shared with me
          </span>
        )}
      </div>

      {/* Upload zone */}
      {showUpload && currentFolderIsOwner && (
        <div className="mt-3">
          <UploadZone folderId={id} onUploadComplete={() => setShowUpload(false)} />
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Folder className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-semibold text-foreground">This folder is empty</p>
          {currentFolderIsOwner && (
            <p className="text-xs text-muted-foreground mt-1">Upload files or create a subfolder to get started</p>
          )}
        </div>
      )}

      {/* Content */}
      {!isEmpty && viewMode === "list" && (
        <div className="overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-[32px_minmax(200px,2fr)_minmax(140px,1fr)_minmax(140px,1fr)_48px] items-center px-6 h-10 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/30">
            <div />
            <div className="flex items-center gap-1">Name <ArrowUpDown className="w-3 h-3" /></div>
            <div className="flex items-center gap-1">Modified <ArrowUpDown className="w-3 h-3" /></div>
            <div>Modified By</div>
            <div />
          </div>

          {subFolders.map((folder) => (
            <div
              key={folder.id}
              className="grid grid-cols-[32px_minmax(200px,2fr)_minmax(140px,1fr)_minmax(140px,1fr)_48px] items-center px-6 h-10 hover:bg-muted/40 transition-colors cursor-pointer group border-b border-border/60 last:border-b-0"
              onDoubleClick={() => router.push(`/folder/${folder.id}`)}
            >
              <div className="flex items-center justify-center">
                <Folder className="w-4 h-4 text-amber-400 fill-amber-400" />
              </div>
              <div className="px-4 flex items-center gap-2 truncate">
                <span className="text-sm font-semibold truncate">{folder.name}</span>
                {folder.visibility === "private" && <Lock className="w-3 h-3 text-muted-foreground/50 shrink-0" />}
              </div>
              <div className="px-4 text-sm text-muted-foreground">{formatDate(folder.createdAt)}</div>
              <div className="px-4 text-sm text-muted-foreground flex items-center gap-2">
                {folder.isOwner ? (
                  <span>Me</span>
                ) : (
                  <>
                    <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0", ownerColor(folder.ownerEmail))}>
                      {ownerInitials(folder.ownerEmail).charAt(0)}
                    </div>
                    <span className="truncate max-w-[80px]">{folder.ownerEmail.split("@")[0]}</span>
                  </>
                )}
              </div>
              <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:bg-muted rounded"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => router.push(`/folder/${folder.id}`)}>
                      <Folder className="w-4 h-4" /> Open
                    </DropdownMenuItem>
                    {folder.isOwner && (
                      <>
                        <DropdownMenuItem onClick={() => setRenameTarget({ type: "folder", id: folder.id, name: folder.name })}>
                          <Pencil className="w-4 h-4" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setVisibilityTarget(folder)}>
                          <Shield className="w-4 h-4" /> Manage access
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteFolder.mutate(folder.id)}>
                          <Trash2 className="w-4 h-4" /> Move to trash
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}

          {files.map((file) => (
            <div
              key={file.id}
              className="grid grid-cols-[32px_minmax(200px,2fr)_minmax(140px,1fr)_minmax(140px,1fr)_48px] items-center px-6 h-10 hover:bg-muted/40 transition-colors cursor-pointer group border-b border-border/60 last:border-b-0"
              onDoubleClick={() => setPreviewFile(file)}
            >
              <div className="flex items-center justify-center">
                <FileIcon mimeType={file.mimeType} className="w-4 h-4" />
              </div>
              <div className="px-4 truncate">
                <span className="text-sm truncate">{file.name}</span>
              </div>
              <div className="px-4 text-sm text-muted-foreground">{formatDate(file.createdAt)}</div>
              <div className="px-4 text-sm text-muted-foreground">
                {file.userId === currentUser?.id ? "Me" : "—"}
              </div>
              <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:bg-muted rounded"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => setPreviewFile(file)}>
                      <Eye className="w-4 h-4" /> Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadFile(file.id, file.name)}>
                      <Download className="w-4 h-4" /> Download
                    </DropdownMenuItem>
                    {currentUser?.id === file.userId && (
                      <>
                        <DropdownMenuItem onClick={() => setRenameTarget({ type: "file", id: file.id, name: file.name })}>
                          <Pencil className="w-4 h-4" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteFile.mutate(file.id)}>
                          <Trash2 className="w-4 h-4" /> Move to trash
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isEmpty && viewMode === "grid" && (
        <div className="space-y-6 mt-4">
          {subFolders.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {subFolders.map((folder) => (
                <div
                  key={folder.id}
                  className="group relative flex flex-col items-center gap-2 p-3 rounded border bg-white hover:bg-muted/30 hover:border-primary/40 hover:shadow-sm cursor-pointer transition-all select-none"
                  onDoubleClick={() => router.push(`/folder/${folder.id}`)}
                >
                  <Folder className="w-9 h-9 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-medium text-center truncate w-full">{folder.name}</span>
                </div>
              ))}
            </div>
          )}
          {files.length > 0 && (
            <div className="rounded border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/30 border-b">
                  <tr>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground px-4 py-2.5 w-8" />
                    <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5">Name</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5 hidden sm:table-cell">Size</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5 hidden md:table-cell">Modified</th>
                    <th className="w-10 px-3" />
                  </tr>
                </thead>
                <tbody>
                  {files.map((file, i) => (
                    <tr
                      key={file.id}
                      className={cn("group border-t hover:bg-muted/20 cursor-pointer transition-colors", i === 0 && "border-t-0")}
                      onDoubleClick={() => setPreviewFile(file)}
                    >
                      <td className="px-4 py-2.5"><FileIcon mimeType={file.mimeType} className="w-4 h-4" /></td>
                      <td className="px-3 py-2.5"><span className="text-sm font-medium truncate max-w-[180px] block">{file.name}</span></td>
                      <td className="px-3 py-2.5 hidden sm:table-cell text-sm text-muted-foreground">{formatBytes(file.size)}</td>
                      <td className="px-3 py-2.5 hidden md:table-cell text-sm text-muted-foreground">{formatDate(file.createdAt)}</td>
                      <td className="px-3 py-2.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => setPreviewFile(file)}><Eye className="w-4 h-4" /> Preview</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadFile(file.id, file.name)}><Download className="w-4 h-4" /> Download</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <FilePreviewModal file={previewFile} open={!!previewFile} onOpenChange={(o) => !o && setPreviewFile(null)} />

      <RenameDialog
        open={!!renameTarget}
        onOpenChange={(o) => !o && setRenameTarget(null)}
        currentName={renameTarget?.name ?? ""}
        title={`Rename ${renameTarget?.type === "folder" ? "Folder" : "File"}`}
        onRename={async (name) => {
          if (!renameTarget) return;
          if (renameTarget.type === "folder") await renameFolder.mutateAsync({ id: renameTarget.id, name });
          else await renameFile.mutateAsync({ id: renameTarget.id, name });
        }}
      />

      <CreateFolderDialog open={createFolderOpen} onOpenChange={setCreateFolderOpen} parentId={id} />

      {visibilityTarget && (
        <VisibilityDialog
          open={!!visibilityTarget}
          onOpenChange={(o) => !o && setVisibilityTarget(null)}
          folderId={visibilityTarget.id}
          folderName={visibilityTarget.name}
          currentVisibility={visibilityTarget.visibility}
          currentUserId={currentUser?.id}
        />
      )}
    </div>
  );
}
