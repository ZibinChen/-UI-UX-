"use client"

import { useMemo, useState, useCallback } from "react"
import {
  generateCreditRiskData,
  creditRiskQuarters,
  creditRiskBranchList,
  type CreditRiskRow,
} from "@/lib/credit-risk-data"
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

interface CreditRiskPanelProps {
  selectedInstitution: string
  selectedDate: string
}

type SortKey = keyof CreditRiskRow
type SortDir = "asc" | "desc"

function useSortable(defaultKey: SortKey = "rank", defaultDir: SortDir = "asc") {
  const [sortKey, setSortKey] = useState<SortKey>(defaultKey)
  const [sortDir, setSortDir] = useState<SortDir>(defaultDir)

  function toggle(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir(key === "rank" ? "asc" : "desc") }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 ml-0.5 inline opacity-40" />
    return sortDir === "asc"
      ? <ChevronUp className="w-3 h-3 ml-0.5 inline text-primary" />
      : <ChevronDown className="w-3 h-3 ml-0.5 inline text-primary" />
  }

  function sort(rows: CreditRiskRow[]) {
    return [...rows].sort((a, b) => {
      const va = a[sortKey]; const vb = b[sortKey]
      if (typeof va === "number" && typeof vb === "number")
        return sortDir === "asc" ? va - vb : vb - va
      return 0
    })
  }

  return { sortKey, toggle, SortIcon, sort }
}

const thBase = "px-2 py-2 text-xs font-semibold border-b border-r border-border whitespace-nowrap cursor-pointer hover:bg-muted/40 select-none"
const tdBase = "px-2 py-1.5 text-xs border-b border-r border-border tabular-nums text-right"

const subTabs = [
  { id: "overview", label: "得分总览" },
  { id: "badDebt", label: "新发生不良得分明细" },
  { id: "recovery", label: "表内清收得分明细" },
  { id: "writeoff", label: "核销动用扣分明细" },
]

const TAB_INDICATORS: Record<string, { id: string; label: string }[]> = {
  overview: [
    { id: "totalScore", label: "信用风险总得分" },
    { id: "badDebtTotalScore", label: "新发生不良得分" },
    { id: "recoveryTotalScore", label: "表内清收得分" },
    { id: "writeoffTotalDeduction", label: "核销动用扣分" },
    { id: "complianceDeduction", label: "内控合规扣分" },
  ],
  badDebt: [
    { id: "badDebtTotalScore", label: "新发生不良得分（合计）" },
    { id: "totalScore", label: "信用风险总得分" },
  ],
  recovery: [
    { id: "recoveryTotalScore", label: "表内清收得分（合计）" },
    { id: "totalScore", label: "信用风险总得分" },
  ],
  writeoff: [
    { id: "writeoffTotalDeduction", label: "核销动用扣分（合计）" },
    { id: "totalScore", label: "信用风险总得分" },
  ],
}

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

