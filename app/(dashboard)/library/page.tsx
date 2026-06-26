"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Folder,
  MoreVertical,
  Pencil,
  Trash2,
  Shield,
  LayoutGrid,
  List,
  Upload,
  ArrowUpDown,
  Plus,
  Share2,
  Download,
  ChevronDown,
  Lock,
  SlidersHorizontal,
} from "lucide-react";
import { api, foldersApi } from "@/lib/api";
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
import { RenameDialog } from "@/components/files/rename-dialog";
import { CreateFolderDialog } from "@/components/folders/create-folder-dialog";
import { VisibilityDialog } from "@/components/folders/visibility-dialog";
import { UploadZone } from "@/components/upload/upload-zone";
import { useDeleteFolder, useRenameFolder } from "@/hooks/use-folders";
import { ManageColumnsDialog } from "@/components/columns/manage-columns-dialog";
import { ItemDetailsPanel, type DetailItem } from "@/components/columns/item-details-panel";
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
}

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

type ViewMode = "list" | "grid";

export default function LibraryPage() {
  const router = useRouter();
  const currentUser = getStoredUser();

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [createOpen, setCreateOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [visibilityTarget, setVisibilityTarget] = useState<FolderItem | null>(null);
  const [manageColumnsTarget, setManageColumnsTarget] = useState<{ id: string; name: string } | null>(null);
  const [selectedItem, setSelectedItem] = useState<DetailItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const deleteFolder = useDeleteFolder();
  const renameFolder = useRenameFolder();

  const { data: allFolders = [], isLoading: foldersLoading } = useQuery<FolderItem[]>({
    queryKey: ["folders", "accessible"],
    queryFn: foldersApi.getAccessibleRoots,
  });

  const { data: files = [], isLoading: filesLoading } = useQuery<FileItem[]>({
    queryKey: ["files", "root"],
    queryFn: () => api.get("/files/root").then((r) => r.data),
  });

  const myFolders = allFolders.filter((f) => f.isOwner);
  const teamFolders = allFolders.filter((f) => !f.isOwner);
  const isLoading = foldersLoading || filesLoading;

  const openDetails = (item: DetailItem) => {
    setSelectedItem(item);
    setDetailsOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Command bar */}
      <div className="flex items-center gap-1 pb-3 border-b border-border mb-0">
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-muted rounded-lg text-sm font-semibold text-primary transition-colors"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-4 h-4" /> New Library
        </button>

        <button
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 hover:bg-muted rounded-lg text-sm font-semibold text-primary transition-colors",
            showUpload && "bg-muted",
          )}
          onClick={() => setShowUpload((v) => !v)}
        >
          <Upload className="w-4 h-4" /> Upload <ChevronDown className={cn("w-3 h-3 transition-transform", showUpload && "rotate-180")} />
        </button>

        <div className="h-5 w-px bg-border mx-1" />

        <button className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-muted rounded-lg text-sm text-muted-foreground transition-colors">
          <Share2 className="w-4 h-4" /> Share
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-muted rounded-lg text-sm text-muted-foreground transition-colors">
          <Download className="w-4 h-4" /> Download
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-muted rounded-lg text-sm text-muted-foreground transition-colors">
            <ArrowUpDown className="w-4 h-4" /> Sort
          </button>
          <div className="flex items-center rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center justify-center w-8 h-7 transition-colors",
                viewMode === "list" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted",
              )}
              title="List view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center justify-center w-8 h-7 border-l border-border transition-colors",
                viewMode === "grid" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted",
              )}
              title="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground py-2 border-b border-border mb-0">
        <span className="font-semibold text-foreground">My Files</span>
      </div>

      {/* Upload zone */}
      {showUpload && (
        <div className="mt-3">
          <UploadZone folderId={undefined} onUploadComplete={() => setShowUpload(false)} />
        </div>
      )}

      {/* Content */}
      {viewMode === "list" ? (
        <FileTable
          myFolders={myFolders}
          teamFolders={teamFolders}
          files={files}
          onOpen={(id) => router.push(`/folder/${id}`)}
          onRename={(id, name) => setRenameTarget({ id, name })}
          onDelete={(id) => deleteFolder.mutate(id)}
          onVisibility={(f) => setVisibilityTarget(f)}
          onManageColumns={(id, name) => setManageColumnsTarget({ id, name })}
          onSelectItem={openDetails}
        />
      ) : (
        <GridView
          myFolders={myFolders}
          teamFolders={teamFolders}
          files={files}
          onOpen={(id) => router.push(`/folder/${id}`)}
          onRename={(id, name) => setRenameTarget({ id, name })}
          onDelete={(id) => deleteFolder.mutate(id)}
          onVisibility={(f) => setVisibilityTarget(f)}
          onCreateFolder={() => setCreateOpen(true)}
          onManageColumns={(id, name) => setManageColumnsTarget({ id, name })}
        />
      )}

      <CreateFolderDialog open={createOpen} onOpenChange={setCreateOpen} parentId={null} />

      <RenameDialog
        open={!!renameTarget}
        onOpenChange={(o) => !o && setRenameTarget(null)}
        currentName={renameTarget?.name ?? ""}
        title="Rename Library"
        onRename={async (name) => {
          if (!renameTarget) return;
          await renameFolder.mutateAsync({ id: renameTarget.id, name });
        }}
      />

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

      {manageColumnsTarget && (
        <ManageColumnsDialog
          open={!!manageColumnsTarget}
          onOpenChange={(o) => !o && setManageColumnsTarget(null)}
          libraryId={manageColumnsTarget.id}
          libraryName={manageColumnsTarget.name}
        />
      )}

      <ItemDetailsPanel
        item={selectedItem}
        libraryId={selectedItem?.itemType === "folder" ? (selectedItem.id ?? null) : null}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
    </div>
  );
}

