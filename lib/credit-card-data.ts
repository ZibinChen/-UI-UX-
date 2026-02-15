// ====================================================================
// Credit Card Business Indicators — deterministic data engine v4
// ====================================================================
// Approach:
//   1. Define NATIONAL TOTALS for current period and year-start.
//   2. Compute each branch's SHARE of the national total (sums to 1.0).
//   3. Branch current value = nationalTotal * share[branch].
//   4. Branch year-start value = nationalYearStart * shareYearStart[branch].
//   5. Growth rate is derived from (current - yearStart) / yearStart.
//   6. Summary row = exact nationalTotal (which equals sum of branch values).
//   7. Rankings come from sorting branch growth rates.
// ====================================================================

export type IndicatorCategory = "customer" | "consumption" | "loan" | "crossborder" | "highend" | "highconsume"

export interface IndicatorRow {
  id: string
  name: string
  indent: number
  category: IndicatorCategory
  value: string
  rawValue: number
  unit: string
  comparisonType: string
  comparison: string
  comparisonRaw: number
  growthVsAll: string
  growthVsAllRaw: number
  growthRank: number
}

// ── Institutions ──────────────────────────────────────────────────
export const institutions: { id: string; name: string }[] = [
  { id: "all", name: "境内分支机构汇总" },
  { id: "beijing", name: "北京市分行" },
  { id: "tianjin", name: "天津市分行" },
  { id: "hebei", name: "河北省分行" },
  { id: "shanxi", name: "山西省分行" },
  { id: "neimenggu", name: "内蒙古分行" },
  { id: "liaoning", name: "辽宁省分行" },
  { id: "jilin", name: "吉林省分行" },
  { id: "heilongjiang", name: "黑龙江省分行" },
  { id: "shanghai", name: "上海市分行" },
  { id: "jiangsu", name: "江苏省分行" },
  { id: "zhejiang", name: "浙江省分行" },
  { id: "anhui", name: "安徽省分行" },
  { id: "fujian", name: "福建省分行" },
  { id: "jiangxi", name: "江西省分行" },
  { id: "shandong", name: "山东省分行" },
  { id: "henan", name: "河南省分行" },
  { id: "hubei", name: "湖北省分行" },
  { id: "hunan", name: "湖南省分行" },
  { id: "guangdong", name: "广东省分行" },
  { id: "guangxi", name: "广西分行" },
  { id: "hainan", name: "海南省分行" },
  { id: "chongqing", name: "重庆市分行" },
  { id: "sichuan", name: "四川省分行" },
  { id: "guizhou", name: "贵州省分行" },
  { id: "yunnan", name: "云南省分行" },
  { id: "xizang", name: "西藏分行" },
  { id: "shaanxi", name: "陕西省分行" },
  { id: "gansu", name: "甘肃省分行" },
  { id: "qinghai", name: "青海省分行" },
  { id: "ningxia", name: "宁夏分行" },
  { id: "xinjiang", name: "新疆分行" },
  { id: "shenzhen", name: "深圳市分行" },
  { id: "ningbo", name: "宁波市分行" },
  { id: "dalian", name: "大连市分行" },
  { id: "qingdao", name: "青岛市分行" },
  { id: "xiamen", name: "厦门市分行" },
]

const branchList = institutions.filter((i) => i.id !== "all")
const BRANCH_COUNT = branchList.length // 36

// ── Available dates ───────────────────────────────────────────────
export const availableDates: string[] = [
  "2026/01/31",
  ...Array.from({ length: 12 }, (_, i) => `2026/02/${String(i + 1).padStart(2, "0")}`),
]

// ── Deterministic seeded random ───────────────────────────────────
function hashCode(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function seeded(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x) // 0..1
}

// ── Province economic weight (determines share of national total) ─
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

// ── Indicator definitions ─────────────────────────────────────────
interface Def {
  id: string
  name: string
  indent: number
  category: IndicatorCategory
  unit: string
  comparisonType: string
  nationalTotal: number
  nationalYearStart: number
  isRatio?: boolean
}

