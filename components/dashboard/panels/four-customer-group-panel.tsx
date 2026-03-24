"use client"

import { useMemo, useState } from "react"
import { TabNavigation } from "../tab-navigation"
import { DetailPanel } from "../credit-card/detail-panel"
import { generateFourCustomerIndicators, institutions } from "@/lib/credit-card-data"

const subTabs = [
  { id: "monthly-active", label: "月活客群" },
  { id: "new-active", label: "新增活跃客户" },
  { id: "highend-active", label: "中高端新增活跃客户" },
  { id: "cross-border", label: "跨境交易客户" },
]

// KPI definitions for each sub-tab
const KPI_DEFS: Record<string, { id: string; label: string; parentId?: string }[]> = {
  "monthly-active": [
    { id: "fc_monthly_active", label: "月活客群" },
  ],
  "new-active": [
    { id: "fc_new_active", label: "新增活跃客户" },
  ],
  "highend-active": [
    { id: "fc_highend_active", label: "中高端新增活跃客户" },
  ],
  "cross-border": [
    { id: "fc_cross_border", label: "跨境交易客户" },
  ],
}

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
  const [activeSubTab, setActiveSubTab] = useState("monthly-active")

  const instName = institutions.find((i) => i.id === selectedInstitution)?.name ?? "境内分支机构汇总"
  const titleDate = formatTitleDate(selectedDate)

  // Generate indicators for the current sub-tab
  const indicators = useMemo(() => {
    const all = generateFourCustomerIndicators(selectedInstitution, selectedDate)
    // Filter by the active tab's indicator id
    const kpis = KPI_DEFS[activeSubTab] ?? []
    const kpiIds = kpis.map(k => k.id)
    return all.filter(r => kpiIds.includes(r.id))
  }, [selectedInstitution, selectedDate, activeSubTab])

  const kpiDefs = KPI_DEFS[activeSubTab] ?? []

  // Section title based on active tab
  const tabLabel = subTabs.find(t => t.id === activeSubTab)?.label ?? ""
  const sectionTitle = `对私折效四大客群 - ${tabLabel}（${titleDate}）`

  return (
    <div className="flex flex-col gap-6">
      {/* Sub-tab Navigation */}
      <TabNavigation
        tabs={subTabs}
        activeTab={activeSubTab}
        onTabChange={setActiveSubTab}
        variant="pill"
      />

      {/* Report Title */}
      <div className="bg-card rounded border border-border px-4 py-3" suppressHydrationWarning>
        <h2 className="text-base font-semibold text-foreground text-center" suppressHydrationWarning>
          {"对私折效四大客群表（"}{titleDate}{")"}
        </h2>
        <p className="text-xs text-muted-foreground text-center mt-1" suppressHydrationWarning>
          {"四大客群指标：月活客群、新增活跃客户、中高端新增活跃客户、跨境交易客户"}
        </p>
      </div>

      {/* Content: DetailPanel with KPI sidebar, trend charts, and branch table */}
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
