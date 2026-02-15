// ====================================================================
// Cross-sell activity data engine
// Activity: "自动还款绑定金喜营销活动" (9月5日 - 统计截至)
// ====================================================================

import {
  institutions, branchList, BRANCH_COUNT,
  seeded, hashCode, computeShares, dateFactor,
} from "./credit-card-data"

export { institutions, branchList }

// ── Available weeks for the "当周情况" tab (from activity start 9/5) ──
export const availableWeeks = [
  { id: "w1",  label: "第1周 (9月5日-9月11日)",    start: "09/05", end: "09/11" },
  { id: "w2",  label: "第2周 (9月12日-9月18日)",   start: "09/12", end: "09/18" },
  { id: "w3",  label: "第3周 (9月19日-9月25日)",   start: "09/19", end: "09/25" },
  { id: "w4",  label: "第4周 (9月26日-10月2日)",   start: "09/26", end: "10/02" },
  { id: "w5",  label: "第5周 (10月3日-10月9日)",   start: "10/03", end: "10/09" },
  { id: "w6",  label: "第6周 (10月10日-10月16日)", start: "10/10", end: "10/16" },
  { id: "w7",  label: "第7周 (10月17日-10月23日)", start: "10/17", end: "10/23" },
  { id: "w8",  label: "第8周 (10月24日-10月30日)", start: "10/24", end: "10/30" },
  { id: "w9",  label: "第9周 (10月31日-11月6日)",  start: "10/31", end: "11/06" },
  { id: "w10", label: "第10周 (11月7日-11月13日)", start: "11/07", end: "11/13" },
  { id: "w11", label: "第11周 (11月14日-11月20日)", start: "11/14", end: "11/20" },
  { id: "w12", label: "第12周 (11月21日-11月27日)", start: "11/21", end: "11/27" },
  { id: "w13", label: "第13周 (11月28日-12月4日)",  start: "11/28", end: "12/04" },
  { id: "w14", label: "第14周 (12月5日-12月11日)",  start: "12/05", end: "12/11" },
  { id: "w15", label: "第15周 (12月12日-12月18日)", start: "12/12", end: "12/18" },
  { id: "w16", label: "第16周 (12月19日-12月25日)", start: "12/19", end: "12/25" },
  { id: "w17", label: "第17周 (12月26日-1月1日)",   start: "12/26", end: "01/01" },
  { id: "w18", label: "第18周 (1月2日-1月8日)",     start: "01/02", end: "01/08" },
  { id: "w19", label: "第19周 (1月9日-1月15日)",    start: "01/09", end: "01/15" },
  { id: "w20", label: "第20周 (1月16日-1月22日)",   start: "01/16", end: "01/22" },
  { id: "w21", label: "第21周 (1月23日-1月29日)",   start: "01/23", end: "01/29" },
  { id: "w22", label: "第22周 (1月30日-2月5日)",    start: "01/30", end: "02/05" },
  { id: "w23", label: "第23周 (2月6日-2月12日)",    start: "02/06", end: "02/12" },
]

// ── KPI Indicators ───────────────────────────────────────────────
export interface CrossSellKpi {
  id: string
  name: string
  unit: string
}

export const kpiList: CrossSellKpi[] = [
  { id: "cs_new_cust",    name: "活动新增客户数", unit: "户" },
  { id: "cs_bound",       name: "已绑定自动还款客户数", unit: "户" },
  { id: "cs_unbound",     name: "未绑定自动还款客户数", unit: "户" },
  { id: "cs_bindrate",    name: "绑定率", unit: "%" },
]

// ── National total seeds (cumulative from activity start to now) ─
const NATIONAL_TOTALS: Record<string, number> = {
  cs_new_cust: 727332,
  cs_bound: 156315,
  cs_unbound: 571017,
}

// ── Branch row for activity table ─────────────────────────────────
export interface CrossSellBranchRow {
  rank: number
  branchId: string
  branchName: string
  newCust: number
  bound: number
  unbound: number
  bindRate: number // %
  weeklyNew: number
}

