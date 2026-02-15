// ====================================================================
// 对私折效指标 — scoring data engine
// ====================================================================
// Logic:
//   1. 对私折效客户数 = 信用卡年消费1w客户×0.3 + 新增活跃客户×0.25
//      + 中高端新增活跃客户×0.25 + 跨境交易客户×0.2
//   2. Compare vs 2024 base → compute 增速 and 增量
//   3. 增速得分: deviation from avg growth rate → scale to 0-100
//   4. 增量得分: deviation from avg increment → scale to 0-100
//   5. 比系统得分 = 增速得分 × 70% + 增量得分 × 30%
//   6. 对私商户日均存款 vs 目标 → 目标完成率
//   7. 扣分 = max(0, (1 - 完成率)) * 20 (up to 20 points deducted)
//   8. 各分行总分 = 比系统得分 - 扣分
// ====================================================================

import { institutions } from "./credit-card-data"

const branchList = institutions.filter((i) => i.id !== "all")
const BRANCH_COUNT = branchList.length

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
  guangdong: 9.0, jiangsu: 7.5, zhejiang: 6.5, shandong: 5.5, beijing: 5.0,
  shanghai: 5.0, sichuan: 4.0, henan: 3.5, hubei: 3.2, hunan: 3.0,
  fujian: 3.0, hebei: 2.8, shenzhen: 3.5, anhui: 2.5, liaoning: 2.2,
  chongqing: 2.0, shaanxi: 1.8, yunnan: 1.6, guangxi: 1.5, jiangxi: 1.5,
  heilongjiang: 1.3, tianjin: 1.2, shanxi: 1.1, guizhou: 1.0, jilin: 0.9,
  neimenggu: 0.9, xinjiang: 0.8, gansu: 0.6, hainan: 0.6,
  qinghai: 0.3, ningxia: 0.3, xizang: 0.15,
  ningbo: 1.2, dalian: 1.0, qingdao: 1.1, xiamen: 0.8,
}

// ── Sub-indicator definitions ─────────────────────────────────────
interface SubIndicator {
  id: string
  name: string
  weight: number       // contribution to 折效客户数
  nationalCurrent: number  // 万户
  nationalBase2024: number // 万户
}

const subIndicators: SubIndicator[] = [
  { id: "annual_10k",     name: "信用卡年消费1w客户",   weight: 0.30, nationalCurrent: 3280, nationalBase2024: 3020 },
  { id: "new_active",     name: "新增活跃客户",         weight: 0.25, nationalCurrent: 1856, nationalBase2024: 1640 },
  { id: "highend_active", name: "中高端新增活跃客户",    weight: 0.25, nationalCurrent: 920,  nationalBase2024: 810 },
  { id: "cross_border",   name: "跨境交易客户",         weight: 0.20, nationalCurrent: 745,  nationalBase2024: 660 },
]

// ── Deposit indicator ─────────────────────────────────────────────
const depositNationalCurrent = 4850   // 亿元 actual
const depositNationalTarget = 5200    // 亿元 target

// ── Compute branch shares (same approach as credit-card-data) ─────
function computeShares(seed: string): number[] {
  const raw = branchList.map((b) => {
    const w = WEIGHT[b.id] ?? 1
    const jitter = 0.85 + seeded(hashCode(`eff_${seed}_${b.id}`)) * 0.3
    return w * jitter
  })
  const sum = raw.reduce((a, b) => a + b, 0)
  return raw.map((r) => r / sum)
}

// ── Scoring table row ─────────────────────────────────────────────
export interface EfficiencyRow {
  branchId: string
  branchName: string
  // Sub-indicators
  annual10k: number
  newActive: number
  highendActive: number
  crossBorder: number
  // 折效客户数
  efficiencyCust: number
  efficiencyCustBase: number
  // Growth
  growthRate: number        // 增速 %
  growthIncrement: number   // 增量 (万户)
  // Scores
  growthRateScore: number   // 增速得分 (0~100)
  growthIncrScore: number   // 增量得分 (0~100)
  systemScore: number       // 比系统得分 = 增速×0.7 + 增量×0.3
  // Deposit
  depositActual: number     // 日均存款 (亿元)
  depositTarget: number     // 目标 (亿元)
  depositCompletionRate: number // 完成率 %
  depositDeduction: number  // 扣分
  // Final
  totalScore: number        // 总分 = systemScore - deduction
  rank: number
}

