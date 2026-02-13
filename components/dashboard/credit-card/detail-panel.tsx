"use client"

import { useState, useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"
import { ArrowUp, ArrowDown, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, ReferenceLine, Legend,
} from "recharts"
import type { IndicatorRow } from "@/lib/credit-card-data"
import {
  generateTrendData, generateBranchRanking, generateBranchComparison,
  getIndicatorDef, branchList,
} from "@/lib/credit-card-data"

// ── Types ─────────────────────────────────────────────────────────
interface KpiDef {
  id: string
  label: string
  parentId?: string
}

interface DetailPanelProps {
  kpiDefs: KpiDef[]
  indicators: IndicatorRow[]
  selectedInstitution: string
  selectedDate: string
  /** e.g. "信用卡经营指标表 - 有效客户数" */
  sectionTitle: string
}

// ── Custom Tooltip ────────────────────────────────────────────────
function TrendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium text-foreground tabular-nums">
            {typeof p.value === "number" ? p.value.toLocaleString("zh-CN", { maximumFractionDigits: 2 }) : p.value}
          </span>
        </p>
      ))}
    </div>
  )
}

// ── KPI Sidebar Card ──────────────────────────────────────────────
function KpiSideCard({
  row, isActive, onClick, depth,
}: {
  row: IndicatorRow
  isActive: boolean
  onClick: () => void
  depth: number
}) {
  const isPositive = row.comparisonRaw >= 0
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left border-l-[3px] transition-colors rounded-r",
        isActive
          ? "border-l-primary bg-primary/5"
          : "border-l-transparent hover:bg-muted/50",
        depth === 0 && "px-3 py-2.5",
        depth === 1 && "pl-6 pr-3 py-2",
        depth === 2 && "pl-9 pr-3 py-1.5",
      )}
    >
      <p className={cn(
        "font-medium",
        isActive ? "text-primary" : "text-muted-foreground",
        depth === 0 ? "text-xs" : "text-[11px]",
      )}>
        {row.name}
      </p>
      <p className={cn(
        "font-bold tabular-nums mt-0.5",
        depth === 0 ? "text-lg" : depth === 1 ? "text-base" : "text-sm",
      )}>
        {row.value}
        <span className="text-[10px] font-normal text-muted-foreground ml-1">{row.unit}</span>
      </p>
      <p className="text-[11px] mt-0.5">
        <span className="text-muted-foreground">{row.comparisonType} </span>
        <span className={cn("font-semibold tabular-nums", isPositive ? "text-primary" : "text-bank-green")}>
          {row.comparison}
        </span>
      </p>
    </button>
  )
}

// ── Sortable column header ────────────────────────────────────────
type SortField = "value" | "growth"
type SortDir = "asc" | "desc"

function SortHeader({
  label, field, currentField, currentDir, onSort,
}: {
  label: string; field: SortField
  currentField: SortField | null; currentDir: SortDir
  onSort: (field: SortField) => void
}) {
  const isActive = currentField === field
  return (
    <button
      className="inline-flex items-center gap-1 hover:text-primary transition-colors"
      onClick={() => onSort(field)}
    >
      <span>{label}</span>
      {isActive ? (
        currentDir === "desc"
          ? <ChevronDown className="h-3 w-3 text-primary" />
          : <ChevronUp className="h-3 w-3 text-primary" />
      ) : (
        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
      )}
    </button>
  )
}

// ── Depth helper ──────────────────────────────────────────────────
function getDepth(kd: KpiDef, kpiDefs: KpiDef[]): number {
  let d = 0
  let current = kd
  while (current.parentId) {
    d++
    const parent = kpiDefs.find(k => k.id === current.parentId)
    if (!parent) break
    current = parent
  }
  return d
}

