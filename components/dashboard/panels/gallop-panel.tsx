"use client"

import { useMemo, useState, useCallback } from "react"
import { TabNavigation } from "../tab-navigation"
import {
  generateGallopSummaryIndicators,
  generateGallopEfficiency,
  generateGallopConsume,
  generateGallopCrossBorder,
  generateGallopZhuojun,
  generateGallopTrend,
  gallopBranchList,
  GALLOP_INDICATOR_DEFS,
  type GallopEffRow,
  type GallopConsumeRow,
  type GallopCrossBorderRow,
  type GallopZhuojunRow,
  type GallopTrendPoint,
  type GallopIndicatorRow,
} from "@/lib/gallop-data"
import {
  ArrowUp, ArrowDown, ArrowUpDown, ChevronUp, ChevronDown, GitCompareArrows, Info, Minus,
} from "lucide-react"
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Legend, ReferenceLine, Cell,
} from "recharts"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface GallopPanelProps {
  selectedInstitution: string
  selectedDate: string
}

const subTabs = [
  { id: "all", label: "全部指标" },
  { id: "efficiency", label: "信用卡折效客户数" },
  { id: "consume", label: "信用卡消费" },
  { id: "crossBorder", label: "信用卡跨境交易" },
  { id: "zhuojun", label: "卓隽信用卡发卡" },
]

const thBase = "px-2 py-2 text-xs font-semibold border-b border-r border-border whitespace-nowrap cursor-pointer hover:bg-muted/40 select-none"
const tdBase = "px-2 py-1.5 text-xs border-b border-r border-border tabular-nums text-right"

const COMPARE_COLORS = [
  "hsl(220, 70%, 50%)", "hsl(0, 85%, 50%)", "hsl(140, 55%, 40%)",
  "hsl(35, 90%, 50%)", "hsl(280, 60%, 55%)", "hsl(180, 55%, 40%)",
]

// ── Tooltip components ───────────────────────────────────────────
function LineTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="bg-card border border-border rounded px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
        <span className="text-muted-foreground">{p.name}:</span>
        <span className="font-medium text-foreground tabular-nums">
          {typeof p.value === "number" ? p.value.toLocaleString("zh-CN", { maximumFractionDigits: 2 }) : p.value}
        </span>
      </p>
    </div>
  )
}

function BarTooltipComp({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const v = payload[0]?.value as number
  return (
    <div className="bg-card border border-border rounded px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full inline-block" style={{ background: v >= 0 ? "hsl(0,85%,46%)" : "hsl(140,60%,40%)" }} />
        <span className="text-muted-foreground">{"同比:"}</span>
        <span className={cn("font-medium tabular-nums", v >= 0 ? "text-[hsl(0,85%,46%)]" : "text-bank-green")}>
          {v >= 0 ? "+" : ""}{v.toFixed(2)}%
        </span>
      </p>
    </div>
  )
}

function CompareLineTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded px-3 py-2 shadow-lg text-xs min-w-[180px]">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="text-muted-foreground truncate max-w-[100px]">{p.name}:</span>
          <span className="font-medium text-foreground tabular-nums">
            {typeof p.value === "number" ? p.value.toLocaleString("zh-CN", { maximumFractionDigits: 2 }) : p.value}
          </span>
        </p>
      ))}
    </div>
  )
}

function formatTitleDate(dateStr: string): string {
  const parts = dateStr.split("/")
  if (parts.length !== 3) return dateStr
  return `${parts[0]}年${Number(parts[1])}月${Number(parts[2])}日`
}

function ValueArrow({ raw }: { raw: number }) {
  if (Math.abs(raw) < 0.001) return <Minus className="h-3 w-3 text-muted-foreground shrink-0" />
  if (raw < 0) return <ArrowDown className="h-3 w-3 text-bank-green shrink-0" />
  return <ArrowUp className="h-3 w-3 text-primary shrink-0" />
}

function colorClass(raw: number): string {
  if (Math.abs(raw) < 0.001) return "text-muted-foreground"
  return raw < 0 ? "text-bank-green" : "text-primary"
}

// ── KPI sidebar card (like detail-panel) ─────────────────────────
function KpiSideCard({ row, isActive, depth, onClick }: {
  row: GallopIndicatorRow; isActive: boolean; depth: number; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2 transition-colors border-l-2",
        isActive
          ? "bg-primary/10 border-l-primary"
          : "border-l-transparent hover:bg-muted/50"
      )}
      style={{ paddingLeft: `${8 + depth * 12}px` }}
    >
      <p className={cn("text-[11px] leading-tight truncate",
        depth === 0 ? "font-semibold text-foreground" : "text-muted-foreground"
      )}>
        {row.name}
      </p>
      <p className={cn("tabular-nums mt-0.5",
        isActive ? "text-primary" : "text-foreground",
        depth === 0 ? "text-sm font-bold" : "text-xs font-semibold"
      )}>
        {row.value}
        <span className="text-[10px] text-muted-foreground ml-1">{row.unit}</span>
      </p>
      {row.comparison && (
        <p className={cn("text-[10px] tabular-nums mt-0.5", colorClass(row.comparisonRaw))}>
          {row.comparisonType}{row.comparison}
        </p>
      )}
    </button>
  )
}

