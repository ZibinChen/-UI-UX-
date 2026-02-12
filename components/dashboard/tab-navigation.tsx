"use client"

import { cn } from "@/lib/utils"

interface TabNavigationProps {
  tabs: { id: string; label: string }[]
  activeTab: string
  onTabChange: (tabId: string) => void
  variant?: "underline" | "pill"
}

export function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  variant = "underline",
}: TabNavigationProps) {
  if (variant === "pill") {
    return (
      <div className="flex items-center gap-0 flex-wrap">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "px-4 py-1.5 text-sm font-medium transition-colors min-h-[36px] border",
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-muted"
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-6 border-b border-border">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "px-1 py-3 text-sm font-medium transition-colors relative min-h-[44px]",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        )
      })}
    </div>
  )
}