const defs: Def[] = [
  { id: "eff_cust",      name: "有效客户",       indent: 0, category: "customer",    unit: "万户", comparisonType: "较年初", nationalTotal: 6832,   nationalYearStart: 6580 },
  { id: "new_cust",      name: "新增客户",       indent: 1, category: "customer",    unit: "万户", comparisonType: "同比",   nationalTotal: 385,    nationalYearStart: 342 },
  { id: "active_cust",   name: "活跃客户",       indent: 1, category: "customer",    unit: "万户", comparisonType: "较年初", nationalTotal: 4215,   nationalYearStart: 3980 },
  { id: "quick_cust",    name: "快捷交易客户",    indent: 1, category: "customer",    unit: "万户", comparisonType: "同比",   nationalTotal: 2870,   nationalYearStart: 2640 },
  { id: "total_consume", name: "总消费额",        indent: 0, category: "consumption", unit: "亿元", comparisonType: "同比",   nationalTotal: 3256,   nationalYearStart: 2985 },
  { id: "installment",   name: "信用卡分期消费额", indent: 1, category: "consumption", unit: "亿元", comparisonType: "同比",   nationalTotal: 1124,   nationalYearStart: 1038 },
  { id: "auto_inst",     name: "汽车分期",        indent: 2, category: "consumption", unit: "亿元", comparisonType: "同比",   nationalTotal: 286,    nationalYearStart: 258 },
  { id: "home_inst",     name: "家装分期",        indent: 2, category: "consumption", unit: "亿元", comparisonType: "同比",   nationalTotal: 178,    nationalYearStart: 165 },
  { id: "e_inst",        name: "中银e分期",       indent: 2, category: "consumption", unit: "亿元", comparisonType: "同比",   nationalTotal: 412,    nationalYearStart: 368 },
  { id: "card_consume",  name: "信用卡消费额",    indent: 1, category: "consumption", unit: "亿元", comparisonType: "同比",   nationalTotal: 1865,   nationalYearStart: 1720 },
  { id: "normal_consume",name: "普通消费额",      indent: 2, category: "consumption", unit: "亿元", comparisonType: "同比",   nationalTotal: 1120,   nationalYearStart: 1042 },
  { id: "merchant_inst", name: "商户分期",        indent: 2, category: "consumption", unit: "亿元", comparisonType: "同比",   nationalTotal: 425,    nationalYearStart: 390 },
  { id: "card_inst",     name: "卡户分期",        indent: 2, category: "consumption", unit: "亿元", comparisonType: "同比",   nationalTotal: 320,    nationalYearStart: 288 },
  { id: "quick_consume", name: "快捷消费额",      indent: 1, category: "consumption", unit: "亿元", comparisonType: "同比",   nationalTotal: 756,    nationalYearStart: 680 },
  { id: "cross_consume", name: "跨境消费额",      indent: 1, category: "consumption", unit: "亿元", comparisonType: "同比",   nationalTotal: 423,    nationalYearStart: 372 },
  { id: "loan_balance",  name: "贷款余额",        indent: 0, category: "loan",        unit: "亿元", comparisonType: "较年初", nationalTotal: 5620,   nationalYearStart: 5340 },
  { id: "npl_balance",   name: "不良余额",        indent: 0, category: "loan",        unit: "亿元", comparisonType: "较年初", nationalTotal: 86.5,   nationalYearStart: 82.1 },
  { id: "npl_ratio",     name: "不良率",          indent: 0, category: "loan",        unit: "%",   comparisonType: "较年初", nationalTotal: 1.54,   nationalYearStart: 1.54, isRatio: true },
]

