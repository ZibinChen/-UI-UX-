// ====================================================================
// 万马奔腾指标 — data engine
// All values are YTD cumulative to the latest date
// ====================================================================
// 4 major indicators:
// 1. 信用卡折效客户数 (same formula as efficiency panel)
//    = c1×3.5 + c2×18 + c3×35 + c4×8
// 2. 信用卡消费 = 普通消费 + 客户分期消费额 (满分30)
//    Scoring: ranked by YoY growth, 1st=base×130%, last=base×50%, linear interpolation
// 3. 信用卡跨境交易 = 境外消费 + 取现交易额 (满分15)
//    Score = 期末贡献度得分(50%=7.5) + 贡献度变动得分(50%=7.5)
//    Each sub: 1st=base×130%, last=base×50%, linear
//    贡献度 = branch / national, 贡献度变动 = current - prior year
// 4. 卓隽信用卡发卡 (满分10)
//    Score = 期末贡献度得分(50%=5) + 贡献度变动得分(50%=5)
//    Same ranking logic as #3
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
    const jitter = 0.85 + seeded(hashCode(`gal_${seed}_${b.id}`)) * 0.3
    return w * jitter
  })
  const sum = raw.reduce((a, b) => a + b, 0)
  return raw.map((r) => r / sum)
}

function dateFactor(dateStr: string): number {
  const parts = dateStr.split("/")
  if (parts.length !== 3) return 1
  const m = parseInt(parts[1])
  const d = parseInt(parts[2])
  return ((m - 1) * 30 + d) / 365
}

// ── Formula weights (same as efficiency) ──────────────────────────
const FW1 = 3.5, FW2 = 18, FW3 = 35, FW4 = 8

// ── National totals ───────────────────────────────────────────────
const N = {
  // Sub-indicators for 折效客户数
  annual10k: 8500000, newActive: 2680000, highendActive: 780000, crossBorder_sub: 2400000,
  annual10k_prior: 7800000, newActive_prior: 2350000, highendActive_prior: 650000, crossBorder_sub_prior: 2100000,
  // 信用卡消费 (亿元)
  normalConsume: 42000, installmentConsume: 8500,
  normalConsume_prior: 38000, installmentConsume_prior: 7600,
  // 跨境交易 (亿元)
  overseasConsume: 3200, cashWithdraw: 850,
  overseasConsume_prior: 2800, cashWithdraw_prior: 780,
  // 卓隽发卡 (万张)
  zhuojunCards: 1200,
  zhuojunCards_prior: 980,
}

// ── Rank-based scoring: 1st=base×130%, last=base×50%, linear ──────
function rankScore(values: number[], baseScore: number): number[] {
  const indexed = values.map((v, i) => ({ v, i }))
  const sorted = [...indexed].sort((a, b) => b.v - a.v)
  const scores = new Array(values.length)
  const n = values.length
  sorted.forEach((item, rank) => {
    // rank 0 = 130%, rank n-1 = 50%, linear interpolation
    const pct = n > 1 ? 1.3 - (rank / (n - 1)) * 0.8 : 1.0
    scores[item.i] = +(baseScore * pct).toFixed(2)
  })
  return scores
}

// ── Contribution-based scoring ────────────────────────────────────
// 贡献度 = branch_value / national_total (ranked)
// 贡献度变动 = current_contribution - prior_contribution (ranked)
function contributionScore(
  currentValues: number[],
  priorValues: number[],
  baseScore: number // half for 期末贡献度, half for 变动
): number[] {
  const national = currentValues.reduce((s, v) => s + v, 0) || 1
  const nationalPrior = priorValues.reduce((s, v) => s + v, 0) || 1
  const half = baseScore / 2

  const contributions = currentValues.map(v => v / national)
  const priorContributions = priorValues.map(v => v / nationalPrior)
  const changes = contributions.map((c, i) => c - priorContributions[i])

  const contribScores = rankScore(contributions, half)
  const changeScores = rankScore(changes, half)

  return currentValues.map((_, i) => +(contribScores[i] + changeScores[i]).toFixed(2))
}

