"use client"

import { useMemo, useState, useCallback } from "react"
import {
  generateEfficiencyData,
  availableQuarters,
  subIndicators,
  efficiencyBranchList,
  type EfficiencyRow,
} from "@/lib/efficiency-data"
import { TabNavigation } from "../tab-navigation"
import { ArrowUpDown, ChevronUp, ChevronDown, GitCompareArrows } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Legend,
} from "recharts"
import { cn } from "@/lib/utils"

interface EfficiencyPanelProps {
  selectedInstitution: string
  selectedDate: string
}

type SortKey = keyof EfficiencyRow
type SortDir = "asc" | "desc"

function useSortable(defaultKey: SortKey = "rank", defaultDir: SortDir = "asc") {
  const [sortKey, setSortKey] = useState<SortKey>(defaultKey)
  const [sortDir, setSortDir] = useState<SortDir>(defaultDir)

  function toggle(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir(key === "rank" ? "asc" : "desc")
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 ml-0.5 inline opacity-40" />
    return sortDir === "asc"
      ? <ChevronUp className="w-3 h-3 ml-0.5 inline text-primary" />
      : <ChevronDown className="w-3 h-3 ml-0.5 inline text-primary" />
  }

  function sort(rows: EfficiencyRow[]) {
    return [...rows].sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      if (typeof va === "number" && typeof vb === "number") {
        return sortDir === "asc" ? va - vb : vb - va
      }
      return 0
    })
  }

  return { sortKey, toggle, SortIcon, sort }
}

const thBase = "px-2 py-2 text-xs font-semibold border-b border-r border-border whitespace-nowrap cursor-pointer hover:bg-muted/40 select-none"
const tdBase = "px-2 py-1.5 text-xs border-b border-r border-border tabular-nums text-right"

const subTabs = [
  { id: "overview", label: "得分总览" },
  { id: "system", label: "比系统得分明细" },
  { id: "deposit", label: "对私商户日均存款扣分" },
]

const COMPARE_COLORS = [
  "hsl(220, 70%, 50%)", "hsl(0, 85%, 50%)", "hsl(140, 55%, 40%)",
  "hsl(35, 90%, 50%)", "hsl(280, 60%, 55%)", "hsl(180, 55%, 40%)",
]

// ── Tooltip ──────────────────────────────────────────────────────
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

