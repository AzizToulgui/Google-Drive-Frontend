"use client";

import { useState, useEffect } from "react";
import { X, Plus, Loader2, Type, Hash, Percent, ListChecks, CheckCircle2, ChevronLeft } from "lucide-react";
import { useCreateColumn, useUpdateColumn } from "@/hooks/use-library-columns";
import type { LibraryColumn, ColumnType } from "@/lib/api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  libraryId: string;
  editingColumn?: LibraryColumn;
}

interface FormState {
  name: string;
  type: ColumnType;
  enumOptions: string[];
  newEnumOption: string;
  defaultValue: string;
}

const TYPES: {
  value: ColumnType;
  label: string;
  description: string;
  icon: React.ElementType;
  iconClass: string;
  badgeClass: string;
}[] = [
  {
    value: "text",
    label: "Text",
    description: "Free-form text and notes",
    icon: Type,
    iconClass: "text-blue-500 bg-blue-50 border-blue-200",
    badgeClass: "text-blue-600 bg-blue-50",
  },
  {
    value: "integer",
    label: "Integer",
    description: "Whole numbers only",
    icon: Hash,
    iconClass: "text-violet-500 bg-violet-50 border-violet-200",
    badgeClass: "text-violet-600 bg-violet-50",
  },
  {
    value: "float",
    label: "Decimal",
    description: "Numbers with decimals",
    icon: Percent,
    iconClass: "text-emerald-500 bg-emerald-50 border-emerald-200",
    badgeClass: "text-emerald-600 bg-emerald-50",
  },
  {
    value: "enum",
    label: "Choice",
    description: "Select from a fixed list",
    icon: ListChecks,
    iconClass: "text-amber-500 bg-amber-50 border-amber-200",
    badgeClass: "text-amber-600 bg-amber-50",
  },
];

