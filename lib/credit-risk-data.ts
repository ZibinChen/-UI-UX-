// ====================================================================
// 信用风险管理 — scoring data engine (quarterly, multi-quarter sums)
// ====================================================================
// Total score = 新发生不良得分 + 表内清收得分 + 核销动用扣分项 + 内控合规扣分项
//
// 1. 新发生不良得分 = sum of past 2 quarters' 不良额得分
//    per quarter: if 不良额 <= 目标 -> 11.70; else score decreases proportionally
//
// 2. 表内现金清收得分 = sum of past 2 quarters' 清收得分
//    per quarter: 清收额 / 清收目标 = 完成率
//    完成率 >= 130% -> 7.80; below -> proportional
//
// 3. 核销动用扣分项 = sum of past 3 quarters' 核销扣分
//    per quarter: if 动用额 <= 管控目标 -> 控制率=0 -> 不扣分
//    else 控制率 = (动用额 - 目标) / 目标; 扣分 = 控制率 * maxPenalty
//
// 4. 内控合规扣分项 = judgmental value (0 or negative)
// ====================================================================

import { institutions } from "./credit-card-data"

const branchList = institutions.filter((i) => i.id !== "all")
const BRANCH_COUNT = branchList.length

// ── Available quarters ────────────────────────────────────────────
export const creditRiskQuarters = [
  { id: "2025Q1", label: "2025年第一季度" },
  { id: "2025Q2", label: "2025年第二季度" },
  { id: "2025Q3", label: "2025年第三季度" },
  { id: "2025Q4", label: "2025年第四季度" },
  { id: "2026Q1", label: "2026年第一季度" },
]

