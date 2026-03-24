"use client"

import { Bell } from "lucide-react"

export function MobileHeader() {
  return (
    <header className="h-11 bg-card flex items-center justify-between px-4 shrink-0 border-b border-border">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-[10px] font-bold">{'B'}</span>
        </div>
        <span className="text-sm font-semibold text-foreground">{'管理驾驶舱'}</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">{'管理员'}</span>
        <button className="relative" aria-label="消息">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
        </button>
      </div>
    </header>
  )
}
