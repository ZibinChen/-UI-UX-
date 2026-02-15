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

// Group structure: top-level tab -> its direct children shown in KPI sidebar
const groups = [
  {
    id: "kc_hc_total",
    label: "中高消费客户总览",
    children: [
      { id: "kc_hc_downgrade", label: "中高消费降级客户", parentId: "kc_hc_total" },
      { id: "kc_hc_transfer", label: "消费转他行客户", parentId: "kc_hc_total" },
      { id: "kc_hc_maintain", label: "中高消费维持客户", parentId: "kc_hc_total" },
      { id: "kc_hc_upgrade", label: "中高消费升级客户", parentId: "kc_hc_total" },
      { id: "kc_hc_scene", label: "中高消费大额场景升级客户", parentId: "kc_hc_total" },
      { id: "kc_hc_asset", label: "中高资产消费升级客户", parentId: "kc_hc_total" },
    ],
  },
  {
    id: "kc_hc_downgrade",
    label: "降级客户明细",
    children: [
      { id: "kc_hc_lost", label: "中高消费流失客户", parentId: "kc_hc_downgrade" },
      { id: "kc_hc_blocked", label: "用卡受阻-销户客户", parentId: "kc_hc_downgrade" },
      { id: "kc_hc_inactive", label: "用卡受阻-到期换卡未激活客户", parentId: "kc_hc_downgrade" },
    ],
  },
]

export function HighconsumeSubPanel({ selectedInstitution, selectedDate, sectionTitle }: Props) {
  const [activeGroup, setActiveGroup] = useState(groups[0].id)
  const group = groups.find((g) => g.id === activeGroup) ?? groups[0]

  const indicators = useMemo(
    () => generateKeyCustomerIndicators(selectedInstitution, selectedDate).filter(r => r.category === "highconsume"),
    [selectedInstitution, selectedDate]
  )

  // KPI defs: the group parent + its children (flat, 1 level only)
  const kpiDefs = useMemo(() => {
    const parentDef = { id: group.id, label: group.label.replace("明细", "").replace("总览", "") }
    return [parentDef, ...group.children]
  }, [group])

  return (
    <div className="flex flex-col gap-4">
      {/* Horizontal group tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => setActiveGroup(g.id)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-full border transition-colors",
              activeGroup === g.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:bg-muted/50"
            )}
          >
            {g.label}
          </button>
        ))}
      </div>

      <DetailPanel
        kpiDefs={kpiDefs}
        indicators={indicators}
        selectedInstitution={selectedInstitution}
        selectedDate={selectedDate}
        sectionTitle={sectionTitle}
      />
    </div>
  )
}
