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
          "relative flex items-center gap-3 mx-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all duration-150 rounded-xl",
          active
            ? "text-primary bg-primary/10"
            : "text-muted-foreground hover:bg-secondary/60",
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

  const { data: files = [] } = useQuery<FileItem[]>({
    queryKey: ["folders", folder.id, "files"],
    queryFn: () => foldersApi.getFiles(folder.id),
    enabled: expanded,
    staleTime: 30_000,
  });

  return (
    <div>
      <div
        className={cn(
          "relative flex items-center gap-1.5 py-1.5 cursor-pointer text-xs transition-colors select-none group rounded-lg mx-2",
          isActive
            ? "text-primary bg-primary/10 font-semibold"
            : "text-muted-foreground hover:bg-secondary/60",
        )}
        style={{ paddingLeft: `${indentPx}px`, paddingRight: "8px" }}
        onClick={() => router.push(`/folder/${folder.id}`)}
      >
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

      {expanded && (
        <>
          {folder.children.map((child) => (
            <FolderTreeItem key={child.id} folder={child} depth={depth + 1} />
          ))}

          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-1.5 py-1.5 cursor-pointer text-xs text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors select-none mx-2 rounded-lg"
              style={{ paddingLeft: `${indentPx + 20}px`, paddingRight: "8px" }}
              onClick={() => openPreview(file as PreviewFile)}
            >
              <FileIcon mimeType={file.mimeType} className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{file.name}</span>
            </div>
          ))}

          {folder.children.length === 0 && files.length === 0 && (
            <p
              className="text-[10px] text-muted-foreground/40 italic py-1"
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
      <aside className="w-60 h-full border-r border-sidebar-border bg-sidebar flex flex-col shrink-0 overflow-hidden">
        {/* New Library button */}
        <div className="px-4 pt-5 pb-3 shrink-0">
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-xs font-bold w-full hover:bg-primary/90 transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" />
            New Library
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col shrink-0 gap-0.5 px-0">
          <NavItem href="/library" icon={FolderOpen} label="My Files" active={pathname === "/library"} />
          <NavItem href="/trash" icon={Trash2} label="Recycle Bin" active={pathname === "/trash"} />
        </nav>

        {/* Libraries section */}
        <div className="mx-4 h-px bg-sidebar-border my-2 shrink-0" />
        <div className="px-4 py-1 shrink-0">
          <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em]">
            Libraries
          </span>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="pb-4">
            {(folderTree as FolderNode[]).map((folder) => (
              <FolderTreeItem key={folder.id} folder={folder} />
            ))}
            {(folderTree as FolderNode[]).length === 0 && (
              <p className="text-[11px] text-muted-foreground/40 px-4 py-2 italic">
                No libraries yet
              </p>
            )}
          </div>
        </ScrollArea>

        {/* Storage meter */}
        <div className="p-4 border-t border-sidebar-border shrink-0">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Storage</span>
            <span className="text-[10px] text-primary font-semibold">65%</span>
          </div>
          <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
            <div className="bg-primary w-[65%] h-full rounded-full" />
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
