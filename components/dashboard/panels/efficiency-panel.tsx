"use client"

import { useMemo, useState } from "react"
import { generateEfficiencyData, type EfficiencyRow } from "@/lib/efficiency-data"
import { ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react"

interface EfficiencyPanelProps {
  selectedInstitution: string
  selectedDate: string
}

function formatTitleDate(dateStr: string): string {
  const parts = dateStr.split("/")
  if (parts.length !== 3) return dateStr
  return `${parts[0]}年${Number(parts[1])}月${Number(parts[2])}日`
}

type SortKey =
  | "rank" | "totalScore" | "efficiencyCust" | "efficiencyCustBase"
  | "growthRate" | "growthRateScore" | "growthIncrement" | "growthIncrScore"
  | "systemScore" | "annual10k" | "newActive" | "highendActive" | "crossBorder"
  | "depositActual" | "depositTarget" | "depositCompletionRate" | "depositDeduction"
type SortDir = "asc" | "desc"

export function EfficiencyPanel({ selectedInstitution, selectedDate }: EfficiencyPanelProps) {
  const [sortKey, setSortKey] = useState<SortKey>("rank")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  const { rows, summary } = useMemo(
    () => generateEfficiencyData(selectedDate),
    [selectedDate]
  )

  const titleDate = formatTitleDate(selectedDate)

  // Highlight the selected branch
  const highlightId = selectedInstitution === "all" ? null : selectedInstitution

  // Sort
  const sortedRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      if (typeof va === "number" && typeof vb === "number") {
        return sortDir === "asc" ? va - vb : vb - va
      }
      return 0
    })
    return sorted
  }, [rows, sortKey, sortDir])

  function toggleSort(key: SortKey) {
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

  const thBase = "px-2 py-2 text-xs font-semibold border-b border-r border-border whitespace-nowrap cursor-pointer hover:bg-muted/40 select-none"
  const tdBase = "px-2 py-1.5 text-xs border-b border-r border-border tabular-nums text-right"

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="bg-card rounded border border-border px-4 py-3" suppressHydrationWarning>
        <h2 className="text-base font-semibold text-foreground text-center" suppressHydrationWarning>
          {`对私折效指标表（${titleDate}）`}
        </h2>
        <p className="text-xs text-muted-foreground text-center mt-1" suppressHydrationWarning>
          {"按日更新，展示每月最后一天及当前月份最新数据即可"}
        </p>
      </div>

      {/* Table */}
      <div className="bg-card rounded border border-border overflow-x-auto">
        <table className="w-full border-collapse min-w-[1600px]">
          <thead>
            {/* Group headers */}
            <tr className="bg-muted/60">
              <th colSpan={4} className="px-2 py-1.5 text-xs font-semibold border-b border-r border-border text-center" />
              <th colSpan={8} className="px-2 py-1.5 text-xs font-semibold border-b border-r border-border text-center text-foreground">
                {"比系统得分"}
              </th>
              <th colSpan={4} className="px-2 py-1.5 text-xs font-semibold border-b border-r border-border text-center text-foreground">
                {"对私折效客户数构成"}
              </th>
              <th colSpan={4} className="px-2 py-1.5 text-xs font-semibold border-b border-border text-center text-foreground">
                {"对私商户日均存款"}
              </th>
            </tr>
            {/* Column headers */}
            <tr className="bg-muted/40">
              <th className={`${thBase} text-center w-[60px]`} onClick={() => toggleSort("rank")}>
                {"排名"}<SortIcon col="rank" />
              </th>
              <th className={`${thBase} text-left min-w-[100px]`}>{"机构"}</th>
              <th className={`${thBase} text-right`} onClick={() => toggleSort("totalScore")}>
                {"得分"}<SortIcon col="totalScore" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggleSort("efficiencyCustBase")}>
                {"2024年基数"}<SortIcon col="efficiencyCustBase" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggleSort("efficiencyCust")}>
                {"2025年"}<SortIcon col="efficiencyCust" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggleSort("growthRate")}>
                {"增速"}<SortIcon col="growthRate" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggleSort("growthRateScore")}>
                <span>{"增速得分率"}</span><br/><span className="font-normal text-muted-foreground">{"(占比70%)"}</span>
                <SortIcon col="growthRateScore" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggleSort("growthIncrement")}>
                {"增量"}<SortIcon col="growthIncrement" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggleSort("growthIncrScore")}>
                <span>{"增量得分率"}</span><br/><span className="font-normal text-muted-foreground">{"(占比30%)"}</span>
                <SortIcon col="growthIncrScore" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggleSort("systemScore")}>
                {"比系统得分"}<SortIcon col="systemScore" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggleSort("efficiencyCust")}>
                {"对私折效客户"}<SortIcon col="efficiencyCust" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggleSort("annual10k")}>
                {"信用卡年消费1万以上"}<SortIcon col="annual10k" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggleSort("newActive")}>
                {"新增活跃客户"}<SortIcon col="newActive" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggleSort("highendActive")}>
                {"中高端新增活跃"}<SortIcon col="highendActive" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggleSort("crossBorder")}>
                {"跨境交易客户"}<SortIcon col="crossBorder" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggleSort("depositActual")}>
                {"日均存款"}<SortIcon col="depositActual" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggleSort("depositTarget")}>
                {"目标"}<SortIcon col="depositTarget" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggleSort("depositCompletionRate")}>
                {"目标完成率"}<SortIcon col="depositCompletionRate" />
              </th>
              <th className={`${thBase} text-right border-r-0`} onClick={() => toggleSort("depositDeduction")}>
                {"扣分项"}<SortIcon col="depositDeduction" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => {
              const isHighlight = row.branchId === highlightId
              const rowCls = isHighlight ? "bg-primary/10 font-semibold" : "hover:bg-muted/30"
              return (
                <tr key={row.branchId} className={rowCls}>
                  <td className={`${tdBase} text-center`}>{row.rank}</td>
                  <td className={`${tdBase} text-left text-foreground`}>{row.branchName}</td>
                  <td className={`${tdBase} font-semibold text-foreground`}>{row.totalScore.toFixed(2)}</td>
                  <td className={tdBase}>{row.efficiencyCustBase.toFixed(0)}</td>
                  <td className={tdBase}>{row.efficiencyCust.toFixed(0)}</td>
                  <td className={tdBase}>{row.growthRate.toFixed(2)}%</td>
                  <td className={tdBase}>{row.growthRateScore.toFixed(2)}%</td>
                  <td className={tdBase}>{row.growthIncrement >= 0 ? "" : ""}{row.growthIncrement.toFixed(0)}</td>
                  <td className={tdBase}>{row.growthIncrScore.toFixed(2)}%</td>
                  <td className={`${tdBase} font-semibold`}>{row.systemScore.toFixed(2)}</td>
                  <td className={tdBase}>{row.efficiencyCust.toFixed(0)}</td>
                  <td className={tdBase}>{row.annual10k.toFixed(0)}</td>
                  <td className={tdBase}>{row.newActive.toFixed(0)}</td>
                  <td className={tdBase}>{row.highendActive.toFixed(0)}</td>
                  <td className={tdBase}>{row.crossBorder.toFixed(0)}</td>
                  <td className={tdBase}>{row.depositActual.toFixed(2)}</td>
                  <td className={tdBase}>{row.depositTarget.toFixed(2)}</td>
                  <td className={`${tdBase} ${row.depositCompletionRate >= 100 ? "text-[hsl(140,60%,40%)]" : "text-primary"}`}>
                    {row.depositCompletionRate.toFixed(2)}%
                  </td>
                  <td className={`${tdBase} border-r-0 ${row.depositDeduction > 0 ? "text-primary font-semibold" : ""}`}>
                    {row.depositDeduction > 0 ? `-${row.depositDeduction.toFixed(2)}` : "0.00"}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Scoring Explanation */}
      <div className="bg-card rounded border border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground mb-2">{"评分规则说明"}</h3>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
          <li>{"对私折效客户数 = 信用卡年消费1w客户 x 30% + 新增活跃客户 x 25% + 中高端新增活跃客户 x 25% + 跨境交易客户 x 20%"}</li>
          <li>{"比系统得分 = 增速得分率 x 70% + 增量得分率 x 30%（基于各分行与全行平均值的偏差标准化计算）"}</li>
          <li>{"对私商户日均存款扣分：目标完成率 < 100% 时，扣分 = (1 - 完成率) x 20，最高扣20分"}</li>
          <li>{"各分行总得分 = 比系统得分 - 对私商户日均存款扣分"}</li>
        </ul>
      </div>
    </div>
  )
}