// ── Row interfaces ────────────────────────────────────────────────
export interface GallopEffRow {
  branchId: string
  branchName: string
  annual10k: number
  newActive: number
  highendActive: number
  crossBorderSub: number
  effCust: number
  effCustBase: number
  growthRate: number
  growthIncrement: number
  growthRateScore: number
  growthIncrScore: number
  systemScore: number
}

export interface GallopConsumeRow {
  branchId: string
  branchName: string
  normalConsume: number     // 亿元
  installmentConsume: number
  totalConsume: number
  normalPrior: number
  installmentPrior: number
  totalPrior: number
  yoyGrowth: number         // %
  score: number              // max 30
  rank: number
}

export interface GallopCrossBorderRow {
  branchId: string
  branchName: string
  overseasConsume: number    // 亿元
  cashWithdraw: number
  totalCross: number
  totalCrossPrior: number
  contribution: number       // %
  contributionPrior: number
  contributionChange: number
  contribScore: number       // 7.5 max
  changeScore: number        // 7.5 max
  score: number              // max 15
  rank: number
}

export interface GallopZhuojunRow {
  branchId: string
  branchName: string
  newCards: number           // 万张
  newCardsPrior: number
  contribution: number       // %
  contributionPrior: number
  contributionChange: number
  contribScore: number       // 5 max
  changeScore: number        // 5 max
  score: number              // max 10
  rank: number
}

export interface GallopIndicatorRow {
  id: string
  name: string
  indent: number
  value: string
  rawValue: number
  unit: string
  comparisonType: string
  comparison: string
  comparisonRaw: number
}

// ── Trend data for charts ─────────────────────────────────────────
export interface GallopTrendPoint {
  month: string
  value: number
  yoyPct: number | null
}

// ── Generation functions ──────────────────────────────────────────

// Date factor for YTD scaling
function genBranchVal(nationalVal: number, seed: string, idx: number, shares: number[], df: number): number {
  const jitter = 0.95 + seeded(hashCode(`gal_jit_${seed}_${branchList[idx].id}`)) * 0.1
  return nationalVal * shares[idx] * df * jitter
}

export function generateGallopEfficiency(dateStr: string): GallopEffRow[] {
  const df = dateFactor(dateStr)
  const sh1 = computeShares("g_a10k"); const sh2 = computeShares("g_na")
  const sh3 = computeShares("g_ha"); const sh4 = computeShares("g_cb")
  const sh1p = computeShares("g_a10k_p"); const sh2p = computeShares("g_na_p")
  const sh3p = computeShares("g_ha_p"); const sh4p = computeShares("g_cb_p")

  const rows: GallopEffRow[] = branchList.map((b, i) => {
    const annual10k = Math.round(genBranchVal(N.annual10k, "a10k", i, sh1, df))
    const newActive = Math.round(genBranchVal(N.newActive, "na", i, sh2, df))
    const highendActive = Math.round(genBranchVal(N.highendActive, "ha", i, sh3, df))
    const crossBorderSub = Math.round(genBranchVal(N.crossBorder_sub, "cb", i, sh4, df))
    const effCust = Math.round(annual10k * FW1 + newActive * FW2 + highendActive * FW3 + crossBorderSub * FW4)

    const a10kp = Math.round(N.annual10k_prior * sh1p[i] * df)
    const nap = Math.round(N.newActive_prior * sh2p[i] * df)
    const hap = Math.round(N.highendActive_prior * sh3p[i] * df)
    const cbp = Math.round(N.crossBorder_sub_prior * sh4p[i] * df)
    const effCustBase = Math.round(a10kp * FW1 + nap * FW2 + hap * FW3 + cbp * FW4)

    const growthRate = effCustBase > 0 ? ((effCust - effCustBase) / effCustBase) * 100 : 0
    const growthIncrement = effCust - effCustBase

    return { branchId: b.id, branchName: b.name, annual10k, newActive, highendActive, crossBorderSub,
      effCust, effCustBase, growthRate, growthIncrement,
      growthRateScore: 0, growthIncrScore: 0, systemScore: 0 }
  })

  // z-score normalization
  const avgGR = rows.reduce((s, r) => s + r.growthRate, 0) / BRANCH_COUNT
  const avgGI = rows.reduce((s, r) => s + r.growthIncrement, 0) / BRANCH_COUNT
  const stdGR = Math.sqrt(rows.reduce((s, r) => s + (r.growthRate - avgGR) ** 2, 0) / BRANCH_COUNT) || 1
  const stdGI = Math.sqrt(rows.reduce((s, r) => s + (r.growthIncrement - avgGI) ** 2, 0) / BRANCH_COUNT) || 1

  rows.forEach(r => {
    r.growthRateScore = +Math.max(30, Math.min(130, 80 + ((r.growthRate - avgGR) / stdGR) * 25)).toFixed(2)
    r.growthIncrScore = +Math.max(30, Math.min(130, 80 + ((r.growthIncrement - avgGI) / stdGI) * 25)).toFixed(2)
    r.systemScore = +((r.growthRateScore / 100 * 0.7 + r.growthIncrScore / 100 * 0.3) * 100 / 10).toFixed(2)
  })
  return rows
}

