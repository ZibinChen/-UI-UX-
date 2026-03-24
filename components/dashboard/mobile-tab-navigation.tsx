"use client"

import { cn } from "@/lib/utils"
import { useRef, useEffect } from "react"

interface MobileTabNavigationProps {
  tabs: { id: string; label: string }[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export function MobileTabNavigation({
  tabs,
  activeTab,
  onTabChange,
}: MobileTabNavigationProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)

  // Auto-scroll to active tab
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current
      const button = activeRef.current
      const scrollLeft = button.offsetLeft - container.offsetWidth / 2 + button.offsetWidth / 2
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: "smooth" })
    }
  }, [activeTab])

  return (
    <div
      ref={scrollRef}
      className="flex overflow-x-auto bg-card border-b border-border shrink-0 scrollbar-hide"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div className="flex px-2 min-w-max">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              ref={isActive ? activeRef : null}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "px-3 py-2.5 text-xs font-medium transition-colors relative whitespace-nowrap",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
