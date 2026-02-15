"use client"

import { useMemo } from "react"
import { DetailPanel } from "../credit-card/detail-panel"
import { generateKeyCustomerIndicators } from "@/lib/credit-card-data"

interface Props {
  selectedInstitution: string
  selectedDate: string
  sectionTitle: string
}

const kpiDefs = [
  { id: "kc_cross_total", label: "信用卡跨境客户数" },
  { id: "kc_study", label: "留学客群", parentId: "kc_cross_total" },
  { id: "kc_resident", label: "常驻客群", parentId: "kc_cross_total" },
  { id: "kc_outbound", label: "出境客群", parentId: "kc_cross_total" },
  { id: "kc_overseas", label: "海淘客群", parentId: "kc_cross_total" },
]

export function CrossborderSubPanel({ selectedInstitution, selectedDate, sectionTitle }: Props) {
  const indicators = useMemo(
    () => generateKeyCustomerIndicators(selectedInstitution, selectedDate).filter(r => r.category === "crossborder"),
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
