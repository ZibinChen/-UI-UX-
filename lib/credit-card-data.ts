// ====================================================================
// Credit Card Business Indicators — deterministic data engine v3
// ====================================================================
// Key principles:
//   1. Define a NATIONAL TOTAL for each indicator first.
//   2. Distribute the total among 36 branches using weighted shares
//      (seeded by branch hash) so branch values always sum to the total.
//   3. Each branch has its own growth rate in a realistic range.
//      The national growth rate is the weighted average.
//   4. Rankings are computed by sorting branches by growth rate.
//   5. Changing dates shifts the growth rates slightly.
// ====================================================================

export interface IndicatorRow {
  id: string
  name: string
  indent: number
  category: "customer" | "consumption" | "loan"
  value: string
  rawValue: number
  unit: string
  comparisonType: string
  comparison: string
  comparisonRaw: number
  growthVsAll: string
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
const BRANCH_COUNT = branchList.length

// ── Available dates ───────────────────────────────────────────────
export const availableDates: string[] = [
  "2026/01/31",
  ...Array.from({ length: 12 }, (_, i) => `2026/02/${String(i + 1).padStart(2, "0")}`),
]

// ── Deterministic hash / random ───────────────────────────────────
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

// ── Indicator definitions ─────────────────────────────────────────
interface Def {
  id: string
  name: string
  indent: number
  category: "customer" | "consumption" | "loan"
  unit: string
  comparisonType: string
  nationalTotal: number      // the fixed national total (current period)
  nationalYearStart: number  // national total at year start
  isRatio?: boolean          // for "不良率" — not summed but averaged
}

// Realistic national-level numbers for a large bank
const defs: Def[] = [
  // ── 有效客户 (万户) ──
  { id: "eff_cust",      name: "有效客户",        indent: 0, category: "customer",    unit: "万户", comparisonType: "较年初", nationalTotal: 6832,   nationalYearStart: 6580 },
  { id: "new_cust",      name: "其中：新增客户",   indent: 1, category: "customer",    unit: "万户", comparisonType: "同比",   nationalTotal: 385,    nationalYearStart: 342 },
  { id: "active_cust",   name: "活跃客户",        indent: 1, category: "customer",    unit: "万户", comparisonType: "较年初", nationalTotal: 4215,   nationalYearStart: 3980 },
  { id: "quick_cust",    name: "快捷交易客户",     indent: 1, category: "customer",    unit: "万户", comparisonType: "同比",   nationalTotal: 2870,   nationalYearStart: 2640 },
  // ── 消费额 (亿元) ──
  { id: "total_consume", name: "总消费额",         indent: 0, category: "consumption", unit: "亿元", comparisonType: "同比",   nationalTotal: 3256,   nationalYearStart: 2985 },
  { id: "installment",   name: "信用卡分期消费额",  indent: 0, category: "consumption", unit: "亿元", comparisonType: "同比",   nationalTotal: 1124,   nationalYearStart: 1038 },
  { id: "auto_inst",     name: "其中：汽车分期",    indent: 1, category: "consumption", unit: "亿元", comparisonType: "同比",   nationalTotal: 286,    nationalYearStart: 258 },
  { id: "home_inst",     name: "家装分期",         indent: 1, category: "consumption", unit: "亿元", comparisonType: "同比",   nationalTotal: 178,    nationalYearStart: 165 },
  { id: "e_inst",        name: "中银e分期",        indent: 1, category: "consumption", unit: "亿元", comparisonType: "同比",   nationalTotal: 412,    nationalYearStart: 368 },
  { id: "card_consume",  name: "信用卡消费额",     indent: 0, category: "consumption", unit: "亿元", comparisonType: "同比",   nationalTotal: 1865,   nationalYearStart: 1720 },
  { id: "normal_consume",name: "其中：普通消费额",  indent: 1, category: "consumption", unit: "亿元", comparisonType: "同比",   nationalTotal: 1120,   nationalYearStart: 1042 },
  { id: "merchant_inst", name: "商户分期",         indent: 1, category: "consumption", unit: "亿元", comparisonType: "同比",   nationalTotal: 425,    nationalYearStart: 390 },
  { id: "card_inst",     name: "卡户分期",         indent: 1, category: "consumption", unit: "亿元", comparisonType: "同比",   nationalTotal: 320,    nationalYearStart: 288 },
  { id: "quick_consume", name: "快捷消费额",       indent: 0, category: "consumption", unit: "亿元", comparisonType: "同比",   nationalTotal: 756,    nationalYearStart: 680 },
  { id: "cross_consume", name: "跨境消费额",       indent: 0, category: "consumption", unit: "亿元", comparisonType: "同比",   nationalTotal: 423,    nationalYearStart: 372 },
  // ── 贷款 & 不良 ──
  { id: "loan_balance",  name: "贷款余额",         indent: 0, category: "loan",        unit: "亿元", comparisonType: "较年初", nationalTotal: 5620,   nationalYearStart: 5340 },
  { id: "npl_balance",   name: "不良余额",         indent: 0, category: "loan",        unit: "亿元", comparisonType: "较年初", nationalTotal: 86.5,   nationalYearStart: 82.1 },
  { id: "npl_ratio",     name: "不良率",           indent: 0, category: "loan",        unit: "%",   comparisonType: "较年初", nationalTotal: 1.54,   nationalYearStart: 1.54, isRatio: true },
]

// ── Branch share distribution ─────────────────────────────────────
// Generate a weight for each branch, then normalize so all shares sum to 1.
// Big provinces (guangdong, jiangsu, zhejiang, beijing, shanghai) get larger
// shares, small ones (xizang, qinghai, ningxia) get smaller shares.

const SIZE_BONUS: Record<string, number> = {
  guangdong: 3.5, jiangsu: 3.0, zhejiang: 2.8, beijing: 2.5, shanghai: 2.5,
  shandong: 2.3, sichuan: 2.0, henan: 1.8, hubei: 1.6, hunan: 1.5,
  fujian: 1.5, hebei: 1.4, shenzhen: 1.8, anhui: 1.3, liaoning: 1.2,
  chongqing: 1.1, shaanxi: 1.0, yunnan: 1.0, guangxi: 0.9,
  jiangxi: 0.9, heilongjiang: 0.8, jilin: 0.6, guizhou: 0.7,
  neimenggu: 0.6, xinjiang: 0.5, gansu: 0.4, hainan: 0.4,
  tianjin: 0.8, shanxi: 0.7, qinghai: 0.25, ningxia: 0.25, xizang: 0.15,
  ningbo: 0.7, dalian: 0.6, qingdao: 0.7, xiamen: 0.5,
}

function getBranchShares(): Map<string, number> {
  let total = 0
  const raw = new Map<string, number>()
  for (const b of branchList) {
    const base = SIZE_BONUS[b.id] ?? 0.5
    // add a small hash jitter so each indicator won't have identical shares
    const w = base + seeded(hashCode(b.id)) * 0.2
    raw.set(b.id, w)
    total += w
  }
  const shares = new Map<string, number>()
  for (const [k, v] of raw) {
    shares.set(k, v / total)
  }
  return shares
}

// Per-indicator shares: multiply the base share by a per-indicator jitter
function getIndicatorShares(indicatorId: string): Map<string, number> {
  const baseShares = getBranchShares()
  const result = new Map<string, number>()
  let total = 0
  for (const b of branchList) {
    const base = baseShares.get(b.id) ?? (1 / BRANCH_COUNT)
    // jitter: +-20% variation per indicator
    const jitter = 0.8 + seeded(hashCode(`${indicatorId}_${b.id}_share`)) * 0.4
    const v = base * jitter
    result.set(b.id, v)
    total += v
  }
  // re-normalize
  for (const [k, v] of result) {
    result.set(k, v / total)
  }
  return result
}

// ── Branch growth rates ───────────────────────────────────────────
// Each branch has a unique growth rate that varies by indicator.
// National growth = (nationalTotal - nationalYearStart) / nationalYearStart.
// Branch growth rates are distributed around the national growth.

function getBranchGrowth(indicatorId: string, branchId: string, nationalGrowth: number, dateOffset: number): number {
  const s = seeded(hashCode(`${indicatorId}_${branchId}_growth`))
  // spread: some branches grow faster, some slower
  // range: national growth +/- 15pp, clamped to [-20%, +40%]
  const deviation = (s - 0.5) * 0.30  // -15pp to +15pp
  const dateShift = (dateOffset - 31) * 0.0003 * (s > 0.5 ? 1 : -1)
  const rate = nationalGrowth + deviation + dateShift
  return Math.max(-0.20, Math.min(0.40, rate))
}

// ── Day offset from date string ───────────────────────────────────
function dayOffset(dateStr: string): number {
  const parts = dateStr.split("/").map(Number)
  return (parts[1] - 1) * 31 + parts[2] // approximate day of year
}

// ── Formatting ────────────────────────────────────────────────────
function fmtValue(v: number, unit: string): string {
  if (unit === "%") return v.toFixed(2)
  if (v >= 1000) return v.toFixed(2)
  if (v >= 100) return v.toFixed(2)
  return v.toFixed(2)
}

function fmtRate(rate: number): string {
  const pct = rate * 100
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`
}

function fmtPp(pp: number): string {
  return `${pp >= 0 ? "+" : ""}${pp.toFixed(2)}pp`
}

// ── Public API ────────────────────────────────────────────────────

export function generateIndicators(institutionId: string, dateStr: string): IndicatorRow[] {
  const dOffset = dayOffset(dateStr)
  const isSummary = institutionId === "all"

  // Pre-compute all branch data for ranking & growth-vs-national
  type BranchCalc = {
    branchId: string
    currentValue: number
    yearStartValue: number
    growthRate: number
  }

  return defs.map((def) => {
    const natGrowth = (def.nationalTotal - def.nationalYearStart) / def.nationalYearStart
    const shares = getIndicatorShares(def.id)

    // Compute each branch's values
    const branches: BranchCalc[] = branchList.map((b) => {
      const share = shares.get(b.id) ?? (1 / BRANCH_COUNT)
      const growth = def.isRatio
        ? getBranchGrowth(def.id, b.id, 0, dOffset) * 0.1 // ratio change is small: +-2pp
        : getBranchGrowth(def.id, b.id, natGrowth, dOffset)

      if (def.isRatio) {
        // For ratio: each branch has its own ratio around the national ratio
        const branchRatio = def.nationalYearStart + (seeded(hashCode(`${def.id}_${b.id}_ratiobase`)) - 0.5) * 0.8
        const currentRatio = branchRatio + growth
        return {
          branchId: b.id,
          currentValue: Math.max(0.1, currentRatio),
          yearStartValue: branchRatio,
          growthRate: growth, // for ratio, "growth" is absolute change in pp
        }
      }

      const yearStart = def.nationalYearStart * share
      const current = yearStart * (1 + growth)
      return {
        branchId: b.id,
        currentValue: current,
        yearStartValue: yearStart,
        growthRate: growth,
      }
    })

    // Sort by growth rate for ranking
    const sorted = [...branches].sort((a, b) => b.growthRate - a.growthRate)
    const rankMap = new Map<string, number>()
    sorted.forEach((b, i) => rankMap.set(b.branchId, i + 1))

    // National average growth rate (weighted for non-ratio, simple avg for ratio)
    let natAvgGrowth: number
    if (def.isRatio) {
      natAvgGrowth = branches.reduce((s, b) => s + b.growthRate, 0) / BRANCH_COUNT
    } else {
      const totalCurrent = branches.reduce((s, b) => s + b.currentValue, 0)
      const totalYearStart = branches.reduce((s, b) => s + b.yearStartValue, 0)
      natAvgGrowth = totalYearStart > 0 ? (totalCurrent - totalYearStart) / totalYearStart : 0
    }

    if (isSummary) {
      if (def.isRatio) {
        const avgCurrent = branches.reduce((s, b) => s + b.currentValue, 0) / BRANCH_COUNT
        const avgYearStart = branches.reduce((s, b) => s + b.yearStartValue, 0) / BRANCH_COUNT
        const change = avgCurrent - avgYearStart
        return {
          id: def.id, name: def.name, indent: def.indent, category: def.category,
          value: fmtValue(avgCurrent, def.unit),
          rawValue: avgCurrent,
          unit: def.unit,
          comparisonType: def.comparisonType,
          comparison: fmtPp(change),
          comparisonRaw: change,
          growthVsAll: "", growthRank: 0,
        }
      }
      const totalCurrent = branches.reduce((s, b) => s + b.currentValue, 0)
      const totalYearStart = branches.reduce((s, b) => s + b.yearStartValue, 0)
      const totalGrowth = totalYearStart > 0 ? (totalCurrent - totalYearStart) / totalYearStart : 0
      return {
        id: def.id, name: def.name, indent: def.indent, category: def.category,
        value: fmtValue(totalCurrent, def.unit),
        rawValue: totalCurrent,
        unit: def.unit,
        comparisonType: def.comparisonType,
        comparison: fmtRate(totalGrowth),
        comparisonRaw: totalGrowth,
        growthVsAll: "", growthRank: 0,
      }
    }

    // Single branch view
    const br = branches.find((b) => b.branchId === institutionId)!
    const rank = rankMap.get(institutionId) ?? 0
    const growthDiff = br.growthRate - natAvgGrowth

    if (def.isRatio) {
      return {
        id: def.id, name: def.name, indent: def.indent, category: def.category,
        value: fmtValue(br.currentValue, def.unit),
        rawValue: br.currentValue,
        unit: def.unit,
        comparisonType: def.comparisonType,
        comparison: fmtPp(br.growthRate),
        comparisonRaw: br.growthRate,
        growthVsAll: fmtPp(growthDiff),
        growthRank: rank,
      }
    }

    return {
      id: def.id, name: def.name, indent: def.indent, category: def.category,
      value: fmtValue(br.currentValue, def.unit),
      rawValue: br.currentValue,
      unit: def.unit,
      comparisonType: def.comparisonType,
      comparison: fmtRate(br.growthRate),
      comparisonRaw: br.growthRate,
      growthVsAll: fmtPp(growthDiff * 100),
      growthRank: rank,
    }
  })
}
