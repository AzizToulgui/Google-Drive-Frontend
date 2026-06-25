"use client";

import { useState, useEffect } from "react";
import { LayoutGrid, Search, Settings, HelpCircle, Bell, LogOut } from "lucide-react";
import { SearchDialog } from "@/components/search/search-dialog";
import { useLogout } from "@/hooks/use-auth";
import { getStoredUser, type AuthUser } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function avatarColor(email: string) {
  const colors = [
    "bg-violet-600", "bg-blue-600", "bg-emerald-600",
    "bg-rose-600", "bg-cyan-600", "bg-fuchsia-600", "bg-indigo-600",
  ];
  let h = 0;
  for (const c of email) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
}

export function TopBar() {
  const [searchOpen, setSearchOpen] = useState(false);
  // Defer localStorage read to after hydration to avoid SSR mismatch
  const [user, setUser] = useState<AuthUser | null>(null);
  const logout = useLogout();

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "··";
  const avatarBg = user?.email ? avatarColor(user.email) : "bg-muted";

  return (
    <>
      <header className="h-14 bg-background border-b border-border flex justify-between items-center px-4 shrink-0 z-50">
        {/* Brand */}
        <div className="flex items-center gap-3 w-60 shrink-0">
          <LayoutGrid className="w-6 h-6 text-primary shrink-0" />
          <span className="font-bold text-base text-primary tracking-tight">SharePoint Docs</span>
        </div>

        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2.5 flex-1 max-w-2xl mx-8 h-8 px-3 bg-muted border border-border rounded text-sm text-muted-foreground hover:bg-secondary transition-colors"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span>Search</span>
        </button>

        {/* Right icons */}
        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-muted rounded transition-colors text-muted-foreground" title="Settings">
            <Settings className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-muted rounded transition-colors text-muted-foreground" title="Help">
            <HelpCircle className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-muted rounded transition-colors text-muted-foreground" title="Notifications">
            <Bell className="w-5 h-5" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`ml-1 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs hover:opacity-90 transition-opacity ${avatarBg}`}
                suppressHydrationWarning
              >
                <span suppressHydrationWarning>{initials}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal py-2">
                <p className="text-xs text-muted-foreground">Signed in as</p>
                <p className="text-sm font-medium truncate mt-0.5" suppressHydrationWarning>
                  {user?.email ?? ""}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
