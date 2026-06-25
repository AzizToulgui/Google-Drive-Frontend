"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  HardDrive,
  FolderPlus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  LogOut,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useFolderTree } from "@/hooks/use-folders";
import { useLogout } from "@/hooks/use-auth";
import { CreateFolderDialog } from "@/components/folders/create-folder-dialog";
import { SearchDialog } from "@/components/search/search-dialog";
import { FileIcon } from "@/components/files/file-icon";
import { foldersApi } from "@/lib/api";

interface FolderNode {
  id: string;
  name: string;
  children: FolderNode[];
  parentId: string | null;
}

interface FileRecord {
  id: string;
  name: string;
  mimeType: string;
}

function FolderTreeItem({
  folder,
  depth = 0,
}: {
  folder: FolderNode;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isActive = pathname === `/folder/${folder.id}`;

  const { data: files = [] } = useQuery<FileRecord[]>({
    queryKey: ["folders", folder.id, "files"],
    queryFn: () => foldersApi.getFiles(folder.id),
    enabled: expanded,
    staleTime: 30 * 1000,
  });

  const showChevron = true;
  const indentPx = 8 + depth * 14;

  return (
    <div>
      {/* Folder row */}
      <div
        className={cn(
          "flex items-center gap-1 py-1 rounded-md cursor-pointer group text-sm transition-colors select-none",
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "hover:bg-muted text-muted-foreground hover:text-foreground",
        )}
        style={{ paddingLeft: `${indentPx}px`, paddingRight: "6px" }}
        onClick={() => router.push(`/folder/${folder.id}`)}
      >
        {/* Expand toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className="p-0.5 rounded hover:bg-muted-foreground/20 transition-colors shrink-0"
        >
          {expanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight
              className={cn(
                "w-3 h-3",
                !showChevron && "opacity-0 pointer-events-none",
              )}
            />
          )}
        </button>

        {expanded ? (
          <FolderOpen className="w-4 h-4 shrink-0 text-yellow-500" />
        ) : (
          <Folder className="w-4 h-4 shrink-0 text-yellow-500" />
        )}
        <span className="truncate flex-1 text-xs">{folder.name}</span>
      </div>

      {/* Children: subfolders + files */}
      {expanded && (
        <div>
          {folder.children.map((child) => (
            <FolderTreeItem key={child.id} folder={child} depth={depth + 1} />
          ))}

          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-1.5 py-1 rounded-md text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-default select-none"
              style={{ paddingLeft: `${indentPx + 22}px`, paddingRight: "6px" }}
              title={file.name}
            >
              <FileIcon
                mimeType={file.mimeType}
                className="w-3.5 h-3.5 shrink-0"
              />
              <span className="truncate">{file.name}</span>
            </div>
          ))}

          {files.length === 0 && folder.children.length === 0 && (
            <div
              className="text-xs text-muted-foreground/50 py-1 italic"
              style={{ paddingLeft: `${indentPx + 22}px` }}
            >
              Empty
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { data: folderTree = [] } = useFolderTree();
  const logout = useLogout();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col h-full w-64 border-r bg-sidebar">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <HardDrive className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground text-lg">CloudDrive</span>
        </div>

        {/* Actions */}
        <div className="p-3 space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="w-4 h-4" />
            Search folders...
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={() => setCreateFolderOpen(true)}
          >
            <FolderPlus className="w-4 h-4" />
            New folder
          </Button>
        </div>

        <Separator />

        {/* My Drive nav */}
        <div className="px-3 py-2">
          <Link href="/drive">
            <div
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer transition-colors",
                pathname === "/drive"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <HardDrive className="w-4 h-4" />
              My Drive
            </div>
          </Link>
        </div>

        <Separator />

        {/* Folder tree */}
        <ScrollArea className="flex-1 px-3 py-2">
          <div className="space-y-0.5">
            {(folderTree as FolderNode[]).map((folder) => (
              <FolderTreeItem key={folder.id} folder={folder} />
            ))}
            {folderTree.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-2">
                No folders yet
              </p>
            )}
          </div>
        </ScrollArea>

        <Separator />

        {/* Bottom */}
        <div className="p-3 space-y-1">
          <Link href="/trash">
            <div
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer transition-colors",
                pathname === "/trash"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Trash2 className="w-4 h-4" />
              Trash
            </div>
          </Link>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        parentId={null}
      />
    </>
  );
}
