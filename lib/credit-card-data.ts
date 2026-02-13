// ====================================================================
// Credit Card Business Indicators — deterministic data engine
// ====================================================================
// Design:
//   1. Each branch has a *base* set of indicator values seeded from a
//      simple hash so data is deterministic yet diverse.
//   2. The "汇总" row is the true SUM of all branch values.
//   3. Year-start values are computed for each branch; YoY / vs-year-start
//      comparisons are derived mathematically.
//   4. Growth-vs-national & rank are computed by sorting all branches.
//   5. Changing the selected date shifts values by a small daily delta so
//      the numbers visibly react, while keeping internal consistency.
// ====================================================================

export interface IndicatorRow {
  id: string
  name: string
  indent: number           // 0 = category header, 1 = sub-item
  category: "customer" | "consumption" | "loan"
  value: string            // formatted display value
  rawValue: number         // numeric value for summation
  unit: string
  comparisonType: string   // "较年初" or "同比"
  comparison: string       // e.g. "+12.35%"
  comparisonRaw: number    // numeric for sorting
  growthVsAll: string      // e.g. "+2.10pp"
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
  // 5 计划单列市
  { id: "shenzhen", name: "深圳市分行" },
  { id: "ningbo", name: "宁波市分行" },
  { id: "dalian", name: "大连市分行" },
  { id: "qingdao", name: "青岛市分行" },
  { id: "xiamen", name: "厦门市分行" },
]

const branchIds = institutions.filter((i) => i.id !== "all").map((i) => i.id)

// ── Available dates ───────────────────────────────────────────────
export const availableDates: string[] = [
  "2026/01/31",
  ...Array.from({ length: 12 }, (_, i) => {
    const d = i + 1
    return `2026/02/${String(d).padStart(2, "0")}`
  }),
]

// ── Indicator definitions ─────────────────────────────────────────
interface IndicatorDef {
  id: string
  name: string
  indent: number
  category: "customer" | "consumption" | "loan"
  unit: string
  comparisonType: string        // "较年初" | "同比"
  baseRange: [number, number]   // min-max for a branch base value
  isPercent?: boolean           // if true the value is a % not a sum
}

const indicatorDefs: IndicatorDef[] = [
  // ── 有效客户 ──
  { id: "eff_cust",      name: "有效客户",       indent: 0, category: "customer",    unit: "万户", comparisonType: "较年初", baseRange: [80, 520] },
  { id: "new_cust",      name: "其中：新增客户",  indent: 1, category: "customer",    unit: "万户", comparisonType: "同比",   baseRange: [5, 60] },
  { id: "active_cust",   name: "活跃客户",       indent: 1, category: "customer",    unit: "万户", comparisonType: "较年初", baseRange: [40, 300] },
  { id: "quick_cust",    name: "快捷交易客户",    indent: 1, category: "customer",    unit: "万户", comparisonType: "同比",   baseRange: [20, 180] },
  // ── 消费额 ──
  { id: "total_consume", name: "总消费额",        indent: 0, category: "consumption", unit: "亿元", comparisonType: "同比",   baseRange: [30, 350] },
  { id: "installment",   name: "信用卡分期消费额", indent: 0, category: "consumption", unit: "亿元", comparisonType: "同比",   baseRange: [10, 120] },
  { id: "auto_inst",     name: "其中：汽车分期",   indent: 1, category: "consumption", unit: "亿元", comparisonType: "同比",   baseRange: [2, 30] },
  { id: "home_inst",     name: "家装分期",        indent: 1, category: "consumption", unit: "亿元", comparisonType: "同比",   baseRange: [1, 20] },
  { id: "e_inst",        name: "中银e分期",       indent: 1, category: "consumption", unit: "亿元", comparisonType: "同比",   baseRange: [3, 40] },
  { id: "card_consume",  name: "信用卡消费额",    indent: 0, category: "consumption", unit: "亿元", comparisonType: "同比",   baseRange: [15, 200] },
  { id: "normal_consume",name: "其中：普通消费额", indent: 1, category: "consumption", unit: "亿元", comparisonType: "同比",   baseRange: [8, 120] },
  { id: "merchant_inst", name: "商户分期",        indent: 1, category: "consumption", unit: "亿元", comparisonType: "同比",   baseRange: [3, 40] },
  { id: "card_inst",     name: "卡户分期",        indent: 1, category: "consumption", unit: "亿元", comparisonType: "同比",   baseRange: [2, 30] },
  { id: "quick_consume", name: "快捷消费额",      indent: 0, category: "consumption", unit: "亿元", comparisonType: "同比",   baseRange: [5, 80] },
  { id: "cross_consume", name: "跨境消费额",      indent: 0, category: "consumption", unit: "亿元", comparisonType: "同比",   baseRange: [2, 45] },
  // ── 贷款 & 不良 ──
  { id: "loan_balance",  name: "贷款余额",        indent: 0, category: "loan",        unit: "亿元", comparisonType: "较年初", baseRange: [50, 600] },
  { id: "npl_balance",   name: "不良余额",        indent: 0, category: "loan",        unit: "亿元", comparisonType: "较年初", baseRange: [1, 15] },
  { id: "npl_ratio",     name: "不良率",          indent: 0, category: "loan",        unit: "%",   comparisonType: "较年初", baseRange: [80, 250], isPercent: true },
]