// ── Generate activity progress data (cumulative from 9/5 to date) ─
export function generateActivityData(
  institutionId: string,
  dateStr: string
): { summary: CrossSellBranchRow; branches: CrossSellBranchRow[] } {
  const df = dateFactor(dateStr)
  // Date affects cumulative values slightly
  const dateMult = 0.95 + (df / 60) * 0.10 // 0.95 ~ 1.05

  const shares = computeShares("cs_new_cust", "cur")

  const branches: CrossSellBranchRow[] = branchList.map((b, i) => {
    const share = shares[i]
    // Per-branch bind rate variation (15% ~ 42%)
    const branchBindRateSeed = seeded(hashCode(`cs_bindrate_${b.id}`))
    const baseBindRate = 0.15 + branchBindRateSeed * 0.27

    const newCust = Math.round(NATIONAL_TOTALS.cs_new_cust * share * dateMult)
    const bound = Math.round(newCust * baseBindRate)
    const unbound = newCust - bound
    const bindRate = newCust > 0 ? (bound / newCust) * 100 : 0

    // Weekly new: ~5-8% of cumulative
    const weeklyPct = 0.05 + seeded(hashCode(`cs_weekly_${b.id}_${dateStr}`)) * 0.03
    const weeklyNew = Math.round(newCust * weeklyPct)

    return {
      rank: 0,
      branchId: b.id,
      branchName: b.name,
      newCust,
      bound,
      unbound,
      bindRate: +bindRate.toFixed(2),
      weeklyNew,
    }
  })

  // Sort by bindRate descending for ranking
  branches.sort((a, b) => b.bindRate - a.bindRate)
  branches.forEach((r, i) => { r.rank = i + 1 })

  const summary: CrossSellBranchRow = {
    rank: 0,
    branchId: "all",
    branchName: "汇总",
    newCust: branches.reduce((s, b) => s + b.newCust, 0),
    bound: branches.reduce((s, b) => s + b.bound, 0),
    unbound: branches.reduce((s, b) => s + b.unbound, 0),
    bindRate: 0,
    weeklyNew: branches.reduce((s, b) => s + b.weeklyNew, 0),
  }
  summary.bindRate = summary.newCust > 0
    ? +((summary.bound / summary.newCust) * 100).toFixed(2)
    : 0

  return { summary, branches }
}

// ── Generate weekly data for a specific week ──────────────────────
export interface WeeklyBranchRow {
  rank: number
  branchId: string
  branchName: string
  weeklyNew: number
  weeklyBound: number
  weeklyUnbound: number
  weeklyBindRate: number
}

export function generateWeeklyData(
  weekId: string
): { summary: WeeklyBranchRow; branches: WeeklyBranchRow[] } {
  const shares = computeShares("cs_new_cust", "cur")
  // National weekly new ~40000-50000
  const weekSeed = seeded(hashCode(`week_total_${weekId}`))
  const nationalWeeklyNew = Math.round(38000 + weekSeed * 12000)

  const branches: WeeklyBranchRow[] = branchList.map((b, i) => {
    const share = shares[i]
    const jitter = 0.85 + seeded(hashCode(`week_${weekId}_${b.id}`)) * 0.30
    const weeklyNew = Math.round(nationalWeeklyNew * share * jitter)

    // Bind rate per branch per week (10% ~ 35%)
    const bindSeed = seeded(hashCode(`weekbind_${weekId}_${b.id}`))
    const bindRate = 0.10 + bindSeed * 0.25
    const weeklyBound = Math.round(weeklyNew * bindRate)
    const weeklyUnbound = weeklyNew - weeklyBound
    const rate = weeklyNew > 0 ? (weeklyBound / weeklyNew) * 100 : 0

    return {
      rank: 0,
      branchId: b.id,
      branchName: b.name,
      weeklyNew,
      weeklyBound,
      weeklyUnbound,
      weeklyBindRate: +rate.toFixed(2),
    }
  })

  // Re-normalize so branch sums match a clean national total
  const totalNew = branches.reduce((s, b) => s + b.weeklyNew, 0)
  const totalBound = branches.reduce((s, b) => s + b.weeklyBound, 0)

  branches.sort((a, b) => b.weeklyBindRate - a.weeklyBindRate)
  branches.forEach((r, i) => { r.rank = i + 1 })

  const summary: WeeklyBranchRow = {
    rank: 0,
    branchId: "all",
    branchName: "汇总",
    weeklyNew: totalNew,
    weeklyBound: totalBound,
    weeklyUnbound: totalNew - totalBound,
    weeklyBindRate: totalNew > 0 ? +((totalBound / totalNew) * 100).toFixed(2) : 0,
  }

  return { summary, branches }
}

// ── Trend data for activity progress (cumulative values) ──────────
export interface CrossSellTrendPoint {
  period: string
  newCust: number      // cumulative
  bound: number        // cumulative
  bindRate: number     // cumulative %
  momPct: number | null // period-over-period % change of the cumulative value (null for first period)
}

