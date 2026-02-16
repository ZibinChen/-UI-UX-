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

interface BranchBarChartProps {
  data: { name: string; value: number }[]
  color?: string
  height?: number
}

export function BranchBarChart({
  data,
  color = "hsl(0, 85%, 46%)",
  height = 280,
}: BranchBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, bottom: 30, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(0, 0%, 92%)" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "hsl(0, 0%, 45%)" }}
          angle={-45}
          textAnchor="end"
          height={60}
          axisLine={{ stroke: "hsl(0, 0%, 90%)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(0, 0%, 45%)" }}
          axisLine={false}
          tickLine={false}
          domain={["auto", "auto"]}
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
        <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  )
}