// ── Main Panel ───────────────────────────────────────────────────
export function EfficiencyPanel({ selectedInstitution }: EfficiencyPanelProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedQuarter, setSelectedQuarter] = useState(availableQuarters[availableQuarters.length - 1].id)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogStep, setDialogStep] = useState<"branch" | "indicator">("branch")
  const [selectedBranches, setSelectedBranches] = useState<string[]>([])
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([])
  const [confirmedBranches, setConfirmedBranches] = useState<string[]>([])
  const [confirmedIndicators, setConfirmedIndicators] = useState<string[]>([])

  const { rows } = useMemo(
    () => generateEfficiencyData(selectedQuarter),
    [selectedQuarter]
  )

  const highlightId = selectedInstitution === "all" ? null : selectedInstitution

  // Dynamic year labels from data
  const currentYear = rows[0]?.currentYear ?? "2025"
  const priorYear = rows[0]?.priorYear ?? "2024"

  // Build tab indicators with dynamic years
  const TAB_INDICATORS_DYNAMIC: Record<string, { id: string; label: string }[]> = {
    overview: [
      { id: "totalScore", label: "得分" },
      { id: "systemScore", label: "比系统得分" },
      { id: "depositDeduction", label: "对私商户日均存款扣分" },
    ],
    system: [
      { id: "systemScore", label: "比系统得分" },
      { id: "efficiencyCust", label: `对私折效客户数（${currentYear}年）` },
      { id: "efficiencyCustBase", label: `${priorYear}年基数` },
      { id: "annual10k", label: "信用卡年消费1万以上客户" },
      { id: "newActive", label: "新增活跃客户" },
      { id: "highendActive", label: "中高端新增活跃客户" },
      { id: "crossBorder", label: "跨境交易客户" },
      { id: "growthRate", label: "增速(%)" },
      { id: "growthRateScore", label: "增速得分率(%)" },
      { id: "growthIncrScore", label: "增量得分率(%)" },
    ],
    deposit: [
      { id: "depositDeduction", label: "对私商户日均存款扣分" },
      { id: "depositActual", label: `${currentYear}年对私商户日均存款(亿元)` },
      { id: "depositTarget", label: `${currentYear}年目标(亿元)` },
      { id: "depositCompletionRate", label: "目标完成率(%)" },
    ],
  }

  // Available indicators for current tab
  const currentTabIndicators = TAB_INDICATORS_DYNAMIC[activeTab] ?? TAB_INDICATORS_DYNAMIC.overview

  // Open dialog: force-include selected institution, reset indicator selection to current tab
  const openCompareDialog = useCallback(() => {
    const initial: string[] = []
    if (selectedInstitution !== "all") {
      initial.push(selectedInstitution)
    }
    setSelectedBranches(initial)
    setSelectedIndicators([currentTabIndicators[0]?.id ?? "totalScore"])
    setDialogStep("branch")
    setDialogOpen(true)
  }, [selectedInstitution, currentTabIndicators])

  const toggleBranch = (branchId: string) => {
    if (branchId === selectedInstitution && selectedInstitution !== "all") return
    setSelectedBranches(prev =>
      prev.includes(branchId)
        ? prev.filter(b => b !== branchId)
        : prev.length >= 6 ? prev : [...prev, branchId]
    )
  }

  const toggleIndicator = (indicatorId: string) => {
    setSelectedIndicators(prev =>
      prev.includes(indicatorId)
        ? prev.filter(i => i !== indicatorId)
        : prev.length >= 4 ? prev : [...prev, indicatorId]
    )
  }

  const confirmComparison = () => {
    setConfirmedBranches([...selectedBranches])
    setConfirmedIndicators([...selectedIndicators])
    setDialogOpen(false)
  }

  // Clear comparison when switching tabs
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setConfirmedBranches([])
    setConfirmedIndicators([])
  }

  // ── Build trend comparison data (X=quarter, one line per branch) ──
  const trendChartData = useMemo(() => {
    if (confirmedBranches.length === 0 || confirmedIndicators.length === 0) return []

    return confirmedIndicators.map(indId => {
      const indDef = currentTabIndicators.find(i => i.id === indId)

      // Generate data for each quarter
      const quarterData = availableQuarters.map(q => {
        const { rows: qRows } = generateEfficiencyData(q.id)
        const entry: Record<string, any> = { quarter: q.label }
        confirmedBranches.forEach(bId => {
          const row = qRows.find(r => r.branchId === bId)
          const br = efficiencyBranchList.find(b => b.id === bId)
          entry[br?.name ?? bId] = row ? (row[indId as keyof EfficiencyRow] as number) : 0
        })
        return entry
      })

      return {
        indicatorId: indId,
        label: indDef?.label ?? indId,
        data: quarterData,
        branches: confirmedBranches.map(bId => {
          const br = efficiencyBranchList.find(b => b.id === bId)
          return br?.name ?? bId
        }),
      }
    })
  }, [confirmedBranches, confirmedIndicators, currentTabIndicators])

  return (
    <div className="flex flex-col gap-6">
      {/* Sub-tabs */}
      <TabNavigation tabs={subTabs} activeTab={activeTab} onTabChange={handleTabChange} variant="pill" />

      {/* Title card */}
      <div className="bg-card rounded border border-border px-4 py-3" suppressHydrationWarning>
        <h2 className="text-base font-semibold text-foreground text-center" suppressHydrationWarning>
          {"对私折效指标表"}
        </h2>
        <p className="text-xs text-muted-foreground text-center mt-1" suppressHydrationWarning>
          {"按季度结算，每季度计算一次得分"}
        </p>
      </div>

      {/* Controls row: right-aligned, stacked vertically */}
      <div className="flex justify-end">
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{"季度："}</span>
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="text-xs border border-border rounded px-2 py-1 bg-card text-foreground"
            >
              {availableQuarters.map(q => (
                <option key={q.id} value={q.id}>{q.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={openCompareDialog}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-border bg-card text-foreground hover:bg-muted transition-colors"
          >
            <GitCompareArrows className="w-3.5 h-3.5" />
            {"分行趋势对比"}
          </button>
        </div>
      </div>

      {/* Tables */}
      {activeTab === "overview" && (
        <OverviewTable rows={rows} highlightId={highlightId} />
      )}
      {activeTab === "system" && (
        <SystemScoreTable rows={rows} highlightId={highlightId} currentYear={currentYear} priorYear={priorYear} />
      )}
      {activeTab === "deposit" && (
        <DepositDeductionTable rows={rows} highlightId={highlightId} currentYear={currentYear} />
      )}

      {/* Trend comparison charts (below table) */}
      {trendChartData.length > 0 && !dialogOpen && (
        <div className="bg-card rounded border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-foreground">
              {"分行趋势对比"}
            </h4>
            <button
              onClick={() => { setConfirmedBranches([]); setConfirmedIndicators([]) }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {"收起"}
            </button>
          </div>
          <div className={cn(
            "grid gap-6",
            trendChartData.length === 1 ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
          )}>
            {trendChartData.map((chart) => (
              <div key={chart.indicatorId} className="border border-border rounded p-3">
                <p className="text-xs font-semibold text-foreground mb-2">{chart.label}</p>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chart.data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
                    <XAxis
                      dataKey="quarter"
                      tick={{ fontSize: 10, fill: "hsl(0,0%,45%)" }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "hsl(0,0%,45%)" }}
                      width={65}
                      tickFormatter={v => Number(v).toLocaleString("zh-CN", { maximumFractionDigits: 2 })}
                      domain={["auto", "auto"]}
                    />
                    <RTooltip content={<CompareLineTooltip />} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
                    {chart.branches.map((name, idx) => (
                      <Line
                        key={name}
                        type="monotone"
                        dataKey={name}
                        name={name}
                        stroke={COMPARE_COLORS[idx % COMPARE_COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 3, fill: COMPARE_COLORS[idx % COMPARE_COLORS.length] }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Branch Trend Comparison Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {dialogStep === "branch" ? "第一步：选择分行" : "第二步：选择对比指标"}
            </DialogTitle>
            <DialogDescription>
              {dialogStep === "branch"
                ? `选择 1-6 个分行进行趋势对比（已选 ${selectedBranches.length}/6）${selectedInstitution !== "all" ? "，当前机构已自动选中" : ""}`
                : `选择 1-4 个指标进行趋势对比（已选 ${selectedIndicators.length}/4）`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 -mx-6 px-6">
            {dialogStep === "branch" && (
              <div className="grid grid-cols-2 gap-2 py-2">
                {efficiencyBranchList.map(b => {
                  const checked = selectedBranches.includes(b.id)
                  const isForced = b.id === selectedInstitution && selectedInstitution !== "all"
                  const disabled = !checked && selectedBranches.length >= 6
                  return (
                    <label
                      key={b.id}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded border text-sm cursor-pointer transition-colors",
                        checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                        (disabled && !checked) && "opacity-40 cursor-not-allowed",
                        isForced && "ring-1 ring-primary/40"
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={isForced || (disabled && !checked)}
                        onCheckedChange={() => toggleBranch(b.id)}
                      />
                      <span className={cn(
                        "truncate",
                        checked ? "text-primary font-medium" : "text-foreground",
                        isForced && "font-semibold"
                      )}>
                        {b.name}{isForced ? "（当前）" : ""}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}

            {dialogStep === "indicator" && (
              <div className="grid grid-cols-1 gap-2 py-2">
                {currentTabIndicators.map(ind => {
                  const checked = selectedIndicators.includes(ind.id)
                  const disabled = !checked && selectedIndicators.length >= 4
                  return (
                    <label
                      key={ind.id}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded border text-sm cursor-pointer transition-colors",
                        checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                        (disabled && !checked) && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={disabled && !checked}
                        onCheckedChange={() => toggleIndicator(ind.id)}
                      />
                      <span className={cn("truncate", checked ? "text-primary font-medium" : "text-foreground")}>
                        {ind.label}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border">
            {dialogStep === "branch" ? (
              <>
                <button
                  onClick={() => {
                    const initial = selectedInstitution !== "all" ? [selectedInstitution] : []
                    setSelectedBranches(initial)
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {"清空选择"}
                </button>
                <button
                  onClick={() => setDialogStep("indicator")}
                  disabled={selectedBranches.length < 1}
                  className={cn(
                    "px-4 py-2 rounded text-sm font-medium transition-colors",
                    selectedBranches.length >= 1
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {`下一步：选择指标 (${selectedBranches.length})`}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setDialogStep("branch")}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {"上一步"}
                </button>
                <button
                  onClick={confirmComparison}
                  disabled={selectedIndicators.length < 1}
                  className={cn(
                    "px-4 py-2 rounded text-sm font-medium transition-colors",
                    selectedIndicators.length >= 1
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {`确认对比 (${selectedIndicators.length})`}
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ================================================================
   Tab 1: 得分总览
   ================================================================ */
function OverviewTable({ rows, highlightId }: { rows: EfficiencyRow[]; highlightId: string | null }) {
  const { toggle, SortIcon, sort } = useSortable()
  const sorted = sort(rows)

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card rounded border border-border overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className={`${thBase} text-center w-[60px]`} onClick={() => toggle("rank")}>
                {"排名"}<SortIcon col="rank" />
              </th>
              <th className={`${thBase} text-left min-w-[100px]`}>{"机构"}</th>
              <th className={`${thBase} text-right`} onClick={() => toggle("totalScore")}>
                {"得分"}<SortIcon col="totalScore" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggle("systemScore")}>
                {"比系统得分"}<SortIcon col="systemScore" />
              </th>
              <th className={`${thBase} text-right border-r-0`} onClick={() => toggle("depositDeduction")}>
                {"对私商户日均存款扣分"}<SortIcon col="depositDeduction" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const hl = row.branchId === highlightId
              return (
                <tr key={row.branchId} className={hl ? "bg-primary/10 font-semibold" : "hover:bg-muted/30"}>
                  <td className={`${tdBase} text-center`}>{row.rank}</td>
                  <td className={`${tdBase} text-left text-foreground`}>{row.branchName}</td>
                  <td className={`${tdBase} font-semibold text-foreground`}>{row.totalScore.toFixed(2)}</td>
                  <td className={tdBase}>{row.systemScore.toFixed(2)}</td>
                  <td className={`${tdBase} border-r-0 ${row.depositDeduction > 0 ? "text-primary font-semibold" : ""}`}>
                    {row.depositDeduction > 0 ? `-${row.depositDeduction.toFixed(2)}` : "0.00"}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="bg-card rounded border border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground mb-2">{"评分公式"}</h3>
        <p className="text-xs text-muted-foreground">
          {"各分行得分 = 比系统得分 - 对私商户日均存款扣分"}
        </p>
      </div>
    </div>
  )
}

/* ================================================================
   Tab 2: 比系统得分明细
   ================================================================ */
function SystemScoreTable({ rows, highlightId, currentYear, priorYear }: { rows: EfficiencyRow[]; highlightId: string | null; currentYear: string; priorYear: string }) {
  const { toggle, SortIcon, sort } = useSortable()
  const sorted = sort(rows)

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card rounded border border-border overflow-x-auto">
        <table className="w-full border-collapse min-w-[1500px]">
          <thead>
            <tr className="bg-muted/60">
              <th colSpan={2} className="px-2 py-1.5 text-xs font-semibold border-b border-r border-border" />
              <th colSpan={4} className="px-2 py-1.5 text-xs font-semibold border-b border-r border-border text-center text-foreground">
                {"四大客群（子指标）"}
              </th>
              <th className="px-2 py-1.5 text-xs font-semibold border-b border-r border-border text-center text-foreground">
                {"加权公式"}
              </th>
              <th className="px-2 py-1.5 text-xs font-semibold border-b border-r border-border text-center text-foreground">
                {`${priorYear}年基数`}
              </th>
              <th colSpan={2} className="px-2 py-1.5 text-xs font-semibold border-b border-r border-border text-center text-foreground">
                {"增速"}
              </th>
              <th colSpan={2} className="px-2 py-1.5 text-xs font-semibold border-b border-r border-border text-center text-foreground">
                {"增量"}
              </th>
              <th className="px-2 py-1.5 text-xs font-semibold border-b border-border text-center text-foreground">
                {"结果"}
              </th>
            </tr>
            <tr className="bg-muted/40">
              <th className={`${thBase} text-center w-[60px]`} onClick={() => toggle("rank")}>
                {"排名"}<SortIcon col="rank" />
              </th>
              <th className={`${thBase} text-left min-w-[80px]`}>{"机构"}</th>
              <th className={`${thBase} text-right`} onClick={() => toggle("annual10k")}>
                {"信用卡年消费"}<br />{"1万以上客户"}<SortIcon col="annual10k" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggle("newActive")}>
                {"新增活跃客户"}<SortIcon col="newActive" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggle("highendActive")}>
                {"中高端新增"}<br />{"活跃客户"}<SortIcon col="highendActive" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggle("crossBorder")}>
                {"跨境交易客户"}<SortIcon col="crossBorder" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggle("efficiencyCust")}>
                {"对私折效客户数"}<br />{`（${currentYear}年）`}<SortIcon col="efficiencyCust" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggle("efficiencyCustBase")}>
                {`${priorYear}年基数`}<SortIcon col="efficiencyCustBase" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggle("growthRate")}>
                {"增速"}<SortIcon col="growthRate" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggle("growthRateScore")}>
                {"增速得分率"}<br />
                <span className="font-normal text-muted-foreground">{"(占比70%)"}</span>
                <SortIcon col="growthRateScore" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggle("growthIncrement")}>
                {"增量"}<SortIcon col="growthIncrement" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggle("growthIncrScore")}>
                {"增量得分率"}<br />
                <span className="font-normal text-muted-foreground">{"(占比30%)"}</span>
                <SortIcon col="growthIncrScore" />
              </th>
              <th className={`${thBase} text-right border-r-0`} onClick={() => toggle("systemScore")}>
                {"比系统得分"}<SortIcon col="systemScore" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const hl = row.branchId === highlightId
              return (
                <tr key={row.branchId} className={hl ? "bg-primary/10 font-semibold" : "hover:bg-muted/30"}>
                  <td className={`${tdBase} text-center`}>{row.rank}</td>
                  <td className={`${tdBase} text-left text-foreground`}>{row.branchName}</td>
                  <td className={tdBase}>{row.annual10k.toLocaleString()}</td>
                  <td className={tdBase}>{row.newActive.toLocaleString()}</td>
                  <td className={tdBase}>{row.highendActive.toLocaleString()}</td>
                  <td className={tdBase}>{row.crossBorder.toLocaleString()}</td>
                  <td className={`${tdBase} font-semibold text-foreground`}>{row.efficiencyCust.toLocaleString()}</td>
                  <td className={tdBase}>{row.efficiencyCustBase.toLocaleString()}</td>
                  <td className={`${tdBase} ${row.growthRate < 0 ? "text-[hsl(140,60%,40%)]" : ""}`}>
                    {row.growthRate.toFixed(2)}%
                  </td>
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
      <div className="bg-card rounded border border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground mb-2">{"计算公式"}</h3>
        <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
          <li>
            {"对私折效客户数 = "}
            {subIndicators.map((si, i) => (
              <span key={si.id}>
                {i > 0 ? " + " : ""}
                {`${si.name} × ${si.formulaWeight}`}
              </span>
            ))}
          </li>
          <li>{`增速 = (${currentYear}年折效客户数 - ${priorYear}年基数) / ${priorYear}年基数`}</li>
          <li>{`增量 = ${currentYear}年折效客户数 - ${priorYear}年基数`}</li>
          <li>{"增速/增量得分率：基于各分行与全行平均值的标准差归一化，映射到 [30%, 130%]"}</li>
          <li>{"比系统得分 = (增速得分率 × 70% + 增量得分率 × 30%) × 100 / 10"}</li>
        </ul>
      </div>
    </div>
  )
}

/* ================================================================
   Tab 3: 对私商户日均存款扣分
   ================================================================ */
function DepositDeductionTable({ rows, highlightId, currentYear }: { rows: EfficiencyRow[]; highlightId: string | null; currentYear: string }) {
  const { toggle, SortIcon, sort } = useSortable()
  const sorted = sort(rows)

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card rounded border border-border overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className={`${thBase} text-center w-[60px]`} onClick={() => toggle("rank")}>
                {"排名"}<SortIcon col="rank" />
              </th>
              <th className={`${thBase} text-left min-w-[100px]`}>{"机构"}</th>
              <th className={`${thBase} text-right`} onClick={() => toggle("depositActual")}>
                {`${currentYear}年对私商户`}<br />{"日均存款（亿元）"}<SortIcon col="depositActual" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggle("depositTarget")}>
                {`${currentYear}年对私商户`}<br />{"日均存款目标（亿元）"}<SortIcon col="depositTarget" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggle("depositCompletionRate")}>
                {"目标完成率"}<SortIcon col="depositCompletionRate" />
              </th>
              <th className={`${thBase} text-right border-r-0`} onClick={() => toggle("depositDeduction")}>
                {"对私商户日均"}<br />{"存款扣分项"}<SortIcon col="depositDeduction" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const hl = row.branchId === highlightId
              const rateColor = row.depositCompletionRate >= 100
                ? "text-[hsl(140,60%,40%)]"
                : row.depositCompletionRate < 90
                  ? "text-primary"
                  : ""
              return (
                <tr key={row.branchId} className={hl ? "bg-primary/10 font-semibold" : "hover:bg-muted/30"}>
                  <td className={`${tdBase} text-center`}>{row.rank}</td>
                  <td className={`${tdBase} text-left text-foreground`}>{row.branchName}</td>
                  <td className={tdBase}>{row.depositActual.toFixed(2)}</td>
                  <td className={tdBase}>{row.depositTarget.toFixed(2)}</td>
                  <td className={`${tdBase} ${rateColor}`}>{row.depositCompletionRate.toFixed(2)}%</td>
                  <td className={`${tdBase} border-r-0 ${row.depositDeduction > 0 ? "text-primary font-semibold" : ""}`}>
                    {row.depositDeduction > 0 ? `-${row.depositDeduction.toFixed(2)}` : "0.00"}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="bg-card rounded border border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground mb-2">{"扣分规则"}</h3>
        <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
          <li>{`目标完成率 = ${currentYear}年对私商户日均存款 / 目标`}</li>
          <li>{"目标完成率 ≥ 100%：不扣分"}</li>
          <li>{"目标完成率 < 100%：扣分 = (1 - 完成率) × 10，最高扣10分"}</li>
        </ul>
      </div>
    </div>
  )
}
