"use client"

import { useMemo, useState } from "react"
import { TabNavigation } from "../tab-navigation"
import { IndicatorsTable } from "../credit-card/indicators-table"
import { CustomerSubPanel } from "../credit-card/customer-sub-panel"
import { ConsumptionSubPanel } from "../credit-card/consumption-sub-panel"
import { LoanSubPanel } from "../credit-card/loan-sub-panel"
import { generateIndicators, institutions } from "@/lib/credit-card-data"

const subTabs = [
  { id: "all", label: "全部指标" },
  { id: "customer", label: "有效客户" },
  { id: "consumption", label: "消费额类别" },
  { id: "loan", label: "贷款余额和不良余额" },
]

interface CreditCardPanelProps {
  selectedInstitution: string
  selectedDate: string
}

function formatTitleDate(dateStr: string): string {
  const parts = dateStr.split("/")
  if (parts.length !== 3) return dateStr
  return `${parts[0]}年${Number(parts[1])}月${Number(parts[2])}日`
}

export function CreditCardPanel({ selectedInstitution, selectedDate }: CreditCardPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState("all")

  const isSummary = selectedInstitution === "all"
  const instName = institutions.find((i) => i.id === selectedInstitution)?.name ?? "境内分支机构汇总"

  const indicators = useMemo(
    () => generateIndicators(selectedInstitution, selectedDate),
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
      <div className="bg-card rounded border border-border px-4 py-3">
        <h2 className="text-base font-semibold text-foreground text-center">
          境内分行汇总分行信用卡经营指标表（{titleDate}）
        </h2>
        <p className="text-xs text-muted-foreground text-center mt-1">
          按日更新，展示每月最后一天及当前月份最新数据即可
        </p>
      </div>

      {/* Content based on active tab */}
      {activeSubTab === "all" && (
        <IndicatorsTable
          data={indicators}
          title={`${instName} — 主要经营指标`}
          isSummary={isSummary}
        />
      )}

      {activeSubTab === "customer" && (
        <CustomerSubPanel
          selectedInstitution={selectedInstitution}
          selectedDate={selectedDate}
          sectionTitle={`信用卡经营指标表 - 有效客户数（${titleDate}）`}
        />
      )}

      {activeSubTab === "consumption" && (
        <ConsumptionSubPanel
          selectedInstitution={selectedInstitution}
          selectedDate={selectedDate}
          sectionTitle={`信用卡经营指标表 - 消费额类别（${titleDate}）`}
        />
      )}

      {activeSubTab === "loan" && (
        <LoanSubPanel
          selectedInstitution={selectedInstitution}
          selectedDate={selectedDate}
          sectionTitle={`信用卡经营指标表 - 贷款余额和不良余额（${titleDate}）`}
        />
      )}
    </div>
  )
}
