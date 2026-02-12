"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface StackedBarChartProps {
  data: Record<string, string | number>[]
  segments: { key: string; label: string; color: string }[]
  height?: number
}

export function StackedBarChart({
  data,
  segments,
  height = 280,
}: StackedBarChartProps) {
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
        <Legend
          wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
          iconType="circle"
          iconSize={8}
        />
        {segments.map((segment) => (
          <Bar
            key={segment.key}
            dataKey={segment.key}
            name={segment.label}
            stackId="stack"
            fill={segment.color}
            maxBarSize={32}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
