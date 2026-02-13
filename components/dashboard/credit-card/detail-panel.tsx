"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { ArrowUp, ArrowDown } from "lucide-react"
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, ReferenceLine, Legend,
  LineChart,
} from "recharts"
import type {
  IndicatorRow, TrendPoint, BranchRankRow, BranchTrendLine,
} from "@/lib/credit-card-data"
import {
  generateTrendData, generateBranchRanking, generateBranchComparison,
  getIndicatorDef, institutions, branchList,
} from "@/lib/credit-card-data"

// ── Types ─────────────────────────────────────────────────────────
interface KpiDef {
  id: string
  label: string
  parentId?: string   // if set, this is a "child" card grouped under parentId
}

interface DetailPanelProps {
  kpiDefs: KpiDef[]
  indicators: IndicatorRow[]
  selectedInstitution: string
  selectedDate: string
}

// ── Custom Tooltip ────────────────────────────────────────────────
function TrendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium text-foreground tabular-nums">{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</span>
        </p>
      ))}
    </div>
  )
}

// ── KPI Sidebar Card ──────────────────────────────────────────────
function KpiSideCard({
  row, isActive, onClick, isChild,
}: {
  row: IndicatorRow
  isActive: boolean
  onClick: () => void
  isChild?: boolean
}) {
  const isPositive = row.comparisonRaw >= 0
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2.5 border-l-[3px] transition-colors rounded-r",
        isActive
          ? "border-l-primary bg-primary/5"
          : "border-l-transparent hover:bg-muted/50",
        isChild && "pl-5"
      )}
    >
      <p className={cn(
        "text-xs font-medium",
        isActive ? "text-primary" : "text-muted-foreground"
      )}>
        {row.name}
      </p>
      <p className={cn(
        "text-lg font-bold tabular-nums mt-0.5",
        isActive ? "text-foreground" : "text-foreground"
      )}>
        {row.value}
        <span className="text-xs font-normal text-muted-foreground ml-1">{row.unit}</span>
      </p>
      <p className="text-xs mt-0.5">
        <span className="text-muted-foreground">{row.comparisonType} </span>
        <span className={cn("font-semibold tabular-nums", isPositive ? "text-primary" : "text-bank-green")}>
          {row.comparison}
        </span>
      </p>
    </button>
  )
}

// ── Main Detail Panel ─────────────────────────────────────────────
export function DetailPanel({
  kpiDefs, indicators, selectedInstitution, selectedDate,
}: DetailPanelProps) {
  // Find first top-level KPI as default
  const topLevel = kpiDefs.filter(k => !k.parentId)
  const [activeKpi, setActiveKpi] = useState(topLevel[0]?.id ?? kpiDefs[0]?.id)

  // Map indicator rows by id
  const rowMap = useMemo(() => {
    const m = new Map<string, IndicatorRow>()
    indicators.forEach(r => m.set(r.id, r))
    return m
  }, [indicators])

  const activeRow = rowMap.get(activeKpi)
  const activeDef = getIndicatorDef(activeKpi)

  // Generate trend & ranking for active indicator
  const trendData = useMemo(
    () => generateTrendData(activeKpi, selectedInstitution),
    [activeKpi, selectedInstitution]
  )

  const rankingData = useMemo(
    () => generateBranchRanking(activeKpi, selectedDate),
    [activeKpi, selectedDate]
  )

  // Branch comparison: pick top-5 branches for comparison
  const [showComparison, setShowComparison] = useState(false)
  const topBranchIds = useMemo(() => {
    return rankingData.slice(0, 5).map(r => r.branchId)
  }, [rankingData])

  const comparisonData = useMemo(
    () => generateBranchComparison(activeKpi, topBranchIds),
    [activeKpi, topBranchIds]
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Top area: KPI cards (left) + Trend chart (right) */}
      <div className="bg-card rounded border border-border overflow-hidden">
        <div className="flex">
          {/* KPI sidebar */}
          <div className="w-[200px] shrink-0 border-r border-border py-2 flex flex-col gap-0.5 overflow-y-auto max-h-[400px]">
            {kpiDefs.map(kd => {
              const row = rowMap.get(kd.id)
              if (!row) return null
              return (
                <KpiSideCard
                  key={kd.id}
                  row={row}
                  isActive={activeKpi === kd.id}
                  isChild={!!kd.parentId}
                  onClick={() => setActiveKpi(kd.id)}
                />
              )
            })}
          </div>

          {/* Trend chart */}
          <div className="flex-1 p-4">
            <h4 className="text-sm font-semibold text-foreground mb-3">
              {activeRow?.name ?? ""}月趋势
            </h4>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "hsl(0,0%,45%)" }}
                  tickFormatter={v => v.split("/")[1] + "月"}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: "hsl(0,0%,45%)" }}
                  tickFormatter={v => v.toLocaleString()}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "hsl(0,0%,45%)" }}
                  tickFormatter={v => v.toLocaleString()}
                />
                <RTooltip content={<TrendTooltip />} />
                <ReferenceLine yAxisId="right" y={0} stroke="hsl(0,0%,80%)" />
                <Bar
                  yAxisId="right"
                  dataKey="growthValue"
                  name="较上月增长"
                  fill="hsl(0, 85%, 46%)"
                  radius={[2, 2, 0, 0]}
                  barSize={24}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="value"
                  name={activeRow?.name ?? ""}
                  stroke="hsl(220, 70%, 45%)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "hsl(220, 70%, 45%)" }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Branch Ranking Table */}
      <div className="bg-card rounded border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">下辖机构排名</h4>
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
                <th className="text-center px-3 py-2 font-semibold text-foreground border-b border-border w-[60px]">序号</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground border-b border-border">机构</th>
                <th className="text-right px-3 py-2 font-semibold text-foreground border-b border-border">
                  {activeRow?.name ?? ""} {activeRow?.unit ? `(${activeRow.unit})` : ""}
                </th>
                <th className="text-right px-3 py-2 font-semibold text-foreground border-b border-border w-[120px]">
                  {activeRow?.comparisonType === "较年初" ? "较年初增长" : "同比增长"}
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
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{ fontSize: 12 }}
              />
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
