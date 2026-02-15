"use client"

import { useMemo, useState } from "react"
import { TabNavigation } from "../tab-navigation"
import { IndicatorsTable } from "../credit-card/indicators-table"
import { CrossborderSubPanel } from "../key-customer/crossborder-sub-panel"
import { HighendSubPanel } from "../key-customer/highend-sub-panel"
import { HighconsumeSubPanel } from "../key-customer/highconsume-sub-panel"
import { generateKeyCustomerIndicators, institutions } from "@/lib/credit-card-data"

const subTabs = [
  { id: "all", label: "全部指标" },
  { id: "crossborder", label: "跨境客户" },
  { id: "highend", label: "中高端客户" },
  { id: "highconsume", label: "中高消费客户" },
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
          {'信用卡重点客群表（'}{titleDate}{'）'}
        </h2>
        <p className="text-xs text-muted-foreground text-center mt-1" suppressHydrationWarning>
          {'按日更新，展示每月最后一天及当前月份最新数据即可'}
        </p>
      </div>

      {/* Content based on active tab */}
      {activeSubTab === "all" && (
        <IndicatorsTable
          data={indicators}
          title={`${instName} — 重点客群指标`}
          isSummary={isSummary}
        />
      )}

      {activeSubTab === "crossborder" && (
        <CrossborderSubPanel
          selectedInstitution={selectedInstitution}
          selectedDate={selectedDate}
          sectionTitle={`信用卡重点客群 - 跨境客户（${titleDate}）`}
        />
      )}

      {activeSubTab === "highend" && (
        <HighendSubPanel
          selectedInstitution={selectedInstitution}
          selectedDate={selectedDate}
          sectionTitle={`信用卡重点客群 - 中高端客户（${titleDate}）`}
        />
      )}

      {activeSubTab === "highconsume" && (
        <HighconsumeSubPanel
          selectedInstitution={selectedInstitution}
          selectedDate={selectedDate}
          sectionTitle={`信用卡重点客群 - 中高消费客户（${titleDate}）`}
        />
      )}
    </div>
  )
}