export function generateGallopConsume(dateStr: string): GallopConsumeRow[] {
  const df = dateFactor(dateStr)
  const shN = computeShares("g_normalC"); const shI = computeShares("g_installC")
  const shNp = computeShares("g_normalCp"); const shIp = computeShares("g_installCp")

  const rows: GallopConsumeRow[] = branchList.map((b, i) => {
    const normalConsume = +genBranchVal(N.normalConsume, "nC", i, shN, df).toFixed(2)
    const installmentConsume = +genBranchVal(N.installmentConsume, "iC", i, shI, df).toFixed(2)
    const totalConsume = +(normalConsume + installmentConsume).toFixed(2)
    const normalPrior = +genBranchVal(N.normalConsume_prior, "nCp", i, shNp, df).toFixed(2)
    const installmentPrior = +genBranchVal(N.installmentConsume_prior, "iCp", i, shIp, df).toFixed(2)
    const totalPrior = +(normalPrior + installmentPrior).toFixed(2)
    const yoyGrowth = totalPrior > 0 ? +((totalConsume - totalPrior) / totalPrior * 100).toFixed(2) : 0
    return { branchId: b.id, branchName: b.name, normalConsume, installmentConsume, totalConsume,
      normalPrior, installmentPrior, totalPrior, yoyGrowth, score: 0, rank: 0 }
  })

  const growthValues = rows.map(r => r.yoyGrowth)
  const scores = rankScore(growthValues, 30)
  rows.forEach((r, i) => { r.score = scores[i] })
  const sorted = [...rows].sort((a, b) => b.score - a.score)
  sorted.forEach((r, i) => { r.rank = i + 1 })
  const rankMap = new Map(sorted.map(r => [r.branchId, r.rank]))
  rows.forEach(r => { r.rank = rankMap.get(r.branchId) ?? 0 })
  return rows
}

export function generateGallopCrossBorder(dateStr: string): GallopCrossBorderRow[] {
  const df = dateFactor(dateStr)
  const shO = computeShares("g_overseas"); const shC = computeShares("g_cash")
  const shOp = computeShares("g_overseasP"); const shCp = computeShares("g_cashP")

  const currentValues: number[] = []
  const priorValues: number[] = []

  const rows: GallopCrossBorderRow[] = branchList.map((b, i) => {
    const overseasConsume = +genBranchVal(N.overseasConsume, "oC", i, shO, df).toFixed(2)
    const cashWithdraw = +genBranchVal(N.cashWithdraw, "cW", i, shC, df).toFixed(2)
    const totalCross = +(overseasConsume + cashWithdraw).toFixed(2)
    const oP = +genBranchVal(N.overseasConsume_prior, "oCp", i, shOp, df).toFixed(2)
    const cP = +genBranchVal(N.cashWithdraw_prior, "cWp", i, shCp, df).toFixed(2)
    const totalCrossPrior = +(oP + cP).toFixed(2)
    currentValues.push(totalCross)
    priorValues.push(totalCrossPrior)
    return { branchId: b.id, branchName: b.name, overseasConsume, cashWithdraw, totalCross, totalCrossPrior,
      contribution: 0, contributionPrior: 0, contributionChange: 0,
      contribScore: 0, changeScore: 0, score: 0, rank: 0 }
  })

  const natCur = currentValues.reduce((s, v) => s + v, 0) || 1
  const natPri = priorValues.reduce((s, v) => s + v, 0) || 1
  rows.forEach((r, i) => {
    r.contribution = +(currentValues[i] / natCur * 100).toFixed(4)
    r.contributionPrior = +(priorValues[i] / natPri * 100).toFixed(4)
    r.contributionChange = +(r.contribution - r.contributionPrior).toFixed(4)
  })

  const scores = contributionScore(currentValues, priorValues, 15)
  // Also get half-scores for display
  const contribHalf = rankScore(rows.map(r => r.contribution), 7.5)
  const changeHalf = rankScore(rows.map(r => r.contributionChange), 7.5)
  rows.forEach((r, i) => {
    r.contribScore = contribHalf[i]
    r.changeScore = changeHalf[i]
    r.score = scores[i]
  })

  const sorted = [...rows].sort((a, b) => b.score - a.score)
  sorted.forEach((r, i) => { r.rank = i + 1 })
  const rankMap = new Map(sorted.map(r => [r.branchId, r.rank]))
  rows.forEach(r => { r.rank = rankMap.get(r.branchId) ?? 0 })
  return rows
}

