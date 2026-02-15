"use client"

import { useState, useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"
import { ArrowUp, ArrowDown, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, ReferenceLine, Cell,
} from "recharts"
import {
  generateActivityData, generateActivityTrend,
  kpiList, type CrossSellBranchRow,
} from "@/lib/cross-sell-data"

// ── Types ────────────────────────────────────────────────────────
type SortField = "newCust" | "bound" | "unbound" | "bindRate"
type SortDir = "asc" | "desc"
type TrendMode = "month" | "week"

interface Props {
  selectedInstitution: string
  selectedDate: string
}

// ── Custom Tooltips ──────────────────────────────────────────────
function LineTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium text-foreground tabular-nums">
            {typeof p.value === "number" ? p.value.toLocaleString("zh-CN") : p.value}
          </span>
        </p>
      ))}
    </div>
  )
}

function BarMomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const v = payload[0]?.value as number
  return (
    <div className="bg-card border border-border rounded px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full inline-block" style={{ background: v >= 0 ? "hsl(0,85%,46%)" : "hsl(140,60%,40%)" }} />
        <span className="text-muted-foreground">环比:</span>
        <span className={cn("font-medium tabular-nums", v >= 0 ? "text-[hsl(0,85%,46%)]" : "text-bank-green")}>
          {v >= 0 ? "+" : ""}{v.toFixed(2)}%
        </span>
      </p>
    </div>
  )
}

// ── Sortable header ──────────────────────────────────────────────
function SortHeader({
  label, field, currentField, currentDir, onSort,
}: {
  label: string; field: SortField
  currentField: SortField | null; currentDir: SortDir
  onSort: (f: SortField) => void
}) {
  const isActive = currentField === field
  return (
    <button className="inline-flex items-center gap-1 hover:text-primary transition-colors" onClick={() => onSort(field)}>
      <span>{label}</span>
      {isActive ? (
        currentDir === "desc" ? <ChevronDown className="h-3 w-3 text-primary" /> : <ChevronUp className="h-3 w-3 text-primary" />
      ) : (
        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
      )}
    </button>
  )
}

// ── KPI Side Card ────────────────────────────────────────────────
function KpiCard({
  label, value, unit, isActive, onClick,
}: {
  label: string; value: number; unit: string; isActive: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left border-l-[3px] transition-colors rounded-r px-3 py-2.5",
        isActive ? "border-l-primary bg-primary/5" : "border-l-transparent hover:bg-muted/50",
      )}
    >
      <p className={cn("text-xs font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
        {label}
      </p>
      <p className="text-lg font-bold tabular-nums mt-0.5">
        {unit === "%" ? `${value}%` : value.toLocaleString("zh-CN")}
        {unit !== "%" && <span className="text-[10px] font-normal text-muted-foreground ml-1">{unit}</span>}
      </p>
    </button>
  )
}

