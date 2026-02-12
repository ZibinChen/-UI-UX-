// Credit card business indicator types and sample data

export interface IndicatorRow {
  id: string
  name: string
  indent?: number // 0 = top level, 1 = sub-item
  comparisonType: "较年初" | "同比" // comparison method
  category: "customer" | "consumption" | "loan" // for tab filtering
  value: string
  comparison: string
  growthVsAll: string
  growthRank: string
}

export const creditCardIndicators: IndicatorRow[] = [
  // -- 有效客户 category --
  {
    id: "effective-customers",
    name: "有效客户",
    indent: 0,
    comparisonType: "较年初",
    category: "customer",
    value: "1,523.45",
    comparison: "+12.35%",
    growthVsAll: "+2.18%",
    growthRank: "3",
  },
  {
    id: "new-customers",
    name: "其中：新增客户",
    indent: 1,
    comparisonType: "同比",
    category: "customer",
    value: "234.56",
    comparison: "+8.92%",
    growthVsAll: "+1.56%",
    growthRank: "5",
  },
  {
    id: "active-customers",
    name: "活跃客户",
    indent: 1,
    comparisonType: "较年初",
    category: "customer",
    value: "987.23",
    comparison: "+15.67%",
    growthVsAll: "+3.45%",
    growthRank: "2",
  },
  {
    id: "quick-trade-customers",
    name: "快捷交易客户",
    indent: 1,
    comparisonType: "同比",
    category: "customer",
    value: "456.78",
    comparison: "+6.34%",
    growthVsAll: "+0.89%",
    growthRank: "8",
  },
  // -- 消费额 category --
  {
    id: "total-consumption",
    name: "总消费额",
    indent: 0,
    comparisonType: "同比",
    category: "consumption",
    value: "3,456.78",
    comparison: "+18.45%",
    growthVsAll: "+4.23%",
    growthRank: "1",
  },
  {
    id: "installment-consumption",
    name: "信用卡分期消费额",
    indent: 0,
    comparisonType: "同比",
    category: "consumption",
    value: "1,234.56",
    comparison: "+14.23%",
    growthVsAll: "+2.89%",
    growthRank: "4",
  },
  {
    id: "auto-installment",
    name: "其中：汽车分期",
    indent: 1,
    comparisonType: "同比",
    category: "consumption",
    value: "456.12",
    comparison: "+22.34%",
    growthVsAll: "+5.67%",
    growthRank: "1",
  },
  {
    id: "home-installment",
    name: "家装分期",
    indent: 1,
    comparisonType: "同比",
    category: "consumption",
    value: "234.56",
    comparison: "+11.45%",
    growthVsAll: "+1.23%",
    growthRank: "6",
  },
  {
    id: "boc-e-installment",
    name: "中银E分期",
    indent: 1,
    comparisonType: "同比",
    category: "consumption",
    value: "345.67",
    comparison: "+9.87%",
    growthVsAll: "+0.56%",
    growthRank: "9",
  },
  {
    id: "card-consumption",
    name: "信用卡消费额",
    indent: 0,
    comparisonType: "同比",
    category: "consumption",
    value: "2,222.22",
    comparison: "+16.78%",
    growthVsAll: "+3.45%",
    growthRank: "2",
  },
  {
    id: "normal-consumption",
    name: "其中：普通消费额",
    indent: 1,
    comparisonType: "同比",
    category: "consumption",
    value: "1,111.11",
    comparison: "+13.56%",
    growthVsAll: "+2.34%",
    growthRank: "5",
  },
  {
    id: "merchant-installment",
    name: "商户分期",
    indent: 1,
    comparisonType: "同比",
    category: "consumption",
    value: "567.89",
    comparison: "+19.23%",
    growthVsAll: "+4.56%",
    growthRank: "3",
  },
  {
    id: "cardholder-installment",
    name: "卡户分期",
    indent: 1,
    comparisonType: "同比",
    category: "consumption",
    value: "345.12",
    comparison: "+7.89%",
    growthVsAll: "+0.45%",
    growthRank: "10",
  },
  {
    id: "quick-consumption",
    name: "快捷消费额",
    indent: 0,
    comparisonType: "同比",
    category: "consumption",
    value: "789.45",
    comparison: "+21.34%",
    growthVsAll: "+5.12%",
    growthRank: "1",
  },
  {
    id: "cross-border-consumption",
    name: "跨境消费额",
    indent: 0,
    comparisonType: "同比",
    category: "consumption",
    value: "234.56",
    comparison: "+25.67%",
    growthVsAll: "+6.78%",
    growthRank: "1",
  },
  // -- 贷款/不良 category --
  {
    id: "loan-balance",
    name: "贷款余额",
    indent: 0,
    comparisonType: "较年初",
    category: "loan",
    value: "4,567.89",
    comparison: "+8.56%",
    growthVsAll: "+1.23%",
    growthRank: "4",
  },
  {
    id: "npl-balance",
    name: "不良余额",
    indent: 0,
    comparisonType: "较年初",
    category: "loan",
    value: "45.67",
    comparison: "-3.45%",
    growthVsAll: "-1.23%",
    growthRank: "2",
  },
  {
    id: "npl-ratio",
    name: "不良率",
    indent: 0,
    comparisonType: "较年初",
    category: "loan",
    value: "1.00%",
    comparison: "-0.12%",
    growthVsAll: "-0.05%",
    growthRank: "3",
  },
]

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