export function generateGallopZhuojun(dateStr: string): GallopZhuojunRow[] {
  const df = dateFactor(dateStr)
  const sh = computeShares("g_zhuojun"); const shP = computeShares("g_zhuojunP")

  const currentValues: number[] = []
  const priorValues: number[] = []

  const rows: GallopZhuojunRow[] = branchList.map((b, i) => {
    const newCards = +genBranchVal(N.zhuojunCards, "zj", i, sh, df).toFixed(2)
    const newCardsPrior = +genBranchVal(N.zhuojunCards_prior, "zjp", i, shP, df).toFixed(2)
    currentValues.push(newCards)
    priorValues.push(newCardsPrior)
    return { branchId: b.id, branchName: b.name, newCards, newCardsPrior,
      contribution: 0, contributionPrior: 0, contributionChange: 0,
      contribScore: 0, changeScore: 0, score: 0, rank: 0 }
  })

  const natCur = currentValues.reduce((s, v) => s + v, 0) || 1
  const natPri = priorValues.reduce((s, v) => s + v, 0) || 1
  rows.forEach((r, i) => {
    r.contribution = +(currentValues[i] / natCur * 100).toFixed(4)
    r.contributionPrior = +(priorValues[i] / natPri * 100).toFixed(4)
    r.contributionChange = +(r.contribution - r.contributionPrior).toFixed(4)
  })

  const scores = contributionScore(currentValues, priorValues, 10)
  const contribHalf = rankScore(rows.map(r => r.contribution), 5)
  const changeHalf = rankScore(rows.map(r => r.contributionChange), 5)
  rows.forEach((r, i) => {
    r.contribScore = contribHalf[i]
    r.changeScore = changeHalf[i]
    r.score = scores[i]
  })

  const sorted = [...rows].sort((a, b) => b.score - a.score)
  sorted.forEach((r, i) => { r.rank = i + 1 })
  const rankMap = new Map(sorted.map(r => [r.branchId, r.rank]))
  rows.forEach(r => { r.rank = rankMap.get(r.branchId) ?? 0 })
  return rows
}

