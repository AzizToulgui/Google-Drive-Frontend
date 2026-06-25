"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Trash2,
  FolderOpen,
  Plus,
  ChevronRight,
  ChevronDown,
  Folder,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFolderTree } from "@/hooks/use-folders";
import { foldersApi } from "@/lib/api";
import { CreateFolderDialog } from "@/components/folders/create-folder-dialog";
import { FileIcon } from "@/components/files/file-icon";
import { useFilePreview, PreviewFile } from "@/components/files/file-preview-context";

interface FolderNode {
  id: string;
  name: string;
  children: FolderNode[];
  parentId: string | null;
}

interface FileItem {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}) {
  return (
    <Link href={href}>
      <div
        className={cn(
          "relative flex items-center gap-3 px-4 py-2 text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all duration-150",
          active
            ? "text-primary border-l-[3px] border-primary bg-white"
            : "text-muted-foreground hover:bg-muted ml-[3px]",
        )}
      >
        <Icon className={cn("w-4 h-4 shrink-0", active ? "text-primary" : "")} />
        {label}
      </div>
    </Link>
  );
}

function FolderTreeItem({ folder, depth = 0 }: { folder: FolderNode; depth?: number }) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { openPreview } = useFilePreview();
  const isActive = pathname === `/folder/${folder.id}`;
  const indentPx = 16 + depth * 14;

  // Fetch files only when the folder is expanded
  const { data: files = [] } = useQuery<FileItem[]>({
    queryKey: ["folders", folder.id, "files"],
    queryFn: () => foldersApi.getFiles(folder.id),
    enabled: expanded,
    staleTime: 30_000,
  });

  return (
    <div>
      {/* Folder row */}
      <div
        className={cn(
          "relative flex items-center gap-1.5 py-1.5 cursor-pointer text-xs transition-colors select-none group",
          isActive
            ? "text-primary bg-white font-semibold border-l-[3px] border-primary"
            : "text-muted-foreground hover:bg-muted ml-[3px]",
        )}
        style={{ paddingLeft: `${indentPx}px`, paddingRight: "8px" }}
        onClick={() => router.push(`/folder/${folder.id}`)}
      >
        {/* Expand toggle */}
        <button
          className="p-0.5 rounded hover:bg-muted-foreground/10 shrink-0"
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
        >
          {expanded
            ? <ChevronDown className="w-3 h-3" />
            : <ChevronRight className="w-3 h-3" />}
        </button>
        {expanded
          ? <FolderOpen className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-primary" : "text-amber-500")} />
          : <Folder className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-primary" : "text-amber-500")} />
        }
        <span className="truncate flex-1">{folder.name}</span>
      </div>

      {/* Children: sub-folders + files */}
      {expanded && (
        <>
          {folder.children.map((child) => (
            <FolderTreeItem key={child.id} folder={child} depth={depth + 1} />
          ))}

          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-1.5 py-1.5 cursor-pointer text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors select-none ml-[3px]"
              style={{ paddingLeft: `${indentPx + 20}px`, paddingRight: "8px" }}
              onClick={() => openPreview(file as PreviewFile)}
            >
              <FileIcon mimeType={file.mimeType} className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{file.name}</span>
            </div>
          ))}

          {folder.children.length === 0 && files.length === 0 && (
            <p
              className="text-[10px] text-muted-foreground/40 italic py-1 ml-[3px]"
              style={{ paddingLeft: `${indentPx + 20}px` }}
            >
              Empty
            </p>
          )}
        </>
      )}
    </div>
  );
}

export function Sidebar() {
  const { data: folderTree = [] } = useFolderTree();
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <aside className="w-60 h-full border-r border-border bg-sidebar flex flex-col shrink-0 overflow-hidden">
        {/* New Drive button */}
        <div className="px-4 pt-5 pb-3 shrink-0">
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded text-xs font-bold w-full hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Drive
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col shrink-0">
          <NavItem href="/drive" icon={FolderOpen} label="My Files" active={pathname === "/drive"} />
          <NavItem href="/trash" icon={Trash2} label="Recycle Bin" active={pathname === "/trash"} />
        </nav>

        {/* Drives section */}
        <div className="mx-4 h-px bg-border my-2 shrink-0" />
        <div className="px-4 py-1 shrink-0">
          <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
            Drives
          </span>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="pb-4">
            {(folderTree as FolderNode[]).map((folder) => (
              <FolderTreeItem key={folder.id} folder={folder} />
            ))}
            {(folderTree as FolderNode[]).length === 0 && (
              <p className="text-[11px] text-muted-foreground/40 px-4 py-2 italic">
                No drives yet
              </p>
            )}
          </div>
        </ScrollArea>

        {/* Storage meter */}
        <div className="p-4 border-t border-border shrink-0">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Storage</span>
            <span className="text-[10px] text-primary font-semibold">65%</span>
          </div>
          <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
            <div className="bg-primary w-[65%] h-full" />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">10.4 GB of 15 GB used</p>
        </div>
      </aside>

      <CreateFolderDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        parentId={null}
      />
    </>
  );
}