// ── File Table (List View) ─────────────────────────────────────────────────────

function FileTable({
  myFolders,
  teamFolders,
  files,
  onOpen,
  onRename,
  onDelete,
  onVisibility,
  onManageColumns,
  onSelectItem,
}: {
  myFolders: FolderItem[];
  teamFolders: FolderItem[];
  files: FileItem[];
  onOpen: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onVisibility: (f: FolderItem) => void;
  onManageColumns: (id: string, name: string) => void;
  onSelectItem: (item: DetailItem) => void;
}) {
  const isEmpty = myFolders.length === 0 && teamFolders.length === 0 && files.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <Folder className="w-7 h-7 text-muted-foreground/40" />
        </div>
        <p className="text-sm font-semibold text-foreground">Nothing here yet</p>
        <p className="text-xs text-muted-foreground mt-1">Create a library or upload files to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-[32px_minmax(200px,2fr)_minmax(140px,1fr)_minmax(140px,1fr)_48px] items-center px-6 h-10 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/30 sticky top-0 z-10">
        <div />
        <div className="flex items-center gap-1 cursor-pointer hover:text-foreground">
          Name <ArrowUpDown className="w-3 h-3" />
        </div>
        <div className="flex items-center gap-1 cursor-pointer hover:text-foreground">
          Modified <ArrowUpDown className="w-3 h-3" />
        </div>
        <div>Modified By</div>
        <div />
      </div>

      {/* My Libraries */}
      {myFolders.map((folder) => (
        <FolderRow
          key={folder.id}
          folder={folder}
          onOpen={() => onOpen(folder.id)}
          onRename={() => onRename(folder.id, folder.name)}
          onDelete={() => onDelete(folder.id)}
          onVisibility={() => onVisibility(folder)}
          onManageColumns={() => onManageColumns(folder.id, folder.name)}
          onClick={() => onSelectItem({
            id: folder.id,
            name: folder.name,
            itemType: "folder",
            createdAt: folder.createdAt,
            ownerEmail: folder.ownerEmail,
            isOwner: folder.isOwner,
          })}
        />
      ))}

      {/* Team Libraries */}
      {teamFolders.map((folder) => (
        <FolderRow
          key={folder.id}
          folder={folder}
          onOpen={() => onOpen(folder.id)}
          onRename={() => onRename(folder.id, folder.name)}
          onDelete={() => onDelete(folder.id)}
          onVisibility={() => onVisibility(folder)}
          onManageColumns={() => onManageColumns(folder.id, folder.name)}
          onClick={() => onSelectItem({
            id: folder.id,
            name: folder.name,
            itemType: "folder",
            createdAt: folder.createdAt,
            ownerEmail: folder.ownerEmail,
            isOwner: folder.isOwner,
          })}
        />
      ))}

      {/* Files */}
      {files.map((file) => (
        <div
          key={file.id}
          className="grid grid-cols-[32px_minmax(200px,2fr)_minmax(140px,1fr)_minmax(140px,1fr)_48px] items-center px-6 h-10 hover:bg-secondary/40 transition-colors cursor-pointer group border-b border-border/60 last:border-b-0"
          onClick={() => onSelectItem({
            id: file.id,
            name: file.name,
            itemType: "file",
            mimeType: file.mimeType,
            size: file.size,
            createdAt: file.createdAt,
          })}
        >
          <div className="flex items-center justify-center">
            <FileIcon mimeType={file.mimeType} className="w-4 h-4" />
          </div>
          <div className="px-4 flex items-center gap-2 truncate">
            <span className="text-sm text-foreground truncate">{file.name}</span>
          </div>
          <div className="px-4 text-sm text-muted-foreground">{formatDate(file.createdAt)}</div>
          <div className="px-4 text-sm text-muted-foreground flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-foreground shrink-0">
              Me
            </div>
          </div>
          <div className="flex justify-center">
            <span className="w-6 h-6 flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4" />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function FolderRow({
  folder,
  onOpen,
  onRename,
  onDelete,
  onVisibility,
  onManageColumns,
  onClick,
}: {
  folder: FolderItem;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
  onVisibility: () => void;
  onManageColumns: () => void;
  onClick: () => void;
}) {
  return (
    <div
      className="grid grid-cols-[32px_minmax(200px,2fr)_minmax(140px,1fr)_minmax(140px,1fr)_48px] items-center px-6 h-10 hover:bg-secondary/40 transition-colors cursor-pointer group border-b border-border/60 last:border-b-0"
      onClick={onClick}
      onDoubleClick={onOpen}
    >
      <div className="flex items-center justify-center">
        <Folder className="w-4 h-4 text-amber-400 fill-amber-400" />
      </div>
      <div className="px-4 flex items-center gap-2 truncate">
        <span className="text-sm font-semibold text-foreground truncate">{folder.name}</span>
        {folder.visibility === "private" && (
          <Lock className="w-3 h-3 text-muted-foreground/50 shrink-0" />
        )}
      </div>
      <div className="px-4 text-sm text-muted-foreground">{formatDate(folder.createdAt)}</div>
      <div className="px-4 text-sm text-muted-foreground flex items-center gap-2">
        {folder.isOwner ? (
          <span>Me</span>
        ) : (
          <>
            <div
              className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0",
                ownerColor(folder.ownerEmail),
              )}
            >
              {ownerInitials(folder.ownerEmail).charAt(0)}
            </div>
            <span className="truncate max-w-[80px]">{folder.ownerEmail.split("@")[0]}</span>
          </>
        )}
      </div>
      <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onOpen}>
              <Folder className="w-4 h-4" /> Open
            </DropdownMenuItem>
            {folder.isOwner && (
              <>
                <DropdownMenuItem onClick={onManageColumns}>
                  <SlidersHorizontal className="w-4 h-4" /> Manage Columns
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onRename}>
                  <Pencil className="w-4 h-4" /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onVisibility}>
                  <Shield className="w-4 h-4" /> Manage access
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="w-4 h-4" /> Move to trash
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ── Grid View ─────────────────────────────────────────────────────────────────

function GridView({
  myFolders,
  teamFolders,
  files,
  onOpen,
  onRename,
  onDelete,
  onVisibility,
  onCreateFolder,
  onManageColumns,
}: {
  myFolders: FolderItem[];
  teamFolders: FolderItem[];
  files: FileItem[];
  onOpen: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onVisibility: (f: FolderItem) => void;
  onCreateFolder: () => void;
  onManageColumns: (id: string, name: string) => void;
}) {
  const isEmpty = myFolders.length === 0 && teamFolders.length === 0 && files.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center mt-4">
        <Folder className="w-10 h-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-semibold text-foreground">Nothing here yet</p>
        <button onClick={onCreateFolder} className="text-xs text-primary hover:underline mt-1">
          Create your first library
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      {[
        { label: "My Libraries", items: myFolders },
        { label: "Team", items: teamFolders },
      ].map(({ label, items }) =>
        items.length > 0 ? (
          <section key={label} className="space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {items.map((folder) => (
                <div
                  key={folder.id}
                  className="group relative flex flex-col items-center gap-2 p-3 rounded-2xl border-[1.5px] border-border bg-white hover:border-primary/40 hover:shadow-md cursor-pointer transition-all select-none"
                  onDoubleClick={() => onOpen(folder.id)}
                >
                  <Folder className="w-9 h-9 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-medium text-center truncate w-full">{folder.name}</span>
                  {!folder.isOwner && (
                    <div
                      className={cn(
                        "text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full",
                        ownerColor(folder.ownerEmail),
                      )}
                    >
                      {ownerInitials(folder.ownerEmail).charAt(0)}
                    </div>
                  )}
                  {folder.isOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center text-muted-foreground hover:bg-muted rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onOpen(folder.id)}><Folder className="w-4 h-4" /> Open</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onManageColumns(folder.id, folder.name)}><SlidersHorizontal className="w-4 h-4" /> Manage Columns</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onRename(folder.id, folder.name)}><Pencil className="w-4 h-4" /> Rename</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onVisibility(folder)}><Shield className="w-4 h-4" /> Manage access</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(folder.id)}>
                          <Trash2 className="w-4 h-4" /> Move to trash
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null
      )}

      {files.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Files</h2>
          <div className="rounded-2xl border-[1.5px] border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary/30 border-b">
                <tr>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground px-4 py-2.5 w-8" />
                  <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5">Name</th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5 hidden sm:table-cell">Size</th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5 hidden md:table-cell">Modified</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file, i) => (
                  <tr key={file.id} className={cn("border-t hover:bg-secondary/20 transition-colors", i === 0 && "border-t-0")}>
                    <td className="px-4 py-2.5"><FileIcon mimeType={file.mimeType} className="w-4 h-4" /></td>
                    <td className="px-3 py-2.5"><span className="text-sm font-medium truncate max-w-[200px] block">{file.name}</span></td>
                    <td className="px-3 py-2.5 hidden sm:table-cell text-sm text-muted-foreground">{formatBytes(file.size)}</td>
                    <td className="px-3 py-2.5 hidden md:table-cell text-sm text-muted-foreground">{formatDate(file.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
