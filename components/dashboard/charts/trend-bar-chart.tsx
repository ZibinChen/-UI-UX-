"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface TrendBarChartProps {
  data: { month: string; value: number }[]
  color?: string
  height?: number
  title?: string
  unit?: string
}

export function TrendBarChart({
  data,
  color = "hsl(0, 85%, 46%)",
  height = 240,
  title,
  unit,
}: TrendBarChartProps) {
  return (
    <div>
      {(title || unit) && (
        <div className="flex items-baseline gap-2 mb-2">
          {title && <span className="text-sm font-semibold text-foreground">{title}</span>}
          {unit && <span className="text-xs text-muted-foreground">单位：{unit}</span>}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(0, 0%, 92%)" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fill: "hsl(0, 0%, 45%)" }}
            axisLine={{ stroke: "hsl(0, 0%, 90%)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(0, 0%, 45%)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(0, 0%, 100%)",
              border: "1px solid hsl(0, 0%, 90%)",
              borderRadius: "4px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "hsl(0, 0%, 20%)", fontWeight: 600, marginBottom: 4 }}
          />
          <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
