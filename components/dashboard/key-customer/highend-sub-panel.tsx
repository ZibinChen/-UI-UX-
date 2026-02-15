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
  { id: "kc_highend_total", label: "信用卡中高端客户数" },
  { id: "kc_wealth_mgmt", label: "理财客户", parentId: "kc_highend_total" },
  { id: "kc_wealth", label: "财富客户", parentId: "kc_highend_total" },
  { id: "kc_private", label: "私行客户", parentId: "kc_highend_total" },
]

export function HighendSubPanel({ selectedInstitution, selectedDate, sectionTitle }: Props) {
  const indicators = useMemo(
    () => generateKeyCustomerIndicators(selectedInstitution, selectedDate).filter(r => r.category === "highend"),
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