// ── Deterministic seeded pseudo-random ────────────────────────────
function hashSeed(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function seededRandom(seed: number): number {
  // simple LCG
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x) // 0..1
}

// ── Core data generation ──────────────────────────────────────────

interface BranchRowData {
  indicatorId: string
  branchId: string
  currentValue: number
  yearStartValue: number
  growthRate: number   // (current - yearStart) / yearStart
}

/**
 * For a given date, compute the raw numeric data for ALL branches x ALL indicators.
 * Returns a Map<indicatorId, BranchRowData[]> sorted by growthRate descending.
 */
function computeAllBranches(dateStr: string): Map<string, BranchRowData[]> {
  // date offset: days since Jan 1 — drives small daily shifts
  const parts = dateStr.split("/").map(Number)
  const dayOfYear = (parts[1] - 1) * 31 + parts[2] // approximate, fine for demo
  const dateFactor = 1 + (dayOfYear - 31) * 0.001   // Jan 31 = 1.0, Feb 12 ≈ 1.012

  const result = new Map<string, BranchRowData[]>()

  for (const def of indicatorDefs) {
    const rows: BranchRowData[] = []

    for (const bId of branchIds) {
      const seed = hashSeed(`${def.id}_${bId}`)
      const r = seededRandom(seed)

      // base value for year-start
      const range = def.baseRange[1] - def.baseRange[0]
      const yearStartValue = def.baseRange[0] + r * range

      // each branch gets a unique growth trajectory
      const growthSeed = seededRandom(seed + 7)
      const baseGrowthRate = (growthSeed - 0.35) * 0.3 // roughly -10% to +20%

      // date shifts the value
      const currentValue = yearStartValue * (1 + baseGrowthRate * dateFactor)
      const growthRate = (currentValue - yearStartValue) / yearStartValue

      rows.push({ indicatorId: def.id, branchId: bId, currentValue, yearStartValue, growthRate })
    }

    // sort by growth rate descending for ranking
    rows.sort((a, b) => b.growthRate - a.growthRate)
    result.set(def.id, rows)
  }

  return result
}

// ── Format helpers ────────────────────────────────────────────────
function fmt(v: number, unit: string, isPercent?: boolean): string {
  if (isPercent) {
    // value is in basis points (80-250) → display as e.g. "1.52%"
    return (v / 100).toFixed(2)
  }
  if (unit === "万户") return v.toFixed(2)
  if (unit === "亿元") return v.toFixed(2)
  return v.toFixed(2)
}

