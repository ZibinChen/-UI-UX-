"use client"

import { useState, useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"
import { ArrowUp, ArrowDown, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, ReferenceLine, Legend, Cell,
} from "recharts"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import type { IndicatorRow } from "@/lib/credit-card-data"
import {
  generateTrendData, generateBranchRanking, generateBranchComparison,
  getIndicatorDef, branchList, institutions,
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
  sectionTitle: string
}

// ── Custom Tooltips ───────────────────────────────────────────────
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

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const v = payload[0]?.value as number
  return (
    <div className="bg-card border border-border rounded px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full inline-block" style={{ background: v >= 0 ? "hsl(0,85%,46%)" : "hsl(140,60%,40%)" }} />
        <span className="text-muted-foreground">同比:</span>
        <span className={cn("font-medium tabular-nums", v >= 0 ? "text-[hsl(0,85%,46%)]" : "text-bank-green")}>
          {v >= 0 ? "+" : ""}{v.toFixed(2)}%
        </span>
      </p>
    </div>
  )
}

function CompareTooltip({ active, payload, label }: any) {
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

// ── KPI Card (horizontal scroll on mobile) ────────────────────────
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
        "shrink-0 text-left border-b-2 transition-colors rounded px-2 py-1.5 min-w-[90px]",
        isActive
          ? "border-b-primary bg-primary/5"
          : "border-b-transparent hover:bg-muted/50",
        depth > 0 && "min-w-[80px]",
      )}
    >
      <p className={cn(
        "font-medium truncate",
        isActive ? "text-primary" : "text-muted-foreground",
        "text-[9px]",
      )}>
        {row.name}
      </p>
      <p className="font-bold tabular-nums mt-0.5 text-xs">
        {row.value}
        <span className="text-[8px] font-normal text-muted-foreground ml-0.5">{row.unit}</span>
      </p>
      <p className="text-[9px] mt-0.5">
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

  // Sorting state
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  // Dialog state for branch comparison
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedBranches, setSelectedBranches] = useState<string[]>([])

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === "desc" ? "asc" : "desc")
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }, [sortField])

  // Row map
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

  // Branch ranking
  const rankingData = useMemo(() => {
    const rows = generateBranchRanking(activeKpi, selectedDate)
    if (!sortField) return rows
    const sorted = [...rows]
    sorted.sort((a, b) => {
      const va = sortField === "value" ? a.value : a.growth
      const vb = sortField === "value" ? b.value : b.growth
      return sortDir === "desc" ? vb - va : va - vb
    })
    sorted.forEach((r, i) => { r.rank = i + 1 })
    return sorted
  }, [activeKpi, selectedDate, sortField, sortDir])

  // Branch comparison data (from dialog selection)
  const comparisonData = useMemo(
    () => selectedBranches.length > 0
      ? generateBranchComparison(activeKpi, selectedBranches)
      : [],
    [activeKpi, selectedBranches]
  )

  const compLabel = activeRow?.comparisonType === "较年初" ? "较年初增长" : "同比增长"

  // Toggle branch in dialog
  const toggleBranch = (branchId: string) => {
    setSelectedBranches(prev =>
      prev.includes(branchId)
        ? prev.filter(b => b !== branchId)
        : prev.length >= 6 ? prev : [...prev, branchId]
    )
  }

  // Open dialog with top-5 pre-selected
  const openCompareDialog = () => {
    const top5 = generateBranchRanking(activeKpi, selectedDate).slice(0, 5).map(r => r.branchId)
    setSelectedBranches(top5)
    setDialogOpen(true)
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-[10px] font-semibold text-foreground">{sectionTitle}</h3>

      {/* Top area: KPI cards (horizontal scroll on mobile) + charts */}
      <div className="bg-card rounded border border-border overflow-hidden">
        {/* KPI cards - horizontal scroll on mobile */}
        <div className="flex overflow-x-auto scrollbar-hide border-b border-border py-1.5 px-1.5 gap-1.5">
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
                onClick={() => { setActiveKpi(kd.id); setSortField(null) }}
              />
            )
          })}
        </div>

        {/* Charts stacked vertically */}
        <div className="p-2 flex flex-col gap-2 min-w-0">
            {/* Upper chart: value trend line (blue) */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <h4 className="text-[10px] font-semibold text-foreground">
                  {activeRow?.name ?? ""}月趋势
                </h4>
              </div>
              <p className="text-[9px] text-muted-foreground mb-0.5">
                {"单位: "}{activeRow?.unit ?? ""}
              </p>
              <ResponsiveContainer width="100%" height={130}>
                <LineChart data={trendData} margin={{ top: 3, right: 8, left: 0, bottom: 3 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 9, fill: "hsl(0,0%,45%)" }}
                    tickFormatter={v => v.split("/")[1] + "月"}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "hsl(0,0%,45%)" }}
                    width={45}
                    tickFormatter={v => Number(v).toLocaleString("zh-CN")}
                    domain={["auto", "auto"]}
                  />
                  <RTooltip content={<LineTooltip />} />
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

            {/* Lower chart: YoY % bars (red positive / green negative) */}
            <div>
              <p className="text-[9px] text-muted-foreground mb-0.5">同比增长 (%)</p>
              <ResponsiveContainer width="100%" height={80}>
                <BarChart data={trendData} margin={{ top: 3, right: 8, left: 0, bottom: 3 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 9, fill: "hsl(0,0%,45%)" }}
                    tickFormatter={v => v.split("/")[1] + "月"}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "hsl(0,0%,45%)" }}
                    width={35}
                    tickFormatter={v => `${v}%`}
                    domain={["auto", "auto"]}
                  />
                  <RTooltip content={<BarTooltip />} />
                  <ReferenceLine y={0} stroke="hsl(0,0%,75%)" />
                  <Bar dataKey="yoyPct" name="同比" barSize={24} radius={[2, 2, 0, 0]}>
                    {trendData.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={entry.yoyPct >= 0 ? "hsl(0, 85%, 46%)" : "hsl(140, 60%, 40%)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      

      {/* Branch Ranking Table */}
      <div className="bg-card rounded border border-border overflow-hidden">
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <h4 className="text-xs font-semibold text-foreground truncate">
            机构排名 — {activeRow?.name ?? ""}
          </h4>
          <button
            onClick={openCompareDialog}
            className="text-[10px] px-2 py-1 rounded border border-border bg-card text-foreground hover:bg-muted transition-colors shrink-0"
          >
            分行对比
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[320px]">
            <thead>
              <tr className="bg-muted">
                <th className="text-center px-2 py-1.5 font-semibold text-foreground border-b border-border w-[40px]">序号</th>
                <th className="text-left px-2 py-1.5 font-semibold text-foreground border-b border-border">机构</th>
                <th className="text-right px-2 py-1.5 font-semibold text-foreground border-b border-border">
                  <SortHeader
                    label={activeRow?.unit ?? "数值"}
                    field="value"
                    currentField={sortField}
                    currentDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th className="text-right px-2 py-1.5 font-semibold text-foreground border-b border-border w-[80px]">
                  <SortHeader
                    label="增长"
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
                const isHighlighted = selectedInstitution !== "all" && row.branchId === selectedInstitution
                return (
                  <tr
                    key={row.branchId}
                    className={cn(
                      "transition-colors",
                      isHighlighted
                        ? "bg-red-50 dark:bg-red-950/30"
                        : i % 2 === 0 ? "bg-card" : "bg-muted/30"
                    )}
                  >
                    <td className="text-center px-2 py-1.5 border-b border-border tabular-nums text-foreground">{row.rank}</td>
                    <td className={cn("text-left px-2 py-1.5 border-b border-border truncate max-w-[100px]", isHighlighted ? "font-semibold text-red-600 dark:text-red-400" : "text-foreground")}>
                      {row.branchName}
                    </td>
                    <td className="text-right px-2 py-1.5 border-b border-border tabular-nums font-medium text-foreground">{row.valueFormatted}</td>
                    <td className="text-right px-2 py-1.5 border-b border-border">
                      <span className={cn("tabular-nums font-semibold inline-flex items-center gap-0.5", isPositive ? "text-primary" : "text-bank-green")}>
                        {row.growthFormatted}
                        {isPositive ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparison chart (shown after dialog confirm) */}
      {comparisonData.length > 0 && !dialogOpen && (
        <div className="bg-card rounded border border-border p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-foreground truncate">
              分行趋势对比
            </h4>
            <button
              onClick={() => setSelectedBranches([])}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              收起
            </button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
              <XAxis
                dataKey="month"
                type="category"
                allowDuplicatedCategory={false}
                tick={{ fontSize: 11, fill: "hsl(0,0%,45%)" }}
                tickFormatter={v => v.split("/")[1] + "月"}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(0,0%,45%)" }}
                width={60}
                tickFormatter={v => Number(v).toLocaleString("zh-CN")}
                domain={["auto", "auto"]}
              />
              <RTooltip content={<CompareTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
              {comparisonData.map(line => (
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

      {/* Branch Selection Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] max-h-[80vh] overflow-hidden flex flex-col mx-2">
          <DialogHeader>
            <DialogTitle className="text-sm">选择分行进行对比</DialogTitle>
            <DialogDescription className="text-xs">
              选择 2-6 个分行（已选 {selectedBranches.length}/6）
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 -mx-4 px-4">
            <div className="grid grid-cols-2 gap-1.5 py-2">
              {branchList.map(b => {
                const checked = selectedBranches.includes(b.id)
                const disabled = !checked && selectedBranches.length >= 6
                return (
                  <label
                    key={b.id}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1.5 rounded border text-xs cursor-pointer transition-colors",
                      checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                      disabled && !checked && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={disabled}
                      onCheckedChange={() => toggleBranch(b.id)}
                      className="h-3.5 w-3.5"
                    />
                    <span className={cn("truncate", checked ? "text-primary font-medium" : "text-foreground")}>
                      {b.name}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <button
              onClick={() => setSelectedBranches([])}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              清空
            </button>
            <button
              onClick={() => setDialogOpen(false)}
              disabled={selectedBranches.length < 2}
              className={cn(
                "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                selectedBranches.length >= 2
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              确认 ({selectedBranches.length})
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
