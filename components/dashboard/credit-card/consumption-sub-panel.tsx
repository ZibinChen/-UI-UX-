"use client"

import { useMemo } from "react"
import { DetailPanel } from "./detail-panel"
import { generateIndicators } from "@/lib/credit-card-data"

interface ConsumptionSubPanelProps {
  selectedInstitution: string
  selectedDate: string
}

// Consumption has many indicators — use parent/child grouping
// Top level: 总消费额, 信用卡分期消费额, 信用卡消费额, 快捷消费额, 跨境消费额
// Children nested under their parents
const kpiDefs = [
  { id: "total_consume", label: "总消费额" },
  { id: "installment", label: "信用卡分期消费额", parentId: "total_consume" },
  { id: "auto_inst", label: "汽车分期", parentId: "installment" },
  { id: "home_inst", label: "家装分期", parentId: "installment" },
  { id: "e_inst", label: "中银e分期", parentId: "installment" },
  { id: "card_consume", label: "信用卡消费额", parentId: "total_consume" },
  { id: "normal_consume", label: "普通消费额", parentId: "card_consume" },
  { id: "merchant_inst", label: "商户分期", parentId: "card_consume" },
  { id: "card_inst", label: "卡户分期", parentId: "card_consume" },
  { id: "quick_consume", label: "快捷消费额", parentId: "total_consume" },
  { id: "cross_consume", label: "跨境消费额", parentId: "total_consume" },
]

export function ConsumptionSubPanel({ selectedInstitution, selectedDate }: ConsumptionSubPanelProps) {
  const indicators = useMemo(
    () => generateIndicators(selectedInstitution, selectedDate).filter(r => r.category === "consumption"),
    [selectedInstitution, selectedDate]
  )

  return (
    <DetailPanel
      kpiDefs={kpiDefs}
      indicators={indicators}
      selectedInstitution={selectedInstitution}
      selectedDate={selectedDate}
    />
  )
}
