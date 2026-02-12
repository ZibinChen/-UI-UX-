"use client"

import { Menu, Bell, User } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  onToggleSidebar: () => void
}

export function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        {/* Bank Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">{'B'}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-9 w-9"
          aria-label="切换侧边栏"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-foreground">管理员</span>
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative" aria-label="消息">
          <Bell className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>
    </header>
  )
}
