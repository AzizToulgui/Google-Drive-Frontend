"use client";

import { useQuery } from "@tanstack/react-query";
import { api, foldersApi } from "@/lib/api";
import { FileGrid } from "@/components/files/file-grid";

export default function DrivePage() {
  const { data: allFolders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ["folders", "tree"],
    queryFn: foldersApi.getTree,
  });

  const rootFolders = (allFolders as any[]).filter((f: any) => f.parentId === null);

  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ["files", "root"],
    queryFn: () => api.get("/files/root").then((r) => r.data),
  });

  return (
    <FileGrid
      folders={rootFolders}
      files={files}
      isLoading={foldersLoading || filesLoading}
      currentFolderId={null}
      breadcrumbs={[{ id: null, name: "My Drive" }]}
    />
  );
}
