"use client"

import { useState, useMemo } from "react"
import { KpiCard } from "../kpi-card"
import { ChartSection } from "../chart-section"
import { BranchBarChart } from "../charts/branch-bar-chart"
import { StackedBarChart } from "../charts/stacked-bar-chart"
import { generateBarData, generateStackedBarData } from "@/lib/sample-data"

export function CustomersPanel() {
  const [chart1Tab, setChart1Tab] = useState("personal")
  const [chart2Tab, setChart2Tab] = useState("private")
  const [chart3Tab, setChart3Tab] = useState("corporate-settle")

  const barData = useMemo(() => generateBarData(), [])
  const stackedData = useMemo(() => generateStackedBarData(), [])
  const blueBarData = useMemo(() => generateBarData(), [])

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards - 2 rows */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-4 py-3 px-4 bg-card rounded border border-border">
        <KpiCard
          label="个人折效客户数"
          value="123,213,375"
          growth="+135,375.21%"
          tooltip="含全个人客户数的折算系数"
        />
        <KpiCard
          label="信用卡折效客户数"
          value="123,213,375"
          growth="+135,375.21%"
        />
        <KpiCard
          label="私人银行客户数"
          value="123,213,375"
          growth="+135,375.21%"
        />
        <KpiCard
          label="对公结算账户数(剔除长期不动户)"
          value="123,213,375"
          growth="+135,375.21%"
        />
        <KpiCard
          label="对公全量客户数"
          value="123,213,375"
          growth="+135,375.21%"
        />
        <KpiCard
          label="普惠客户数"
          value="123,213,375"
          growth="+136,375.21%"
        />
        <KpiCard
          label="代发客户数"
          value="123,213,375"
          growth="+135,375.21%"
        />
        <KpiCard
          label="手机银行签约新户数"
          value="123,213,375"
          growth="+135,375.21%"
        />
      </div>

      {/* Chart Section 1: Personal Effective Customers (Red Bar) */}
      <ChartSection
        tabs={[
          { id: "personal", label: "个人折效客户数" },
          { id: "credit-card", label: "信用卡折效客户数" },
          { id: "mobile-bank", label: "手机银行客户数" },
        ]}
        activeTab={chart1Tab}
        onTabChange={setChart1Tab}
        rightContent={<span className="text-sm text-foreground">个人折效客户数</span>}
      >
        <BranchBarChart data={barData} color="hsl(0, 85%, 46%)" />
      </ChartSection>

      {/* Chart Section 2: Private Bank Customers (Stacked) */}
      <ChartSection
        tabs={[
          { id: "private", label: "私人银行客户数" },
          { id: "general", label: "普惠客户数" },
          { id: "proxy", label: "代发客户数" },
        ]}
        activeTab={chart2Tab}
        onTabChange={setChart2Tab}
      >
        <StackedBarChart
          data={stackedData}
          segments={[
            { key: "segment1", label: "其中：600万(含)至1000万(不含) 客户数", color: "hsl(220, 70%, 35%)" },
            { key: "segment2", label: "其中：1000万(含)至2000万(不含) 客户数", color: "hsl(140, 60%, 40%)" },
            { key: "segment3", label: "其中：2000万(含)至3000万(不含) 客户数", color: "hsl(220, 70%, 55%)" },
            { key: "segment4", label: "其中：3000万(含)以上 客户数", color: "hsl(30, 80%, 55%)" },
          ]}
        />
      </ChartSection>

      {/* Chart Section 3: Corporate Settlement (Blue Bar) */}
      <ChartSection
        tabs={[
          { id: "corporate-settle", label: "对公结算账户数" },
          { id: "corporate-all", label: "对公全量客户数" },
        ]}
        activeTab={chart3Tab}
        onTabChange={setChart3Tab}
      >
        <BranchBarChart data={blueBarData} color="hsl(220, 70%, 45%)" />
      </ChartSection>
    </div>
  )
}
