// Sample branch names
export const branches = [
  "济南支行", "城北支行", "卢杭支行", "开发支行", "高新支行",
  "城南欧亚支行", "城西支行", "滨江支行", "浙江支行", "临平支行",
  "桐庐支行", "余杭支行", "萧山支行", "富阳支行", "建德支行",
  "钱江新城支行", "滨安支行", "浮安支行", "淳安支行",
]

// Generate random bar data for branches
export function generateBarData(branchList: string[] = branches) {
  return branchList.map((name) => ({
    name,
    value: Math.floor(Math.random() * 500) + 50,
  }))
}

// Generate stacked bar data for branches
export function generateStackedBarData(branchList: string[] = branches) {
  return branchList.map((name) => ({
    name,
    segment1: Math.floor(Math.random() * 200) + 20,
    segment2: Math.floor(Math.random() * 150) + 10,
    segment3: Math.floor(Math.random() * 100) + 10,
    segment4: Math.floor(Math.random() * 80) + 5,
  }))
}

// Generate monthly trend data
export function generateTrendData() {
  const months = [
    "2024/12", "2025/01", "2025/02", "2025/03", "2025/04",
    "2025/05", "2025/06", "2025/07", "2025/08", "2025/09",
    "2025/10", "2025/11", "2025/12",
  ]
  return months.map((month) => ({
    month,
    value: Math.floor(Math.random() * 400) + 200,
  }))
}

// Generate line chart data (market share)
export function generateLineData() {
  const months = [
    "2024/12", "2025/01", "2025/02", "2025/03", "2025/04",
    "2025/05", "2025/06", "2025/07", "2025/08", "2025/09",
    "2025/10", "2025/11", "2025/12",
  ]
  return months.map((month) => ({
    month,
    value: Math.floor(Math.random() * 30) + 10,
  }))
}

// Generate multi-line data for "四行排名"
export function generateMultiLineData() {
  const months = [
    "2024/12", "2025/01", "2025/02", "2025/03", "2025/04",
    "2025/05", "2025/06", "2025/07", "2025/08", "2025/09",
    "2025/10", "2025/11", "2025/12",
  ]
  return months.map((month) => ({
    month,
    bank1: Math.floor(Math.random() * 150) + 250,
    bank2: Math.floor(Math.random() * 150) + 200,
    bank3: Math.floor(Math.random() * 150) + 180,
    bank4: Math.floor(Math.random() * 150) + 150,
  }))
}

// KPI data structure
export interface KpiItem {
  label: string
  value: string
  growth: string
  growthLabel?: string
  tooltip?: string
}
