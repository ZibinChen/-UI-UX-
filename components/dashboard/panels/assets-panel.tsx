"use client"

import { useState, useMemo } from "react"
import { TabNavigation } from "../tab-navigation"
import { KpiCard } from "../kpi-card"
import { TrendBarChart } from "../charts/trend-bar-chart"
import { MultiLineChart } from "../charts/multi-line-chart"
import { generateTrendData, generateLineData, generateMultiLineData } from "@/lib/sample-data"

const subTabs = [
  { id: "overview", label: "总体情况" },
  { id: "institution", label: "辖属机构情况" },
  { id: "product", label: "细分产品" },
  { id: "customer-asset", label: "全量客户金融资产" },
]

const currencyTabs = [
  { id: "rmb-total", label: "汇总人民币" },
  { id: "rmb", label: "人民币" },
  { id: "foreign", label: "外币" },
]

export function AssetsPanel() {
  const [activeSubTab, setActiveSubTab] = useState("overview")
  const [activeCurrency, setActiveCurrency] = useState("rmb")

  const trendData = useMemo(() => generateTrendData(), [])
  const lineData = useMemo(() => generateLineData(), [])
  const multiLineData = useMemo(() => generateMultiLineData(), [])

  return (
    <div className="flex flex-col gap-6">
      {/* Sub tabs */}
      <TabNavigation tabs={subTabs} activeTab={activeSubTab} onTabChange={setActiveSubTab} variant="pill" />

      {/* Currency selector */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1">
          <span className="text-sm font-semibold text-foreground mr-1">{'|'}</span>
          <span className="text-sm font-semibold text-foreground">资产情况</span>
        </div>
        <TabNavigation tabs={currencyTabs} activeTab={activeCurrency} onTabChange={setActiveCurrency} variant="pill" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>单位：亿元、亿美元</span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 py-2 px-4 bg-card rounded border border-border">
        <KpiCard label="贷款合计时点余额" value="2,839.42" tooltip="贷款合计时点余额说明" />
        <KpiCard label="较年初" growth="+135,375.21" />
        <KpiCard label="较上月" growth="+135,375.21" />
        <KpiCard label="较上日" growth="-135,375.21" />
        <KpiCard label="市场份额" value="25.23%" />
        <KpiCard label="较年初" growth="+12.23%" />
        <KpiCard label="较上月" growth="-12.23%" />
      </div>

      {/* Charts Row: Bar Chart + Line Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendBarChart data={trendData} title="时点贷款余额（贷款合计）" unit="亿元" />
        <MultiLineChart
          data={lineData.map((d) => ({ month: d.month, value: d.value }))}
          lines={[{ key: "value", label: "市场份额", color: "hsl(0, 85%, 46%)" }]}
          title="市场份额"
          unit="%"
        />
      </div>

      {/* 四行排名 */}
      <MultiLineChart
        data={multiLineData}
        lines={[
          { key: "bank1", label: "中行", color: "hsl(0, 85%, 46%)" },
          { key: "bank2", label: "工行", color: "hsl(30, 80%, 50%)" },
          { key: "bank3", label: "农行", color: "hsl(140, 60%, 40%)" },
          { key: "bank4", label: "建行", color: "hsl(220, 70%, 45%)" },
        ]}
        title="四行排名"
        unit="亿元"
        height={260}
      />

      {/* Liabilities Section */}
      <div className="border-t border-border pt-6">
        <div className="flex items-center gap-4 flex-wrap mb-4">
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-foreground mr-1">{'|'}</span>
            <span className="text-sm font-semibold text-foreground">负债情况</span>
          </div>
          <TabNavigation tabs={currencyTabs} activeTab={activeCurrency} onTabChange={setActiveCurrency} variant="pill" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>单位：亿元、亿美元</span>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 py-2 px-4 bg-card rounded border border-border mb-6">
          <KpiCard label="存款合计时点余额" value="2,839.42" tooltip="存款合计时点余额说明" />
          <KpiCard label="较年初" growth="+135,375.21" />
          <KpiCard label="较上月" growth="+135,375.21" />
          <KpiCard label="较上日" growth="-135,375.21" />
          <KpiCard label="市场份额" value="25.23%" />
          <KpiCard label="较年初" growth="+12.23%" />
          <KpiCard label="较上月" growth="-12.23%" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrendBarChart data={trendData} title="时点存款余额（存款合计）" unit="亿元" />
          <MultiLineChart
            data={lineData.map((d) => ({ month: d.month, value: d.value }))}
            lines={[{ key: "value", label: "市场份额", color: "hsl(0, 85%, 46%)" }]}
            title="市场份额"
            unit="%"
          />
        </div>

        <div className="mt-6">
          <MultiLineChart
            data={multiLineData}
            lines={[
              { key: "bank1", label: "中行", color: "hsl(0, 85%, 46%)" },
              { key: "bank2", label: "工行", color: "hsl(30, 80%, 50%)" },
              { key: "bank3", label: "农行", color: "hsl(140, 60%, 40%)" },
              { key: "bank4", label: "建行", color: "hsl(220, 70%, 45%)" },
            ]}
            title="四行排名"
            unit="亿元"
            height={260}
          />
        </div>
      </div>
    </div>
  )
}
