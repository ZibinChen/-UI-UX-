// Credit card business indicator types and sample data

export interface IndicatorRow {
  id: string
  name: string
  indent?: number // 0 = top level, 1 = sub-item
  comparisonType: "较年初" | "同比" // comparison method
  category: "customer" | "consumption" | "loan" // for tab filtering
  unit: string // e.g. "万户", "亿元", "%"
  value: string
  comparison: string
  growthVsAll: string
  growthRank: string
}

// Provinces + 5 separately planned cities
export const institutions: { id: string; name: string }[] = [
  { id: "all", name: "境内分支机构汇总" },
  // 直辖市
  { id: "beijing", name: "北京市分行" },
  { id: "tianjin", name: "天津市分行" },
  { id: "shanghai", name: "上海市分行" },
  { id: "chongqing", name: "重庆市分行" },
  // 省份
  { id: "hebei", name: "河北省分行" },
  { id: "shanxi", name: "山西省分行" },
  { id: "neimenggu", name: "内蒙古分行" },
  { id: "liaoning", name: "辽宁省分行" },
  { id: "jilin", name: "吉林省分行" },
  { id: "heilongjiang", name: "黑龙江省分行" },
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
  { id: "sichuan", name: "四川省分行" },
  { id: "guizhou", name: "贵州省分行" },
  { id: "yunnan", name: "云南省分行" },
  { id: "xizang", name: "西藏分行" },
  { id: "shaanxi", name: "陕西省分行" },
  { id: "gansu", name: "甘肃省分行" },
  { id: "qinghai", name: "青海省分行" },
  { id: "ningxia", name: "宁夏分行" },
  { id: "xinjiang", name: "新疆分行" },
  // 五个计划单列市
  { id: "shenzhen", name: "深圳市分行" },
  { id: "ningbo", name: "宁波市分行" },
  { id: "dalian", name: "大连市分行" },
  { id: "qingdao", name: "青岛市分行" },
  { id: "xiamen", name: "厦门市分行" },
]

// Available dates for the date selector
export const availableDates: string[] = [
  "2026/01/31",
  ...Array.from({ length: 13 }, (_, i) => {
    const day = i + 1
    return `2026/02/${String(day).padStart(2, "0")}`
  }),
]

// Indicator template (without values)
interface IndicatorTemplate {
  id: string
  name: string
  indent?: number
  comparisonType: "较年初" | "同比"
  category: "customer" | "consumption" | "loan"
  unit: string
}

const indicatorTemplates: IndicatorTemplate[] = [
  { id: "effective-customers", name: "有效客户", indent: 0, comparisonType: "较年初", category: "customer", unit: "万户" },
  { id: "new-customers", name: "其中：新增客户", indent: 1, comparisonType: "同比", category: "customer", unit: "万户" },
  { id: "active-customers", name: "活跃客户", indent: 1, comparisonType: "较年初", category: "customer", unit: "万户" },
  { id: "quick-trade-customers", name: "快捷交易客户", indent: 1, comparisonType: "同比", category: "customer", unit: "万户" },
  { id: "total-consumption", name: "总消费额", indent: 0, comparisonType: "同比", category: "consumption", unit: "亿元" },
  { id: "installment-consumption", name: "信用卡分期消费额", indent: 0, comparisonType: "同比", category: "consumption", unit: "亿元" },
  { id: "auto-installment", name: "其中：汽车分期", indent: 1, comparisonType: "同比", category: "consumption", unit: "亿元" },
  { id: "home-installment", name: "家装分期", indent: 1, comparisonType: "同比", category: "consumption", unit: "亿元" },
  { id: "boc-e-installment", name: "中银E分期", indent: 1, comparisonType: "同比", category: "consumption", unit: "亿元" },
  { id: "card-consumption", name: "信用卡消费额", indent: 0, comparisonType: "同比", category: "consumption", unit: "亿元" },
  { id: "normal-consumption", name: "其中：普通消费额", indent: 1, comparisonType: "同比", category: "consumption", unit: "亿元" },
  { id: "merchant-installment", name: "商户分期", indent: 1, comparisonType: "同比", category: "consumption", unit: "亿元" },
  { id: "cardholder-installment", name: "卡户分期", indent: 1, comparisonType: "同比", category: "consumption", unit: "亿元" },
  { id: "quick-consumption", name: "快捷消费额", indent: 0, comparisonType: "同比", category: "consumption", unit: "亿元" },
  { id: "cross-border-consumption", name: "跨境消费额", indent: 0, comparisonType: "同比", category: "consumption", unit: "亿元" },
  { id: "loan-balance", name: "贷款余额", indent: 0, comparisonType: "较年初", category: "loan", unit: "亿元" },
  { id: "npl-balance", name: "不良余额", indent: 0, comparisonType: "较年初", category: "loan", unit: "亿元" },
  { id: "npl-ratio", name: "不良率", indent: 0, comparisonType: "较年初", category: "loan", unit: "%" },
]

// Deterministic pseudo-random based on seed string
function seededRandom(seed: string): () => number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b)
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b)
    h = (h ^ (h >>> 16)) >>> 0
    return (h % 10000) / 10000
  }
}

export function generateIndicators(institutionId: string, date: string): IndicatorRow[] {
  const rng = seededRandom(`${institutionId}-${date}`)

  return indicatorTemplates.map((tpl) => {
    const isPercent = tpl.unit === "%"
    const baseValue = isPercent
      ? (rng() * 3 + 0.5) // 0.5% ~ 3.5%
      : tpl.indent === 0
        ? (rng() * 5000 + 500)  // top-level: 500 ~ 5500
        : (rng() * 2000 + 100)  // sub-item: 100 ~ 2100

    const comparisonVal = (rng() - 0.35) * 30 // -10.5% ~ 19.5%
    const growthVal = (rng() - 0.4) * 10       // -4% ~ 6%
    const rank = Math.floor(rng() * 36) + 1     // 1~36

    return {
      ...tpl,
      value: isPercent ? baseValue.toFixed(2) : baseValue.toFixed(2),
      comparison: `${comparisonVal >= 0 ? "+" : ""}${comparisonVal.toFixed(2)}%`,
      growthVsAll: `${growthVal >= 0 ? "+" : ""}${growthVal.toFixed(2)}%`,
      growthRank: String(rank),
    }
  })
}

// Keep a static version for backward compat
export const creditCardIndicators = generateIndicators("all", "2026/02/12")

// Branch data for sub-panel charts
export const creditCardBranches = [
  "济南支行", "城北支行", "卢杭支行", "开发支行", "高新支行",
  "城南欧亚支行", "城西支行", "滨江支行", "浙江支行", "临平支行",
  "桐庐支行", "余杭支行", "萧山支行", "富阳支行", "建德支行",
  "钱江新城支行", "淳安支行",
]

export function generateCreditCardBarData() {
  return creditCardBranches.map((name) => ({
    name,
    value: Math.floor(Math.random() * 800) + 100,
  }))
}

export function generateCreditCardTrendData() {
  const months = [
    "2025/07", "2025/08", "2025/09", "2025/10", "2025/11", "2025/12",
    "2026/01", "2026/02", "2026/03", "2026/04", "2026/05", "2026/06",
  ]
  return months.map((month) => ({
    month,
    value: Math.floor(Math.random() * 500) + 200,
  }))
}
