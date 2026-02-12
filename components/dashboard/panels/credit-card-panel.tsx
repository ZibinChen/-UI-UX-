"use client"

import { useState } from "react"
import { TabNavigation } from "../tab-navigation"
import { IndicatorsTable } from "../credit-card/indicators-table"
import { CustomerSubPanel } from "../credit-card/customer-sub-panel"
import { ConsumptionSubPanel } from "../credit-card/consumption-sub-panel"
import { LoanSubPanel } from "../credit-card/loan-sub-panel"
import { creditCardIndicators } from "@/lib/credit-card-data"

const subTabs = [
  { id: "all", label: "全部指标" },
  { id: "customer", label: "有效客户" },
  { id: "consumption", label: "消费额类别" },
  { id: "loan", label: "贷款余额和不良余额" },
]

export function CreditCardPanel() {
  const [activeSubTab, setActiveSubTab] = useState("all")

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
          境内分行汇总分行信用卡经营指标表（2026年X月X日）
        </h2>
        <p className="text-xs text-muted-foreground text-center mt-1">
          按日更新，展示每月最后一天及当前月份最新数据即可
        </p>
      </div>

      {/* Content based on active tab */}
      {activeSubTab === "all" && (
        <IndicatorsTable
          data={creditCardIndicators}
          title="境内分行汇总 — 主要经营指标"
        />
      )}

      {activeSubTab === "customer" && <CustomerSubPanel />}

      {activeSubTab === "consumption" && <ConsumptionSubPanel />}

      {activeSubTab === "loan" && <LoanSubPanel />}
    </div>
  )
}
