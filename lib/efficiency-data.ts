// ====================================================================
// 对私折效指标 — scoring data engine (quarterly settlement)
// ====================================================================
// Calculation chain (matching Excel screenshot magnitudes):
//   1. Four sub-indicators per branch (base data, 万户 scale):
//      信用卡年消费1w客户, 新增活跃客户, 中高端新增活跃客户, 跨境交易客户
//   2. 对私折效客户数 = c1×3.5 + c2×18 + c3×35 + c4×8
//      This weighted formula produces values in the millions
//   3. 2024年基数 = same formula applied to 2024 sub-indicator values
//   4. 增速 = (2025 - 2024) / 2024
//   5. 增量 = 2025 - 2024
//   6. 增速得分率 = normalized vs avg, mapped to [30%, 130%]
//   7. 增量得分率 = normalized vs avg, mapped to [30%, 130%]
//   8. 比系统得分 = (增速得分率×70% + 增量得分率×30%) × 100 / 10
//   9. 对私商户日均存款 (亿元) vs 目标 -> 完成率
//  10. 完成率 < 100% => 扣分 = (1 - 完成率) × maxPenalty
//  11. 各分行总分 = 比系统得分 - 扣分
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

// ── Province economic weight (controls relative branch size) ──────
// Larger provinces get higher weights -> bigger sub-indicator values
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

// ── Formula weights for 折效客户数 ────────────────────────────────
// 折效客户数 = c1×W1 + c2×W2 + c3×W3 + c4×W4
const FORMULA_W1 = 3.5   // 信用卡年消费1w
const FORMULA_W2 = 18     // 新增活跃
const FORMULA_W3 = 35     // 中高端新增活跃
const FORMULA_W4 = 8      // 跨境交易

// ── National totals for sub-indicators (万户 -> actual count) ─────
// These produce branch values in the 10K~950K range per screenshot
const NATIONAL_SUB = {
  annual10k_2025:     8500000,    // ~8.5M total, branch ~70K-950K
  newActive_2025:     2680000,    // ~2.68M total, branch ~7K-180K
  highendActive_2025: 780000,     // ~780K total, branch ~500-50K
  crossBorder_2025:   2400000,    // ~2.4M total, branch ~500-190K
  annual10k_2024:     7800000,
  newActive_2024:     2350000,
  highendActive_2024: 650000,
  crossBorder_2024:   2100000,
}

// ── National deposit totals (亿元) ────────────────────────────────
const NATIONAL_DEPOSIT_ACTUAL = 650  // ~650亿 total, branch ~0.2-80亿
const NATIONAL_DEPOSIT_TARGET = 620  // slightly lower so most complete

// ── Sub-indicator meta (for display) ──────────────────────────────
export interface SubIndicator {
  id: string
  name: string
  formulaWeight: number
}

export const subIndicators: SubIndicator[] = [
  { id: "annual_10k",     name: "信用卡年消费1万以上客户", formulaWeight: FORMULA_W1 },
  { id: "new_active",     name: "新增活跃客户",           formulaWeight: FORMULA_W2 },
  { id: "highend_active", name: "中高端新增活跃客户",      formulaWeight: FORMULA_W3 },
  { id: "cross_border",   name: "跨境交易客户",           formulaWeight: FORMULA_W4 },
]

// ── Compute branch shares (stable per seed) ───────────────────────
function computeShares(seed: string): number[] {
  const raw = branchList.map((b) => {
    const w = WEIGHT[b.id] ?? 1
    const jitter = 0.85 + seeded(hashCode(`eff_${seed}_${b.id}`)) * 0.3
    return w * jitter
  })
  const sum = raw.reduce((a, b) => a + b, 0)
  return raw.map((r) => r / sum)
}

// ── Quarter factor ────────────────────────────────────────────────
function quarterFactor(quarterId: string): number {
  const map: Record<string, number> = {
    "2025Q1": 0.92, "2025Q2": 0.96, "2025Q3": 0.98, "2025Q4": 1.0, "2026Q1": 1.03,
  }
  return map[quarterId] ?? 1.0
}

// ── Scoring table row ─────────────────────────────────────────────
export interface EfficiencyRow {
  branchId: string
  branchName: string
  // 4 sub-indicators (raw counts)
  annual10k: number
  newActive: number
  highendActive: number
  crossBorder: number
  // formula result
  efficiencyCust: number       // 2025: weighted sum
  efficiencyCustBase: number   // 2024 base: weighted sum
  // growth
  growthRate: number           // % change
  growthIncrement: number      // absolute change
  // scoring
  growthRateScore: number      // 得分率 30%-130%
  growthIncrScore: number      // 得分率 30%-130%
  systemScore: number          // (增速×0.7 + 增量×0.3) × 100 / 10
  // deposit
  depositActual: number        // 亿元
  depositTarget: number        // 亿元
  depositCompletionRate: number // %
  depositDeduction: number     // >= 0
  // final
  totalScore: number           // systemScore - deduction
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

  // Shares for each sub-indicator (different seeds -> different distributions)
  const sh_a10k_25 = computeShares("annual10k_2025")
  const sh_na_25   = computeShares("new_active_2025")
  const sh_ha_25   = computeShares("highend_active_2025")
  const sh_cb_25   = computeShares("cross_border_2025")
  const sh_a10k_24 = computeShares("annual10k_2024")
  const sh_na_24   = computeShares("new_active_2024")
  const sh_ha_24   = computeShares("highend_active_2024")
  const sh_cb_24   = computeShares("cross_border_2024")
  const sh_dep     = computeShares("deposit_actual")
  const sh_tgt     = computeShares("deposit_target")

