"use client"

import { useMemo, useState } from "react"
import {
  generateEfficiencyData,
  availableQuarters,
  subIndicators,
  type EfficiencyRow,
} from "@/lib/efficiency-data"
import { TabNavigation } from "../tab-navigation"
import { ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react"

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
  { id: "system",   label: "比系统得分明细" },
  { id: "deposit",  label: "对私商户日均存款扣分" },
]

export function EfficiencyPanel({ selectedInstitution }: EfficiencyPanelProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedQuarter, setSelectedQuarter] = useState(availableQuarters[availableQuarters.length - 1].id)

  const { rows } = useMemo(
    () => generateEfficiencyData(selectedQuarter),
    [selectedQuarter]
  )

  const highlightId = selectedInstitution === "all" ? null : selectedInstitution
  const quarterLabel = availableQuarters.find(q => q.id === selectedQuarter)?.label ?? selectedQuarter

  return (
    <div className="flex flex-col gap-6">
      {/* Sub-tabs */}
      <TabNavigation tabs={subTabs} activeTab={activeTab} onTabChange={setActiveTab} variant="pill" />

      {/* Title + quarter selector */}
      <div className="bg-card rounded border border-border px-4 py-3 flex items-center justify-between" suppressHydrationWarning>
        <div>
          <h2 className="text-base font-semibold text-foreground" suppressHydrationWarning>
            {`对私折效指标表（${quarterLabel}）`}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5" suppressHydrationWarning>
            {"按季度结算，每季度计算一次得分"}
          </p>
        </div>
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
      </div>

      {activeTab === "overview" && (
        <OverviewTable rows={rows} highlightId={highlightId} />
      )}
      {activeTab === "system" && (
        <SystemScoreTable rows={rows} highlightId={highlightId} />
      )}
      {activeTab === "deposit" && (
        <DepositDeductionTable rows={rows} highlightId={highlightId} />
      )}
    </div>
  )
}

/* ================================================================
   Tab 1: 得分总览 — 排名 / 机构 / 得分 / 比系统得分 / 扣分
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

      {/* Formula summary */}
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
   四大客群 -> 公式 -> 折效客户数 -> 2025 vs 2024 -> 增速/增量
   -> 增速/增量得分率 -> 比重 -> x100/10 -> 比系统得分
   ================================================================ */