// ── Deterministic random ──────────────────────────────────────────
function hashCode(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}
function seeded(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

// ── Province economic weight ──────────────────────────────────────
const WEIGHT: Record<string, number> = {
  guangdong: 10.0, jiangsu: 9.2, zhejiang: 6.7, shandong: 5.8, beijing: 5.3,
  shanghai: 5.5, sichuan: 5.0, henan: 4.0, hubei: 3.6, hunan: 2.5,
  fujian: 3.0, hebei: 4.8, shenzhen: 3.5, anhui: 2.8, liaoning: 2.2,
  chongqing: 2.0, shaanxi: 2.4, yunnan: 1.8, guangxi: 1.5, jiangxi: 2.5,
  heilongjiang: 1.3, tianjin: 1.2, shanxi: 1.8, guizhou: 1.0, jilin: 1.2,
  neimenggu: 1.6, xinjiang: 1.0, gansu: 0.6, hainan: 0.6,
  qinghai: 0.3, ningxia: 0.3, xizang: 0.15,
  ningbo: 1.0, dalian: 1.0, qingdao: 1.1, xiamen: 0.8,
}

function computeShares(seed: string): number[] {
  const raw = branchList.map((b) => {
    const w = WEIGHT[b.id] ?? 1
    const jitter = 0.85 + seeded(hashCode(`cr_${seed}_${b.id}`)) * 0.3
    return w * jitter
  })
  const sum = raw.reduce((a, b) => a + b, 0)
  return raw.map((r) => r / sum)
}

// ── Per-quarter sub-data for a single branch ──────────────────────
interface QuarterSubData {
  quarterId: string
  // 新发生不良
  badDebtActual: number     // 万元
  badDebtTarget: number     // 万元
  badDebtScore: number      // max 11.70
  // 表内清收
  recoveryActual: number    // 万元
  recoveryTarget: number    // 万元
  recoveryCompRate: number  // %
  recoveryScore: number     // max 7.80
  // 核销动用
  writeoffActual: number    // 万元
  writeoffTarget: number    // 万元
  writeoffCtrlRate: number  // % (0 when within target)
  writeoffDeduction: number // <= 0
}

// ── Final scoring row (aggregated across quarters) ────────────────
export interface CreditRiskRow {
  branchId: string
  branchName: string
  totalScore: number
  rank: number
  // Aggregated scores (sum of relevant quarters)
  badDebtTotalScore: number      // sum of 2 quarters
  recoveryTotalScore: number     // sum of 2 quarters
  writeoffTotalDeduction: number // sum of 3 quarters
  complianceDeduction: number    // judgmental
  // Per-quarter detail
  quarterDetails: QuarterSubData[]
}

// ── National totals per quarter (万元) ────────────────────────────
const NATIONAL_BAD_DEBT_BASE = 420000     // ~42亿, branch ~800-17000万元
const NATIONAL_RECOVERY_BASE = 280000     // ~28亿, branch ~300-10000万元
const NATIONAL_WRITEOFF_BASE = 150000     // ~15亿, branch ~200-8000万元

function quarterScale(qId: string): number {
  const m: Record<string, number> = {
    "2025Q1": 0.90, "2025Q2": 0.95, "2025Q3": 1.0, "2025Q4": 1.05, "2026Q1": 1.08,
  }
  return m[qId] ?? 1.0
}

// ── Generate per-quarter data for a single branch ─────────────────
function genQuarterBranch(
  branchId: string,
  branchIdx: number,
  qId: string,
  shBD: number[],
  shRC: number[],
  shWO: number[]
): QuarterSubData {
  const qs = quarterScale(qId)
  const bj = 0.92 + seeded(hashCode(`crq_${qId}_${branchId}`)) * 0.16

  // 新发生不良额
  const badDebtActual = Math.round(NATIONAL_BAD_DEBT_BASE * shBD[branchIdx] * qs * bj)
  // Target is slightly above actual for most branches (so most get full score)
  const targetJitter = 1.0 + seeded(hashCode(`crqt_bd_${qId}_${branchId}`)) * 0.15
  const badDebtTarget = Math.round(badDebtActual * targetJitter)
  // Score: if actual <= target -> 11.70; else decrease proportionally
  let badDebtScore: number
  if (badDebtActual <= badDebtTarget) {
    badDebtScore = 11.70
  } else {
    const excess = (badDebtActual - badDebtTarget) / badDebtTarget
    badDebtScore = Math.max(0, +(11.70 * (1 - excess * 2)).toFixed(2))
  }

  // 表内清收
  const recoveryActual = Math.round(NATIONAL_RECOVERY_BASE * shRC[branchIdx] * qs * bj)
  const rcTargetJitter = 0.7 + seeded(hashCode(`crqt_rc_${qId}_${branchId}`)) * 0.35
  const recoveryTarget = Math.round(recoveryActual * rcTargetJitter)
  const recoveryCompRate = recoveryTarget > 0 ? +((recoveryActual / recoveryTarget) * 100).toFixed(2) : 100
  // Score: completion >= 130% -> 7.80; below -> proportional
  let recoveryScore: number
  if (recoveryCompRate >= 130) {
    recoveryScore = 7.80
  } else {
    recoveryScore = +(7.80 * (recoveryCompRate / 130)).toFixed(2)
  }

  // 核销动用
  const writeoffActual = Math.round(NATIONAL_WRITEOFF_BASE * shWO[branchIdx] * qs * bj)
  const woTargetJitter = 1.05 + seeded(hashCode(`crqt_wo_${qId}_${branchId}`)) * 0.25
  const writeoffTarget = Math.round(writeoffActual * woTargetJitter)
  // Control rate: 0 if within target
  let writeoffCtrlRate = 0
  let writeoffDeduction = 0
  if (writeoffActual > writeoffTarget) {
    writeoffCtrlRate = +((writeoffActual - writeoffTarget) / writeoffTarget * 100).toFixed(2)
    // Max deduction per quarter = -2.0
    writeoffDeduction = +Math.min(0, -(writeoffCtrlRate / 100 * 2)).toFixed(2)
  }

  return {
    quarterId: qId,
    badDebtActual,
    badDebtTarget,
    badDebtScore,
    recoveryActual,
    recoveryTarget,
    recoveryCompRate,
    recoveryScore,
    writeoffActual,
    writeoffTarget,
    writeoffCtrlRate,
    writeoffDeduction,
  }
}

// ── Main generator ────────────────────────────────────────────────
export function generateCreditRiskData(selectedQuarter: string): {
  rows: CreditRiskRow[]
} {
  // Determine which quarters to use
  const allQIds = creditRiskQuarters.map(q => q.id)
  const selIdx = allQIds.indexOf(selectedQuarter)
  if (selIdx < 0) return { rows: [] }

  // For bad debt & recovery: past 2 quarters (including selected)
  const bdQuarters = allQIds.slice(Math.max(0, selIdx - 1), selIdx + 1)
  // For writeoff: past 3 quarters (including selected)
  const woQuarters = allQIds.slice(Math.max(0, selIdx - 2), selIdx + 1)

  // Shares
  const shBD = computeShares("bad_debt")
  const shRC = computeShares("recovery")
  const shWO = computeShares("writeoff")

  const rows: CreditRiskRow[] = branchList.map((branch, idx) => {
    // Generate all relevant quarter data
    const allQuarterIds = [...new Set([...bdQuarters, ...woQuarters])]
    const quarterDetails = allQuarterIds.map(qId =>
      genQuarterBranch(branch.id, idx, qId, shBD, shRC, shWO)
    )

    // Sum bad debt scores (past 2 quarters)
    const badDebtTotalScore = +quarterDetails
      .filter(d => bdQuarters.includes(d.quarterId))
      .reduce((s, d) => s + d.badDebtScore, 0)
      .toFixed(2)

    // Sum recovery scores (past 2 quarters)
    const recoveryTotalScore = +quarterDetails
      .filter(d => bdQuarters.includes(d.quarterId))
      .reduce((s, d) => s + d.recoveryScore, 0)
      .toFixed(2)

    // Sum writeoff deductions (past 3 quarters)
    const writeoffTotalDeduction = +quarterDetails
      .filter(d => woQuarters.includes(d.quarterId))
      .reduce((s, d) => s + d.writeoffDeduction, 0)
      .toFixed(2)

    // Compliance deduction (judgmental: most 0, some small negative)
    const compSeed = seeded(hashCode(`cr_comp_${branch.id}_${selectedQuarter}`))
    const complianceDeduction = compSeed > 0.85 ? +(-compSeed * 2).toFixed(2) : 0

    const totalScore = +(
      badDebtTotalScore +
      recoveryTotalScore +
      writeoffTotalDeduction +
      complianceDeduction
    ).toFixed(2)

    return {
      branchId: branch.id,
      branchName: branch.name,
      totalScore,
      rank: 0,
      badDebtTotalScore,
      recoveryTotalScore,
      writeoffTotalDeduction,
      complianceDeduction,
      quarterDetails,
    }
  })

  // Rank
  const sorted = [...rows].sort((a, b) => b.totalScore - a.totalScore)
  sorted.forEach((r, i) => { r.rank = i + 1 })
  const rankMap = new Map(sorted.map(r => [r.branchId, r.rank]))
  rows.forEach(r => { r.rank = rankMap.get(r.branchId) ?? 0 })

  return { rows }
}

export { branchList as creditRiskBranchList }