export interface EfficiencySummary {
  totalEffCust: number
  totalEffCustBase: number
  avgGrowthRate: number
  avgGrowthIncrement: number
  avgSystemScore: number
  totalDeposit: number
  totalDepositTarget: number
  avgCompletionRate: number
  avgDeduction: number
  avgTotalScore: number
}

export function generateEfficiencyData(dateStr: string): {
  rows: EfficiencyRow[]
  summary: EfficiencySummary
} {
  // Date factor for slight variation
  const dayNum = parseInt(dateStr.split("/")[2] ?? "12")
  const df = 0.98 + (dayNum / 100) * 0.04 // 0.98~1.02

  // Generate per-branch sub-indicator values
  const rows: EfficiencyRow[] = branchList.map((branch) => {
    const shares = {
      annual10k: computeShares("annual10k"),
      new_active: computeShares("new_active"),
      highend_active: computeShares("highend_active"),
      cross_border: computeShares("cross_border"),
      deposit_cur: computeShares("deposit_cur"),
      deposit_tgt: computeShares("deposit_tgt"),
    }
    const idx = branchList.findIndex((b) => b.id === branch.id)

    // Sub-indicator current values
    const annual10k = subIndicators[0].nationalCurrent * shares.annual10k[idx] * df
    const newActive = subIndicators[1].nationalCurrent * shares.new_active[idx] * df
    const highendActive = subIndicators[2].nationalCurrent * shares.highend_active[idx] * df
    const crossBorder = subIndicators[3].nationalCurrent * shares.cross_border[idx] * df

    // 折效客户数 = weighted sum
    const efficiencyCust = annual10k * 0.30 + newActive * 0.25 + highendActive * 0.25 + crossBorder * 0.20

    // 2024 base (same formula)
    const sharesBase = {
      annual10k: computeShares("annual10k_base"),
      new_active: computeShares("new_active_base"),
      highend_active: computeShares("highend_active_base"),
      cross_border: computeShares("cross_border_base"),
    }
    const a10kBase = subIndicators[0].nationalBase2024 * sharesBase.annual10k[idx]
    const naBase = subIndicators[1].nationalBase2024 * sharesBase.new_active[idx]
    const haBase = subIndicators[2].nationalBase2024 * sharesBase.highend_active[idx]
    const cbBase = subIndicators[3].nationalBase2024 * sharesBase.cross_border[idx]
    const efficiencyCustBase = a10kBase * 0.30 + naBase * 0.25 + haBase * 0.25 + cbBase * 0.20

    // Growth
    const growthRate = efficiencyCustBase > 0 ? ((efficiencyCust - efficiencyCustBase) / efficiencyCustBase) * 100 : 0
    const growthIncrement = efficiencyCust - efficiencyCustBase

    // Deposit
    const depositJitter = 0.85 + seeded(hashCode(`dep_actual_${branch.id}`)) * 0.3
    const targetJitter = 0.85 + seeded(hashCode(`dep_target_${branch.id}`)) * 0.3
    const depositActual = depositNationalCurrent * shares.deposit_cur[idx] * depositJitter * df
    const depositTarget = depositNationalTarget * shares.deposit_tgt[idx] * targetJitter
    const depositCompletionRate = depositTarget > 0 ? (depositActual / depositTarget) * 100 : 100

    // Deduction: uncompleted portion * 20 points (max 20)
    const depositDeduction = depositCompletionRate >= 100 ? 0 : Math.min(20, (1 - depositActual / depositTarget) * 20)

    return {
      branchId: branch.id,
      branchName: branch.name,
      annual10k: +annual10k.toFixed(2),
      newActive: +newActive.toFixed(2),
      highendActive: +highendActive.toFixed(2),
      crossBorder: +crossBorder.toFixed(2),
      efficiencyCust: +efficiencyCust.toFixed(2),
      efficiencyCustBase: +efficiencyCustBase.toFixed(2),
      growthRate: +growthRate.toFixed(2),
      growthIncrement: +growthIncrement.toFixed(2),
      // Scores computed below after we know the average
      growthRateScore: 0,
      growthIncrScore: 0,
      systemScore: 0,
      depositActual: +depositActual.toFixed(2),
      depositTarget: +depositTarget.toFixed(2),
      depositCompletionRate: +depositCompletionRate.toFixed(2),
      depositDeduction: +depositDeduction.toFixed(2),
      totalScore: 0,
      rank: 0,
    }
  })

  // Compute averages for scoring
  const avgGrowthRate = rows.reduce((s, r) => s + r.growthRate, 0) / BRANCH_COUNT
  const avgGrowthIncrement = rows.reduce((s, r) => s + r.growthIncrement, 0) / BRANCH_COUNT

  // Standard deviation for normalization
  const stdGrowthRate = Math.sqrt(rows.reduce((s, r) => s + (r.growthRate - avgGrowthRate) ** 2, 0) / BRANCH_COUNT) || 1
  const stdGrowthIncr = Math.sqrt(rows.reduce((s, r) => s + (r.growthIncrement - avgGrowthIncrement) ** 2, 0) / BRANCH_COUNT) || 1

  // Score each branch (z-score mapped to 0~100 scale, centered at 60)
  rows.forEach((r) => {
    const zRate = (r.growthRate - avgGrowthRate) / stdGrowthRate
    r.growthRateScore = +Math.max(0, Math.min(100, 60 + zRate * 15)).toFixed(2)

    const zIncr = (r.growthIncrement - avgGrowthIncrement) / stdGrowthIncr
    r.growthIncrScore = +Math.max(0, Math.min(100, 60 + zIncr * 15)).toFixed(2)

    r.systemScore = +(r.growthRateScore * 0.7 + r.growthIncrScore * 0.3).toFixed(2)
    r.totalScore = +(r.systemScore - r.depositDeduction).toFixed(2)
  })

  // Rank by totalScore descending
  const sorted = [...rows].sort((a, b) => b.totalScore - a.totalScore)
  sorted.forEach((r, i) => { r.rank = i + 1 })
  // Write rank back
  const rankMap = new Map(sorted.map((r) => [r.branchId, r.rank]))
  rows.forEach((r) => { r.rank = rankMap.get(r.branchId) ?? 0 })

  // Summary
  const summary: EfficiencySummary = {
    totalEffCust: +rows.reduce((s, r) => s + r.efficiencyCust, 0).toFixed(2),
    totalEffCustBase: +rows.reduce((s, r) => s + r.efficiencyCustBase, 0).toFixed(2),
    avgGrowthRate: +avgGrowthRate.toFixed(2),
    avgGrowthIncrement: +avgGrowthIncrement.toFixed(2),
    avgSystemScore: +(rows.reduce((s, r) => s + r.systemScore, 0) / BRANCH_COUNT).toFixed(2),
    totalDeposit: +rows.reduce((s, r) => s + r.depositActual, 0).toFixed(2),
    totalDepositTarget: +rows.reduce((s, r) => s + r.depositTarget, 0).toFixed(2),
    avgCompletionRate: +(rows.reduce((s, r) => s + r.depositCompletionRate, 0) / BRANCH_COUNT).toFixed(2),
    avgDeduction: +(rows.reduce((s, r) => s + r.depositDeduction, 0) / BRANCH_COUNT).toFixed(2),
    avgTotalScore: +(rows.reduce((s, r) => s + r.totalScore, 0) / BRANCH_COUNT).toFixed(2),
  }

  return { rows, summary }
}

