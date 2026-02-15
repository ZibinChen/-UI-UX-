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

// 3 groups under 中高消费客户数, each with its own children
const groups = [
  {
    id: "kc_hc_downgrade",
    label: "中高消费降级客户",
    // parent + L2 children
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
    // Only the parent, no children
    kpis: [
      { id: "kc_hc_maintain", label: "中高消费维持客户" },
    ],
  },
  {
    id: "kc_hc_upgrade",
    label: "中高消费升级客户",
    // parent + L2 children
    kpis: [
      { id: "kc_hc_upgrade", label: "中高消费升级客户" },
      { id: "kc_hc_scene",   label: "中高消费大额场景升级客户", parentId: "kc_hc_upgrade" },
      { id: "kc_hc_asset",   label: "中高资产消费升级客户",     parentId: "kc_hc_upgrade" },
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

  return (
    <div className="flex flex-col gap-4">
      {/* Top-level: total KPI card for 中高消费客户数 */}
      {(() => {
        const total = indicators.find(r => r.id === "kc_hc_total")
        if (!total) return null
        return (
          <div className="rounded border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{total.name}</p>
            <p className="text-lg font-semibold text-foreground">
              {total.value} <span className="text-xs font-normal text-muted-foreground">{total.unit}</span>
            </p>
            <p className={cn("text-xs", total.comparisonRaw >= 0 ? "text-bank-red" : "text-bank-green")}>
              {total.comparisonType} {total.comparison}
            </p>
          </div>
        )
      })()}

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
        kpiDefs={group.kpis}
        indicators={indicators}
        selectedInstitution={selectedInstitution}
        selectedDate={selectedDate}
        sectionTitle={sectionTitle}
      />
    </div>
  )
}
