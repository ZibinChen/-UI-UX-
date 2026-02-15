"use client"

import { useState } from "react"
import { TabNavigation } from "../tab-navigation"
import { ActivityProgressPanel } from "../cross-sell/activity-progress-panel"
import { WeeklyPanel } from "../cross-sell/weekly-panel"

const subTabs = [
  { id: "progress", label: "活动开展情况" },
  { id: "weekly", label: "活动开展当周情况" },
]

interface CrossSellPanelProps {
  selectedInstitution: string
  selectedDate: string
}

export function CrossSellPanel({ selectedInstitution, selectedDate }: CrossSellPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState("progress")

  // Format selectedDate "2026/02/12" -> "2026年2月12日"
  const parts = selectedDate.split("/")
  const endDateLabel = parts.length === 3
    ? `${parts[0]}年${parseInt(parts[1])}月${parseInt(parts[2])}日`
    : selectedDate

  return (
    <div className="flex flex-col gap-6">
      {/* Sub-tab Navigation */}
      <TabNavigation
        tabs={subTabs}
        activeTab={activeSubTab}
        onTabChange={setActiveSubTab}
        variant="pill"
      />

      {/* Report Title */}
      <div className="bg-card rounded border border-border px-4 py-3" suppressHydrationWarning>
        <h2 className="text-base font-semibold text-foreground text-center" suppressHydrationWarning>
          {'交叉销售 — 自动还款绑定"金"喜营销活动'}
        </h2>
        <p className="text-xs text-muted-foreground text-center mt-1" suppressHydrationWarning>
          {`活动期间：2025年9月5日 - ${endDateLabel}`}
        </p>
      </div>

      {activeSubTab === "progress" && (
        <ActivityProgressPanel
          selectedInstitution={selectedInstitution}
          selectedDate={selectedDate}
        />
      )}

      {activeSubTab === "weekly" && (
        <WeeklyPanel selectedInstitution={selectedInstitution} />
      )}
    </div>
  )
}