// ── Main Detail Panel ─────────────────────────────────────────────
export function DetailPanel({
  kpiDefs, indicators, selectedInstitution, selectedDate, sectionTitle,
}: DetailPanelProps) {
  const topLevel = kpiDefs.filter(k => !k.parentId)
  const [activeKpi, setActiveKpi] = useState(topLevel[0]?.id ?? kpiDefs[0]?.id)

  // Sorting state for ranking table
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

  // Map indicator rows by id
  const rowMap = useMemo(() => {
    const m = new Map<string, IndicatorRow>()
    indicators.forEach(r => m.set(r.id, r))
    return m
  }, [indicators])

  const activeRow = rowMap.get(activeKpi)
  const activeDef = getIndicatorDef(activeKpi)

  // Trend data
  const trendData = useMemo(
    () => generateTrendData(activeKpi, selectedInstitution),
    [activeKpi, selectedInstitution]
  )

  // Branch ranking for active indicator + sorted
  const rankingData = useMemo(() => {
    const rows = generateBranchRanking(activeKpi, selectedDate)
    if (!sortField) return rows
    const sorted = [...rows]
    sorted.sort((a, b) => {
      const va = sortField === "value" ? a.value : a.growth
      const vb = sortField === "value" ? b.value : b.growth
      return sortDir === "desc" ? vb - va : va - vb
    })
    // Re-rank after sort
    sorted.forEach((r, i) => { r.rank = i + 1 })
    return sorted
  }, [activeKpi, selectedDate, sortField, sortDir])

  // Branch trend comparison (top 5)
  const [showComparison, setShowComparison] = useState(false)
  const topBranchIds = useMemo(
    () => generateBranchRanking(activeKpi, selectedDate).slice(0, 5).map(r => r.branchId),
    [activeKpi, selectedDate]
  )
  const comparisonData = useMemo(
    () => generateBranchComparison(activeKpi, topBranchIds),
    [activeKpi, topBranchIds]
  )

  const compLabel = activeRow?.comparisonType === "较年初" ? "较年初增长" : "同比增长"

  return (
    <div className="flex flex-col gap-6">
      {/* Section title */}
      <h3 className="text-sm font-semibold text-foreground">{sectionTitle}</h3>

      {/* Top area: KPI cards (left) + Trend charts (right) */}
      <div className="bg-card rounded border border-border overflow-hidden">
        <div className="flex">
          {/* KPI sidebar */}
          <div className="w-[200px] shrink-0 border-r border-border py-2 flex flex-col gap-0.5 overflow-y-auto max-h-[500px]">
            {kpiDefs.map(kd => {
              const row = rowMap.get(kd.id)
              if (!row) return null
              const depth = getDepth(kd, kpiDefs)
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
          <div className="flex-1 p-4 flex flex-col gap-6">
            {/* Top chart: indicator value trend (blue line) */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">
                {activeRow?.name ?? ""}月趋势
              </h4>
              <p className="text-[11px] text-muted-foreground mb-2">
                {"单位: "}{activeRow?.unit ?? ""}
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "hsl(0,0%,45%)" }}
                    tickFormatter={v => v.split("/")[1] + "月"}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(0,0%,45%)" }}
                    tickFormatter={v => v.toLocaleString()}
                  />
                  <RTooltip content={<TrendTooltip />} />
                  <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={activeRow?.name ?? ""}
                    stroke="hsl(220, 70%, 45%)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "hsl(220, 70%, 45%)" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom chart: MoM growth bars (red/green) */}
            <div>
              <p className="text-[11px] text-muted-foreground mb-2">较上月增长</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "hsl(0,0%,45%)" }}
                    tickFormatter={v => v.split("/")[1] + "月"}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(0,0%,45%)" }}
                    tickFormatter={v => v.toLocaleString()}
                  />
                  <RTooltip content={<TrendTooltip />} />
                  <ReferenceLine y={0} stroke="hsl(0,0%,75%)" />
                  <Bar
                    dataKey="growthValue"
                    name="较上月增长"
                    radius={[2, 2, 0, 0]}
                    barSize={28}
                    fill="hsl(0, 85%, 46%)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Branch Ranking Table */}
      <div className="bg-card rounded border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">
            下辖机构排名 — {activeRow?.name ?? ""}
          </h4>
          <button
            onClick={() => setShowComparison(!showComparison)}
            className={cn(
              "text-xs px-3 py-1 rounded border transition-colors",
              showComparison
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:bg-muted"
            )}
          >
            分行趋势对比
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="text-center px-3 py-2 font-semibold text-foreground border-b border-border w-[60px]">
                  序号
                </th>
                <th className="text-left px-3 py-2 font-semibold text-foreground border-b border-border">
                  机构
                </th>
                <th className="text-right px-3 py-2 font-semibold text-foreground border-b border-border">
                  <SortHeader
                    label={`${activeRow?.name ?? ""} (${activeRow?.unit ?? ""})`}
                    field="value"
                    currentField={sortField}
                    currentDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th className="text-right px-3 py-2 font-semibold text-foreground border-b border-border w-[130px]">
                  <SortHeader
                    label={compLabel}
                    field="growth"
                    currentField={sortField}
                    currentDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {rankingData.map((row, i) => {
                const isPositive = row.growth >= 0
                return (
                  <tr
                    key={row.branchId}
                    className={cn(
                      "transition-colors hover:bg-muted/50",
                      i % 2 === 0 ? "bg-card" : "bg-muted/30"
                    )}
                  >
                    <td className="text-center px-3 py-2 border-b border-border tabular-nums text-foreground">
                      {row.rank}
                    </td>
                    <td className="text-left px-3 py-2 border-b border-border text-foreground">
                      {row.branchName}
                    </td>
                    <td className="text-right px-3 py-2 border-b border-border tabular-nums font-medium text-foreground">
                      {row.valueFormatted}
                    </td>
                    <td className="text-right px-3 py-2 border-b border-border">
                      <span className={cn(
                        "tabular-nums font-semibold inline-flex items-center gap-0.5",
                        isPositive ? "text-primary" : "text-bank-green"
                      )}>
                        {row.growthFormatted}
                        {isPositive
                          ? <ArrowUp className="h-3 w-3" />
                          : <ArrowDown className="h-3 w-3" />
                        }
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Branch Trend Comparison (toggle) */}
      {showComparison && (
        <div className="bg-card rounded border border-border p-4">
          <h4 className="text-sm font-semibold text-foreground mb-1">
            分行趋势对比 — {activeRow?.name ?? ""}
          </h4>
          <p className="text-xs text-muted-foreground mb-3">
            展示排名前5的分行月度趋势
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
              <XAxis
                dataKey="month"
                type="category"
                allowDuplicatedCategory={false}
                tick={{ fontSize: 11, fill: "hsl(0,0%,45%)" }}
                tickFormatter={v => v.split("/")[1] + "月"}
              />
              <YAxis tick={{ fontSize: 11, fill: "hsl(0,0%,45%)" }} />
              <RTooltip content={<TrendTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12 }} />
              {comparisonData.map((line) => (
                <Line
                  key={line.branchId}
                  data={line.data}
                  type="monotone"
                  dataKey="value"
                  name={line.branchName}
                  stroke={line.color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: line.color }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
