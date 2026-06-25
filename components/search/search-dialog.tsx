"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { searchApi } from "@/lib/api";
import { Folder, File, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: Props) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => searchApi.search(debouncedQuery),
    enabled: debouncedQuery.length >= 1,
  });

  const handleFolderClick = (folderId: string) => {
    router.push(`/folder/${folderId}`);
    onOpenChange(false);
    setQuery("");
  };

  const totalResults = (data?.files?.length ?? 0) + (data?.folders?.length ?? 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-0">
          <DialogTitle className="sr-only">Search</DialogTitle>
        </DialogHeader>
        <div className="px-4 pb-3 pt-1 border-b">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search files and folders..."
              className="border-0 shadow-none focus-visible:ring-0 text-base px-0 h-9"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {isLoading && debouncedQuery && (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}

          {!isLoading && debouncedQuery && data && totalResults === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">
              No results for &ldquo;{debouncedQuery}&rdquo;
            </p>
          )}

          {data?.folders?.length > 0 && (
            <div className="p-2">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1">Folders</p>
              {data.folders.map((folder: any) => (
                <button
                  key={folder.id}
                  onClick={() => handleFolderClick(folder.id)}
                  className="flex items-center gap-3 w-full px-2 py-2 rounded-md hover:bg-muted text-sm text-left"
                >
                  <Folder className="w-4 h-4 text-yellow-500 shrink-0" />
                  <span className="truncate">{folder.name}</span>
                </button>
              ))}
            </div>
          )}

          {data?.files?.length > 0 && (
            <div className="p-2">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1">Files</p>
              {data.files.map((file: any) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 w-full px-2 py-2 rounded-md hover:bg-muted text-sm"
                >
                  <File className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="truncate flex-1">{file.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                </div>
              ))}
            </div>
          )}

          {!debouncedQuery && (
            <p className="text-center text-muted-foreground text-sm py-8">
              Type to search files and folders
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
