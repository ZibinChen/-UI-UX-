"use client"

import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  BarChart3,
  Users,
  FileText,
  Settings,
  TrendingUp,
  Building2,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SidebarProps {
  collapsed: boolean
  activeItem?: string
  onItemClick?: (item: string) => void
}

const navItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "驾驶舱" },
  { id: "assets", icon: BarChart3, label: "资产负债" },
  { id: "customers", icon: Users, label: "客户基础" },
  { id: "performance", icon: TrendingUp, label: "经营效益" },
  { id: "quality", icon: FileText, label: "资产质量" },
  { id: "institution", icon: Building2, label: "机构管理" },
  { id: "settings", icon: Settings, label: "系统设置" },
]

export function Sidebar({ collapsed, activeItem = "assets", onItemClick }: SidebarProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "border-r border-border bg-card flex flex-col shrink-0 transition-all duration-200",
          collapsed ? "w-14" : "w-48"
        )}
      >
        <nav className="flex-1 py-4">
          <ul className="flex flex-col gap-1 px-2">
            {navItems.map((item) => {
              const isActive = activeItem === item.id
              return (
                <li key={item.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onItemClick?.(item.id)}
                        className={cn(
                          "flex items-center gap-3 w-full rounded-sm px-2 py-2.5 text-sm transition-colors min-h-[44px]",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </button>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right" className="bg-foreground text-background">
                        {item.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>
    </TooltipProvider>
  )
}