// ── Overview Table ───────────────────────────────────────────────
function OverviewTable({ rows, highlightId }: { rows: CreditRiskRow[]; highlightId: string | null }) {
  const s = useSortable()
  const sorted = s.sort(rows)
  return (
    <div className="overflow-x-auto border border-border rounded">
      <table className="w-full text-xs">
        <thead className="bg-muted/60">
          <tr>
            <th className={cn(thBase, "text-center w-[60px] cursor-default")}>{"排名"}</th>
            <th className={cn(thBase, "text-left w-[120px] cursor-default")}>{"行名"}</th>
            <th className={cn(thBase, "text-right")} onClick={() => s.toggle("totalScore")}>
              {"信用风险总得分"}<s.SortIcon col="totalScore" />
            </th>
            <th className={cn(thBase, "text-right")} onClick={() => s.toggle("badDebtTotalScore")}>
              {"新发生不良得分"}<s.SortIcon col="badDebtTotalScore" />
            </th>
            <th className={cn(thBase, "text-right")} onClick={() => s.toggle("recoveryTotalScore")}>
              {"表内清收得分"}<s.SortIcon col="recoveryTotalScore" />
            </th>
            <th className={cn(thBase, "text-right")} onClick={() => s.toggle("writeoffTotalDeduction")}>
              {"核销动用扣分"}<s.SortIcon col="writeoffTotalDeduction" />
            </th>
            <th className={cn(thBase, "text-right")} onClick={() => s.toggle("complianceDeduction")}>
              {"内控合规扣分"}<s.SortIcon col="complianceDeduction" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(r => {
            const hl = r.branchId === highlightId
            return (
              <tr key={r.branchId} className={cn(hl && "bg-primary/5")}>
                <td className={cn(tdBase, "text-center font-medium")}>{r.rank}</td>
                <td className={cn(tdBase, "text-left font-medium", hl && "text-primary")} suppressHydrationWarning>{r.branchName}</td>
                <td className={cn(tdBase, "font-semibold")}>{r.totalScore.toFixed(2)}</td>
                <td className={tdBase}>{r.badDebtTotalScore.toFixed(2)}</td>
                <td className={tdBase}>{r.recoveryTotalScore.toFixed(2)}</td>
                <td className={cn(tdBase, r.writeoffTotalDeduction < 0 && "text-red-500")}>
                  {r.writeoffTotalDeduction.toFixed(2)}
                </td>
                <td className={cn(tdBase, r.complianceDeduction < 0 && "text-red-500")}>
                  {r.complianceDeduction.toFixed(2)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Bad Debt Detail Table ────────────────────────────────────────
function BadDebtTable({ rows, highlightId }: { rows: CreditRiskRow[]; highlightId: string | null }) {
  const s = useSortable()
  const sorted = s.sort(rows)
  // Get quarter labels from first row
  const qLabels = rows[0]?.quarterDetails.filter(d =>
    rows[0].quarterDetails.slice(-2).map(x => x.quarterId).includes(d.quarterId)
  ).map(d => {
    const q = creditRiskQuarters.find(x => x.id === d.quarterId)
    return { id: d.quarterId, short: q?.label.replace("年第", "Q").replace("季度", "") ?? d.quarterId }
  }) ?? []

  return (
    <div className="overflow-x-auto border border-border rounded">
      <table className="w-full text-xs">
        <thead className="bg-muted/60">
          <tr>
            <th className={cn(thBase, "text-center w-[60px] cursor-default")} rowSpan={2}>{"排名"}</th>
            <th className={cn(thBase, "text-left w-[100px] cursor-default")} rowSpan={2}>{"行名"}</th>
            <th className={cn(thBase, "text-right")} rowSpan={2} onClick={() => s.toggle("badDebtTotalScore")}>
              {"不良得分合计"}<s.SortIcon col="badDebtTotalScore" />
            </th>
            {qLabels.map(q => (
              <th key={q.id} className={cn(thBase, "text-center cursor-default")} colSpan={3} suppressHydrationWarning>
                {q.short}
              </th>
            ))}
          </tr>
          <tr>
            {qLabels.map(q => (
              <Fragment key={q.id}>
                <th className={cn(thBase, "text-right cursor-default")}>{"不良额"}</th>
                <th className={cn(thBase, "text-right cursor-default")}>{"目标"}</th>
                <th className={cn(thBase, "text-right cursor-default")}>{"得分"}</th>
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(r => {
            const hl = r.branchId === highlightId
            const relevantQs = r.quarterDetails.slice(-2)
            return (
              <tr key={r.branchId} className={cn(hl && "bg-primary/5")}>
                <td className={cn(tdBase, "text-center font-medium")}>{r.rank}</td>
                <td className={cn(tdBase, "text-left font-medium", hl && "text-primary")} suppressHydrationWarning>{r.branchName}</td>
                <td className={cn(tdBase, "font-semibold")}>{r.badDebtTotalScore.toFixed(2)}</td>
                {relevantQs.map(d => (
                  <Fragment key={d.quarterId}>
                    <td className={tdBase}>{d.badDebtActual.toLocaleString()}</td>
                    <td className={tdBase}>{d.badDebtTarget.toLocaleString()}</td>
                    <td className={cn(tdBase, d.badDebtScore < 11.70 && "text-orange-500")}>
                      {d.badDebtScore.toFixed(2)}
                    </td>
                  </Fragment>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Recovery Detail Table ────────────────────────────────────────
function RecoveryTable({ rows, highlightId }: { rows: CreditRiskRow[]; highlightId: string | null }) {
  const s = useSortable()
  const sorted = s.sort(rows)
  const qLabels = rows[0]?.quarterDetails.filter(d =>
    rows[0].quarterDetails.slice(-2).map(x => x.quarterId).includes(d.quarterId)
  ).map(d => {
    const q = creditRiskQuarters.find(x => x.id === d.quarterId)
    return { id: d.quarterId, short: q?.label.replace("年第", "Q").replace("季度", "") ?? d.quarterId }
  }) ?? []

  return (
    <div className="overflow-x-auto border border-border rounded">
      <table className="w-full text-xs">
        <thead className="bg-muted/60">
          <tr>
            <th className={cn(thBase, "text-center w-[60px] cursor-default")} rowSpan={2}>{"排名"}</th>
            <th className={cn(thBase, "text-left w-[100px] cursor-default")} rowSpan={2}>{"行名"}</th>
            <th className={cn(thBase, "text-right")} rowSpan={2} onClick={() => s.toggle("recoveryTotalScore")}>
              {"清收得分合计"}<s.SortIcon col="recoveryTotalScore" />
            </th>
            {qLabels.map(q => (
              <th key={q.id} className={cn(thBase, "text-center cursor-default")} colSpan={4} suppressHydrationWarning>
                {q.short}
              </th>
            ))}
          </tr>
          <tr>
            {qLabels.map(q => (
              <Fragment key={q.id}>
                <th className={cn(thBase, "text-right cursor-default")}>{"清收额"}</th>
                <th className={cn(thBase, "text-right cursor-default")}>{"目标"}</th>
                <th className={cn(thBase, "text-right cursor-default")}>{"完成率"}</th>
                <th className={cn(thBase, "text-right cursor-default")}>{"得分"}</th>
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(r => {
            const hl = r.branchId === highlightId
            const relevantQs = r.quarterDetails.slice(-2)
            return (
              <tr key={r.branchId} className={cn(hl && "bg-primary/5")}>
                <td className={cn(tdBase, "text-center font-medium")}>{r.rank}</td>
                <td className={cn(tdBase, "text-left font-medium", hl && "text-primary")} suppressHydrationWarning>{r.branchName}</td>
                <td className={cn(tdBase, "font-semibold")}>{r.recoveryTotalScore.toFixed(2)}</td>
                {relevantQs.map(d => (
                  <Fragment key={d.quarterId}>
                    <td className={tdBase}>{d.recoveryActual.toLocaleString()}</td>
                    <td className={tdBase}>{d.recoveryTarget.toLocaleString()}</td>
                    <td className={cn(tdBase, d.recoveryCompRate >= 130 ? "text-green-600" : d.recoveryCompRate < 100 ? "text-red-500" : "")}>
                      {d.recoveryCompRate.toFixed(2)}%
                    </td>
                    <td className={cn(tdBase, d.recoveryScore < 7.80 && "text-orange-500")}>
                      {d.recoveryScore.toFixed(2)}
                    </td>
                  </Fragment>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Writeoff Detail Table ────────────────────────────────────────
function WriteoffTable({ rows, highlightId }: { rows: CreditRiskRow[]; highlightId: string | null }) {
  const s = useSortable()
  const sorted = s.sort(rows)
  // All quarters (up to 3) used for writeoff
  const allQIds = rows[0]?.quarterDetails.map(d => d.quarterId) ?? []
  const qLabels = allQIds.map(qId => {
    const q = creditRiskQuarters.find(x => x.id === qId)
    return { id: qId, short: q?.label.replace("年第", "Q").replace("季度", "") ?? qId }
  })

  return (
    <div className="overflow-x-auto border border-border rounded">
      <table className="w-full text-xs">
        <thead className="bg-muted/60">
          <tr>
            <th className={cn(thBase, "text-center w-[60px] cursor-default")} rowSpan={2}>{"排名"}</th>
            <th className={cn(thBase, "text-left w-[100px] cursor-default")} rowSpan={2}>{"行名"}</th>
            <th className={cn(thBase, "text-right")} rowSpan={2} onClick={() => s.toggle("writeoffTotalDeduction")}>
              {"核销扣分合计"}<s.SortIcon col="writeoffTotalDeduction" />
            </th>
            {qLabels.map(q => (
              <th key={q.id} className={cn(thBase, "text-center cursor-default")} colSpan={4} suppressHydrationWarning>
                {q.short}
              </th>
            ))}
          </tr>
          <tr>
            {qLabels.map(q => (
              <Fragment key={q.id}>
                <th className={cn(thBase, "text-right cursor-default")}>{"动用额"}</th>
                <th className={cn(thBase, "text-right cursor-default")}>{"管控目标"}</th>
                <th className={cn(thBase, "text-right cursor-default")}>{"控制率"}</th>
                <th className={cn(thBase, "text-right cursor-default")}>{"扣分"}</th>
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(r => {
            const hl = r.branchId === highlightId
            return (
              <tr key={r.branchId} className={cn(hl && "bg-primary/5")}>
                <td className={cn(tdBase, "text-center font-medium")}>{r.rank}</td>
                <td className={cn(tdBase, "text-left font-medium", hl && "text-primary")} suppressHydrationWarning>{r.branchName}</td>
                <td className={cn(tdBase, "font-semibold", r.writeoffTotalDeduction < 0 && "text-red-500")}>
                  {r.writeoffTotalDeduction.toFixed(2)}
                </td>
                {r.quarterDetails.map(d => (
                  <Fragment key={d.quarterId}>
                    <td className={tdBase}>{d.writeoffActual.toLocaleString()}</td>
                    <td className={tdBase}>{d.writeoffTarget.toLocaleString()}</td>
                    <td className={cn(tdBase, d.writeoffCtrlRate > 0 && "text-red-500")}>
                      {d.writeoffCtrlRate.toFixed(2)}%
                    </td>
                    <td className={cn(tdBase, d.writeoffDeduction < 0 && "text-red-500")}>
                      {d.writeoffDeduction.toFixed(2)}
                    </td>
                  </Fragment>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// Need Fragment import
import { Fragment } from "react"

// ── Main Panel ───────────────────────────────────────────────────
export function CreditRiskPanel({ selectedInstitution }: CreditRiskPanelProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedQuarter, setSelectedQuarter] = useState(creditRiskQuarters[creditRiskQuarters.length - 1].id)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogStep, setDialogStep] = useState<"branch" | "indicator">("branch")
  const [selectedBranches, setSelectedBranches] = useState<string[]>([])
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([])
  const [confirmedBranches, setConfirmedBranches] = useState<string[]>([])
  const [confirmedIndicators, setConfirmedIndicators] = useState<string[]>([])

  const { rows } = useMemo(
    () => generateCreditRiskData(selectedQuarter),
    [selectedQuarter]
  )

  const highlightId = selectedInstitution === "all" ? null : selectedInstitution
  const currentTabIndicators = TAB_INDICATORS[activeTab] ?? TAB_INDICATORS.overview

  const openCompareDialog = useCallback(() => {
    const initial: string[] = []
    if (selectedInstitution !== "all") initial.push(selectedInstitution)
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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setConfirmedBranches([])
    setConfirmedIndicators([])
  }

  // ── Trend comparison data ──
  const trendChartData = useMemo(() => {
    if (confirmedBranches.length === 0 || confirmedIndicators.length === 0) return []

    return confirmedIndicators.map(indId => {
      const indDef = currentTabIndicators.find(i => i.id === indId)
      const quarterData = creditRiskQuarters.map(q => {
        const { rows: qRows } = generateCreditRiskData(q.id)
        const entry: Record<string, any> = { quarter: q.label.replace("年第", "Q").replace("季度", "") }
        confirmedBranches.forEach(bId => {
          const row = qRows.find(r => r.branchId === bId)
          const br = creditRiskBranchList.find(b => b.id === bId)
          entry[br?.name ?? bId] = row ? (row[indId as keyof CreditRiskRow] as number) : 0
        })
        return entry
      })
      return {
        indicatorId: indId,
        label: indDef?.label ?? indId,
        data: quarterData,
        branches: confirmedBranches.map(bId => {
          const br = creditRiskBranchList.find(b => b.id === bId)
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
          {"信用风险管理指标表"}
        </h2>
        <p className="text-xs text-muted-foreground text-center mt-1" suppressHydrationWarning>
          {"总分 = 新发生不良得分 + 表内清收得分 + 核销动用扣分 + 内控合规扣分"}
        </p>
      </div>

      {/* Controls row */}
      <div className="flex justify-end">
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{"季度："}</span>
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="text-xs border border-border rounded px-2 py-1 bg-card text-foreground"
            >
              {creditRiskQuarters.map(q => (
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
      {activeTab === "overview" && <OverviewTable rows={rows} highlightId={highlightId} />}
      {activeTab === "badDebt" && <BadDebtTable rows={rows} highlightId={highlightId} />}
      {activeTab === "recovery" && <RecoveryTable rows={rows} highlightId={highlightId} />}
      {activeTab === "writeoff" && <WriteoffTable rows={rows} highlightId={highlightId} />}

      {/* Scoring rules */}
      {activeTab === "overview" && (
        <div className="bg-muted/30 rounded border border-border px-4 py-3">
          <p className="text-xs font-semibold text-foreground mb-2">{"计分规则"}</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
            <li>{"新发生不良得分 = 过去2个季度得分之和（每季度满分 11.70，不良额 ≤ 目标则满分）"}</li>
            <li>{"表内清收得分 = 过去2个季度得分之和（每季度满分 7.80，清收完成率 ≥ 130% 则满分）"}</li>
            <li>{"核销动用扣分 = 过去3个季度扣分之和（动用额 ≤ 管控目标则不扣分，超出则按控制率扣分）"}</li>
            <li>{"内控合规扣分 = 判断性指标（违规扣分，无违规则为0）"}</li>
          </ul>
        </div>
      )}

      {activeTab === "badDebt" && (
        <div className="bg-muted/30 rounded border border-border px-4 py-3">
          <p className="text-xs font-semibold text-foreground mb-2">{"新发生不良得分计算"}</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
            <li>{"每季度：新发生不良额 vs 目标 -> 不良额 ≤ 目标则得11.70分"}</li>
            <li>{"不良额 > 目标：得分 = 11.70 × (1 - 超额比例 × 2)，最低0分"}</li>
            <li>{"总分 = 最近2个季度得分之和（满分 23.40）"}</li>
          </ul>
        </div>
      )}

      {activeTab === "recovery" && (
        <div className="bg-muted/30 rounded border border-border px-4 py-3">
          <p className="text-xs font-semibold text-foreground mb-2">{"表内清收得分计算"}</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
            <li>{"每季度：清收额 / 清收目标 = 完成率"}</li>
            <li>{"完成率 ≥ 130% 则得满分 7.80"}</li>
            <li>{"完成率 < 130%：得分 = 7.80 × (完成率 / 130%)，按比例递减"}</li>
            <li>{"总分 = 最近2个季度得分之和（满分 15.60）"}</li>
          </ul>
        </div>
      )}

      {activeTab === "writeoff" && (
        <div className="bg-muted/30 rounded border border-border px-4 py-3">
          <p className="text-xs font-semibold text-foreground mb-2">{"核销动用扣分计算"}</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
            <li>{"每季度：核销动用额 vs 管控目标 -> 控制率 = (动用额 - 目标) / 目标"}</li>
            <li>{"动用额 ≤ 目标：控制率 = 0%，不扣分"}</li>
            <li>{"动用额 > 目标：按控制率扣分（每季度最多扣2分）"}</li>
            <li>{"总扣分 = 最近3个季度扣分之和"}</li>
          </ul>
        </div>
      )}

      {/* Trend comparison charts */}
      {trendChartData.length > 0 && !dialogOpen && (
        <div className="bg-card rounded border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-foreground">{"分行趋势对比"}</h4>
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
                    <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: "hsl(0,0%,45%)" }} />
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
                ? `选择 1-6 个分行（已选 ${selectedBranches.length}/6）${selectedInstitution !== "all" ? "，当前机构已自动选中" : ""}`
                : `选择 1-4 个指标（已选 ${selectedIndicators.length}/4）`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 -mx-6 px-6">
            {dialogStep === "branch" && (
              <div className="grid grid-cols-2 gap-2 py-2">
                {creditRiskBranchList.map(b => {
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
                      )} suppressHydrationWarning>
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

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            {dialogStep === "indicator" && (
              <button
                onClick={() => setDialogStep("branch")}
                className="text-xs px-4 py-2 rounded border border-border hover:bg-muted transition-colors"
              >
                {"上一步"}
              </button>
            )}
            {dialogStep === "branch" ? (
              <button
                onClick={() => setDialogStep("indicator")}
                disabled={selectedBranches.length === 0}
                className="text-xs px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
              >
                {"下一步：选择指标"}
              </button>
            ) : (
              <button
                onClick={confirmComparison}
                disabled={selectedIndicators.length === 0}
                className="text-xs px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
              >
                {"确认对比"}
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