// ── Main Panel ───────────────────────────────────────────────────
export function GallopPanel({ selectedInstitution, selectedDate }: GallopPanelProps) {
  const [activeTab, setActiveTab] = useState("all")

  return (
    <div className="flex flex-col gap-6">
      <TabNavigation tabs={subTabs} activeTab={activeTab} onTabChange={setActiveTab} variant="pill" />

      {/* Title card */}
      <div className="bg-card rounded border border-border px-4 py-3">
        <h2 className="text-base font-semibold text-foreground text-center">
          {"万马奔腾指标表"}
        </h2>
        <p className="text-xs text-muted-foreground text-center mt-1">
          {`当年截至最新时间点累计值（${formatTitleDate(selectedDate)}）`}
        </p>
      </div>

      {activeTab === "all" && (
        <AllIndicatorsTab selectedDate={selectedDate} selectedInstitution={selectedInstitution} />
      )}
      {activeTab === "efficiency" && (
        <DetailSubTab tabKey="efficiency" selectedInstitution={selectedInstitution} selectedDate={selectedDate} />
      )}
      {activeTab === "consume" && (
        <DetailSubTab tabKey="consume" selectedInstitution={selectedInstitution} selectedDate={selectedDate} />
      )}
      {activeTab === "crossBorder" && (
        <DetailSubTab tabKey="crossBorder" selectedInstitution={selectedInstitution} selectedDate={selectedDate} />
      )}
      {activeTab === "zhuojun" && (
        <DetailSubTab tabKey="zhuojun" selectedInstitution={selectedInstitution} selectedDate={selectedDate} />
      )}
    </div>
  )
}

/* ================================================================
   Tab 1: 全部指标 — left-aligned table matching 综合经营计划 style
   ================================================================ */
