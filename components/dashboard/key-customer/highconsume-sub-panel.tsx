"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { DetailPanel } from "../credit-card/detail-panel"
import { generateKeyCustomerIndicators } from "@/lib/credit-card-data"

interface Props {
  selectedInstitution: string
  selectedDate: string
  sectionTitle: string
}

// Tab 0: Overview showing total + 3 L1 children
const overviewTab = {
  id: "overview",
  label: "信用卡中高消费客户数",
  kpis: [
    { id: "kc_hc_total",     label: "信用卡中高消费客户数" },
    { id: "kc_hc_downgrade", label: "中高消费降级客户",  parentId: "kc_hc_total" },
    { id: "kc_hc_maintain",  label: "中高消费维持客户",  parentId: "kc_hc_total" },
    { id: "kc_hc_upgrade",   label: "中高消费升级客户",  parentId: "kc_hc_total" },
  ],
}

// Tab 1-3: Drill-down into each L1 with its L2 children
const drillTabs = [
  {
    id: "kc_hc_downgrade",
    label: "中高消费降级客户",
    kpis: [
      { id: "kc_hc_downgrade", label: "中高消费降级客户" },
      { id: "kc_hc_lost",      label: "中高消费流失客户",           parentId: "kc_hc_downgrade" },
      { id: "kc_hc_blocked",   label: "用卡受阻-销户客户",          parentId: "kc_hc_downgrade" },
      { id: "kc_hc_inactive",  label: "用卡受阻-到期换卡未激活客户", parentId: "kc_hc_downgrade" },
      { id: "kc_hc_transfer",  label: "消费转他行客户",             parentId: "kc_hc_downgrade" },
    ],
  },
  {
    id: "kc_hc_maintain",
    label: "中高消费维持客户",
    kpis: [
      { id: "kc_hc_maintain", label: "中高消费维持客户" },
    ],
  },
  {
    id: "kc_hc_upgrade",
    label: "中高消费升级客户",
    kpis: [
      { id: "kc_hc_upgrade", label: "中高消费升级客户" },
      { id: "kc_hc_scene",   label: "中高消费大额场景升级客户", parentId: "kc_hc_upgrade" },
      { id: "kc_hc_asset",   label: "中高资产消费升级客户",     parentId: "kc_hc_upgrade" },
    ],
  },
]

const allTabs = [overviewTab, ...drillTabs]

export function HighconsumeSubPanel({ selectedInstitution, selectedDate, sectionTitle }: Props) {
  const [activeTab, setActiveTab] = useState(overviewTab.id)
  const tab = allTabs.find((t) => t.id === activeTab) ?? overviewTab

  const indicators = useMemo(
    () => generateKeyCustomerIndicators(selectedInstitution, selectedDate).filter(r => r.category === "highconsume"),
    [selectedInstitution, selectedDate]
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Horizontal tab pills */}
      <div className="flex items-center gap-1 flex-wrap">
        {allTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-full border transition-colors",
              activeTab === t.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:bg-muted/50"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <DetailPanel
        kpiDefs={tab.kpis}
        indicators={indicators}
        selectedInstitution={selectedInstitution}
        selectedDate={selectedDate}
        sectionTitle={sectionTitle}
      />
    </div>
  )
}
