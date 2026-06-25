"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileX } from "lucide-react";
import { isPreviewable } from "@/lib/utils";
import { downloadFile, getPreviewUrl } from "@/lib/download";

interface FileRecord {
  id: string;
  name: string;
  mimeType: string;
  size: number;
}

interface Props {
  file: FileRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FilePreviewModal({ file, open, onOpenChange }: Props) {
  if (!file) return null;

  const canPreview = isPreviewable(file.mimeType);
  const previewUrl = getPreviewUrl(file.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-base font-medium truncate pr-4">
            {file.name}
          </DialogTitle>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 mr-4.5"
            onClick={() => downloadFile(file.id, file.name)}
          >
            <Download className="w-4 h-4 mr-1.5" />
            Download
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-auto min-h-0 bg-muted/30">
          {!canPreview && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
              <FileX className="w-12 h-12" />
              <p className="text-sm">
                Preview not supported for this file type
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadFile(file.id, file.name)}
              >
                <Download className="w-4 h-4 mr-1.5" />
                Download to view
              </Button>
            </div>
          )}

          {canPreview && file.mimeType.startsWith("image/") && (
            <div className="flex items-center justify-center p-6 min-h-64">
              <img
                src={previewUrl}
                alt={file.name}
                className="max-w-full max-h-[70vh] object-contain rounded-md shadow-md"
              />
            </div>
          )}

          {canPreview && file.mimeType === "application/pdf" && (
            <iframe
              src={previewUrl}
              className="w-full h-[70vh]"
              title={file.name}
            />
          )}

          {canPreview && file.mimeType.startsWith("text/") && (
            <TextPreview fileId={file.id} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TextPreview({ fileId }: { fileId: string }) {
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`/api/files/${fileId}/preview`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.text())
      .then(setContent)
      .catch(() => setContent("Failed to load preview"));
  }, [fileId]);

  return (
    <pre className="p-6 text-sm font-mono whitespace-pre-wrap text-foreground leading-relaxed">
      {content || "Loading..."}
    </pre>
  );
}
