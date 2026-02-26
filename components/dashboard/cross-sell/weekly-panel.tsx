"use client"

import { useState, useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"
import { ArrowUpDown, ChevronUp, ChevronDown, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, ReferenceLine, Cell,
} from "recharts"
import {
  generateWeeklyData, generateWeeklyTrend, availableWeeks, type WeeklyBranchRow,
} from "@/lib/cross-sell-data"

type SortField = "weeklyNew" | "weeklyBound" | "weeklyUnbound" | "weeklyBindRate"
type SortDir = "asc" | "desc"
type ActiveKpi = "weeklyNew" | "weeklyBound" | "weeklyBindRate"

interface Props {
  selectedInstitution: string
}

// ── Tooltips ─────────────────────────────────────────────────────
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

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const v = payload[0]?.value as number
  return (
    <div className="bg-card border border-border rounded px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full inline-block" style={{ background: v >= 0 ? "hsl(0,85%,46%)" : "hsl(140,60%,40%)" }} />
        <span className="text-muted-foreground">{"周环比:"}</span>
        <span className={cn("font-medium tabular-nums", v >= 0 ? "text-[hsl(0,85%,46%)]" : "text-bank-green")}>
          {v >= 0 ? "+" : ""}{v.toFixed(2)}%
        </span>
      </p>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────
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

const kpiMeta: Record<ActiveKpi, { key: string; label: string }> = {
  weeklyNew: { key: "weeklyNew", label: "当周新增客户数" },
  weeklyBound: { key: "weeklyBound", label: "当周已绑定客户数" },
  weeklyBindRate: { key: "weeklyBindRate", label: "当周绑定率" },
}

// ── Main ─────────────────────────────────────────────────────────
export function WeeklyPanel({ selectedInstitution }: Props) {
  const [selectedWeek, setSelectedWeek] = useState(availableWeeks[availableWeeks.length - 1].id)
  const [activeKpi, setActiveKpi] = useState<ActiveKpi>("weeklyNew")
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

  const weekObj = availableWeeks.find(w => w.id === selectedWeek) ?? availableWeeks[0]

  const { summary, branches } = useMemo(
    () => generateWeeklyData(selectedWeek),
    [selectedWeek]
  )

  const displayRow = selectedInstitution === "all" ? summary : (
    branches.find(b => b.branchId === selectedInstitution) ?? summary
  )

  const trendData = useMemo(
    () => generateWeeklyTrend(selectedInstitution),
    [selectedInstitution]
  )

  const activeTrend = kpiMeta[activeKpi]

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

  return (
    <div className="flex flex-col gap-6">
      {/* Header with week selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground" suppressHydrationWarning>
          {"交叉销售 - 活动开展当周情况"}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{"选择周次："}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-sm text-foreground bg-card border-border">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                {weekObj.label}
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {availableWeeks.map(w => (
                <DropdownMenuItem
                  key={w.id}
                  className={w.id === selectedWeek ? "bg-primary/10 text-primary font-medium" : ""}
                  onSelect={() => setSelectedWeek(w.id)}
                >
                  {w.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* KPI sidebar + weekly trend chart */}
      <div className="bg-card rounded border border-border overflow-hidden">
        <div className="flex">
          {/* KPI sidebar */}
          <div className="w-[200px] shrink-0 border-r border-border py-2 flex flex-col gap-0.5">
            <KpiCard
              label="当周新增客户数"
              value={displayRow.weeklyNew}
              unit="户"
              isActive={activeKpi === "weeklyNew"}
              onClick={() => setActiveKpi("weeklyNew")}
            />
            <KpiCard
              label="已绑定自动还款客户数"
              value={displayRow.weeklyBound}
              unit="户"
              isActive={activeKpi === "weeklyBound"}
              onClick={() => setActiveKpi("weeklyBound")}
            />
            <KpiCard
              label="未绑定自动还款客户数"
              value={displayRow.weeklyUnbound}
              unit="户"
              isActive={false}
              onClick={() => {}}
            />
            <KpiCard
              label="绑定率"
              value={displayRow.weeklyBindRate}
              unit="%"
              isActive={activeKpi === "weeklyBindRate"}
              onClick={() => setActiveKpi("weeklyBindRate")}
            />
          </div>

          {/* Right: weekly trend charts */}
          <div className="flex-1 p-4 flex flex-col gap-4 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground" suppressHydrationWarning>
                {activeTrend.label}{"（各周趋势）"}
              </h4>
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
                  {"周环比"}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={180}>
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

            {/* Lower: WoW % bars */}
            <div>
              <p className="text-[11px] text-muted-foreground mb-2">{"周环比变化 (%)"}</p>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: "hsl(0,0%,45%)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(0,0%,45%)" }} width={50} tickFormatter={v => `${v}%`} domain={["auto", "auto"]} />
                  <RTooltip content={<BarTooltip />} />
                  <ReferenceLine y={0} stroke="hsl(0,0%,75%)" />
                  <Bar dataKey="wowPct" name="周环比" barSize={24} radius={[2, 2, 0, 0]}>
                    {trendData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.wowPct === null ? "transparent" : entry.wowPct >= 0 ? "hsl(0, 85%, 46%)" : "hsl(140, 60%, 40%)"} />
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
        <div className="px-4 py-3 border-b border-border">
          <h4 className="text-sm font-semibold text-foreground" suppressHydrationWarning>
            {"下辖机构排名 — 当周情况（"}{weekObj.start}{"-"}{weekObj.end}{"）"}
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="text-center px-3 py-2 font-semibold text-foreground border-b border-border w-[60px] whitespace-nowrap">{"序号"}</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground border-b border-border">{"机构"}</th>
                <th className="text-right px-3 py-2 font-semibold text-foreground border-b border-border">
                  <SortHeader label="当周新增客户数" field="weeklyNew" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
                </th>
                <th className="text-right px-3 py-2 font-semibold text-foreground border-b border-border">
                  <SortHeader label="已绑定客户数" field="weeklyBound" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
                </th>
                <th className="text-right px-3 py-2 font-semibold text-foreground border-b border-border">
                  <SortHeader label="未绑定客户数" field="weeklyUnbound" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
                </th>
                <th className="text-right px-3 py-2 font-semibold text-foreground border-b border-border w-[100px]">
                  <SortHeader label="绑定率" field="weeklyBindRate" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedBranches.map((row, i) => {
                const isHighlighted = selectedInstitution !== "all" && row.branchId === selectedInstitution
                const rateColor = row.weeklyBindRate >= 25 ? "text-bank-green" : row.weeklyBindRate < 10 ? "text-primary" : "text-foreground"
                return (
                  <tr
                    key={row.branchId}
                    className={cn(
                      "transition-colors",
                      isHighlighted ? "bg-red-50 dark:bg-red-950/30 ring-1 ring-inset ring-red-300 dark:ring-red-800" :
                        i % 2 === 0 ? "bg-card hover:bg-muted/50" : "bg-muted/30 hover:bg-muted/50"
                    )}
                  >
                    <td className="text-center px-3 py-2 border-b border-border tabular-nums text-foreground">{row.rank}</td>
                    <td className={cn("text-left px-3 py-2 border-b border-border", isHighlighted ? "font-semibold text-red-600 dark:text-red-400" : "text-foreground")}>
                      {row.branchName}
                    </td>
                    <td className="text-right px-3 py-2 border-b border-border tabular-nums text-foreground">{row.weeklyNew.toLocaleString()}</td>
                    <td className="text-right px-3 py-2 border-b border-border tabular-nums text-foreground">{row.weeklyBound.toLocaleString()}</td>
                    <td className="text-right px-3 py-2 border-b border-border tabular-nums text-foreground">{row.weeklyUnbound.toLocaleString()}</td>
                    <td className={cn("text-right px-3 py-2 border-b border-border tabular-nums font-semibold", rateColor)}>
                      {row.weeklyBindRate}%
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