// ── Key Customer Group indicator definitions ──────────────────────
const keyCustomerDefs: Def[] = [
  // Cross-border
  { id: "kc_cross_total",  name: "信用卡跨境客户数",  indent: 0, category: "crossborder",  unit: "万户", comparisonType: "同比", nationalTotal: 892,   nationalYearStart: 815 },
  { id: "kc_study",        name: "留学客群",          indent: 1, category: "crossborder",  unit: "万户", comparisonType: "同比", nationalTotal: 186,   nationalYearStart: 168 },
  { id: "kc_resident",     name: "常驻客群",          indent: 1, category: "crossborder",  unit: "万户", comparisonType: "同比", nationalTotal: 245,   nationalYearStart: 228 },
  { id: "kc_outbound",     name: "出境客群",          indent: 1, category: "crossborder",  unit: "万户", comparisonType: "同比", nationalTotal: 312,   nationalYearStart: 280 },
  { id: "kc_overseas",     name: "海淘客群",          indent: 1, category: "crossborder",  unit: "万户", comparisonType: "同比", nationalTotal: 149,   nationalYearStart: 139 },
  // High-end
  { id: "kc_highend_total", name: "信用卡中高端客户数", indent: 0, category: "highend",     unit: "万户", comparisonType: "较年初", nationalTotal: 1520, nationalYearStart: 1435 },
  { id: "kc_wealth_mgmt",   name: "理财客户",         indent: 1, category: "highend",     unit: "万户", comparisonType: "较年初", nationalTotal: 680,  nationalYearStart: 645 },
  { id: "kc_wealth",        name: "财富客户",         indent: 1, category: "highend",     unit: "万户", comparisonType: "较年初", nationalTotal: 520,  nationalYearStart: 492 },
  { id: "kc_private",       name: "私行客户",         indent: 1, category: "highend",     unit: "万户", comparisonType: "较年初", nationalTotal: 320,  nationalYearStart: 298 },
  // High-consumption: L0 -> L1 -> L2
  { id: "kc_hc_total",     name: "信用卡中高消费客户数",       indent: 0, category: "highconsume", unit: "万户", comparisonType: "较年初", nationalTotal: 2156, nationalYearStart: 2020 },
  { id: "kc_hc_downgrade", name: "中高消费降级客户",           indent: 1, category: "highconsume", unit: "万户", comparisonType: "较年初", nationalTotal: 385,  nationalYearStart: 410 },
  { id: "kc_hc_lost",      name: "中高消费流失客户",           indent: 2, category: "highconsume", unit: "万户", comparisonType: "同比",   nationalTotal: 128,  nationalYearStart: 142 },
  { id: "kc_hc_blocked",   name: "用卡受阻-销户客户",          indent: 2, category: "highconsume", unit: "万户", comparisonType: "同比",   nationalTotal: 96,   nationalYearStart: 105 },
  { id: "kc_hc_inactive",  name: "用卡受阻-到期换卡未激活客户", indent: 2, category: "highconsume", unit: "万户", comparisonType: "同比",   nationalTotal: 161,  nationalYearStart: 163 },
  { id: "kc_hc_transfer",  name: "消费转他行客户",             indent: 2, category: "highconsume", unit: "万户", comparisonType: "同比",   nationalTotal: 218,  nationalYearStart: 205 },
  { id: "kc_hc_maintain",  name: "中高消费维持客户",           indent: 1, category: "highconsume", unit: "万户", comparisonType: "较年初", nationalTotal: 1082, nationalYearStart: 1005 },
  { id: "kc_hc_upgrade",   name: "中高消费升级客户",           indent: 1, category: "highconsume", unit: "万户", comparisonType: "较年初", nationalTotal: 689,  nationalYearStart: 605 },
  { id: "kc_hc_scene",     name: "中高消费大额场景升级客户",    indent: 2, category: "highconsume", unit: "万户", comparisonType: "同比",   nationalTotal: 245,  nationalYearStart: 218 },
  { id: "kc_hc_asset",     name: "中高资产消费升级客户",        indent: 2, category: "highconsume", unit: "万户", comparisonType: "同比",   nationalTotal: 312,  nationalYearStart: 276 },
]

// ── Compute normalized shares for a specific indicator ────────────
// Each branch gets a weight-based share with per-indicator jitter.
// Two separate share vectors: one for current, one for year-start,
// so that different branches grow at different rates.

