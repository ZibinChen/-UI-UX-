"use client"

import { useMemo } from "react"
import { DetailPanel } from "./detail-panel"
import { generateIndicators } from "@/lib/credit-card-data"

interface LoanSubPanelProps {
  selectedInstitution: string
  selectedDate: string
  sectionTitle: string
}

const kpiDefs = [
  { id: "loan_balance", label: "贷款余额" },
  { id: "npl_balance", label: "不良余额" },
  { id: "npl_ratio", label: "不良率" },
]

export function LoanSubPanel({ selectedInstitution, selectedDate, sectionTitle }: LoanSubPanelProps) {
  const indicators = useMemo(
    () => generateIndicators(selectedInstitution, selectedDate).filter(r => r.category === "loan"),
    [selectedInstitution, selectedDate]
  )

  return (
    <DetailPanel
      kpiDefs={kpiDefs}
      indicators={indicators}
      selectedInstitution={selectedInstitution}
      selectedDate={selectedDate}
      sectionTitle={sectionTitle}
    />
  )
}
