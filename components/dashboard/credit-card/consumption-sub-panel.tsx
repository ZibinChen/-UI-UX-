"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { DetailPanel } from "./detail-panel"
import { generateIndicators } from "@/lib/credit-card-data"

interface ConsumptionSubPanelProps {
  selectedInstitution: string
  selectedDate: string
  sectionTitle: string
}

// Group structure: top-level tab -> its direct children shown in KPI sidebar
const groups = [
  {
    id: "total_consume",
    label: "总消费额",
    children: [
      { id: "installment", label: "信用卡分期消费额", parentId: "total_consume" },
      { id: "card_consume", label: "信用卡消费额", parentId: "total_consume" },
      { id: "quick_consume", label: "快捷消费额", parentId: "total_consume" },
      { id: "cross_consume", label: "跨境消费额", parentId: "total_consume" },
    ],
  },
  {
    id: "installment",
    label: "信用卡分期消费额",
    children: [
      { id: "auto_inst", label: "汽车分期", parentId: "installment" },
      { id: "home_inst", label: "家装分期", parentId: "installment" },
      { id: "e_inst", label: "中银e分期", parentId: "installment" },
    ],
  },
  {
    id: "card_consume",
    label: "信用卡消费额",
    children: [
      { id: "normal_consume", label: "普通消费额", parentId: "card_consume" },
      { id: "merchant_inst", label: "商户分期", parentId: "card_consume" },
      { id: "card_inst", label: "卡户分期", parentId: "card_consume" },
    ],
  },
]

export function ConsumptionSubPanel({
  selectedInstitution,
  selectedDate,
  sectionTitle,
}: ConsumptionSubPanelProps) {
  const [activeGroup, setActiveGroup] = useState(groups[0].id)
  const group = groups.find((g) => g.id === activeGroup) ?? groups[0]

  const indicators = useMemo(
    () =>
      generateIndicators(selectedInstitution, selectedDate).filter(
        (r) => r.category === "consumption"
      ),
    [selectedInstitution, selectedDate]
  )

  // KPI defs: the group parent + its children (flat, 1 level only)
  const kpiDefs = useMemo(() => {
    const parentDef = { id: group.id, label: group.label }
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
