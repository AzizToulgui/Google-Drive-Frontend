"use client";

import { useState } from "react";
import { X, Loader2, HardDrive, FolderPlus } from "lucide-react";
import { useCreateFolder } from "@/hooks/use-folders";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId: string | null;
  /** Dialog heading — defaults based on whether parentId is null (drive) or set (folder) */
  title?: string;
  /** Optional subtitle shown below the heading */
  description?: string;
}

export function CreateFolderDialog({ open, onOpenChange, parentId, title, description }: Props) {
  const [name, setName] = useState("");
  const create = useCreateFolder();

  const isDrive = parentId === null;
  const resolvedTitle = title ?? (isDrive ? "Create a drive" : "Create a folder");
  const resolvedDescription = description ?? (
    isDrive
      ? "A drive is your top-level workspace. Create one drive per project or team."
      : "A folder helps organise files within this drive."
  );
  const Icon = isDrive ? HardDrive : FolderPlus;
  const placeholder = isDrive ? "e.g. Marketing, Q4 Projects…" : "e.g. Reports, Assets…";
  const label = isDrive ? "Drive name" : "Folder name";
  const confirmLabel = isDrive ? "Create drive" : "Create folder";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate(
      { name: name.trim(), parentId: parentId ?? undefined },
      {
        onSuccess: () => {
          setName("");
          onOpenChange(false);
        },
      }
    );
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={(e) => { if (e.target === e.currentTarget) onOpenChange(false); }}
    >
      <div className="bg-white w-[420px] rounded border border-border shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-start border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">{resolvedTitle}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{resolvedDescription}</p>
            </div>
          </div>
          <button
            className="p-1 hover:bg-muted rounded-full text-muted-foreground transition-colors mt-0.5 shrink-0"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2" htmlFor="folderName">
              {label}
            </label>
            <input
              id="folderName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={placeholder}
              autoFocus
              className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary focus:border-2 transition-all"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 text-sm font-semibold text-primary hover:bg-muted transition-colors rounded"
              onClick={() => { setName(""); onOpenChange(false); }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || create.isPending}
              className="px-5 py-2 text-sm font-semibold bg-primary text-white rounded shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
            >
              {create.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