// ── Summary indicators for "全部指标" tab ─────────────────────────
export function generateGallopSummaryIndicators(dateStr: string): GallopIndicatorRow[] {
  const df = dateFactor(dateStr)
  const effRows = generateGallopEfficiency(dateStr)
  const conRows = generateGallopConsume(dateStr)
  const crossRows = generateGallopCrossBorder(dateStr)
  const zjRows = generateGallopZhuojun(dateStr)

  const totalEff = effRows.reduce((s, r) => s + r.effCust, 0)
  const totalA10k = effRows.reduce((s, r) => s + r.annual10k, 0)
  const totalNA = effRows.reduce((s, r) => s + r.newActive, 0)
  const totalHA = effRows.reduce((s, r) => s + r.highendActive, 0)
  const totalCB = effRows.reduce((s, r) => s + r.crossBorderSub, 0)

  const totalConsume = conRows.reduce((s, r) => s + r.totalConsume, 0)
  const totalNormal = conRows.reduce((s, r) => s + r.normalConsume, 0)
  const totalInstall = conRows.reduce((s, r) => s + r.installmentConsume, 0)
  const totalConsumePrior = conRows.reduce((s, r) => s + r.totalPrior, 0)

  const totalCross = crossRows.reduce((s, r) => s + r.totalCross, 0)
  const totalOverseas = crossRows.reduce((s, r) => s + r.overseasConsume, 0)
  const totalCash = crossRows.reduce((s, r) => s + r.cashWithdraw, 0)
  const totalCrossPrior = crossRows.reduce((s, r) => s + r.totalCrossPrior, 0)

  const totalZJ = zjRows.reduce((s, r) => s + r.newCards, 0)
  const totalZJPrior = zjRows.reduce((s, r) => s + r.newCardsPrior, 0)

  function fmtV(v: number, unit: string): string {
    if (unit === "亿元") return v >= 10000 ? `${(v / 10000).toFixed(2)}万亿` : `${v.toFixed(2)}亿`
    if (unit === "万户" || unit === "万张") return v >= 10000 ? `${(v / 10000).toFixed(2)}亿` : `${Math.round(v).toLocaleString()}万`
    return v.toLocaleString()
  }
  function fmtR(cur: number, prior: number): { comparison: string; comparisonRaw: number } {
    const r = prior > 0 ? ((cur - prior) / prior) * 100 : 0
    return { comparison: `${r >= 0 ? "+" : ""}${r.toFixed(2)}%`, comparisonRaw: r }
  }

  const effBase = effRows.reduce((s, r) => s + r.effCustBase, 0)
  const consumeCompare = fmtR(totalConsume, totalConsumePrior)
  const crossCompare = fmtR(totalCross, totalCrossPrior)
  const zjCompare = fmtR(totalZJ, totalZJPrior)
  const effCompare = fmtR(totalEff, effBase)

  return [
    { id: "g_eff", name: "信用卡折效客户数", indent: 0, value: fmtV(totalEff, ""), rawValue: totalEff, unit: "", comparisonType: "同比", ...effCompare },
    { id: "g_eff_a10k", name: "信用卡年消费1万以上客户", indent: 1, value: totalA10k.toLocaleString(), rawValue: totalA10k, unit: "", comparisonType: "同比", comparison: "", comparisonRaw: 0 },
    { id: "g_eff_na", name: "新增活跃客户", indent: 1, value: totalNA.toLocaleString(), rawValue: totalNA, unit: "", comparisonType: "同比", comparison: "", comparisonRaw: 0 },
    { id: "g_eff_ha", name: "中高端新增活跃客户", indent: 1, value: totalHA.toLocaleString(), rawValue: totalHA, unit: "", comparisonType: "同比", comparison: "", comparisonRaw: 0 },
    { id: "g_eff_cb", name: "跨境交易客户", indent: 1, value: totalCB.toLocaleString(), rawValue: totalCB, unit: "", comparisonType: "同比", comparison: "", comparisonRaw: 0 },

    { id: "g_consume", name: "信用卡消费（满分30分）", indent: 0, value: fmtV(totalConsume, "亿元"), rawValue: totalConsume, unit: "亿元", comparisonType: "同比", ...consumeCompare },
    { id: "g_consume_normal", name: "普通消费", indent: 1, value: fmtV(totalNormal, "亿元"), rawValue: totalNormal, unit: "亿元", comparisonType: "同比", comparison: "", comparisonRaw: 0 },
    { id: "g_consume_install", name: "客户分期消费额", indent: 1, value: fmtV(totalInstall, "亿元"), rawValue: totalInstall, unit: "亿元", comparisonType: "同比", comparison: "", comparisonRaw: 0 },

    { id: "g_cross", name: "信用卡跨境交易（满分15分）", indent: 0, value: fmtV(totalCross, "亿元"), rawValue: totalCross, unit: "亿元", comparisonType: "同比", ...crossCompare },
    { id: "g_cross_overseas", name: "境外消费", indent: 1, value: fmtV(totalOverseas, "亿元"), rawValue: totalOverseas, unit: "亿元", comparisonType: "同比", comparison: "", comparisonRaw: 0 },
    { id: "g_cross_cash", name: "取现交易额", indent: 1, value: fmtV(totalCash, "亿元"), rawValue: totalCash, unit: "亿元", comparisonType: "同比", comparison: "", comparisonRaw: 0 },

    { id: "g_zhuojun", name: "卓隽信用卡发卡（满分10分）", indent: 0, value: fmtV(totalZJ, "万张"), rawValue: totalZJ, unit: "万张", comparisonType: "同比", ...zjCompare },
  ]
}

