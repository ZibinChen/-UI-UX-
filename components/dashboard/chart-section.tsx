"use client"

import { TabNavigation } from "./tab-navigation"

interface ChartSectionProps {
  title?: string
  tabs?: { id: string; label: string }[]
  activeTab?: string
  onTabChange?: (tabId: string) => void
  children: React.ReactNode
  rightContent?: React.ReactNode
}

export function ChartSection({
  tabs,
  activeTab,
  onTabChange,
  children,
  rightContent,
}: ChartSectionProps) {
  return (
    <div className="border-t border-border pt-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        {tabs && activeTab && onTabChange && (
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
            variant="pill"
          />
        )}
        {rightContent && <div className="text-sm text-muted-foreground">{rightContent}</div>}
      </div>
      <div className="w-full">{children}</div>
    </div>
  )
}
