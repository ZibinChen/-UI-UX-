"use client"

import { useState, useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"
import { ArrowUpDown, ChevronUp, ChevronDown, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  generateWeeklyData, availableWeeks, type WeeklyBranchRow,
} from "@/lib/cross-sell-data"

type SortField = "weeklyNew" | "weeklyBound" | "weeklyUnbound" | "weeklyBindRate"
type SortDir = "asc" | "desc"

interface Props {
  selectedInstitution: string
}

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

function KpiCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="border border-border rounded px-4 py-3 bg-card">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="text-xl font-bold tabular-nums mt-1">
        {unit === "%" ? `${value}%` : value.toLocaleString("zh-CN")}
        {unit !== "%" && <span className="text-[10px] font-normal text-muted-foreground ml-1">{unit}</span>}
      </p>
    </div>
  )
}

export function WeeklyPanel({ selectedInstitution }: Props) {
  const [selectedWeek, setSelectedWeek] = useState(availableWeeks[availableWeeks.length - 1].id)
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
          {'交叉销售 - 活动开展当周情况'}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">选择周次：</span>
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

      {/* KPI summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="当周新增客户数" value={displayRow.weeklyNew} unit="户" />
        <KpiCard label="已绑定自动还款客户数" value={displayRow.weeklyBound} unit="户" />
        <KpiCard label="未绑定自动还款客户数" value={displayRow.weeklyUnbound} unit="户" />
        <KpiCard label="绑定率" value={displayRow.weeklyBindRate} unit="%" />
      </div>

      {/* Branch table */}
      <div className="bg-card rounded border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h4 className="text-sm font-semibold text-foreground" suppressHydrationWarning>
            {'下辖机构排名 — 当周情况（'}{weekObj.start}{'-'}{weekObj.end}{'）'}
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="text-center px-3 py-2 font-semibold text-foreground border-b border-border w-[50px]">序号</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground border-b border-border">机构</th>
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
              {/* Summary */}
              <tr className="bg-muted/60 font-semibold">
                <td className="text-center px-3 py-2 border-b border-border" />
                <td className="text-left px-3 py-2 border-b border-border text-foreground">汇总</td>
                <td className="text-right px-3 py-2 border-b border-border tabular-nums text-foreground">{summary.weeklyNew.toLocaleString()}</td>
                <td className="text-right px-3 py-2 border-b border-border tabular-nums text-foreground">{summary.weeklyBound.toLocaleString()}</td>
                <td className="text-right px-3 py-2 border-b border-border tabular-nums text-foreground">{summary.weeklyUnbound.toLocaleString()}</td>
                <td className="text-right px-3 py-2 border-b border-border tabular-nums text-primary">{summary.weeklyBindRate}%</td>
              </tr>
              {sortedBranches.map((row, i) => {
                const isHighlighted = selectedInstitution !== "all" && row.branchId === selectedInstitution
                const rateColor = row.weeklyBindRate >= 25 ? "text-bank-green" : row.weeklyBindRate < 10 ? "text-primary" : "text-foreground"
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
