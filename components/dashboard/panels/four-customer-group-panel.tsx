"use client"

import { useMemo } from "react"
import { DetailPanel } from "../credit-card/detail-panel"
import { generateFourCustomerIndicators, institutions } from "@/lib/credit-card-data"

// All four customer group KPIs in a single list for sidebar switching
const kpiDefs = [
  { id: "fc_monthly_active", label: "月活客群" },
  { id: "fc_new_active", label: "新增活跃客户" },
  { id: "fc_highend_active", label: "中高端新增活跃客户" },
  { id: "fc_cross_border", label: "跨境交易客户" },
]

interface FourCustomerGroupPanelProps {
  selectedInstitution: string
  selectedDate: string
}

function formatTitleDate(dateStr: string): string {
  const parts = dateStr.split("/")
  if (parts.length !== 3) return dateStr
  return `${parts[0]}年${Number(parts[1])}月${Number(parts[2])}日`
}

export function FourCustomerGroupPanel({ selectedInstitution, selectedDate }: FourCustomerGroupPanelProps) {
  const instName = institutions.find((i) => i.id === selectedInstitution)?.name ?? "境内分支机构汇总"
  const titleDate = formatTitleDate(selectedDate)

  // Generate all four customer group indicators
  const indicators = useMemo(
    () => generateFourCustomerIndicators(selectedInstitution, selectedDate),
    [selectedInstitution, selectedDate]
  )

  const sectionTitle = "对私折效四大客群"

  return (
    <div className="flex flex-col gap-2">
      {/* Report Title */}
      <div className="bg-card rounded border border-border px-2 py-1.5" suppressHydrationWarning>
        <h2 className="text-[10px] font-semibold text-foreground text-center" suppressHydrationWarning>
          对私折效四大客群（{titleDate}）
        </h2>
      </div>

      {/* Content: DetailPanel with all 4 KPIs as switchable cards */}
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
