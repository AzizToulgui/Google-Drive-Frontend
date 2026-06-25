"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { filesApi } from "@/lib/api";
import { toast } from "sonner";

export function useUploadFiles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: filesApi.upload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("Files uploaded successfully");
    },
    onError: () => toast.error("Upload failed"),
  });
}

export function useRenameFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      filesApi.rename(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("File renamed");
    },
    onError: () => toast.error("Failed to rename file"),
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: filesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("File moved to trash");
    },
    onError: () => toast.error("Failed to delete file"),
  });
}

export function useRestoreFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: filesApi.restore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("File restored");
    },
    onError: () => toast.error("Failed to restore file"),
  });
}

export function usePermanentDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: filesApi.permanentDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("File permanently deleted");
    },
    onError: () => toast.error("Failed to delete file"),
  });
}

export function useTrashFiles() {
  return useQuery({
    queryKey: ["files", "trash"],
    queryFn: filesApi.getTrash,
  });
}