function fmtPct(rate: number): string {
  const pct = rate * 100
  const sign = pct >= 0 ? "+" : ""
  return `${sign}${pct.toFixed(2)}%`
}

function fmtPp(diff: number): string {
  const sign = diff >= 0 ? "+" : ""
  return `${sign}${diff.toFixed(2)}pp`
}

// ── Public API ────────────────────────────────────────────────────

export function generateIndicators(
  institutionId: string,
  dateStr: string
): IndicatorRow[] {
  const allBranches = computeAllBranches(dateStr)
  const totalBranches = branchIds.length
  const isSummary = institutionId === "all"

  return indicatorDefs.map((def) => {
    const branchRows = allBranches.get(def.id)!

    if (isSummary) {
      // ── Summary: sum of all branches ──
      const totalCurrent = branchRows.reduce((s, r) => s + r.currentValue, 0)
      const totalYearStart = branchRows.reduce((s, r) => s + r.yearStartValue, 0)

      let comparison: string
      if (def.isPercent) {
        // for ratio indicators, use weighted average instead of sum
        const avgCurrent = totalCurrent / totalBranches
        const avgYearStart = totalYearStart / totalBranches
        const diff = (avgCurrent - avgYearStart) / 100 // convert bp to pp
        comparison = fmtPp(diff)
        return {
          id: def.id,
          name: def.name,
          indent: def.indent,
          category: def.category,
          value: (avgCurrent / 100).toFixed(2),
          rawValue: avgCurrent / 100,
          unit: def.unit,
          comparisonType: def.comparisonType,
          comparison,
          comparisonRaw: diff,
          growthVsAll: "",
          growthRank: 0,
        }
      }

      const growthRate = (totalCurrent - totalYearStart) / totalYearStart
      comparison = fmtPct(growthRate)

      return {
        id: def.id,
        name: def.name,
        indent: def.indent,
        category: def.category,
        value: fmt(totalCurrent, def.unit),
        rawValue: totalCurrent,
        unit: def.unit,
        comparisonType: def.comparisonType,
        comparison,
        comparisonRaw: growthRate,
        growthVsAll: "",
        growthRank: 0,
      }
    }

    // ── Single branch ──
    const branchRow = branchRows.find((r) => r.branchId === institutionId)!
    const rank = branchRows.findIndex((r) => r.branchId === institutionId) + 1

    // national average growth rate
    const totalCurrent = branchRows.reduce((s, r) => s + r.currentValue, 0)
    const totalYearStart = branchRows.reduce((s, r) => s + r.yearStartValue, 0)
    const nationalGrowth = (totalCurrent - totalYearStart) / totalYearStart

    const branchGrowth = branchRow.growthRate
    const growthDiff = branchGrowth - nationalGrowth

    if (def.isPercent) {
      const valDisplay = (branchRow.currentValue / 100).toFixed(2)
      const diff = (branchRow.currentValue - branchRow.yearStartValue) / 100
      return {
        id: def.id,
        name: def.name,
        indent: def.indent,
        category: def.category,
        value: valDisplay,
        rawValue: branchRow.currentValue / 100,
        unit: def.unit,
        comparisonType: def.comparisonType,
        comparison: fmtPp(diff),
        comparisonRaw: diff,
        growthVsAll: fmtPp(growthDiff * 100),
        growthRank: rank,
      }
    }

    return {
      id: def.id,
      name: def.name,
      indent: def.indent,
      category: def.category,
      value: fmt(branchRow.currentValue, def.unit),
      rawValue: branchRow.currentValue,
      unit: def.unit,
      comparisonType: def.comparisonType,
      comparison: fmtPct(branchGrowth),
      comparisonRaw: branchGrowth,
      growthVsAll: fmtPp(growthDiff * 100),
      growthRank: rank,
    }
  })
}