// ── Main component ───────────────────────────────────────────────
export function ActivityProgressPanel({ selectedInstitution, selectedDate }: Props) {
  const [activeKpi, setActiveKpi] = useState("cs_new_cust")
  const [trendMode, setTrendMode] = useState<TrendMode>("month")
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === "desc" ? "asc" : "desc")
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }, [sortField])

  // Activity data
  const { summary, branches } = useMemo(
    () => generateActivityData(selectedInstitution, selectedDate),
    [selectedInstitution, selectedDate]
  )

  // Decide which data to show in the KPI cards
  const displayRow = selectedInstitution === "all" ? summary : (
    branches.find(b => b.branchId === selectedInstitution) ?? summary
  )

  // Trend data
  const trendData = useMemo(
    () => generateActivityTrend(selectedInstitution, trendMode),
    [selectedInstitution, trendMode]
  )

  // Map kpi id to the corresponding trend dataKey
  const trendKeyMap: Record<string, { key: string; label: string }> = {
    cs_new_cust: { key: "newCust", label: "活动新增客户数" },
    cs_bound: { key: "bound", label: "已绑定自动还款客户数" },
    cs_unbound: { key: "newCust", label: "活动新增客户数" },
    cs_bindrate: { key: "bindRate", label: "绑定率" },
  }
  const activeTrend = trendKeyMap[activeKpi] ?? trendKeyMap.cs_new_cust

  // Sorted branches for table
  const sortedBranches = useMemo(() => {
    if (!sortField) return branches
    const sorted = [...branches]
    sorted.sort((a, b) => {
      const va = a[sortField]
      const vb = b[sortField]
      return sortDir === "desc" ? vb - va : va - vb
    })
    sorted.forEach((r, i) => { r.rank = i + 1 })
    return sorted
  }, [branches, sortField, sortDir])

  const dateLabel = selectedDate.replace(/\//g, ".")

  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-sm font-semibold text-foreground" suppressHydrationWarning>
        {'交叉销售 - 活动开展情况（2025年9月5日 至 '}{dateLabel}{'）'}
      </h3>

      {/* KPI + trend area */}
      <div className="bg-card rounded border border-border overflow-hidden">
        <div className="flex">
          {/* KPI sidebar */}
          <div className="w-[200px] shrink-0 border-r border-border py-2 flex flex-col gap-0.5">
            <KpiCard
              label="活动新增客户数"
              value={displayRow.newCust}
              unit="户"
              isActive={activeKpi === "cs_new_cust"}
              onClick={() => setActiveKpi("cs_new_cust")}
            />
            <KpiCard
              label="已绑定自动还款客户数"
              value={displayRow.bound}
              unit="户"
              isActive={activeKpi === "cs_bound"}
              onClick={() => setActiveKpi("cs_bound")}
            />
            <KpiCard
              label="未绑定自动还款客户数"
              value={displayRow.unbound}
              unit="户"
              isActive={activeKpi === "cs_unbound"}
              onClick={() => setActiveKpi("cs_unbound")}
            />
            <KpiCard
              label="绑定率"
              value={displayRow.bindRate}
              unit="%"
              isActive={activeKpi === "cs_bindrate"}
              onClick={() => setActiveKpi("cs_bindrate")}
            />
          </div>

          {/* Right: trend charts */}
          <div className="flex-1 p-4 flex flex-col gap-4 min-w-0">
            {/* Mode toggle */}
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground" suppressHydrationWarning>
                {activeTrend.label}{'趋势'}
              </h4>
              <div className="flex items-center gap-0">
                <button
                  onClick={() => setTrendMode("month")}
                  className={cn(
                    "px-3 py-1 text-xs border font-medium transition-colors",
                    trendMode === "month" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"
                  )}
                >
                  按月
                </button>
                <button
                  onClick={() => setTrendMode("week")}
                  className={cn(
                    "px-3 py-1 text-xs border-y border-r font-medium transition-colors",
                    trendMode === "week" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"
                  )}
                >
                  按周
                </button>
              </div>
            </div>

            {/* Upper: value line */}
            <div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-[hsl(220,70%,45%)] inline-block rounded" />
                  {activeTrend.label}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-2.5 bg-[hsl(0,85%,46%)] inline-block rounded-sm" />
                  环比变化
                </span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: "hsl(0,0%,45%)" }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(0,0%,45%)" }}
                    width={60}
                    tickFormatter={v => Number(v).toLocaleString("zh-CN")}
                    domain={["auto", "auto"]}
                  />
                  <RTooltip content={<LineTooltip />} />
                  <Line
                    type="monotone"
                    dataKey={activeTrend.key}
                    name={activeTrend.label}
                    stroke="hsl(220, 70%, 45%)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "hsl(220, 70%, 45%)" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Lower: MoM % bars */}
            <div>
              <p className="text-[11px] text-muted-foreground mb-2">环比变化 (%)</p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: "hsl(0,0%,45%)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(0,0%,45%)" }} width={50} tickFormatter={v => `${v}%`} domain={["auto", "auto"]} />
                  <RTooltip content={<BarMomTooltip />} />
                  <ReferenceLine y={0} stroke="hsl(0,0%,75%)" />
                  <Bar dataKey="momPct" name="环比" barSize={24} radius={[2, 2, 0, 0]}>
                    {trendData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.momPct >= 0 ? "hsl(0, 85%, 46%)" : "hsl(140, 60%, 40%)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Branch ranking table */}
      <div className="bg-card rounded border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h4 className="text-sm font-semibold text-foreground" suppressHydrationWarning>
            {'下辖机构排名 — 活动开展情况'}
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="text-center px-3 py-2 font-semibold text-foreground border-b border-border w-[50px]">序号</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground border-b border-border">机构</th>
                <th className="text-right px-3 py-2 font-semibold text-foreground border-b border-border">
                  <SortHeader label="活动新增客户数" field="newCust" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
                </th>
                <th className="text-right px-3 py-2 font-semibold text-foreground border-b border-border">
                  <SortHeader label="已绑定客户数" field="bound" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
                </th>
                <th className="text-right px-3 py-2 font-semibold text-foreground border-b border-border">
                  <SortHeader label="未绑定客户数" field="unbound" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
                </th>
                <th className="text-right px-3 py-2 font-semibold text-foreground border-b border-border w-[100px]">
                  <SortHeader label="绑定率" field="bindRate" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Summary row */}
              <tr className="bg-muted/60 font-semibold">
                <td className="text-center px-3 py-2 border-b border-border" />
                <td className="text-left px-3 py-2 border-b border-border text-foreground">汇总</td>
                <td className="text-right px-3 py-2 border-b border-border tabular-nums text-foreground">{summary.newCust.toLocaleString()}</td>
                <td className="text-right px-3 py-2 border-b border-border tabular-nums text-foreground">{summary.bound.toLocaleString()}</td>
                <td className="text-right px-3 py-2 border-b border-border tabular-nums text-foreground">{summary.unbound.toLocaleString()}</td>
                <td className="text-right px-3 py-2 border-b border-border tabular-nums text-primary">{summary.bindRate}%</td>
              </tr>
              {sortedBranches.map((row, i) => {
                const isHighlighted = selectedInstitution !== "all" && row.branchId === selectedInstitution
                // Color code bind rate: green >= 25%, red < 10%
                const rateColor = row.bindRate >= 25 ? "text-bank-green" : row.bindRate < 10 ? "text-primary" : "text-foreground"
                return (
                  <tr
                    key={row.branchId}
                    className={cn(
                      "transition-colors",
                      isHighlighted ? "bg-primary/10 ring-1 ring-inset ring-primary/30" :
                        i % 2 === 0 ? "bg-card hover:bg-muted/50" : "bg-muted/30 hover:bg-muted/50"
                    )}
                  >
                    <td className="text-center px-3 py-2 border-b border-border tabular-nums text-foreground">{row.rank}</td>
                    <td className={cn("text-left px-3 py-2 border-b border-border", isHighlighted ? "font-semibold text-primary" : "text-foreground")}>
                      {row.branchName}
                    </td>
                    <td className="text-right px-3 py-2 border-b border-border tabular-nums text-foreground">{row.newCust.toLocaleString()}</td>
                    <td className="text-right px-3 py-2 border-b border-border tabular-nums text-foreground">{row.bound.toLocaleString()}</td>
                    <td className="text-right px-3 py-2 border-b border-border tabular-nums text-foreground">{row.unbound.toLocaleString()}</td>
                    <td className={cn("text-right px-3 py-2 border-b border-border tabular-nums font-semibold", rateColor)}>
                      {row.bindRate}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
