"use client"

import { useMemo } from "react"
import { KpiCard } from "../kpi-card"
import { BranchBarChart } from "../charts/branch-bar-chart"
import { TrendBarChart } from "../charts/trend-bar-chart"
import { creditCardIndicators, generateCreditCardBarData, generateCreditCardTrendData } from "@/lib/credit-card-data"

export function CustomerSubPanel() {
  const customerData = creditCardIndicators.filter((r) => r.category === "customer")
  const barData = useMemo(() => generateCreditCardBarData(), [])
  const trendData = useMemo(() => generateCreditCardTrendData(), [])

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 py-3 px-4 bg-card rounded border border-border">
        {customerData
          .filter((r) => r.indent === 0 || r.indent === undefined)
          .map((item) => (
            <KpiCard
              key={item.id}
              label={item.name}
              value={item.value}
              growth={item.comparison}
              growthLabel={item.comparisonType}
            />
          ))}
      </div>

      {/* Charts */}
      <div className="flex flex-col gap-6">
        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-semibold text-foreground mb-4">各分支机构有效客户数</h4>
          <BranchBarChart data={barData} color="hsl(0, 85%, 46%)" />
        </div>
        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-semibold text-foreground mb-4">有效客户数月度趋势</h4>
          <TrendBarChart data={trendData} title="" unit="万户" />
        </div>
      </div>
    </div>
  )
}
