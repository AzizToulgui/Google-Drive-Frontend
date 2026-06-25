"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Globe, Lock, UserPlus, X, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { folderVisibilityApi, usersApi } from "@/lib/api";

interface ShareEntry {
  id: string;
  sharedWithUserId: string;
  email: string;
}

interface PlatformUser {
  id: string;
  email: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
  folderName: string;
  currentVisibility: "public" | "private";
  currentUserId?: string;
}

export function VisibilityDialog({
  open,
  onOpenChange,
  folderId,
  folderName,
  currentVisibility,
  currentUserId,
}: Props) {
  const queryClient = useQueryClient();
  const [visibility, setVisibility] = useState<"public" | "private">(currentVisibility);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setVisibility(currentVisibility);
  }, [currentVisibility, open]);

  const { data: shares = [] } = useQuery<ShareEntry[]>({
    queryKey: ["folder-shares", folderId],
    queryFn: () => folderVisibilityApi.getShares(folderId),
    enabled: open,
  });

  const { data: allUsers = [] } = useQuery<PlatformUser[]>({
    queryKey: ["users"],
    queryFn: () => usersApi.getAll(),
    enabled: open && visibility === "private",
  });

  const setVisibilityMutation = useMutation({
    mutationFn: (v: "public" | "private") =>
      folderVisibilityApi.setVisibility(folderId, v),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["folder-shares", folderId] });
    },
    onError: () => toast.error("Failed to update visibility"),
  });

  const addSharesMutation = useMutation({
    mutationFn: (userIds: string[]) =>
      folderVisibilityApi.addShares(folderId, userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folder-shares", folderId] });
      setSelectedUserIds(new Set());
      toast.success("Access granted");
    },
    onError: () => toast.error("Failed to add users"),
  });

  const removeShareMutation = useMutation({
    mutationFn: (sharedUserId: string) =>
      folderVisibilityApi.removeShare(folderId, sharedUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folder-shares", folderId] });
      toast.success("Access removed");
    },
    onError: () => toast.error("Failed to remove user"),
  });

  const handleVisibilityChange = (v: "public" | "private") => {
    setVisibility(v);
    setVisibilityMutation.mutate(v);
  };

  const sharedUserIds = new Set(shares.map((s) => s.sharedWithUserId));
  const availableUsers = allUsers.filter(
    (u) => u.id !== currentUserId && !sharedUserIds.has(u.id)
  );

  const toggleSelect = (uid: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const handleAddSelected = () => {
    if (selectedUserIds.size === 0) return;
    addSharesMutation.mutate(Array.from(selectedUserIds));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="truncate">Visibility — {folderName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Visibility toggle */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleVisibilityChange("public")}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all text-sm font-medium",
                visibility === "public"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              <Globe className="w-6 h-6" />
              Public
              <span className="text-xs font-normal text-center text-muted-foreground">
                Anyone on the platform can view
              </span>
            </button>

            <button
              onClick={() => handleVisibilityChange("private")}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all text-sm font-medium",
                visibility === "private"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              <Lock className="w-6 h-6" />
              Private
              <span className="text-xs font-normal text-center text-muted-foreground">
                Only you and invited people
              </span>
            </button>
          </div>

          {/* Sharing UI — only when private */}
          {visibility === "private" && (
            <div className="space-y-3">
              {/* Who has access */}
              {shares.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Has access
                  </p>
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {shares.map((share) => (
                      <div
                        key={share.id}
                        className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"
                      >
                        <span className="truncate text-foreground">{share.email}</span>
                        <button
                          onClick={() => removeShareMutation.mutate(share.sharedWithUserId)}
                          className="ml-2 p-0.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add people */}
              {availableUsers.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Add people
                  </p>
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {availableUsers.map((user) => {
                      const selected = selectedUserIds.has(user.id);
                      return (
                        <button
                          key={user.id}
                          onClick={() => toggleSelect(user.id)}
                          className={cn(
                            "flex items-center justify-between w-full rounded-lg px-3 py-2 text-sm transition-colors",
                            selected
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted/50 text-foreground"
                          )}
                        >
                          <span className="truncate">{user.email}</span>
                          {selected && <Check className="w-3.5 h-3.5 shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>

                  {selectedUserIds.size > 0 && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={handleAddSelected}
                      disabled={addSharesMutation.isPending}
                    >
                      <UserPlus className="w-4 h-4 mr-1.5" />
                      Grant access to {selectedUserIds.size} user{selectedUserIds.size > 1 ? "s" : ""}
                    </Button>
                  )}
                </div>
              )}

              {availableUsers.length === 0 && shares.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No other users on the platform yet.
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
