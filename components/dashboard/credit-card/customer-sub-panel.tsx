"use client"

import { useMemo } from "react"
import { DetailPanel } from "./detail-panel"
import { generateIndicators } from "@/lib/credit-card-data"

interface CustomerSubPanelProps {
  selectedInstitution: string
  selectedDate: string
}

const kpiDefs = [
  { id: "eff_cust", label: "有效客户" },
  { id: "new_cust", label: "新增客户", parentId: "eff_cust" },
  { id: "active_cust", label: "活跃客户", parentId: "eff_cust" },
  { id: "quick_cust", label: "快捷交易客户", parentId: "eff_cust" },
]

export function CustomerSubPanel({ selectedInstitution, selectedDate }: CustomerSubPanelProps) {
  const indicators = useMemo(
    () => generateIndicators(selectedInstitution, selectedDate).filter(r => r.category === "customer"),
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