export function CreateColumnDialog({ open, onOpenChange, libraryId, editingColumn }: Props) {
  const createColumn = useCreateColumn(libraryId);
  const updateColumn = useUpdateColumn(libraryId);

  const [step, setStep] = useState<"type" | "config">("type");
  const [form, setForm] = useState<FormState>({
    name: "",
    type: "text",
    enumOptions: [],
    newEnumOption: "",
    defaultValue: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({
        name: editingColumn?.name ?? "",
        type: editingColumn?.type ?? "text",
        enumOptions: editingColumn?.enumOptions ?? [],
        newEnumOption: "",
        defaultValue: editingColumn?.defaultValue ?? "",
      });
      setError("");
      setStep(editingColumn ? "config" : "type");
    }
  }, [open, editingColumn]);

  const addEnumOption = () => {
    const opt = form.newEnumOption.trim();
    if (!opt || form.enumOptions.includes(opt)) return;
    setForm((f) => ({ ...f, enumOptions: [...f.enumOptions, opt], newEnumOption: "" }));
  };

  const removeEnumOption = (opt: string) => {
    setForm((f) => ({
      ...f,
      enumOptions: f.enumOptions.filter((o) => o !== opt),
      defaultValue: f.defaultValue === opt ? "" : f.defaultValue,
    }));
  };

  const validate = (): boolean => {
    if (!form.name.trim()) {
      setError("Column name is required");
      return false;
    }
    if (form.type === "enum" && form.enumOptions.length === 0) {
      setError("Add at least one option for a Choice column");
      return false;
    }
    if (form.defaultValue.trim()) {
      if (form.type === "integer" && !/^-?\d+$/.test(form.defaultValue.trim())) {
        setError("Default value must be a whole number");
        return false;
      }
      if (form.type === "float" && isNaN(Number(form.defaultValue.trim()))) {
        setError("Default value must be a valid number");
        return false;
      }
      if (form.type === "enum" && !form.enumOptions.includes(form.defaultValue)) {
        setError("Default value must be one of the options above");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      type: form.type,
      enumOptions: form.type === "enum" ? form.enumOptions : undefined,
      defaultValue: form.defaultValue.trim() || undefined,
    };

    if (editingColumn) {
      updateColumn.mutate({ columnId: editingColumn.id, data: payload }, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      createColumn.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  if (!open) return null;

  const isPending = createColumn.isPending || updateColumn.isPending;
  const selectedType = TYPES.find((t) => t.value === form.type)!;
  const TypeIcon = selectedType.icon;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div className="bg-white w-[480px] rounded-2xl shadow-2xl border border-border/40 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground leading-tight">
              {editingColumn
                ? "Edit column"
                : step === "type"
                ? "Choose column type"
                : `New ${selectedType.label} column`}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {step === "type"
                ? "What kind of data will this column store?"
                : "Name your column and set optional defaults"}
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground transition-colors ml-4 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Step 1: Type selection ── */}
        {step === "type" && (
          <div className="px-6 pb-6">
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map((t) => {
                const Icon = t.icon;
                const isSelected = form.type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: t.value, defaultValue: "" }))}
                    className={`flex items-start gap-3 p-4 rounded-xl border-[1.5px] text-left transition-all hover:shadow-sm ${
                      isSelected
                        ? "border-primary bg-accent/60 shadow-sm"
                        : "border-border hover:border-primary/30 hover:bg-secondary/20"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${t.iconClass}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-sm font-semibold leading-tight ${
                            isSelected ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {t.label}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                        {t.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end mt-5">
              <button
                type="button"
                onClick={() => setStep("config")}
                className="px-5 py-2.5 text-sm font-semibold bg-primary text-white rounded-xl shadow-sm hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                Continue <span aria-hidden>→</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Configuration ── */}
        {step === "config" && (
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
            {/* Type indicator + back */}
            {!editingColumn && (
              <div className="flex items-center gap-2 -mt-1">
                <button
                  type="button"
                  onClick={() => { setStep("type"); setError(""); }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Change type
                </button>
                <div
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold ${selectedType.badgeClass}`}
                >
                  <TypeIcon className="w-3 h-3" />
                  {selectedType.label}
                </div>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                Column name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={
                  form.type === "text"
                    ? "e.g. Status, Notes, Description…"
                    : form.type === "integer"
                    ? "e.g. Count, Version, Score…"
                    : form.type === "float"
                    ? "e.g. Price, Rating, Weight…"
                    : "e.g. Stage, Category, Priority…"
                }
                autoFocus
                className="w-full border-[1.5px] border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/60"
              />
            </div>

            {/* Enum options */}
            {form.type === "enum" && (
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Options <span className="text-destructive">*</span>
                </label>

                {form.enumOptions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2.5 p-2.5 bg-secondary/30 rounded-xl border border-border/60">
                    {form.enumOptions.map((opt) => (
                      <div
                        key={opt}
                        className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-white border border-border rounded-full text-xs font-medium shadow-sm"
                      >
                        <span className="text-foreground">{opt}</span>
                        <button
                          type="button"
                          onClick={() => removeEnumOption(opt)}
                          className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.newEnumOption}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, newEnumOption: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addEnumOption();
                      }
                    }}
                    placeholder="Type an option and press Enter…"
                    className="flex-1 border-[1.5px] border-border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/60"
                  />
                  <button
                    type="button"
                    onClick={addEnumOption}
                    className="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-xl transition-colors flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 text-secondary-foreground" />
                  </button>
                </div>
              </div>
            )}

            {/* Default value */}
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                Default value{" "}
                <span className="text-[11px] font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              {form.type === "enum" ? (
                <select
                  value={form.defaultValue}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, defaultValue: e.target.value }))
                  }
                  disabled={form.enumOptions.length === 0}
                  className="w-full border-[1.5px] border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">None</option>
                  {form.enumOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={
                    form.type === "integer" || form.type === "float"
                      ? "number"
                      : "text"
                  }
                  step={
                    form.type === "float"
                      ? "any"
                      : form.type === "integer"
                      ? "1"
                      : undefined
                  }
                  value={form.defaultValue}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, defaultValue: e.target.value }))
                  }
                  placeholder={
                    form.type === "integer"
                      ? "e.g. 0"
                      : form.type === "float"
                      ? "e.g. 0.00"
                      : "e.g. Draft"
                  }
                  className="w-full border-[1.5px] border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/60"
                />
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="px-3.5 py-2.5 bg-destructive/5 border border-destructive/20 rounded-xl">
                <p className="text-xs font-medium text-destructive">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2.5 text-sm font-semibold bg-primary text-white rounded-xl shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editingColumn ? "Save changes" : "Create column"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
