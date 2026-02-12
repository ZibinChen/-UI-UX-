"use client"

import { useMemo } from "react"
import { KpiCard } from "../kpi-card"
import { BranchBarChart } from "../charts/branch-bar-chart"
import { TrendBarChart } from "../charts/trend-bar-chart"
import { MultiLineChart } from "../charts/multi-line-chart"
import { creditCardIndicators, generateCreditCardBarData, generateCreditCardTrendData } from "@/lib/credit-card-data"

function generateNplTrendData() {
  const months = [
    "2025/07", "2025/08", "2025/09", "2025/10", "2025/11", "2025/12",
    "2026/01", "2026/02", "2026/03", "2026/04", "2026/05", "2026/06",
  ]
  return months.map((month) => ({
    month,
    loanBalance: Math.floor(Math.random() * 300) + 400,
    nplBalance: Math.floor(Math.random() * 20) + 30,
    nplRatio: +(Math.random() * 0.5 + 0.8).toFixed(2),
  }))
}

export function LoanSubPanel() {
  const loanData = creditCardIndicators.filter((r) => r.category === "loan")
  const barData = useMemo(() => generateCreditCardBarData(), [])
  const trendData = useMemo(() => generateCreditCardTrendData(), [])
  const nplTrend = useMemo(() => generateNplTrendData(), [])

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 py-3 px-4 bg-card rounded border border-border">
        {loanData.map((item) => (
          <KpiCard
            key={item.id}
            label={item.name}
            value={item.value}
            growth={item.comparison}
            growthLabel={item.comparisonType}
          />
        ))}
      </div>

      {/* Loan balance by branch */}
      <div className="border-t border-border pt-4">
        <h4 className="text-sm font-semibold text-foreground mb-4">各分支机构贷款余额</h4>
        <BranchBarChart data={barData} color="hsl(0, 85%, 46%)" />
      </div>

      {/* Loan balance monthly trend */}
      <div className="border-t border-border pt-4">
        <h4 className="text-sm font-semibold text-foreground mb-4">贷款余额月度趋势</h4>
        <TrendBarChart data={trendData} title="" unit="亿元" />
      </div>

      {/* NPL trend - multi line */}
      <div className="border-t border-border pt-4">
        <h4 className="text-sm font-semibold text-foreground mb-4">不良余额及不良率趋势</h4>
        <MultiLineChart
          data={nplTrend}
          lines={[
            { key: "nplBalance", label: "不良余额(亿元)", color: "hsl(0, 85%, 46%)" },
            { key: "nplRatio", label: "不良率(%)", color: "hsl(220, 70%, 45%)" },
          ]}
          title=""
          unit=""
          height={260}
        />
      </div>
    </div>
  )
}