// ── Sub-indicator details for a specific branch ───────────────────
export interface SubIndicatorDetail {
  id: string
  name: string
  weight: string     // e.g. "30%"
  current: number
  base2024: number
  growthRate: number  // %
  increment: number
  unit: string
}

export function getSubIndicatorDetails(branchId: string, dateStr: string): SubIndicatorDetail[] {
  const dayNum = parseInt(dateStr.split("/")[2] ?? "12")
  const df = 0.98 + (dayNum / 100) * 0.04
  const idx = branchList.findIndex((b) => b.id === branchId)
  if (idx < 0) return []

  return subIndicators.map((si) => {
    const sharesCur = computeShares(si.id)
    const sharesBase = computeShares(`${si.id}_base`)
    const current = si.nationalCurrent * sharesCur[idx] * df
    const base = si.nationalBase2024 * sharesBase[idx]
    const growthRate = base > 0 ? ((current - base) / base) * 100 : 0
    return {
      id: si.id,
      name: si.name,
      weight: `${(si.weight * 100).toFixed(0)}%`,
      current: +current.toFixed(2),
      base2024: +base.toFixed(2),
      growthRate: +growthRate.toFixed(2),
      increment: +(current - base).toFixed(2),
      unit: "万户",
    }
  })
}

export { branchList as efficiencyBranchList, subIndicators }
