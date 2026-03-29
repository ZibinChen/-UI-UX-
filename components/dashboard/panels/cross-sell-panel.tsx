"use client"

import { useState } from "react"
import { TabNavigation } from "../tab-navigation"
import { ActivityProgressPanel } from "../cross-sell/activity-progress-panel"
import { WeeklyPanel } from "../cross-sell/weekly-panel"

const subTabs = [
  { id: "progress", label: "累计情况" },
  { id: "weekly", label: "当周情况" },
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
    <div className="flex flex-col gap-2">
      {/* Report Title */}
      <div className="bg-card rounded border border-border px-2 py-1.5" suppressHydrationWarning>
        <h2 className="text-[10px] font-semibold text-foreground text-center" suppressHydrationWarning>
          交叉销售 - 自动还款绑定
        </h2>
        <p className="text-[9px] text-muted-foreground text-center mt-0.5" suppressHydrationWarning>
          {`活动期间：2025年9月5日 - ${endDateLabel}`}
        </p>
      </div>

      {/* Sub-tab Navigation */}
      <TabNavigation
        tabs={subTabs}
        activeTab={activeSubTab}
        onTabChange={setActiveSubTab}
        variant="pill"
      />

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