function SystemScoreTable({ rows, highlightId }: { rows: EfficiencyRow[]; highlightId: string | null }) {
  const { toggle, SortIcon, sort } = useSortable()
  const sorted = sort(rows)

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card rounded border border-border overflow-x-auto">
        <table className="w-full border-collapse min-w-[1400px]">
          <thead>
            {/* Group headers */}
            <tr className="bg-muted/60">
              <th colSpan={2} className="px-2 py-1.5 text-xs font-semibold border-b border-r border-border text-center" />
              <th colSpan={4} className="px-2 py-1.5 text-xs font-semibold border-b border-r border-border text-center text-foreground">
                {"四大客群"}
              </th>
              <th className="px-2 py-1.5 text-xs font-semibold border-b border-r border-border text-center text-foreground">
                {"公式"}
              </th>
              <th colSpan={2} className="px-2 py-1.5 text-xs font-semibold border-b border-r border-border text-center text-foreground">
                {"2025 vs 2024"}
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
            {/* Column headers */}
            <tr className="bg-muted/40">
              <th className={`${thBase} text-center w-[60px]`} onClick={() => toggle("rank")}>
                {"排名"}<SortIcon col="rank" />
              </th>
              <th className={`${thBase} text-left min-w-[80px]`}>{"机构"}</th>
              {/* 4 sub-indicators */}
              <th className={`${thBase} text-right`} onClick={() => toggle("annual10k")}>
                <span>{"年消费1w"}</span><br /><span className="font-normal text-muted-foreground">{"×30%"}</span>
                <SortIcon col="annual10k" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggle("newActive")}>
                <span>{"新增活跃"}</span><br /><span className="font-normal text-muted-foreground">{"×25%"}</span>
                <SortIcon col="newActive" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggle("highendActive")}>
                <span>{"中高端活跃"}</span><br /><span className="font-normal text-muted-foreground">{"×25%"}</span>
                <SortIcon col="highendActive" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggle("crossBorder")}>
                <span>{"跨境交易"}</span><br /><span className="font-normal text-muted-foreground">{"×20%"}</span>
                <SortIcon col="crossBorder" />
              </th>
              {/* formula result */}
              <th className={`${thBase} text-right`} onClick={() => toggle("efficiencyCust")}>
                {"折效客户数"}<SortIcon col="efficiencyCust" />
              </th>
              {/* 2025 vs 2024 */}
              <th className={`${thBase} text-right`} onClick={() => toggle("efficiencyCustBase")}>
                {"2024基数"}<SortIcon col="efficiencyCustBase" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggle("efficiencyCust")}>
                {"2025年"}<SortIcon col="efficiencyCust" />
              </th>
              {/* 增速 */}
              <th className={`${thBase} text-right`} onClick={() => toggle("growthRate")}>
                {"增速"}<SortIcon col="growthRate" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggle("growthRateScore")}>
                <span>{"得分率"}</span><br /><span className="font-normal text-muted-foreground">{"(比重70%)"}</span>
                <SortIcon col="growthRateScore" />
              </th>
              {/* 增量 */}
              <th className={`${thBase} text-right`} onClick={() => toggle("growthIncrement")}>
                {"增量"}<SortIcon col="growthIncrement" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggle("growthIncrScore")}>
                <span>{"得分率"}</span><br /><span className="font-normal text-muted-foreground">{"(比重30%)"}</span>
                <SortIcon col="growthIncrScore" />
              </th>
              {/* 比系统得分 */}
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
                  <td className={tdBase}>{row.annual10k.toFixed(0)}</td>
                  <td className={tdBase}>{row.newActive.toFixed(0)}</td>
                  <td className={tdBase}>{row.highendActive.toFixed(0)}</td>
                  <td className={tdBase}>{row.crossBorder.toFixed(0)}</td>
                  <td className={`${tdBase} font-semibold text-foreground`}>{row.efficiencyCust.toFixed(0)}</td>
                  <td className={tdBase}>{row.efficiencyCustBase.toFixed(0)}</td>
                  <td className={tdBase}>{row.efficiencyCust.toFixed(0)}</td>
                  <td className={tdBase}>{row.growthRate.toFixed(2)}%</td>
                  <td className={tdBase}>{row.growthRateScore.toFixed(2)}%</td>
                  <td className={tdBase}>{row.growthIncrement.toFixed(0)}</td>
                  <td className={tdBase}>{row.growthIncrScore.toFixed(2)}%</td>
                  <td className={`${tdBase} border-r-0 font-semibold text-foreground`}>{row.systemScore.toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Formula breakdown */}
      <div className="bg-card rounded border border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground mb-2">{"计算公式"}</h3>
        <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
          <li>
            {"对私折效客户数 = "}
            {subIndicators.map((si, i) => (
              <span key={si.id}>
                {i > 0 ? " + " : ""}
                {`${si.name} × ${(si.weight * 100).toFixed(0)}%`}
              </span>
            ))}
          </li>
          <li>{"增速 = (2025年折效客户数 - 2024年基数) / 2024年基数"}</li>
          <li>{"增量 = 2025年折效客户数 - 2024年基数"}</li>
          <li>{"增速/增量得分率：基于各分行与全行平均值的偏差标准化，映射到0~100分"}</li>
          <li>{"比系统得分 = (增速得分率 × 70% + 增量得分率 × 30%) × 100 / 10"}</li>
        </ul>
      </div>
    </div>
  )
}

/* ================================================================
   Tab 3: 对私商户日均存款扣分
   日均存款 / 目标 / 完成率 / 扣分
   ================================================================ */
function DepositDeductionTable({ rows, highlightId }: { rows: EfficiencyRow[]; highlightId: string | null }) {
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
                {"2025年对私商户日均存款"}<SortIcon col="depositActual" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggle("depositTarget")}>
                {"目标"}<SortIcon col="depositTarget" />
              </th>
              <th className={`${thBase} text-right`} onClick={() => toggle("depositCompletionRate")}>
                {"目标完成率"}<SortIcon col="depositCompletionRate" />
              </th>
              <th className={`${thBase} text-right border-r-0`} onClick={() => toggle("depositDeduction")}>
                {"扣分"}<SortIcon col="depositDeduction" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const hl = row.branchId === highlightId
              const rateColor = row.depositCompletionRate >= 100 ? "text-[hsl(140,60%,40%)]" : "text-primary"
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

      {/* Formula */}
      <div className="bg-card rounded border border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground mb-2">{"扣分规则"}</h3>
        <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
          <li>{"目标完成率 = 2025年对私商户日均存款 / 目标"}</li>
          <li>{"目标完成率 ≥ 100%：不扣分"}</li>
          <li>{"目标完成率 < 100%：扣分 = (1 - 完成率) × 20，最高扣20分"}</li>
        </ul>
      </div>
    </div>
  )
}