// ── Monthly trend data for charts ─────────────────────────────────
const MONTHS = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"]

export function generateGallopTrend(
  indicatorKey: "consume" | "crossBorder" | "zhuojun" | "efficiency",
  institutionId: string,
  dateStr: string
): GallopTrendPoint[] {
  const parts = dateStr.split("/")
  const maxMonth = parts.length === 3 ? parseInt(parts[1]) : 12
  const months = MONTHS.slice(0, maxMonth)

  const nationalBase: Record<string, number> = {
    consume: N.normalConsume + N.installmentConsume,
    crossBorder: N.overseasConsume + N.cashWithdraw,
    zhuojun: N.zhuojunCards,
    efficiency: N.annual10k * FW1 + N.newActive * FW2 + N.highendActive * FW3 + N.crossBorder_sub * FW4,
  }
  const priorBase: Record<string, number> = {
    consume: N.normalConsume_prior + N.installmentConsume_prior,
    crossBorder: N.overseasConsume_prior + N.cashWithdraw_prior,
    zhuojun: N.zhuojunCards_prior,
    efficiency: N.annual10k_prior * FW1 + N.newActive_prior * FW2 + N.highendActive_prior * FW3 + N.crossBorder_sub_prior * FW4,
  }

  const isAll = institutionId === "all"
  const shares = computeShares(`gtrend_${indicatorKey}`)
  const idx = branchList.findIndex(b => b.id === institutionId)

  let prevCum = 0
  return months.map((month, mi) => {
    const mFrac = (mi + 1) / 12
    const seasonal = 0.85 + seeded(hashCode(`gseason_${indicatorKey}_${mi}`)) * 0.3
    let curCum = nationalBase[indicatorKey] * mFrac * seasonal
    const priCum = priorBase[indicatorKey] * mFrac * seasonal * 0.95

    if (!isAll && idx >= 0) {
      const brJitter = 0.92 + seeded(hashCode(`gtrend_br_${indicatorKey}_${mi}_${institutionId}`)) * 0.16
      curCum = curCum * shares[idx] * brJitter
    }

    const yoyPct = priCum > 0 ? ((curCum - priCum) / priCum) * 100 : null
    const momPct = prevCum > 0 ? ((curCum - prevCum) / prevCum) * 100 : null
    prevCum = curCum

    return {
      month,
      value: +curCum.toFixed(2),
      yoyPct: yoyPct !== null ? +yoyPct.toFixed(2) : null,
    }
  })
}

// ── Indicator definitions (for reference) ─────────────────────────
export const GALLOP_INDICATOR_DEFS = {
  efficiency: {
    name: "信用卡折效客户数",
    description: "= 信用卡年消费1万以上客户 × 3.5 + 新增活跃客户 × 18 + 中高端新增活跃客户 × 35 + 跨境交易客户 × 8",
  },
  consume: {
    name: "信用卡消费（满分30分）",
    description: "= 普通消费 + 客户分期消费额。评分：基于消费额较去年同期增长排名，第一名得基本分×130%，最后一名得基本分×50%，按排名等差赋分。",
  },
  crossBorder: {
    name: "信用卡跨境交易（满分15分）",
    description: "= 境外消费 + 取现交易额。评分 = 期末贡献度得分（50%=7.5分）+ 贡献度变动得分（50%=7.5分）。贡献度 = 跨境交易额占全行比例排序。贡献度变动 = 当期贡献度 - 去年同期贡献度差值排序。",
  },
  zhuojun: {
    name: "卓隽信用卡发卡（满分10分）",
    description: "卓隽信用卡当年新发活动卡量。评分 = 期末贡献度得分（50%=5分）+ 贡献度变动得分（50%=5分）。卓隽卡：指我行Visa、万事达、银联品牌卓隽系列信用卡。活动卡量：最近六个月有消费、取现、转账或存款，且单笔金额10元以上的卡量，或者六个月内日均存款余额大于等于10元的卡量。",
  },
}

export { branchList as gallopBranchList }
