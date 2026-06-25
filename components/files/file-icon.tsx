import {
  File, Image, FileText, Film, Music, Archive,
  FileSpreadsheet, FileCode, FileType
} from "lucide-react";
import { getFileIcon } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  mimeType: string;
  className?: string;
}

export function FileIcon({ mimeType, className }: Props) {
  const type = getFileIcon(mimeType);
  const base = cn("shrink-0", className);

  switch (type) {
    case "image": return <Image className={cn(base, "text-purple-500")} />;
    case "pdf": return <FileType className={cn(base, "text-red-500")} />;
    case "video": return <Film className={cn(base, "text-blue-500")} />;
    case "audio": return <Music className={cn(base, "text-pink-500")} />;
    case "spreadsheet": return <FileSpreadsheet className={cn(base, "text-green-500")} />;
    case "document": return <FileText className={cn(base, "text-blue-400")} />;
    case "archive": return <Archive className={cn(base, "text-orange-400")} />;
    case "text": return <FileCode className={cn(base, "text-gray-500")} />;
    default: return <File className={cn(base, "text-muted-foreground")} />;
  }
}
