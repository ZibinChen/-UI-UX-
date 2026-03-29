"use client"

import { useMemo, useState } from "react"
import { TabNavigation } from "../tab-navigation"
import { IndicatorsTable } from "../credit-card/indicators-table"
import { CustomerSubPanel } from "../credit-card/customer-sub-panel"
import { ConsumptionSubPanel } from "../credit-card/consumption-sub-panel"
import { LoanSubPanel } from "../credit-card/loan-sub-panel"
import { generateIndicators, institutions } from "@/lib/credit-card-data"

const subTabs = [
  { id: "all", label: "全部" },
  { id: "customer", label: "客户" },
  { id: "consumption", label: "消费" },
  { id: "loan", label: "贷款" },
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
    <div className="flex flex-col gap-2">
      {/* Report Title */}
      <div className="bg-card rounded border border-border px-2 py-1.5">
        <h2 className="text-[10px] font-semibold text-foreground text-center">
          信用卡经营指标（{titleDate}）
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
          title={instName}
          isSummary={isSummary}
        />
      )}

      {activeSubTab === "customer" && (
        <CustomerSubPanel
          selectedInstitution={selectedInstitution}
          selectedDate={selectedDate}
          sectionTitle="有效客户数"
        />
      )}

      {activeSubTab === "consumption" && (
        <ConsumptionSubPanel
          selectedInstitution={selectedInstitution}
          selectedDate={selectedDate}
          sectionTitle="消费额类别"
        />
      )}

      {activeSubTab === "loan" && (
        <LoanSubPanel
          selectedInstitution={selectedInstitution}
          selectedDate={selectedDate}
          sectionTitle="贷款余额"
        />
      )}
    </div>
  )
}
