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

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-bold text-foreground" suppressHydrationWarning>
        {'交叉销售 — 自动还款绑定"金"喜营销活动'}
      </h2>
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
