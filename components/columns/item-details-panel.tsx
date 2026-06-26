"use client";

import { useEffect, useState, useRef } from "react";
import { X, Folder, File as FileIcon2, Check, Loader2 } from "lucide-react";
import {
  useFolderColumnValues,
  useFileColumnValues,
  useSetFolderColumnValues,
  useSetFileColumnValues,
} from "@/hooks/use-library-columns";
import { formatBytes, formatDate } from "@/lib/utils";
import type { LibraryColumn } from "@/lib/api";
import { cn } from "@/lib/utils";

export interface DetailItem {
  id: string;
  name: string;
  itemType: "file" | "folder";
  mimeType?: string;
  size?: number;
  createdAt: string;
  ownerEmail?: string;
  isOwner?: boolean;
}

interface Props {
  item: DetailItem | null;
  libraryId: string | null;
  open: boolean;
  onClose: () => void;
}

function ColumnField({
  column,
  value,
  onSave,
}: {
  column: LibraryColumn;
  value: string | null;
  onSave: (v: string | null) => void;
}) {
  const [local, setLocal] = useState(value ?? "");
  const [saved, setSaved] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocal(value ?? "");
  }, [value]);

  const handleBlur = () => {
    const trimmed = local.trim();
    const finalVal = trimmed === "" ? null : trimmed;
    onSave(finalVal);
    setSaved(true);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => setSaved(false), 1500);
  };

  if (column.type === "enum") {
    return (
      <div className="relative">
        <select
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={handleBlur}
          className="w-full border-[1.5px] border-border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-primary transition-all bg-white appearance-none"
        >
          <option value="">—</option>
          {column.enumOptions?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {saved && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-500">
            <Check className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type={column.type === "integer" || column.type === "float" ? "number" : "text"}
        step={column.type === "float" ? "any" : column.type === "integer" ? "1" : undefined}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={handleBlur}
        placeholder={column.defaultValue ?? "—"}
        className="w-full border-[1.5px] border-border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-primary transition-all"
      />
      {saved && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-500">
          <Check className="w-3.5 h-3.5" />
        </span>
      )}
    </div>
  );
}

export function ItemDetailsPanel({ item, libraryId, open, onClose }: Props) {
  const isFolderItem = item?.itemType === "folder";

  const folderValues = useFolderColumnValues(isFolderItem && item ? item.id : null);
  const fileValues = useFileColumnValues(!isFolderItem && item ? item.id : null);
  const setFolderValues = useSetFolderColumnValues(item?.id ?? "");
  const setFileValues = useSetFileColumnValues(item?.id ?? "");

  const data = isFolderItem ? folderValues.data : fileValues.data;
  const columns: LibraryColumn[] = data?.columns ?? [];
  const values: Record<string, string | null> = data?.values ?? {};

  const handleSave = (columnId: string, value: string | null) => {
    const entry = [{ columnId, value }];
    if (isFolderItem) {
      setFolderValues.mutate(entry);
    } else {
      setFileValues.mutate(entry);
    }
  };

  return (
    <div
      className={cn(
        "fixed top-0 right-0 h-full w-80 bg-white border-l border-border shadow-2xl z-40 flex flex-col transition-transform duration-300",
        open ? "translate-x-0" : "translate-x-full",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
        <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center shrink-0">
          {item?.itemType === "folder" ? (
            <Folder className="w-4 h-4 text-amber-500 fill-amber-400" />
          ) : (
            <FileIcon2 className="w-4 h-4 text-primary" />
          )}
        </div>
        <span className="flex-1 text-sm font-semibold text-foreground truncate">
          {item?.name ?? "Details"}
        </span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-muted rounded-lg text-muted-foreground transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {item && (
          <>
            {/* Metadata */}
            <div className="px-5 py-4 space-y-3 border-b border-border">
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em]">Details</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Type</span>
                  <span className="text-xs font-medium text-foreground capitalize">{item.itemType}</span>
                </div>
                {item.size !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Size</span>
                    <span className="text-xs font-medium text-foreground">{formatBytes(item.size)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Created</span>
                  <span className="text-xs font-medium text-foreground">{formatDate(item.createdAt)}</span>
                </div>
                {item.ownerEmail && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Owner</span>
                    <span className="text-xs font-medium text-foreground truncate max-w-[140px]">
                      {item.isOwner ? "Me" : item.ownerEmail}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Column values */}
            {libraryId && columns.length > 0 && (
              <div className="px-5 py-4 space-y-4">
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em]">Properties</p>
                {columns.map((col) => (
                  <div key={col.id} className="space-y-1.5">
                    <label className="block text-xs font-semibold text-foreground">
                      {col.name}
                    </label>
                    <ColumnField
                      column={col}
                      value={values[col.id] ?? null}
                      onSave={(v) => handleSave(col.id, v)}
                    />
                  </div>
                ))}
              </div>
            )}

            {libraryId && columns.length === 0 && (
              <div className="px-5 py-4">
                <p className="text-xs text-muted-foreground italic">No columns defined for this library yet.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
