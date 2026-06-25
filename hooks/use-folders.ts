"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { foldersApi } from "@/lib/api";
import { toast } from "sonner";

export function useFolderTree() {
  return useQuery({
    queryKey: ["folders", "tree"],
    queryFn: foldersApi.getTree,
    staleTime: 30 * 1000,
  });
}

export function useFolderFiles(folderId: string | null) {
  return useQuery({
    queryKey: ["folders", folderId, "files"],
    queryFn: () => (folderId ? foldersApi.getFiles(folderId) : Promise.resolve([])),
    enabled: !!folderId,
  });
}


export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: foldersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      toast.success("Folder created");
    },
    onError: () => toast.error("Failed to create folder"),
  });
}

export function useRenameFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      foldersApi.rename(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      toast.success("Folder renamed");
    },
    onError: () => toast.error("Failed to rename folder"),
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: foldersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      toast.success("Folder moved to trash");
    },
    onError: () => toast.error("Failed to delete folder"),
  });
}

export function useRestoreFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: foldersApi.restore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      toast.success("Folder restored");
    },
    onError: () => toast.error("Failed to restore folder"),
  });
}

export function usePermanentDeleteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: foldersApi.permanentDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      toast.success("Folder permanently deleted");
    },
    onError: () => toast.error("Failed to delete folder"),
  });
}

export function useTrashFolders() {
  return useQuery({
    queryKey: ["folders", "trash"],
    queryFn: foldersApi.getTrash,
  });
}