  const rows: EfficiencyRow[] = branchList.map((branch, idx) => {
    // Quarter jitter per branch (small variation)
    const qj = 0.97 + seeded(hashCode(`q_${quarterId}_${branch.id}`)) * 0.06

    // 2025 sub-indicators (actual counts)
    const annual10k     = Math.round(NATIONAL_SUB.annual10k_2025 * sh_a10k_25[idx] * qf * qj)
    const newActive     = Math.round(NATIONAL_SUB.newActive_2025 * sh_na_25[idx] * qf * qj)
    const highendActive = Math.round(NATIONAL_SUB.highendActive_2025 * sh_ha_25[idx] * qf * qj)
    const crossBorder   = Math.round(NATIONAL_SUB.crossBorder_2025 * sh_cb_25[idx] * qf * qj)

    // 2025 折效客户数 via formula
    const efficiencyCust = Math.round(
      annual10k * FORMULA_W1 + newActive * FORMULA_W2 + highendActive * FORMULA_W3 + crossBorder * FORMULA_W4
    )

    // 2024 sub-indicators & base
    const a10k_24 = Math.round(NATIONAL_SUB.annual10k_2024 * sh_a10k_24[idx])
    const na_24   = Math.round(NATIONAL_SUB.newActive_2024 * sh_na_24[idx])
    const ha_24   = Math.round(NATIONAL_SUB.highendActive_2024 * sh_ha_24[idx])
    const cb_24   = Math.round(NATIONAL_SUB.crossBorder_2024 * sh_cb_24[idx])
    const efficiencyCustBase = Math.round(
      a10k_24 * FORMULA_W1 + na_24 * FORMULA_W2 + ha_24 * FORMULA_W3 + cb_24 * FORMULA_W4
    )

    // Growth
    const growthRate = efficiencyCustBase > 0
      ? ((efficiencyCust - efficiencyCustBase) / efficiencyCustBase) * 100
      : 0
    const growthIncrement = efficiencyCust - efficiencyCustBase

    // Deposit (亿元)
    const depJitter = 0.85 + seeded(hashCode(`dep_act_${branch.id}`)) * 0.3
    const tgtJitter = 0.85 + seeded(hashCode(`dep_tgt_${branch.id}`)) * 0.3
    const depositActual = NATIONAL_DEPOSIT_ACTUAL * sh_dep[idx] * depJitter * qf
    const depositTarget = NATIONAL_DEPOSIT_TARGET * sh_tgt[idx] * tgtJitter
    const depositCompletionRate = depositTarget > 0 ? (depositActual / depositTarget) * 100 : 100
    // Deduction: shortfall mapped. From screenshot: most 0, some -0.15 to -2.00
    const depositDeduction = depositCompletionRate >= 100
      ? 0
      : +((1 - depositActual / depositTarget) * 10).toFixed(2)

    return {
      branchId: branch.id,
      branchName: branch.name,
      annual10k,
      newActive,
      highendActive,
      crossBorder,
      efficiencyCust,
      efficiencyCustBase,
      growthRate,
      growthIncrement,
      growthRateScore: 0,  // computed below
      growthIncrScore: 0,
      systemScore: 0,
      depositActual: +depositActual.toFixed(2),
      depositTarget: +depositTarget.toFixed(2),
      depositCompletionRate: +depositCompletionRate.toFixed(2),
      depositDeduction: Math.abs(depositDeduction),
      totalScore: 0,
      rank: 0,
    }
  })

  // ── Compute 增速/增量得分率 (capped 30%-130% per screenshot) ────
  const avgGR = rows.reduce((s, r) => s + r.growthRate, 0) / BRANCH_COUNT
  const avgGI = rows.reduce((s, r) => s + r.growthIncrement, 0) / BRANCH_COUNT
  const stdGR = Math.sqrt(rows.reduce((s, r) => s + (r.growthRate - avgGR) ** 2, 0) / BRANCH_COUNT) || 1
  const stdGI = Math.sqrt(rows.reduce((s, r) => s + (r.growthIncrement - avgGI) ** 2, 0) / BRANCH_COUNT) || 1

  rows.forEach((r) => {
    // Map z-score to [30, 130]: center at 80, +-50
    const zRate = (r.growthRate - avgGR) / stdGR
    r.growthRateScore = +Math.max(30, Math.min(130, 80 + zRate * 25)).toFixed(2)

    const zIncr = (r.growthIncrement - avgGI) / stdGI
    r.growthIncrScore = +Math.max(30, Math.min(130, 80 + zIncr * 25)).toFixed(2)

    // 比系统得分 = (增速得分率×70% + 增量得分率×30%) × 100 / 10
    // 得分率 is %, so e.g. 91.10 -> 0.9110
    const weightedScore = (r.growthRateScore / 100) * 0.7 + (r.growthIncrScore / 100) * 0.3
    r.systemScore = +(weightedScore * 100 / 10).toFixed(2)  // e.g. 9.50

    r.totalScore = +(r.systemScore - r.depositDeduction).toFixed(2)
  })

  // ── Rank by totalScore desc ─────────────────────────────────────
  const sorted = [...rows].sort((a, b) => b.totalScore - a.totalScore)
  sorted.forEach((r, i) => { r.rank = i + 1 })
  const rankMap = new Map(sorted.map((r) => [r.branchId, r.rank]))
  rows.forEach((r) => { r.rank = rankMap.get(r.branchId) ?? 0 })

  const summary: EfficiencySummary = {
    totalEffCust: rows.reduce((s, r) => s + r.efficiencyCust, 0),
    totalEffCustBase: rows.reduce((s, r) => s + r.efficiencyCustBase, 0),
    avgGrowthRate: +avgGR.toFixed(2),
    avgGrowthIncrement: Math.round(avgGI),
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
