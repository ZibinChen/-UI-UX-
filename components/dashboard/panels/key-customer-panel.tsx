"use client"

import { useMemo, useState } from "react"
import { TabNavigation } from "../tab-navigation"
import { IndicatorsTable } from "../credit-card/indicators-table"
import { CrossborderSubPanel } from "../key-customer/crossborder-sub-panel"
import { HighendSubPanel } from "../key-customer/highend-sub-panel"
import { HighconsumeSubPanel } from "../key-customer/highconsume-sub-panel"
import { generateKeyCustomerIndicators, institutions } from "@/lib/credit-card-data"

const subTabs = [
  { id: "all", label: "全部" },
  { id: "crossborder", label: "跨境" },
  { id: "highend", label: "中高端" },
  { id: "highconsume", label: "中高消费" },
]

interface KeyCustomerPanelProps {
  selectedInstitution: string
  selectedDate: string
}

function formatTitleDate(dateStr: string): string {
  const parts = dateStr.split("/")
  if (parts.length !== 3) return dateStr
  return `${parts[0]}年${Number(parts[1])}月${Number(parts[2])}日`
}

export function KeyCustomerPanel({ selectedInstitution, selectedDate }: KeyCustomerPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState("all")

  const isSummary = selectedInstitution === "all"
  const instName = institutions.find((i) => i.id === selectedInstitution)?.name ?? "境内分支机构汇总"

  const indicators = useMemo(
    () => generateKeyCustomerIndicators(selectedInstitution, selectedDate),
    [selectedInstitution, selectedDate]
  )

  const titleDate = formatTitleDate(selectedDate)

  return (
    <div className="flex flex-col gap-2">
      {/* Report Title */}
      <div className="bg-card rounded border border-border px-2 py-1.5" suppressHydrationWarning>
        <h2 className="text-[10px] font-semibold text-foreground text-center" suppressHydrationWarning>
          信用卡重点客群（{titleDate}）
        </h2>
      </div>

      {/* Sub-tab Navigation */}
      <TabNavigation
        tabs={subTabs}
        activeTab={activeSubTab}
        onTabChange={setActiveSubTab}
        variant="pill"
      />

      {/* Content based on active tab */}
      {activeSubTab === "all" && (
        <IndicatorsTable
          data={indicators}
          title={`${instName}`}
          isSummary={isSummary}
        />
      )}

      {activeSubTab === "crossborder" && (
        <CrossborderSubPanel
          selectedInstitution={selectedInstitution}
          selectedDate={selectedDate}
          sectionTitle="跨境客户"
        />
      )}

      {activeSubTab === "highend" && (
        <HighendSubPanel
          selectedInstitution={selectedInstitution}
          selectedDate={selectedDate}
          sectionTitle="中高端客户"
        />
      )}

      {activeSubTab === "highconsume" && (
        <HighconsumeSubPanel
          selectedInstitution={selectedInstitution}
          selectedDate={selectedDate}
          sectionTitle="中高消费客户"
        />
      )}
    </div>
  )
}
