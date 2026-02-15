// ====================================================================
// Cross-sell activity data engine
// Activity: "自动还款绑定金喜营销活动" (9月5日 - 统计截至)
// ====================================================================

import {
  institutions, branchList, BRANCH_COUNT,
  seeded, hashCode, computeShares, dateFactor,
} from "./credit-card-data"

export { institutions, branchList }

// ── Available weeks for the "当周情况" tab ────────────────────────
export const availableWeeks = [
  { id: "w1", label: "第1周 (1月6日-1月12日)", start: "01/06", end: "01/12" },
  { id: "w2", label: "第2周 (1月13日-1月19日)", start: "01/13", end: "01/19" },
  { id: "w3", label: "第3周 (1月20日-1月26日)", start: "01/20", end: "01/26" },
  { id: "w4", label: "第4周 (1月27日-2月2日)", start: "01/27", end: "02/02" },
  { id: "w5", label: "第5周 (2月3日-2月9日)", start: "02/03", end: "02/09" },
  { id: "w6", label: "第6周 (2月10日-2月12日)", start: "02/10", end: "02/12" },
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

// ── Trend data for activity progress (monthly or weekly) ──────────
export interface CrossSellTrendPoint {
  period: string
  newCust: number
  bound: number
  bindRate: number
  momPct: number // month-over-month or week-over-week %
}

const trendMonths = ["9月", "10月", "11月", "12月", "1月", "2月"]
const trendWeeksLabels = Array.from({ length: 20 }, (_, i) => `W${i + 1}`)

export function generateActivityTrend(
  institutionId: string,
  mode: "month" | "week"
): CrossSellTrendPoint[] {
  const isSummary = institutionId === "all"
  const periods = mode === "month" ? trendMonths : trendWeeksLabels.slice(0, 12)

  let prevNew = 0
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
    const bindRate = 18 + bindSeed * 10 // 18% ~ 28%
    const bound = Math.round(periodNew * bindRate / 100)

    const momPct = prevNew > 0 ? ((periodNew - prevNew) / prevNew) * 100 : 0
    prevNew = periodNew

    return {
      period,
      newCust: periodNew,
      bound,
      bindRate: +bindRate.toFixed(2),
      momPct: +momPct.toFixed(2),
    }
  })
}
