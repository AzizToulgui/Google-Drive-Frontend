"use client";

import { useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import {
  libraryColumnsApi,
  type LibraryColumn,
  type ColumnValueEntry,
  type CreateColumnPayload,
  type UpdateColumnPayload,
} from "@/lib/api";
import { toast } from "sonner";

export function useLibraryColumns(libraryId: string | null) {
  return useQuery<LibraryColumn[]>({
    queryKey: ["library-columns", libraryId],
    queryFn: () => libraryColumnsApi.getColumns(libraryId!),
    enabled: !!libraryId,
    staleTime: 60_000,
  });
}

export function useCreateColumn(libraryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateColumnPayload) =>
      libraryColumnsApi.createColumn(libraryId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library-columns", libraryId] });
      toast.success("Column created");
    },
    onError: () => toast.error("Failed to create column"),
  });
}

export function useUpdateColumn(libraryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ columnId, data }: { columnId: string; data: UpdateColumnPayload }) =>
      libraryColumnsApi.updateColumn(libraryId, columnId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library-columns", libraryId] });
      toast.success("Column updated");
    },
    onError: () => toast.error("Failed to update column"),
  });
}

export function useDeleteColumn(libraryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (columnId: string) =>
      libraryColumnsApi.deleteColumn(libraryId, columnId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library-columns", libraryId] });
      toast.success("Column deleted");
    },
    onError: () => toast.error("Failed to delete column"),
  });
}

export function useFolderColumnValues(folderId: string | null) {
  return useQuery({
    queryKey: ["column-values", "folder", folderId],
    queryFn: () => libraryColumnsApi.getFolderColumnValues(folderId!),
    enabled: !!folderId,
    staleTime: 30_000,
  });
}

export function useFileColumnValues(fileId: string | null) {
  return useQuery({
    queryKey: ["column-values", "file", fileId],
    queryFn: () => libraryColumnsApi.getFileColumnValues(fileId!),
    enabled: !!fileId,
    staleTime: 30_000,
  });
}

export function useSetColumnValue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      itemType,
      values,
    }: {
      itemId: string;
      itemType: "file" | "folder";
      values: ColumnValueEntry[];
    }) =>
      itemType === "folder"
        ? libraryColumnsApi.setFolderColumnValues(itemId, values)
        : libraryColumnsApi.setFileColumnValues(itemId, values),
    onSuccess: (_, { itemId, itemType }) => {
      qc.invalidateQueries({ queryKey: ["column-values", itemType, itemId] });
    },
    onError: () => toast.error("Failed to save value"),
  });
}

export function useSetFolderColumnValues(folderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: ColumnValueEntry[]) =>
      libraryColumnsApi.setFolderColumnValues(folderId, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["column-values", "folder", folderId] });
    },
    onError: () => toast.error("Failed to save value"),
  });
}

export function useSetFileColumnValues(fileId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: ColumnValueEntry[]) =>
      libraryColumnsApi.setFileColumnValues(fileId, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["column-values", "file", fileId] });
    },
    onError: () => toast.error("Failed to save value"),
  });
}

export function useBatchColumnValues(
  items: Array<{ id: string; type: "file" | "folder" }>,
  libraryId: string | null,
  columnCount: number = 0,
) {
  const queries = useQueries({
    queries: items.map((item) => ({
      queryKey: ["column-values", item.type, item.id],
      queryFn: () =>
        item.type === "folder"
          ? libraryColumnsApi.getFolderColumnValues(item.id)
          : libraryColumnsApi.getFileColumnValues(item.id),
      enabled: !!libraryId && columnCount > 0,
      staleTime: 60_000,
    })),
  });

  const byItem: Record<string, Record<string, string | null>> = {};
  for (let i = 0; i < items.length; i++) {
    const data = queries[i]?.data;
    if (data) byItem[items[i].id] = data.values;
  }
  return byItem;
}
