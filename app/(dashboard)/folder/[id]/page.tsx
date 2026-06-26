"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Folder,
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
  SlidersHorizontal,
} from "lucide-react";
import { foldersApi, type LibraryColumn } from "@/lib/api";
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
import {
  useLibraryColumns,
  useBatchColumnValues,
  useSetColumnValue,
} from "@/hooks/use-library-columns";
import { ManageColumnsDialog } from "@/components/columns/manage-columns-dialog";
import { ItemDetailsPanel, type DetailItem } from "@/components/columns/item-details-panel";
import { downloadFile } from "@/lib/download";
import { cn, formatDate } from "@/lib/utils";

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

function ownerColor(email: string) {
  const colors = [
    "bg-violet-500", "bg-blue-500", "bg-emerald-500",
    "bg-rose-500", "bg-amber-500", "bg-cyan-500", "bg-fuchsia-500",
  ];
  let hash = 0;
  for (const c of email) hash = (hash * 31 + c.charCodeAt(0)) % colors.length;
  return colors[hash];
}

// ── Inline cell editor ────────────────────────────────────────────────────────

function InlineCellEditor({
  column,
  value,
  onSave,
}: {
  column: LibraryColumn;
  value: string | null;
  onSave: (value: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  // Stay in sync with server value when not editing
  useEffect(() => {
    if (!editing) setLocal(value ?? "");
  }, [value, editing]);

  const commit = () => {
    setEditing(false);
    const v = local.trim();
    onSave(v === "" ? null : v);
  };

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditing(true);
  };

  const stopBubble = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
  };

  if (editing) {
    const sharedCls =
      "w-full h-full text-sm bg-white border-[1.5px] border-primary rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-primary/20";

    if (column.type === "enum") {
      return (
        <div className="h-full flex items-center px-1" onClick={stopBubble} onDoubleClick={stopBubble}>
          <select
            ref={selectRef}
            autoFocus
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { stopBubble(e); if (e.key === "Escape") { setEditing(false); setLocal(value ?? ""); } }}
            className={sharedCls}
          >
            <option value="">—</option>
            {column.enumOptions?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div className="h-full flex items-center px-1" onClick={stopBubble} onDoubleClick={stopBubble}>
        <input
          ref={inputRef}
          autoFocus
          type={column.type === "integer" || column.type === "float" ? "number" : "text"}
          step={column.type === "float" ? "any" : column.type === "integer" ? "1" : undefined}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            stopBubble(e);
            if (e.key === "Enter") commit();
            if (e.key === "Escape") { setEditing(false); setLocal(value ?? ""); }
          }}
          placeholder={column.defaultValue ?? ""}
          className={sharedCls}
        />
      </div>
    );
  }

  return (
    <div
      className="h-full flex items-center px-3 cursor-text rounded-lg hover:bg-primary/5 transition-colors group/cell"
      onClick={startEdit}
      onDoubleClick={stopBubble}
      title={`Click to edit ${column.name}`}
    >
      <span className={cn(
        "text-sm truncate select-none",
        local ? "text-foreground" : "text-muted-foreground/40",
      )}>
        {local || "—"}
      </span>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

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
  const [manageColumnsOpen, setManageColumnsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DetailItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const deleteFolder = useDeleteFolder();
  const renameFolder = useRenameFolder();
  const deleteFile = useDeleteFile();
  const renameFile = useRenameFile();
  const setCellValue = useSetColumnValue();

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

  const libraryId = breadcrumbs[0]?.id ?? null;
  const isLibraryOwner = breadcrumbs[0]?.isOwner ?? false;
  const { data: libraryColumns = [] } = useLibraryColumns(libraryId);

  const allItems: Array<{ id: string; type: "file" | "folder" }> = [
    ...subFolders.map((f) => ({ id: f.id, type: "folder" as const })),
    ...files.map((f) => ({ id: f.id, type: "file" as const })),
  ];
  const batchValues = useBatchColumnValues(allItems, libraryId, libraryColumns.length);

  // Grid template: icon | name | modified | modifiedBy | ...columns | actions
  const gridTemplateColumns = [
    "32px",
    "minmax(180px,2fr)",
    "minmax(120px,1fr)",
    "minmax(120px,1fr)",
    ...libraryColumns.map(() => "minmax(140px,1fr)"),
    "48px",
  ].join(" ");

  const isLoading = crumbsLoading || subLoading || filesLoading;
  const currentFolderIsOwner = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].isOwner : false;
  const isEmpty = subFolders.length === 0 && files.length === 0;

  const openDetails = (item: DetailItem) => {
    setSelectedItem(item);
    setDetailsOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-xl" />
        ))}
      </div>
    );
  }

  // Shared column header cells
  const columnHeaders = libraryColumns.map((col) => (
    <div key={col.id} className="flex items-center gap-1 px-3 truncate text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
      {col.name}
    </div>
  ));

  // Column cells for a given item
  const columnCells = (itemId: string, itemType: "file" | "folder") =>
    libraryColumns.map((col) => (
      <InlineCellEditor
        key={col.id}
        column={col}
        value={batchValues[itemId]?.[col.id] ?? null}
        onSave={(value) =>
          setCellValue.mutate({ itemId, itemType, values: [{ columnId: col.id, value }] })
        }
      />
    ));

  return (
    <div className="space-y-0">
      {/* Command bar */}
      <div className="flex items-center gap-1 pb-3 border-b border-border">
        {currentFolderIsOwner && (
          <>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-muted rounded-lg text-sm font-semibold text-primary transition-colors"
              onClick={() => setCreateFolderOpen(true)}
            >
              <Plus className="w-4 h-4" /> New Folder
            </button>

            <button
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 hover:bg-muted rounded-lg text-sm font-semibold text-primary transition-colors",
                showUpload && "bg-muted",
              )}
              onClick={() => setShowUpload((v) => !v)}
            >
              <Upload className="w-4 h-4" /> Upload
              <ChevronDown className={cn("w-3 h-3 transition-transform", showUpload && "rotate-180")} />
            </button>

            <div className="h-5 w-px bg-border mx-1" />
          </>
        )}

        <button className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-muted rounded-lg text-sm text-muted-foreground transition-colors">
          <Share2 className="w-4 h-4" /> Share
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-muted rounded-lg text-sm text-muted-foreground transition-colors">
          <Download className="w-4 h-4" /> Download
        </button>

        {isLibraryOwner && libraryId && (
          <>
            <div className="h-5 w-px bg-border mx-1" />
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-muted rounded-lg text-sm font-semibold text-primary transition-colors"
              onClick={() => setManageColumnsOpen(true)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Columns
              {libraryColumns.length > 0 && (
                <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                  {libraryColumns.length}
                </span>
              )}
            </button>
          </>
        )}

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
        <button onClick={() => router.push("/library")} className="hover:text-primary transition-colors">
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
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
            <Folder className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-semibold text-foreground">This folder is empty</p>
          {currentFolderIsOwner && (
            <p className="text-xs text-muted-foreground mt-1">
              Upload files or create a subfolder to get started
            </p>
          )}
        </div>
      )}

      {/* List view */}
      {!isEmpty && viewMode === "list" && (
        <div className="overflow-x-auto">
          {/* Header row */}
          <div
            className="grid items-center px-6 h-9 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/30 sticky top-0 z-10"
            style={{ gridTemplateColumns }}
          >
            <div />
            <div className="flex items-center gap-1 cursor-pointer hover:text-foreground px-4">
              Name <ArrowUpDown className="w-3 h-3" />
            </div>
            <div className="flex items-center gap-1 cursor-pointer hover:text-foreground px-4">
              Modified <ArrowUpDown className="w-3 h-3" />
            </div>
            <div className="px-4">Modified By</div>
            {columnHeaders}
            <div />
          </div>

          {/* Folder rows */}
          {subFolders.map((folder) => (
            <div
              key={folder.id}
              className="grid border-b border-border/60 last:border-b-0 hover:bg-secondary/30 transition-colors group cursor-pointer"
              style={{ gridTemplateColumns, height: "42px" }}
              onClick={() => openDetails({
                id: folder.id,
                name: folder.name,
                itemType: "folder",
                createdAt: folder.createdAt,
                ownerEmail: folder.ownerEmail,
                isOwner: folder.isOwner,
              })}
              onDoubleClick={() => router.push(`/folder/${folder.id}`)}
            >
              {/* Icon */}
              <div className="flex items-center justify-center">
                <Folder className="w-4 h-4 text-amber-400 fill-amber-400" />
              </div>
              {/* Name */}
              <div className="flex items-center gap-2 px-4 min-w-0">
                <span className="text-sm font-semibold truncate">{folder.name}</span>
                {folder.visibility === "private" && (
                  <Lock className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                )}
              </div>
              {/* Modified */}
              <div className="flex items-center px-4 text-sm text-muted-foreground">
                {formatDate(folder.createdAt)}
              </div>
              {/* Modified By */}
              <div className="flex items-center gap-2 px-4 text-sm text-muted-foreground">
                {folder.isOwner ? (
                  <span>Me</span>
                ) : (
                  <>
                    <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0", ownerColor(folder.ownerEmail))}>
                      {folder.ownerEmail.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate max-w-[80px]">{folder.ownerEmail.split("@")[0]}</span>
                  </>
                )}
              </div>
              {/* Column cells */}
              {columnCells(folder.id, "folder")}
              {/* Actions */}
              <div
                className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:bg-muted rounded-lg">
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
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => deleteFolder.mutate(folder.id)}
                        >
                          <Trash2 className="w-4 h-4" /> Move to trash
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}

          {/* File rows */}
          {files.map((file) => (
            <div
              key={file.id}
              className="grid border-b border-border/60 last:border-b-0 hover:bg-secondary/30 transition-colors group cursor-pointer"
              style={{ gridTemplateColumns, height: "42px" }}
              onClick={() => openDetails({
                id: file.id,
                name: file.name,
                itemType: "file",
                mimeType: file.mimeType,
                size: file.size,
                createdAt: file.createdAt,
              })}
              onDoubleClick={() => setPreviewFile(file)}
            >
              {/* Icon */}
              <div className="flex items-center justify-center">
                <FileIcon mimeType={file.mimeType} className="w-4 h-4" />
              </div>
              {/* Name */}
              <div className="flex items-center px-4 min-w-0">
                <span className="text-sm truncate">{file.name}</span>
              </div>
              {/* Modified */}
              <div className="flex items-center px-4 text-sm text-muted-foreground">
                {formatDate(file.createdAt)}
              </div>
              {/* Modified By */}
              <div className="flex items-center px-4 text-sm text-muted-foreground">
                {file.userId === currentUser?.id ? "Me" : "—"}
              </div>
              {/* Column cells */}
              {columnCells(file.id, "file")}
              {/* Actions */}
              <div
                className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:bg-muted rounded-lg">
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
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => deleteFile.mutate(file.id)}
                        >
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

      {/* Grid view */}
      {!isEmpty && viewMode === "grid" && (
        <div className="space-y-6 mt-4">
          {subFolders.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {subFolders.map((folder) => (
                <div
                  key={folder.id}
                  className="group relative flex flex-col items-center gap-2 p-3 rounded-2xl border-[1.5px] border-border bg-white hover:border-primary/40 hover:shadow-md cursor-pointer transition-all select-none"
                  onClick={() => openDetails({
                    id: folder.id,
                    name: folder.name,
                    itemType: "folder",
                    createdAt: folder.createdAt,
                    ownerEmail: folder.ownerEmail,
                    isOwner: folder.isOwner,
                  })}
                  onDoubleClick={() => router.push(`/folder/${folder.id}`)}
                >
                  <Folder className="w-9 h-9 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-medium text-center truncate w-full">{folder.name}</span>
                  {libraryColumns.length > 0 && (
                    <div className="w-full space-y-1 mt-1">
                      {libraryColumns.slice(0, 2).map((col) => {
                        const val = batchValues[folder.id]?.[col.id];
                        return val ? (
                          <div key={col.id} className="flex items-center gap-1 text-[10px]">
                            <span className="text-muted-foreground truncate">{col.name}:</span>
                            <span className="font-medium truncate">{val}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {files.length > 0 && (
            <div className="rounded-2xl border-[1.5px] border-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary/30 border-b">
                  <tr>
                    <th className="w-8 px-4 py-2.5" />
                    <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5">Name</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5 hidden md:table-cell">Modified</th>
                    {libraryColumns.map((col) => (
                      <th key={col.id} className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5 hidden lg:table-cell">
                        {col.name}
                      </th>
                    ))}
                    <th className="w-10 px-3" />
                  </tr>
                </thead>
                <tbody>
                  {files.map((file, i) => (
                    <tr
                      key={file.id}
                      className={cn("group border-t hover:bg-secondary/20 cursor-pointer transition-colors", i === 0 && "border-t-0")}
                      onClick={() => openDetails({
                        id: file.id,
                        name: file.name,
                        itemType: "file",
                        mimeType: file.mimeType,
                        size: file.size,
                        createdAt: file.createdAt,
                      })}
                      onDoubleClick={() => setPreviewFile(file)}
                    >
                      <td className="px-4 py-2.5">
                        <FileIcon mimeType={file.mimeType} className="w-4 h-4" />
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-sm font-medium truncate max-w-[180px] block">{file.name}</span>
                      </td>
                      <td className="px-3 py-2.5 hidden md:table-cell text-sm text-muted-foreground">
                        {formatDate(file.createdAt)}
                      </td>
                      {libraryColumns.map((col) => (
                        <td
                          key={col.id}
                          className="px-3 py-2.5 hidden lg:table-cell text-sm text-muted-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {batchValues[file.id]?.[col.id] ?? "—"}
                        </td>
                      ))}
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:bg-muted rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => setPreviewFile(file)}>
                              <Eye className="w-4 h-4" /> Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadFile(file.id, file.name)}>
                              <Download className="w-4 h-4" /> Download
                            </DropdownMenuItem>
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

      {isLibraryOwner && libraryId && (
        <ManageColumnsDialog
          open={manageColumnsOpen}
          onOpenChange={setManageColumnsOpen}
          libraryId={libraryId}
          libraryName={breadcrumbs[0]?.name ?? "Library"}
        />
      )}

      <ItemDetailsPanel
        item={selectedItem}
        libraryId={libraryId}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
    </div>
  );
}