const trendMonths = ["9月", "10月", "11月", "12月", "1月", "2月"]
// Week labels using start date (from activity start 9/5 onward, each week = 7 days)
const trendWeekStartDates = [
  "9/5", "9/12", "9/19", "9/26", "10/3", "10/10", "10/17", "10/24",
  "10/31", "11/7", "11/14", "11/21", "11/28", "12/5", "12/12", "12/19",
  "12/26", "1/2", "1/9", "1/16",
]

export function generateActivityTrend(
  institutionId: string,
  mode: "month" | "week"
): CrossSellTrendPoint[] {
  const isSummary = institutionId === "all"
  const periods = mode === "month" ? trendMonths : trendWeekStartDates.slice(0, 12)

  let cumNew = 0
  let cumBound = 0
  let prevCumNew = 0

  return periods.map((period, pi) => {
    // Incremental new customers per period
    const basePeriod = mode === "month" ? 120000 : 30000
    const growth = 1 + pi * 0.02
    const jitter = 0.9 + seeded(hashCode(`cstrend_${mode}_${period}`)) * 0.2
    let periodNew = Math.round(basePeriod * growth * jitter)

    if (!isSummary) {
      const shares = computeShares("cs_new_cust", "cur")
      const idx = branchList.findIndex(b => b.id === institutionId)
      if (idx >= 0) {
        const brJitter = 0.9 + seeded(hashCode(`cstrend_br_${mode}_${period}_${institutionId}`)) * 0.2
        periodNew = Math.round(periodNew * shares[idx] * brJitter)
      }
    }

    const bindSeed = seeded(hashCode(`cstrend_bind_${mode}_${period}_${institutionId}`))
    const bindRate = 18 + bindSeed * 10
    const periodBound = Math.round(periodNew * bindRate / 100)

    // Accumulate
    cumNew += periodNew
    cumBound += periodBound
    const cumBindRate = cumNew > 0 ? (cumBound / cumNew) * 100 : 0

    const momPct = prevCumNew > 0 ? ((cumNew - prevCumNew) / prevCumNew) * 100 : null
    prevCumNew = cumNew

    return {
      period,
      newCust: cumNew,
      bound: cumBound,
      bindRate: +cumBindRate.toFixed(2),
      momPct: momPct !== null ? +momPct.toFixed(2) : null,
    }
  })
}

// ── Weekly trend data (per-week values, not cumulative) ───────────
export interface WeeklyTrendPoint {
  period: string
  weeklyNew: number
  weeklyBound: number
  weeklyBindRate: number
  wowPct: number | null  // week-over-week % change (null for first week)
}

export function generateWeeklyTrend(
  institutionId: string
): WeeklyTrendPoint[] {
  const isSummary = institutionId === "all"
  let prevNew = 0

  return availableWeeks.map((week, wi) => {
    const basePeriod = 38000 + seeded(hashCode(`weektrend_base_${week.id}`)) * 12000
    const jitter = 0.9 + seeded(hashCode(`weektrend_${week.id}`)) * 0.2
    let weeklyNew = Math.round(basePeriod * jitter)

    if (!isSummary) {
      const shares = computeShares("cs_new_cust", "cur")
      const idx = branchList.findIndex(b => b.id === institutionId)
      if (idx >= 0) {
        const brJitter = 0.9 + seeded(hashCode(`weektrend_br_${week.id}_${institutionId}`)) * 0.2
        weeklyNew = Math.round(weeklyNew * shares[idx] * brJitter)
      }
    }

    const bindSeed = seeded(hashCode(`weektrend_bind_${week.id}_${institutionId}`))
    const bindRate = 10 + bindSeed * 25
    const weeklyBound = Math.round(weeklyNew * bindRate / 100)
    const weeklyBindRate = weeklyNew > 0 ? (weeklyBound / weeklyNew) * 100 : 0

    const wowPct = prevNew > 0 ? ((weeklyNew - prevNew) / prevNew) * 100 : null
    prevNew = weeklyNew

    return {
      period: `${parseInt(week.start.split("/")[0])}/${parseInt(week.start.split("/")[1])}`,
      weeklyNew,
      weeklyBound,
      weeklyBindRate: +weeklyBindRate.toFixed(2),
      wowPct: wowPct !== null ? +wowPct.toFixed(2) : null,
    }
  })
}