function computeShares(indicatorId: string, suffix: string): number[] {
  const raw: number[] = []
  let total = 0
  for (const b of branchList) {
    const base = WEIGHT[b.id] ?? 0.5
    const jitter = 0.85 + seeded(hashCode(`${indicatorId}_${b.id}_${suffix}`)) * 0.30
    const v = base * jitter
    raw.push(v)
    total += v
  }
  return raw.map((v) => v / total)
}

// ── Date factor: tiny daily drift ─────────────────────────────────
function dateFactor(dateStr: string): number {
  const parts = dateStr.split("/").map(Number)
  // days since 2026/01/01
  return (parts[1] - 1) * 31 + parts[2]
}

// ── Formatting ────────────────────────────────────────────────────
function fmtValue(v: number, unit: string): string {
  if (unit === "%") return v.toFixed(2)
  if (Math.abs(v) >= 100) return v.toFixed(2)
  return v.toFixed(2)
}

function fmtRate(rate: number): string {
  const pct = rate * 100
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`
}

function fmtPp(pp: number): string {
  return `${pp >= 0 ? "+" : ""}${pp.toFixed(2)}pp`
}

// ── Main generation function ──────────────────────────────────────

export function generateIndicators(institutionId: string, dateStr: string): IndicatorRow[] {
  const isSummary = institutionId === "all"
  const df = dateFactor(dateStr)

  return defs.map((def) => {
    if (def.isRatio) {
      return generateRatioRow(def, institutionId, isSummary, df)
    }

    // ── Step 1: Compute shares for current & year-start ──
    const sharesCurrent = computeShares(def.id, "cur")
    const sharesYearStart = computeShares(def.id, "ys")

    // ── Step 2: Tiny per-branch daily drift ──
    // Each branch's current share gets a tiny date-dependent nudge
    // so values change slightly when the user changes the date.
    const adjustedSharesCurrent = sharesCurrent.map((s, i) => {
      const drift = (seeded(hashCode(`${def.id}_${branchList[i].id}_drift`)) - 0.5) * 0.001 * (df - 31)
      return Math.max(0.001, s + drift)
    })
    // Re-normalize
    const sumAdj = adjustedSharesCurrent.reduce((a, b) => a + b, 0)
    const normalizedCurrent = adjustedSharesCurrent.map((s) => s / sumAdj)

    // ── Step 3: Branch values ──
    // branch_current  = nationalTotal * normalizedCurrent[i]
    // branch_yearStart = nationalYearStart * sharesYearStart[i]
    // This guarantees: sum(branch_current) === nationalTotal
    //                  sum(branch_yearStart) === nationalYearStart

    type BranchData = {
      id: string
      current: number
      yearStart: number
      growth: number
    }

    const branches: BranchData[] = branchList.map((b, i) => {
      const current = def.nationalTotal * normalizedCurrent[i]
      const yearStart = def.nationalYearStart * sharesYearStart[i]
      const growth = yearStart > 0 ? (current - yearStart) / yearStart : 0
      return { id: b.id, current, yearStart, growth }
    })

    // ── Step 4: National growth (from the defined totals) ──
    const nationalGrowth = (def.nationalTotal - def.nationalYearStart) / def.nationalYearStart

    // ── Step 5: Rank branches by growth rate ──
    const sorted = [...branches].sort((a, b) => b.growth - a.growth)
    const rankMap = new Map<string, number>()
    sorted.forEach((b, i) => rankMap.set(b.id, i + 1))

    // ── Step 6: Build the row ──
    if (isSummary) {
      return {
        id: def.id,
        name: def.name,
        indent: def.indent,
        category: def.category,
        value: fmtValue(def.nationalTotal, def.unit),
        rawValue: def.nationalTotal,
        unit: def.unit,
        comparisonType: def.comparisonType,
        comparison: fmtRate(nationalGrowth),
        comparisonRaw: nationalGrowth,
        growthVsAll: "",
        growthVsAllRaw: 0,
        growthRank: 0,
      }
    }

    const br = branches.find((b) => b.id === institutionId)!
    const rank = rankMap.get(institutionId) ?? 0
    const growthDiff = br.growth - nationalGrowth // difference in growth rate

    return {
      id: def.id,
      name: def.name,
      indent: def.indent,
      category: def.category,
      value: fmtValue(br.current, def.unit),
      rawValue: br.current,
      unit: def.unit,
      comparisonType: def.comparisonType,
      comparison: fmtRate(br.growth),
      comparisonRaw: br.growth,
      growthVsAll: fmtRate(growthDiff),
      growthVsAllRaw: growthDiff,
      growthRank: rank,
    }
  })
}

// ── Key Customer Group generation (same engine, different defs) ───
export function generateKeyCustomerIndicators(institutionId: string, dateStr: string): IndicatorRow[] {
  const isSummary = institutionId === "all"
  const df = dateFactor(dateStr)

  return keyCustomerDefs.map((def) => {
    if (def.isRatio) {
      return generateRatioRow(def, institutionId, isSummary, df)
    }
    const sharesCurrent = computeShares(def.id, "cur")
    const sharesYearStart = computeShares(def.id, "ys")
    const adjustedSharesCurrent = sharesCurrent.map((s, i) => {
      const drift = (seeded(hashCode(`${def.id}_${branchList[i].id}_drift`)) - 0.5) * 0.001 * (df - 31)
      return Math.max(0.001, s + drift)
    })
    const sumAdj = adjustedSharesCurrent.reduce((a, b) => a + b, 0)
    const normalizedCurrent = adjustedSharesCurrent.map((s) => s / sumAdj)

    type BranchData = { id: string; current: number; yearStart: number; growth: number }
    const branches: BranchData[] = branchList.map((b, i) => {
      const current = def.nationalTotal * normalizedCurrent[i]
      const yearStart = def.nationalYearStart * sharesYearStart[i]
      const growth = yearStart > 0 ? (current - yearStart) / yearStart : 0
      return { id: b.id, current, yearStart, growth }
    })

    const nationalGrowth = (def.nationalTotal - def.nationalYearStart) / def.nationalYearStart
    const sorted = [...branches].sort((a, b) => b.growth - a.growth)
    const rankMap = new Map<string, number>()
    sorted.forEach((b, i) => rankMap.set(b.id, i + 1))

    if (isSummary) {
      return {
        id: def.id, name: def.name, indent: def.indent, category: def.category,
        value: fmtValue(def.nationalTotal, def.unit), rawValue: def.nationalTotal, unit: def.unit,
        comparisonType: def.comparisonType, comparison: fmtRate(nationalGrowth), comparisonRaw: nationalGrowth,
        growthVsAll: "", growthVsAllRaw: 0, growthRank: 0,
      }
    }

    const br = branches.find((b) => b.id === institutionId)!
    const rank = rankMap.get(institutionId) ?? 0
    const growthDiff = br.growth - nationalGrowth

    return {
      id: def.id, name: def.name, indent: def.indent, category: def.category,
      value: fmtValue(br.current, def.unit), rawValue: br.current, unit: def.unit,
      comparisonType: def.comparisonType, comparison: fmtRate(br.growth), comparisonRaw: br.growth,
      growthVsAll: fmtRate(growthDiff), growthVsAllRaw: growthDiff, growthRank: rank,
    }
  })
}

// ── Exported helpers ──────────────────────────────────────────────
export { defs, keyCustomerDefs, branchList, BRANCH_COUNT, computeShares, seeded, hashCode, dateFactor, fmtValue, fmtRate }

// ── Trend data: 12 months of data for an indicator ────────────────
export interface TrendPoint {
  month: string          // e.g. "2025/03"
  value: number          // absolute value for that month
  yoyPct: number         // year-over-year % change (for bar chart)
}

const trendMonths = [
  "2025/03","2025/04","2025/05","2025/06","2025/07","2025/08",
  "2025/09","2025/10","2025/11","2025/12","2026/01","2026/02",
]

const allDefs = [...defs, ...keyCustomerDefs]

export function generateTrendData(indicatorId: string, institutionId: string): TrendPoint[] {
  const def = allDefs.find(d => d.id === indicatorId)
  if (!def) return []
  const isSummary = institutionId === "all"

  // National year-over-year growth (annualized)
  const annualGrowth = (def.nationalTotal - def.nationalYearStart) / def.nationalYearStart
  // Base value ~12 months ago
  const baseTotal = def.nationalYearStart * (1 - annualGrowth * 0.15)
  const growthPerMonth = annualGrowth / 12

  return trendMonths.map((month, mi) => {
    // Current period value: grows month-by-month with seasonal jitter
    const monthMultiplier = 1 + growthPerMonth * (mi + 1)
    const jitter = 1 + (seeded(hashCode(`trend_${indicatorId}_${month}`)) - 0.5) * 0.03
    let value = baseTotal * monthMultiplier * jitter

    // Same-month last year value: slightly lower baseline, different jitter
    const lyBase = baseTotal * 0.92
    const lyMultiplier = 1 + growthPerMonth * 0.3 * (mi + 1)
    const lyJitter = 1 + (seeded(hashCode(`trend_ly_${indicatorId}_${month}`)) - 0.5) * 0.03
    let lyValue = lyBase * lyMultiplier * lyJitter

    // If branch selected, scale both by that branch's share
    if (!isSummary) {
      const shares = computeShares(indicatorId, "cur")
      const branchIdx = branchList.findIndex(b => b.id === institutionId)
      if (branchIdx >= 0) {
        // Branch share with small per-month jitter for realism
        const branchMoJitter = 1 + (seeded(hashCode(`trend_bs_${indicatorId}_${month}_${institutionId}`)) - 0.5) * 0.04
        value = value * shares[branchIdx] * branchMoJitter
        lyValue = lyValue * shares[branchIdx] * branchMoJitter
      }
    }

    const yoyPct = lyValue > 0 ? ((value - lyValue) / lyValue) * 100 : 0

    return {
      month,
      value: +value.toFixed(2),
      yoyPct: +yoyPct.toFixed(2),
    }
  })
}

// ── Branch ranking for a specific indicator ───────────────────────
export interface BranchRankRow {
  rank: number
  branchId: string
  branchName: string
  value: number
  valueFormatted: string
  unit: string
  growth: number
  growthFormatted: string
}

export function generateBranchRanking(indicatorId: string, dateStr: string): BranchRankRow[] {
  const def = allDefs.find(d => d.id === indicatorId)
  if (!def) return []

  const df = dateFactor(dateStr)
  const sharesCurrent = computeShares(indicatorId, "cur")
  const sharesYearStart = computeShares(indicatorId, "ys")

  // Apply date drift
  const adjusted = sharesCurrent.map((s, i) => {
    const drift = (seeded(hashCode(`${indicatorId}_${branchList[i].id}_drift`)) - 0.5) * 0.001 * (df - 31)
    return Math.max(0.001, s + drift)
  })
  const sumAdj = adjusted.reduce((a, b) => a + b, 0)
  const normalized = adjusted.map(s => s / sumAdj)

  const rows = branchList.map((b, i) => {
    const current = def.nationalTotal * normalized[i]
    const yearStart = def.nationalYearStart * sharesYearStart[i]
    const growth = yearStart > 0 ? (current - yearStart) / yearStart : 0
    return {
      rank: 0,
      branchId: b.id,
      branchName: b.name,
      value: current,
      valueFormatted: fmtValue(current, def.unit),
      unit: def.unit,
      growth,
      growthFormatted: fmtRate(growth),
    }
  })

  // Sort by value descending for ranking
  rows.sort((a, b) => b.value - a.value)
  rows.forEach((r, i) => { r.rank = i + 1 })
  return rows
}

// ── Branch trend comparison: multiple branches over 12 months ─────
export interface BranchTrendLine {
  branchId: string
  branchName: string
  color: string
  data: { month: string; value: number }[]
}

const COMPARE_COLORS = [
  "hsl(0, 85%, 46%)", "hsl(220, 70%, 45%)", "hsl(140, 60%, 40%)",
  "hsl(30, 80%, 55%)", "hsl(270, 60%, 55%)", "hsl(180, 50%, 40%)",
]

export function generateBranchComparison(
  indicatorId: string,
  branchIds: string[]
): BranchTrendLine[] {
  const def = allDefs.find(d => d.id === indicatorId)
  if (!def) return []

  return branchIds.map((bid, ci) => {
    const branch = branchList.find(b => b.id === bid) ?? institutions.find(b => b.id === bid)
    const name = branch?.name ?? bid
    const shares = computeShares(indicatorId, "cur")
    const branchIdx = branchList.findIndex(b => b.id === bid)
    const share = branchIdx >= 0 ? shares[branchIdx] : 1

    const baseTotal = def.nationalYearStart * 0.95
    const growthPerMonth = ((def.nationalTotal / def.nationalYearStart) - 1) / 12

    const data = trendMonths.map((month, mi) => {
      const monthMultiplier = 1 + growthPerMonth * (mi + 1)
      const jitter = 1 + (seeded(hashCode(`trend_${indicatorId}_${month}`)) - 0.5) * 0.04
      // Per-branch jitter
      const branchJitter = 1 + (seeded(hashCode(`trend_${indicatorId}_${month}_${bid}`)) - 0.5) * 0.06
      const value = baseTotal * monthMultiplier * jitter * share * branchJitter
      return { month, value: +value.toFixed(2) }
    })

    return {
      branchId: bid,
      branchName: name,
      color: COMPARE_COLORS[ci % COMPARE_COLORS.length],
      data,
    }
  })
}

// ── Get indicator definition by id ────────────────────────────────
export function getIndicatorDef(id: string) {
  return allDefs.find(d => d.id === id)
}

// ── Ratio rows (e.g. 不良率) — special handling ──────────────────
function generateRatioRow(
  def: Def,
  institutionId: string,
  isSummary: boolean,
  df: number
): IndicatorRow {
  // Each branch has its own ratio around the national value
  type BranchRatio = { id: string; current: number; yearStart: number; change: number }

  const branches: BranchRatio[] = branchList.map((b) => {
    const s = seeded(hashCode(`${def.id}_${b.id}_ratio`))
    const yearStart = def.nationalYearStart + (s - 0.5) * 0.6
    const drift = (seeded(hashCode(`${def.id}_${b.id}_rdrift`)) - 0.5) * 0.003 * (df - 31)
    const changeBase = (seeded(hashCode(`${def.id}_${b.id}_rchg`)) - 0.5) * 0.3
    const current = yearStart + changeBase + drift
    return {
      id: b.id,
      current: Math.max(0.1, current),
      yearStart,
      change: current - yearStart,
    }
  })

  const sorted = [...branches].sort((a, b) => a.change - b.change) // lower change = better for NPL
  const rankMap = new Map<string, number>()
  sorted.forEach((b, i) => rankMap.set(b.id, i + 1))

  const nationalChange = def.nationalTotal - def.nationalYearStart

  if (isSummary) {
    return {
      id: def.id,
      name: def.name,
      indent: def.indent,
      category: def.category,
      value: fmtValue(def.nationalTotal, def.unit),
      rawValue: def.nationalTotal,
      unit: def.unit,
      comparisonType: def.comparisonType,
      comparison: fmtPp(nationalChange),
      comparisonRaw: nationalChange,
      growthVsAll: "",
      growthVsAllRaw: 0,
      growthRank: 0,
    }
  }

  const br = branches.find((b) => b.id === institutionId)!
  const rank = rankMap.get(institutionId) ?? 0
  const diffVsNational = br.change - nationalChange

  return {
    id: def.id,
    name: def.name,
    indent: def.indent,
    category: def.category,
    value: fmtValue(br.current, def.unit),
    rawValue: br.current,
    unit: def.unit,
    comparisonType: def.comparisonType,
    comparison: fmtPp(br.change),
    comparisonRaw: br.change,
    growthVsAll: fmtPp(diffVsNational),
    growthVsAllRaw: diffVsNational,
    growthRank: rank,
  }
}