function AllIndicatorsTab({ selectedDate, selectedInstitution }: { selectedDate: string; selectedInstitution: string }) {
  const indicators = useMemo(
    () => generateGallopSummaryIndicators(selectedDate, selectedInstitution),
    [selectedDate, selectedInstitution]
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card rounded border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="text-left px-3 py-2.5 font-semibold text-foreground border-b border-border whitespace-nowrap min-w-[200px]">
                  {"业务指标"}
                </th>
                <th className="text-right px-3 py-2.5 font-semibold text-foreground border-b border-border whitespace-nowrap min-w-[150px]">
                  {"业务量"}
                </th>
                <th className="text-right px-3 py-2.5 font-semibold text-foreground border-b border-border whitespace-nowrap min-w-[140px]">
                  {"同比变化"}
                </th>
              </tr>
            </thead>
            <tbody>
              {indicators.map((row, index) => {
                const isEvenRow = index % 2 === 0
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "transition-colors hover:bg-muted/50",
                      isEvenRow ? "bg-card" : "bg-muted/30"
                    )}
                  >
                    <td
                      className={cn(
                        "px-3 py-2 border-b border-border text-foreground whitespace-nowrap",
                        row.indent === 0 ? "font-semibold" : "font-normal"
                      )}
                      style={{ paddingLeft: `${row.indent * 20 + 12}px` }}
                    >
                      {row.name}
                    </td>
                    <td className="px-3 py-2 border-b border-border text-right whitespace-nowrap">
                      <span className="tabular-nums text-foreground font-medium">{row.value}</span>
                      <span className="text-xs text-muted-foreground ml-1">{row.unit}</span>
                    </td>
                    <td className="px-3 py-2 border-b border-border text-right whitespace-nowrap">
                      {row.comparison ? (
                        <div className="inline-flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">{row.comparisonType}</span>
                          <span className={cn("tabular-nums font-semibold text-sm", colorClass(row.comparisonRaw))}>
                            {row.comparison}
                          </span>
                          <ValueArrow raw={row.comparisonRaw} />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">{"-"}</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Definitions */}
      <div className="bg-card rounded border border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-muted-foreground" />
          {"指标定义与计算规则"}
        </h3>
        <div className="grid gap-4">
          {Object.entries(GALLOP_INDICATOR_DEFS).map(([key, def]) => (
            <div key={key} className="border-l-2 border-primary/30 pl-3">
              <p className="text-xs font-semibold text-foreground mb-1">{def.name}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{def.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   Tab 2-5: Detail sub-tab with KPI sidebar + trend charts + table
   ================================================================ */
type TabKey = "efficiency" | "consume" | "crossBorder" | "zhuojun"

// KPI definitions per tab — these drive the sidebar
const KPI_DEFS: Record<TabKey, { id: string; label: string; parentId?: string }[]> = {
  efficiency: [
    { id: "effCust", label: "信用卡折效客户数" },
    { id: "annual10k", label: "信用卡年消费1万以上客户", parentId: "effCust" },
    { id: "newActive", label: "新增活跃客户", parentId: "effCust" },
    { id: "highendActive", label: "中高端新增活跃客户", parentId: "effCust" },
    { id: "crossBorderSub", label: "跨境交易客户", parentId: "effCust" },
  ],
  consume: [
    { id: "totalConsume", label: "信用卡消费总额" },
    { id: "normalConsume", label: "普通消费", parentId: "totalConsume" },
    { id: "installmentConsume", label: "客户分期消费额", parentId: "totalConsume" },
  ],
  crossBorder: [
    { id: "totalCross", label: "信用卡跨境交易总额" },
    { id: "overseasConsume", label: "境外消费", parentId: "totalCross" },
    { id: "cashWithdraw", label: "取现交易额", parentId: "totalCross" },
  ],
  zhuojun: [
    { id: "newCards", label: "卓隽信用卡新发活动卡量" },
  ],
}

function DetailSubTab({
  tabKey, selectedInstitution, selectedDate,
}: {
  tabKey: TabKey; selectedInstitution: string; selectedDate: string
}) {
  const kpiDefs = KPI_DEFS[tabKey]
  const [activeKpi, setActiveKpi] = useState(kpiDefs[0].id)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogStep, setDialogStep] = useState<"branch" | "indicator">("branch")
  const [selectedBranches, setSelectedBranches] = useState<string[]>([])
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([])
  const [confirmedBranches, setConfirmedBranches] = useState<string[]>([])
  const [confirmedIndicators, setConfirmedIndicators] = useState<string[]>([])

  const def = GALLOP_INDICATOR_DEFS[tabKey]
  const highlightId = selectedInstitution === "all" ? null : selectedInstitution

  // Generate summary indicators for KPI sidebar (filtered by selected institution)
  const summaryIndicators = useMemo(
    () => generateGallopSummaryIndicators(selectedDate, selectedInstitution),
    [selectedDate, selectedInstitution]
  )

  // Map KPI IDs -> indicator rows for sidebar display
  const kpiRowMap = useMemo(() => {
    const map = new Map<string, GallopIndicatorRow>()
    summaryIndicators.forEach(r => map.set(r.id, r))
    return map
  }, [summaryIndicators])

  // Trend data based on activeKpi
  const trendData = useMemo(
    () => generateGallopTrend(tabKey, selectedInstitution, selectedDate, activeKpi),
    [tabKey, selectedInstitution, selectedDate, activeKpi]
  )
  const activeRow = kpiRowMap.get(activeKpi)

  // Available comparison indicators per tab
  const tabIndicators = useMemo(() => {
    switch (tabKey) {
      case "efficiency": return [
        { id: "effCust", label: "折效客户数" },
        { id: "annual10k", label: "信用卡年消费1万以上客户" },
        { id: "newActive", label: "新增活跃客户" },
        { id: "highendActive", label: "中高端新增活跃客户" },
        { id: "crossBorderSub", label: "跨境交易客户" },
        { id: "effCustBase", label: "上年基数" },
      ]
      case "consume": return [
        { id: "totalConsume", label: "信用卡消费总额" },
        { id: "normalConsume", label: "普通消费" },
        { id: "installmentConsume", label: "客户分期消费额" },
        { id: "yoyGrowth", label: "同比增长率" },
        { id: "score", label: "得分" },
      ]
      case "crossBorder": return [
        { id: "totalCross", label: "跨境交易总额" },
        { id: "overseasConsume", label: "境外消费" },
        { id: "cashWithdraw", label: "取现交易额" },
        { id: "contribution", label: "贡献度" },
        { id: "contributionChange", label: "贡献度变动" },
        { id: "score", label: "得分" },
      ]
      case "zhuojun": return [
        { id: "newCards", label: "新发活动卡量" },
        { id: "contribution", label: "贡献度" },
        { id: "contributionChange", label: "贡献度变动" },
        { id: "score", label: "得分" },
      ]
    }
  }, [tabKey])

  const openCompareDialog = useCallback(() => {
    const initial: string[] = []
    if (selectedInstitution !== "all") initial.push(selectedInstitution)
    setSelectedBranches(initial)
    setSelectedIndicators([tabIndicators[0]?.id ?? ""])
    setDialogStep("branch")
    setDialogOpen(true)
  }, [selectedInstitution, tabIndicators])

  const toggleBranch = (branchId: string) => {
    if (branchId === selectedInstitution && selectedInstitution !== "all") return
    setSelectedBranches(prev =>
      prev.includes(branchId) ? prev.filter(b => b !== branchId) : prev.length >= 6 ? prev : [...prev, branchId]
    )
  }
  const toggleIndicator = (id: string) => {
    setSelectedIndicators(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : prev.length >= 4 ? prev : [...prev, id]
    )
  }
  const confirmComparison = () => {
    setConfirmedBranches([...selectedBranches])
    setConfirmedIndicators([...selectedIndicators])
    setDialogOpen(false)
  }

  // Build comparison trend data
  const comparisonChartData = useMemo(() => {
    if (confirmedBranches.length === 0 || confirmedIndicators.length === 0) return []
    return confirmedIndicators.map(indId => {
      const indDef = tabIndicators.find(i => i.id === indId)
      const allBranchRows: Record<string, any[]> = {}
      confirmedBranches.forEach(bId => {
        switch (tabKey) {
          case "efficiency": allBranchRows[bId] = generateGallopEfficiency(selectedDate); break
          case "consume": allBranchRows[bId] = generateGallopConsume(selectedDate); break
          case "crossBorder": allBranchRows[bId] = generateGallopCrossBorder(selectedDate); break
          case "zhuojun": allBranchRows[bId] = generateGallopZhuojun(selectedDate); break
        }
      })
      const chartDataPoints = confirmedBranches.map(bId => {
        const bName = gallopBranchList.find(b => b.id === bId)?.name ?? bId
        const rows = allBranchRows[bId] ?? []
        const row = rows.find((r: any) => r.branchId === bId)
        return { name: bName, value: row ? (row as any)[indId] ?? 0 : 0 }
      })
      return { indicatorId: indId, label: indDef?.label ?? indId, data: chartDataPoints }
    })
  }, [confirmedBranches, confirmedIndicators, tabKey, selectedDate, tabIndicators])

  return (
    <div className="flex flex-col gap-6">
      {/* Top area: KPI sidebar + dual trend charts */}
      <div className="bg-card rounded border border-border overflow-hidden">
        <div className="flex">
          {/* KPI sidebar */}
          <div className="w-[200px] shrink-0 border-r border-border py-2 flex flex-col gap-0.5 overflow-y-auto max-h-[520px]">
            {kpiDefs.map(kd => {
              const row = kpiRowMap.get(kd.id)
              if (!row) return null
              const depth = kd.parentId ? 1 : 0
              return (
                <KpiSideCard
                  key={kd.id}
                  row={row}
                  isActive={activeKpi === kd.id}
                  depth={depth}
                  onClick={() => setActiveKpi(kd.id)}
                />
              )
            })}
          </div>

          {/* Right: two charts stacked */}
          <div className="flex-1 p-4 flex flex-col gap-4 min-w-0">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-semibold text-foreground">
                  {activeRow?.name ?? ""}{"月趋势"}
                </h4>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-0.5 bg-[hsl(220,70%,45%)] inline-block rounded" />
                    {"累计值"}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-2.5 bg-[hsl(0,85%,46%)] inline-block rounded-sm" />
                    {"同比增长"}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mb-2">
                {"单位: "}{activeRow?.unit ?? ""}
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(0,0%,45%)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(0,0%,45%)" }} width={60}
                    tickFormatter={v => Number(v).toLocaleString("zh-CN")} domain={["auto", "auto"]} />
                  <RTooltip content={<LineTooltip />} />
                  <Line type="monotone" dataKey="value" name={activeRow?.name ?? ""}
                    stroke="hsl(220, 70%, 45%)" strokeWidth={2}
                    dot={{ r: 3, fill: "hsl(220, 70%, 45%)" }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground mb-2">{"同比增长 (%)"}</p>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(0,0%,45%)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(0,0%,45%)" }} width={50}
                    tickFormatter={v => `${v}%`} domain={["auto", "auto"]} />
                  <RTooltip content={<BarTooltipComp />} />
                  <ReferenceLine y={0} stroke="hsl(0,0%,75%)" />
                  <Bar dataKey="yoyPct" name="同比" barSize={24} radius={[2, 2, 0, 0]}>
                    {trendData.map((entry, idx) => (
                      <Cell key={idx}
                        fill={(entry.yoyPct ?? 0) >= 0 ? "hsl(0, 85%, 46%)" : "hsl(140, 60%, 40%)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Branch table */}
      <div className="bg-card rounded border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">
            {"下辖机构排名 — "}{def.name}
          </h4>
          <button
            onClick={openCompareDialog}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-border bg-card text-foreground hover:bg-muted transition-colors"
          >
            <GitCompareArrows className="w-3.5 h-3.5" />
            {"分行趋势对比"}
          </button>
        </div>

        {tabKey === "efficiency" && <EfficiencyTable selectedDate={selectedDate} highlightId={highlightId} />}
        {tabKey === "consume" && <ConsumeTable selectedDate={selectedDate} highlightId={highlightId} />}
        {tabKey === "crossBorder" && <CrossBorderTable selectedDate={selectedDate} highlightId={highlightId} />}
        {tabKey === "zhuojun" && <ZhuojunTable selectedDate={selectedDate} highlightId={highlightId} />}
      </div>

      {/* Comparison charts */}
      {comparisonChartData.length > 0 && !dialogOpen && (
        <div className="bg-card rounded border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-foreground">{"分行趋势对比"}</h4>
            <button
              onClick={() => { setConfirmedBranches([]); setConfirmedIndicators([]) }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >{"收起"}</button>
          </div>
          <div className={cn("grid gap-6", comparisonChartData.length === 1 ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2")}>
            {comparisonChartData.map(chart => (
              <div key={chart.indicatorId} className="border border-border rounded p-3">
                <p className="text-xs font-semibold text-foreground mb-2">{chart.label}</p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chart.data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(0,0%,45%)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(0,0%,45%)" }} width={65}
                      tickFormatter={v => Number(v).toLocaleString("zh-CN", { maximumFractionDigits: 2 })}
                      domain={["auto", "auto"]} />
                    <RTooltip content={<CompareLineTooltip />} />
                    <Bar dataKey="value" name={chart.label} barSize={32} radius={[4, 4, 0, 0]}>
                      {chart.data.map((_, idx) => (
                        <Cell key={idx} fill={COMPARE_COLORS[idx % COMPARE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {dialogStep === "branch" ? "第一步：选择分行" : "第二步：选择对比指标"}
            </DialogTitle>
            <DialogDescription>
              {dialogStep === "branch"
                ? `选择 1-6 个分行进行趋势对比（已选 ${selectedBranches.length}/6）${selectedInstitution !== "all" ? "，当前机构已自动选中" : ""}`
                : `选择 1-4 个指标进行对比（已选 ${selectedIndicators.length}/4）`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 -mx-6 px-6">
            {dialogStep === "branch" && (
              <div className="grid grid-cols-2 gap-2 py-2">
                {gallopBranchList.map(b => {
                  const checked = selectedBranches.includes(b.id)
                  const isForced = b.id === selectedInstitution && selectedInstitution !== "all"
                  const disabled = !checked && selectedBranches.length >= 6
                  return (
                    <label key={b.id} className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded border text-sm cursor-pointer transition-colors",
                      checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                      (disabled && !checked) && "opacity-40 cursor-not-allowed",
                      isForced && "ring-1 ring-primary/40"
                    )}>
                      <Checkbox checked={checked} disabled={isForced || (disabled && !checked)}
                        onCheckedChange={() => toggleBranch(b.id)} />
                      <span className={cn("truncate", checked ? "text-primary font-medium" : "text-foreground", isForced && "font-semibold")}>
                        {b.name}{isForced ? "（当前）" : ""}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
            {dialogStep === "indicator" && (
              <div className="grid grid-cols-1 gap-2 py-2">
                {tabIndicators.map(ind => {
                  const checked = selectedIndicators.includes(ind.id)
                  const disabled = !checked && selectedIndicators.length >= 4
                  return (
                    <label key={ind.id} className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded border text-sm cursor-pointer transition-colors",
                      checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                      (disabled && !checked) && "opacity-40 cursor-not-allowed"
                    )}>
                      <Checkbox checked={checked} disabled={disabled && !checked}
                        onCheckedChange={() => toggleIndicator(ind.id)} />
                      <span className={cn("truncate", checked ? "text-primary font-medium" : "text-foreground")}>{ind.label}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border">
            {dialogStep === "branch" ? (
              <>
                <button onClick={() => { const i = selectedInstitution !== "all" ? [selectedInstitution] : []; setSelectedBranches(i) }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors">{"清空选择"}</button>
                <button onClick={() => setDialogStep("indicator")} disabled={selectedBranches.length < 1}
                  className={cn("px-4 py-2 rounded text-sm font-medium transition-colors",
                    selectedBranches.length >= 1 ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}>{`下一步：选择指标 (${selectedBranches.length})`}</button>
              </>
            ) : (
              <>
                <button onClick={() => setDialogStep("branch")}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors">{"上一步"}</button>
                <button onClick={confirmComparison} disabled={selectedIndicators.length < 1}
                  className={cn("px-4 py-2 rounded text-sm font-medium transition-colors",
                    selectedIndicators.length >= 1 ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}>{`确认对比 (${selectedIndicators.length})`}</button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ================================================================
   Branch Table: 信用卡折效客户数 (like efficiency system score)
   ================================================================ */
function EfficiencyTable({ selectedDate, highlightId }: { selectedDate: string; highlightId: string | null }) {
  const rows = useMemo(() => generateGallopEfficiency(selectedDate), [selectedDate])
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-[1200px]">
        <thead>
          <tr className="bg-muted/60">
            <th colSpan={2} className="px-2 py-1.5 text-xs font-semibold border-b border-r border-border" />
            <th colSpan={4} className="px-2 py-1.5 text-xs font-semibold border-b border-r border-border text-center text-foreground">{"四大客群（子指标）"}</th>
            <th className="px-2 py-1.5 text-xs font-semibold border-b border-r border-border text-center text-foreground">{"加权公式"}</th>
            <th className="px-2 py-1.5 text-xs font-semibold border-b border-r border-border text-center text-foreground">{"上年基数"}</th>
            <th colSpan={2} className="px-2 py-1.5 text-xs font-semibold border-b border-r border-border text-center text-foreground">{"增速"}</th>
            <th colSpan={2} className="px-2 py-1.5 text-xs font-semibold border-b border-r border-border text-center text-foreground">{"增量"}</th>
            <th className="px-2 py-1.5 text-xs font-semibold border-b border-border text-center text-foreground">{"结果"}</th>
          </tr>
          <tr className="bg-muted/40">
            <th className={`${thBase} text-center w-[60px] whitespace-nowrap`}>{"序号"}</th>
            <th className={`${thBase} text-left min-w-[80px]`}>{"机构"}</th>
            <th className={`${thBase} text-right`}>{"信用卡年消费"}<br />{"1万以上客户"}</th>
            <th className={`${thBase} text-right`}>{"新增活跃客户"}</th>
            <th className={`${thBase} text-right`}>{"中高端新增"}<br />{"活跃客户"}</th>
            <th className={`${thBase} text-right`}>{"跨境交易客户"}</th>
            <th className={`${thBase} text-right`}>{"折效客户数"}</th>
            <th className={`${thBase} text-right`}>{"上年基数"}</th>
            <th className={`${thBase} text-right`}>{"增速"}</th>
            <th className={`${thBase} text-right`}>{"增速得分率"}<br /><span className="font-normal text-muted-foreground">{"(占比70%)"}</span></th>
            <th className={`${thBase} text-right`}>{"增量"}</th>
            <th className={`${thBase} text-right`}>{"增量得分率"}<br /><span className="font-normal text-muted-foreground">{"(占比30%)"}</span></th>
            <th className={`${thBase} text-right border-r-0`}>{"比系统得分"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const hl = row.branchId === highlightId
            return (
              <tr key={row.branchId} className={hl ? "bg-red-50 dark:bg-red-950/30 font-semibold" : "hover:bg-muted/30"}>
                <td className={`${tdBase} text-center`}>{idx + 1}</td>
                <td className={`${tdBase} text-left text-foreground`}>{row.branchName}</td>
                <td className={tdBase}>{row.annual10k.toLocaleString()}</td>
                <td className={tdBase}>{row.newActive.toLocaleString()}</td>
                <td className={tdBase}>{row.highendActive.toLocaleString()}</td>
                <td className={tdBase}>{row.crossBorderSub.toLocaleString()}</td>
                <td className={`${tdBase} font-semibold text-foreground`}>{row.effCust.toLocaleString()}</td>
                <td className={tdBase}>{row.effCustBase.toLocaleString()}</td>
                <td className={`${tdBase} ${row.growthRate < 0 ? "text-bank-green" : ""}`}>{row.growthRate.toFixed(2)}%</td>
                <td className={tdBase}>{row.growthRateScore.toFixed(2)}%</td>
                <td className={tdBase}>{row.growthIncrement.toLocaleString()}</td>
                <td className={tdBase}>{row.growthIncrScore.toFixed(2)}%</td>
                <td className={`${tdBase} border-r-0 font-semibold text-foreground`}>{row.systemScore.toFixed(2)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ================================================================
   Branch Table: 信用卡消费 (满分30分)
   ================================================================ */
function ConsumeTable({ selectedDate, highlightId }: { selectedDate: string; highlightId: string | null }) {
  const rows = useMemo(() => generateGallopConsume(selectedDate), [selectedDate])
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-[1000px]">
        <thead>
          <tr className="bg-muted/60">
            <th colSpan={2} className="px-2 py-1.5 text-xs font-semibold border-b border-r border-border" />
            <th colSpan={3} className="px-2 py-1.5 text-xs font-semibold border-b border-r border-border text-center text-foreground">{"信用卡消费额"}</th>
            <th colSpan={3} className="px-2 py-1.5 text-xs font-semibold border-b border-r border-border text-center text-foreground">{"去年同期"}</th>
            <th colSpan={2} className="px-2 py-1.5 text-xs font-semibold border-b border-border text-center text-foreground">{"评分"}</th>
          </tr>
          <tr className="bg-muted/40">
            <th className={`${thBase} text-center w-[60px] whitespace-nowrap`}>{"排名"}</th>
            <th className={`${thBase} text-left min-w-[80px]`}>{"机构"}</th>
            <th className={`${thBase} text-right`}>{"消费总额"}<br />{"（亿元）"}</th>
            <th className={`${thBase} text-right`}>{"普通消费"}<br />{"（亿元）"}</th>
            <th className={`${thBase} text-right`}>{"客户分期"}<br />{"消费额（亿元）"}</th>
            <th className={`${thBase} text-right`}>{"消费总额"}<br />{"（亿元）"}</th>
            <th className={`${thBase} text-right`}>{"普通消费"}<br />{"（亿元）"}</th>
            <th className={`${thBase} text-right`}>{"客户分期"}<br />{"消费额（亿元）"}</th>
            <th className={`${thBase} text-right`}>{"同比增长"}</th>
            <th className={`${thBase} text-right border-r-0`}>{"得分"}<br />{"（满分30）"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const hl = row.branchId === highlightId
            const isPositive = row.yoyGrowth >= 0
            return (
              <tr key={row.branchId} className={hl ? "bg-red-50 dark:bg-red-950/30 font-semibold" : "hover:bg-muted/30"}>
                <td className={`${tdBase} text-center`}>{row.rank}</td>
                <td className={`${tdBase} text-left text-foreground`}>{row.branchName}</td>
                <td className={`${tdBase} font-semibold text-foreground`}>{row.totalConsume.toFixed(2)}</td>
                <td className={tdBase}>{row.normalConsume.toFixed(2)}</td>
                <td className={tdBase}>{row.installmentConsume.toFixed(2)}</td>
                <td className={tdBase}>{row.totalPrior.toFixed(2)}</td>
                <td className={tdBase}>{row.normalPrior.toFixed(2)}</td>
                <td className={tdBase}>{row.installmentPrior.toFixed(2)}</td>
                <td className={`${tdBase} ${isPositive ? "" : "text-bank-green"}`}>
                  {isPositive ? "+" : ""}{row.yoyGrowth.toFixed(2)}%
                </td>
                <td className={`${tdBase} border-r-0 font-semibold text-foreground`}>{row.score.toFixed(2)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ================================================================
   Branch Table: 信用卡跨境交易 (满分15分)
   ================================================================ */
function CrossBorderTable({ selectedDate, highlightId }: { selectedDate: string; highlightId: string | null }) {
  const rows = useMemo(() => generateGallopCrossBorder(selectedDate), [selectedDate])
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-[1100px]">
        <thead>
          <tr className="bg-muted/60">
            <th colSpan={2} className="px-2 py-1.5 text-xs font-semibold border-b border-r border-border" />
            <th colSpan={3} className="px-2 py-1.5 text-xs font-semibold border-b border-r border-border text-center text-foreground">{"跨境交易额"}</th>
            <th colSpan={3} className="px-2 py-1.5 text-xs font-semibold border-b border-r border-border text-center text-foreground">{"贡献度"}</th>
            <th colSpan={3} className="px-2 py-1.5 text-xs font-semibold border-b border-border text-center text-foreground">{"评分"}</th>
          </tr>
          <tr className="bg-muted/40">
            <th className={`${thBase} text-center w-[60px] whitespace-nowrap`}>{"排名"}</th>
            <th className={`${thBase} text-left min-w-[80px]`}>{"机构"}</th>
            <th className={`${thBase} text-right`}>{"跨境总额"}<br />{"（亿元）"}</th>
            <th className={`${thBase} text-right`}>{"境外消费"}<br />{"（亿元）"}</th>
            <th className={`${thBase} text-right`}>{"取现交易额"}<br />{"（亿元）"}</th>
            <th className={`${thBase} text-right`}>{"期末贡献度"}<br />{"(%)"}</th>
            <th className={`${thBase} text-right`}>{"去年同期"}<br />{"贡献度(%)"}</th>
            <th className={`${thBase} text-right`}>{"贡献度"}<br />{"变动"}</th>
            <th className={`${thBase} text-right`}>{"贡献度"}<br />{"得分(7.5)"}</th>
            <th className={`${thBase} text-right`}>{"变动"}<br />{"得分(7.5)"}</th>
            <th className={`${thBase} text-right border-r-0`}>{"总分"}<br />{"（满分15）"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const hl = row.branchId === highlightId
            return (
              <tr key={row.branchId} className={hl ? "bg-red-50 dark:bg-red-950/30 font-semibold" : "hover:bg-muted/30"}>
                <td className={`${tdBase} text-center`}>{row.rank}</td>
                <td className={`${tdBase} text-left text-foreground`}>{row.branchName}</td>
                <td className={`${tdBase} font-semibold text-foreground`}>{row.totalCross.toFixed(2)}</td>
                <td className={tdBase}>{row.overseasConsume.toFixed(2)}</td>
                <td className={tdBase}>{row.cashWithdraw.toFixed(2)}</td>
                <td className={tdBase}>{row.contribution.toFixed(2)}%</td>
                <td className={tdBase}>{row.contributionPrior.toFixed(2)}%</td>
                <td className={`${tdBase} ${row.contributionChange >= 0 ? "" : "text-bank-green"}`}>
                  {row.contributionChange >= 0 ? "+" : ""}{row.contributionChange.toFixed(4)}
                </td>
                <td className={tdBase}>{row.contribScore.toFixed(2)}</td>
                <td className={tdBase}>{row.changeScore.toFixed(2)}</td>
                <td className={`${tdBase} border-r-0 font-semibold text-foreground`}>{row.score.toFixed(2)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ================================================================
   Branch Table: 卓隽信用卡发卡 (满分10分)
   ================================================================ */
function ZhuojunTable({ selectedDate, highlightId }: { selectedDate: string; highlightId: string | null }) {
  const rows = useMemo(() => generateGallopZhuojun(selectedDate), [selectedDate])
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-[900px]">
        <thead>
          <tr className="bg-muted/60">
            <th colSpan={2} className="px-2 py-1.5 text-xs font-semibold border-b border-r border-border" />
            <th colSpan={2} className="px-2 py-1.5 text-xs font-semibold border-b border-r border-border text-center text-foreground">{"发卡量"}</th>
            <th colSpan={3} className="px-2 py-1.5 text-xs font-semibold border-b border-r border-border text-center text-foreground">{"贡献度"}</th>
            <th colSpan={3} className="px-2 py-1.5 text-xs font-semibold border-b border-border text-center text-foreground">{"评分"}</th>
          </tr>
          <tr className="bg-muted/40">
            <th className={`${thBase} text-center w-[60px] whitespace-nowrap`}>{"排名"}</th>
            <th className={`${thBase} text-left min-w-[80px]`}>{"机构"}</th>
            <th className={`${thBase} text-right`}>{"当年新发"}<br />{"活动卡量"}</th>
            <th className={`${thBase} text-right`}>{"去年同期"}<br />{"新发卡量"}</th>
            <th className={`${thBase} text-right`}>{"期末贡献度"}<br />{"(%)"}</th>
            <th className={`${thBase} text-right`}>{"去年同期"}<br />{"贡献度(%)"}</th>
            <th className={`${thBase} text-right`}>{"贡献度"}<br />{"变动"}</th>
            <th className={`${thBase} text-right`}>{"贡献度"}<br />{"得分(5)"}</th>
            <th className={`${thBase} text-right`}>{"变动"}<br />{"得分(5)"}</th>
            <th className={`${thBase} text-right border-r-0`}>{"总分"}<br />{"（满分10）"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const hl = row.branchId === highlightId
            return (
              <tr key={row.branchId} className={hl ? "bg-red-50 dark:bg-red-950/30 font-semibold" : "hover:bg-muted/30"}>
                <td className={`${tdBase} text-center`}>{row.rank}</td>
                <td className={`${tdBase} text-left text-foreground`}>{row.branchName}</td>
                <td className={`${tdBase} font-semibold text-foreground`}>{row.newCards.toFixed(2)}</td>
                <td className={tdBase}>{row.newCardsPrior.toFixed(2)}</td>
                <td className={tdBase}>{row.contribution.toFixed(2)}%</td>
                <td className={tdBase}>{row.contributionPrior.toFixed(2)}%</td>
                <td className={`${tdBase} ${row.contributionChange >= 0 ? "" : "text-bank-green"}`}>
                  {row.contributionChange >= 0 ? "+" : ""}{row.contributionChange.toFixed(4)}
                </td>
                <td className={tdBase}>{row.contribScore.toFixed(2)}</td>
                <td className={tdBase}>{row.changeScore.toFixed(2)}</td>
                <td className={`${tdBase} border-r-0 font-semibold text-foreground`}>{row.score.toFixed(2)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
