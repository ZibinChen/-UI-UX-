"use client"

import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  BarChart3,
  Users,
  TrendingUp,
  Settings,
} from "lucide-react"

interface MobileBottomNavProps {
  activeItem: string
  onItemClick: (item: string) => void
}

const navItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "驾驶舱" },
  { id: "assets", icon: BarChart3, label: "资产" },
  { id: "customers", icon: Users, label: "客户" },
  { id: "performance", icon: TrendingUp, label: "效益" },
  { id: "settings", icon: Settings, label: "设置" },
]

export function MobileBottomNav({ activeItem, onItemClick }: MobileBottomNavProps) {
  return (
    <nav className="h-14 bg-card border-t border-border flex items-center shrink-0">
      {navItems.map((item) => {
        const isActive = activeItem === item.id
        return (
          <button
            key={item.id}
            onClick={() => onItemClick(item.id)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
