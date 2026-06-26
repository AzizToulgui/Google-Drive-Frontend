"use client";

import { useState } from "react";
import {
  X,
  Pencil,
  Trash2,
  Plus,
  SlidersHorizontal,
  Type,
  Hash,
  Percent,
  ListChecks,
  GripVertical,
  AlertTriangle,
} from "lucide-react";
import { useLibraryColumns, useDeleteColumn } from "@/hooks/use-library-columns";
import type { LibraryColumn } from "@/lib/api";
import { CreateColumnDialog } from "./create-column-dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  libraryId: string;
  libraryName: string;
}

const TYPE_CONFIG = {
  text:    { label: "Text",    icon: Type,       iconClass: "text-blue-500 bg-blue-50",    badgeClass: "text-blue-600 bg-blue-50 border-blue-100" },
  integer: { label: "Integer", icon: Hash,       iconClass: "text-violet-500 bg-violet-50", badgeClass: "text-violet-600 bg-violet-50 border-violet-100" },
  float:   { label: "Decimal", icon: Percent,    iconClass: "text-emerald-500 bg-emerald-50", badgeClass: "text-emerald-600 bg-emerald-50 border-emerald-100" },
  enum:    { label: "Choice",  icon: ListChecks, iconClass: "text-amber-500 bg-amber-50",  badgeClass: "text-amber-600 bg-amber-50 border-amber-100" },
} as const;

export function ManageColumnsDialog({
  open,
  onOpenChange,
  libraryId,
  libraryName,
}: Props) {
  const { data: columns = [], isLoading } = useLibraryColumns(open ? libraryId : null);
  const deleteColumn = useDeleteColumn(libraryId);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<LibraryColumn | undefined>();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!open) return null;

  const handleDelete = (columnId: string) => {
    deleteColumn.mutate(columnId, {
      onSuccess: () => setConfirmDeleteId(null),
    });
  };

  const openCreate = () => {
    setEditingColumn(undefined);
    setCreateOpen(true);
  };

  const openEdit = (col: LibraryColumn) => {
    setEditingColumn(col);
    setCreateOpen(true);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) onOpenChange(false);
        }}
      >
        <div className="bg-white w-[520px] rounded-2xl shadow-2xl border border-border/40 max-h-[82vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 flex items-start justify-between border-b border-border/60 shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Column Properties</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <span className="font-medium text-foreground/70">{libraryName}</span>
                  {" · "}
                  {columns.length} {columns.length === 1 ? "column" : "columns"} defined
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-14">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : columns.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-14 text-center px-8">
                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                  <SlidersHorizontal className="w-7 h-7 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-bold text-foreground">No columns defined</p>
                <p className="text-xs text-muted-foreground mt-1.5 max-w-[240px] leading-relaxed">
                  Columns let you track custom metadata on every file and folder inside this library.
                </p>
                <button
                  onClick={openCreate}
                  className="mt-5 flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold bg-primary text-white rounded-xl shadow-sm hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" /> Add your first column
                </button>
              </div>
            ) : (
              /* Column list */
              <div className="p-3 space-y-0.5">
                {columns.map((col) => {
                  const cfg = TYPE_CONFIG[col.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.text;
                  const Icon = cfg.icon;
                  const isConfirming = confirmDeleteId === col.id;

                  return (
                    <div
                      key={col.id}
                      className={`rounded-xl transition-colors group ${
                        isConfirming ? "bg-destructive/5" : "hover:bg-secondary/30"
                      }`}
                    >
                      {isConfirming ? (
                        /* Delete confirmation row */
                        <div className="flex items-center gap-3 px-4 py-3.5">
                          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">
                              Delete &ldquo;{col.name}&rdquo;?
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              All saved values for this column will be permanently removed.
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDelete(col.id)}
                              disabled={deleteColumn.isPending}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-destructive hover:opacity-90 rounded-lg transition-opacity disabled:opacity-60"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Normal column row */
                        <div className="flex items-center gap-3 px-3 py-3">
                          <GripVertical className="w-4 h-4 text-muted-foreground/25 shrink-0 cursor-grab" />

                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.iconClass}`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-foreground truncate">
                                {col.name}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${cfg.badgeClass}`}
                              >
                                {cfg.label}
                              </span>
                            </div>
                            {(col.defaultValue ||
                              (col.enumOptions && col.enumOptions.length > 0)) && (
                              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                {col.enumOptions && col.enumOptions.length > 0 && (
                                  <span>{col.enumOptions.join(" · ")}</span>
                                )}
                                {col.defaultValue && (
                                  <span>
                                    {col.enumOptions && col.enumOptions.length > 0
                                      ? "  ·  "
                                      : ""}
                                    Default: {col.defaultValue}
                                  </span>
                                )}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEdit(col)}
                              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                              title="Edit column"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(col.id)}
                              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                              title="Delete column"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer — only shown when there are columns */}
          {!isLoading && columns.length > 0 && (
            <div className="px-4 py-3.5 border-t border-border/60 bg-secondary/10 shrink-0">
              <button
                onClick={openCreate}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 rounded-xl border-[1.5px] border-dashed border-primary/30 hover:border-primary/50 transition-all"
              >
                <Plus className="w-4 h-4" /> Add column
              </button>
            </div>
          )}
        </div>
      </div>

      <CreateColumnDialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) setEditingColumn(undefined);
        }}
        libraryId={libraryId}
        editingColumn={editingColumn}
      />
    </>
  );
}
