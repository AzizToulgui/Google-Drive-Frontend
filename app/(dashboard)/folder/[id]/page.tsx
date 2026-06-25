"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { foldersApi } from "@/lib/api";
import { FileGrid } from "@/components/files/file-grid";

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
}

function buildBreadcrumbs(folders: Folder[], targetId: string): { id: string | null; name: string }[] {
  const map = new Map(folders.map((f) => [f.id, f]));
  const crumbs: { id: string | null; name: string }[] = [];
  let current = map.get(targetId);

  while (current) {
    crumbs.unshift({ id: current.id, name: current.name });
    current = current.parentId ? map.get(current.parentId) : undefined;
  }

  return [{ id: null, name: "My Drive" }, ...crumbs];
}

export default function FolderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: allFolders = [] } = useQuery({
    queryKey: ["folders", "all-flat"],
    queryFn: async () => {
      const flatten = (nodes: any[]): any[] =>
        nodes.flatMap((n) => [n, ...flatten(n.children ?? [])]);
      return foldersApi.getTree().then(flatten);
    },
  });

  const { data: subFolders = [], isLoading: subLoading } = useQuery({
    queryKey: ["folders", id, "children"],
    queryFn: async () => {
      const flatten = (nodes: any[]): any[] =>
        nodes.flatMap((n) => [n, ...flatten(n.children ?? [])]);
      const all = await foldersApi.getTree().then(flatten);
      return all.filter((f: any) => f.parentId === id);
    },
    enabled: !!id,
  });

  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ["folders", id, "files"],
    queryFn: () => foldersApi.getFiles(id),
    enabled: !!id,
  });

  const breadcrumbs = buildBreadcrumbs(allFolders as Folder[], id);

  return (
    <FileGrid
      folders={subFolders}
      files={files}
      isLoading={subLoading || filesLoading}
      currentFolderId={id}
      breadcrumbs={breadcrumbs}
    />
  );
}
