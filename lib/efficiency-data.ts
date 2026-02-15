// ====================================================================
// 对私折效指标 — scoring data engine (quarterly settlement)
// ====================================================================
// Logic:
//   1. 对私折效客户数 = 信用卡年消费1w客户×0.3 + 新增活跃客户×0.25
//      + 中高端新增活跃客户×0.25 + 跨境交易客户×0.2
//   2. Compare vs 2024 base -> 增速 & 增量
//   3. 增速/增量 vs average -> z-score -> mapped to 0~100
//   4. 比系统得分 = (增速得分 × 70% + 增量得分 × 30%) × 100 / 10
//   5. 对私商户日均存款 vs 目标 -> 完成率
//   6. 扣分 = max(0, (1 - 完成率)) * 20  (max 20)
//   7. 各分行总分 = 比系统得分 - 扣分
// ====================================================================

import { institutions } from "./credit-card-data"

const branchList = institutions.filter((i) => i.id !== "all")
const BRANCH_COUNT = branchList.length

// ── Available quarters ────────────────────────────────────────────
export const availableQuarters = [
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
export interface SubIndicator {
  id: string
  name: string
  weight: number
  nationalCurrent: number
  nationalBase2024: number
}

export const subIndicators: SubIndicator[] = [
  { id: "annual_10k",     name: "信用卡年消费1w客户",   weight: 0.30, nationalCurrent: 3280, nationalBase2024: 3020 },
  { id: "new_active",     name: "新增活跃客户",         weight: 0.25, nationalCurrent: 1856, nationalBase2024: 1640 },
  { id: "highend_active", name: "中高端新增活跃客户",    weight: 0.25, nationalCurrent: 920,  nationalBase2024: 810 },
  { id: "cross_border",   name: "跨境交易客户",         weight: 0.20, nationalCurrent: 745,  nationalBase2024: 660 },
]

const depositNationalCurrent = 4850
const depositNationalTarget = 5200

// ── Compute branch shares ─────────────────────────────────────────
function computeShares(seed: string): number[] {
  const raw = branchList.map((b) => {
    const w = WEIGHT[b.id] ?? 1
    const jitter = 0.85 + seeded(hashCode(`eff_${seed}_${b.id}`)) * 0.3
    return w * jitter
  })
  const sum = raw.reduce((a, b) => a + b, 0)
  return raw.map((r) => r / sum)
}

// ── Quarter factor: different quarters give slightly different data
function quarterFactor(quarterId: string): number {
  const map: Record<string, number> = {
    "2025Q1": 0.92, "2025Q2": 0.95, "2025Q3": 0.98, "2025Q4": 1.0, "2026Q1": 1.02,
  }
  return map[quarterId] ?? 1.0
}

// ── Scoring table row ─────────────────────────────────────────────
export interface EfficiencyRow {
  branchId: string
  branchName: string
  annual10k: number
  newActive: number
  highendActive: number
  crossBorder: number
  efficiencyCust: number
  efficiencyCustBase: number
  growthRate: number
  growthIncrement: number
  growthRateScore: number
  growthIncrScore: number
  systemScore: number       // (增速×0.7 + 增量×0.3) * 100 / 10
  depositActual: number
  depositTarget: number
  depositCompletionRate: number
  depositDeduction: number
  totalScore: number        // systemScore - deduction
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

export function generateEfficiencyData(quarterId: string): {
  rows: EfficiencyRow[]
  summary: EfficiencySummary
} {
  const qf = quarterFactor(quarterId)

  const rows: EfficiencyRow[] = branchList.map((branch) => {
    const idx = branchList.findIndex((b) => b.id === branch.id)

    // Sub-indicator shares
    const s_a10k = computeShares("annual10k")[idx]
    const s_na   = computeShares("new_active")[idx]
    const s_ha   = computeShares("highend_active")[idx]
    const s_cb   = computeShares("cross_border")[idx]
    const s_dep  = computeShares("deposit_cur")[idx]
    const s_tgt  = computeShares("deposit_tgt")[idx]

    // Quarter jitter per branch
    const qJitter = 0.97 + seeded(hashCode(`q_${quarterId}_${branch.id}`)) * 0.06

    const annual10k     = subIndicators[0].nationalCurrent * s_a10k * qf * qJitter
    const newActive     = subIndicators[1].nationalCurrent * s_na   * qf * qJitter
    const highendActive = subIndicators[2].nationalCurrent * s_ha   * qf * qJitter
    const crossBorder   = subIndicators[3].nationalCurrent * s_cb   * qf * qJitter

    const efficiencyCust = annual10k * 0.30 + newActive * 0.25 + highendActive * 0.25 + crossBorder * 0.20

    // 2024 base
    const sb_a10k = computeShares("annual10k_base")[idx]
    const sb_na   = computeShares("new_active_base")[idx]
    const sb_ha   = computeShares("highend_active_base")[idx]
    const sb_cb   = computeShares("cross_border_base")[idx]
    const efficiencyCustBase =
      subIndicators[0].nationalBase2024 * sb_a10k * 0.30 +
      subIndicators[1].nationalBase2024 * sb_na   * 0.25 +
      subIndicators[2].nationalBase2024 * sb_ha   * 0.25 +
      subIndicators[3].nationalBase2024 * sb_cb   * 0.20

    const growthRate = efficiencyCustBase > 0 ? ((efficiencyCust - efficiencyCustBase) / efficiencyCustBase) * 100 : 0
    const growthIncrement = efficiencyCust - efficiencyCustBase

    // Deposit
    const depositJitter = 0.85 + seeded(hashCode(`dep_actual_${branch.id}`)) * 0.3
    const targetJitter  = 0.85 + seeded(hashCode(`dep_target_${branch.id}`)) * 0.3
    const depositActual = depositNationalCurrent * s_dep * depositJitter * qf
    const depositTarget = depositNationalTarget * s_tgt * targetJitter
    const depositCompletionRate = depositTarget > 0 ? (depositActual / depositTarget) * 100 : 100
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

  // Compute averages & std
  const avgGR  = rows.reduce((s, r) => s + r.growthRate, 0) / BRANCH_COUNT
  const avgGI  = rows.reduce((s, r) => s + r.growthIncrement, 0) / BRANCH_COUNT
  const stdGR  = Math.sqrt(rows.reduce((s, r) => s + (r.growthRate - avgGR) ** 2, 0) / BRANCH_COUNT) || 1
  const stdGI  = Math.sqrt(rows.reduce((s, r) => s + (r.growthIncrement - avgGI) ** 2, 0) / BRANCH_COUNT) || 1

  rows.forEach((r) => {
    const zRate = (r.growthRate - avgGR) / stdGR
    r.growthRateScore = +Math.max(0, Math.min(100, 60 + zRate * 15)).toFixed(2)

    const zIncr = (r.growthIncrement - avgGI) / stdGI
    r.growthIncrScore = +Math.max(0, Math.min(100, 60 + zIncr * 15)).toFixed(2)

    // systemScore = (增速×70% + 增量×30%) × 100 / 10
    r.systemScore = +((r.growthRateScore * 0.7 + r.growthIncrScore * 0.3) * 100 / 10 / 100).toFixed(2)
    r.totalScore = +(r.systemScore - r.depositDeduction).toFixed(2)
  })

  // Rank
  const sorted = [...rows].sort((a, b) => b.totalScore - a.totalScore)
  sorted.forEach((r, i) => { r.rank = i + 1 })
  const rankMap = new Map(sorted.map((r) => [r.branchId, r.rank]))
  rows.forEach((r) => { r.rank = rankMap.get(r.branchId) ?? 0 })

  const summary: EfficiencySummary = {
    totalEffCust: +rows.reduce((s, r) => s + r.efficiencyCust, 0).toFixed(2),
    totalEffCustBase: +rows.reduce((s, r) => s + r.efficiencyCustBase, 0).toFixed(2),
    avgGrowthRate: +avgGR.toFixed(2),
    avgGrowthIncrement: +avgGI.toFixed(2),
    avgSystemScore: +(rows.reduce((s, r) => s + r.systemScore, 0) / BRANCH_COUNT).toFixed(2),
    totalDeposit: +rows.reduce((s, r) => s + r.depositActual, 0).toFixed(2),
    totalDepositTarget: +rows.reduce((s, r) => s + r.depositTarget, 0).toFixed(2),
    avgCompletionRate: +(rows.reduce((s, r) => s + r.depositCompletionRate, 0) / BRANCH_COUNT).toFixed(2),
    avgDeduction: +(rows.reduce((s, r) => s + r.depositDeduction, 0) / BRANCH_COUNT).toFixed(2),
    avgTotalScore: +(rows.reduce((s, r) => s + r.totalScore, 0) / BRANCH_COUNT).toFixed(2),
  }

  return { rows, summary }
}

export { branchList as efficiencyBranchList }
