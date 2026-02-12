"use client"

import { useMemo } from "react"
import { KpiCard } from "../kpi-card"
import { StackedBarChart } from "../charts/stacked-bar-chart"
import { TrendBarChart } from "../charts/trend-bar-chart"
import { creditCardIndicators, generateCreditCardTrendData, creditCardBranches } from "@/lib/credit-card-data"

function generateConsumptionStackedData() {
  return creditCardBranches.map((name) => ({
    name,
    segment1: Math.floor(Math.random() * 300) + 50,
    segment2: Math.floor(Math.random() * 200) + 30,
    segment3: Math.floor(Math.random() * 150) + 20,
    segment4: Math.floor(Math.random() * 100) + 10,
  }))
}

export function ConsumptionSubPanel() {
  const consumptionData = creditCardIndicators.filter((r) => r.category === "consumption")
  const stackedData = useMemo(() => generateConsumptionStackedData(), [])
  const trendData = useMemo(() => generateCreditCardTrendData(), [])

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-4 py-3 px-4 bg-card rounded border border-border">
        {consumptionData
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

      {/* Stacked chart - consumption breakdown by branch */}
      <div className="border-t border-border pt-4">
        <h4 className="text-sm font-semibold text-foreground mb-4">各分支机构消费额构成</h4>
        <StackedBarChart
          data={stackedData}
          segments={[
            { key: "segment1", label: "信用卡分期消费额", color: "hsl(0, 85%, 46%)" },
            { key: "segment2", label: "普通消费额", color: "hsl(30, 80%, 55%)" },
            { key: "segment3", label: "快捷消费额", color: "hsl(140, 60%, 40%)" },
            { key: "segment4", label: "跨境消费额", color: "hsl(220, 70%, 45%)" },
          ]}
        />
      </div>

      {/* Monthly trend */}
      <div className="border-t border-border pt-4">
        <h4 className="text-sm font-semibold text-foreground mb-4">总消费额月度趋势</h4>
        <TrendBarChart data={trendData} title="" unit="亿元" />
      </div>
    </div>
  )
}
