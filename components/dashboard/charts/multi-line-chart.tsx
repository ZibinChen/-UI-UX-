"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface MultiLineChartProps {
  data: Record<string, string | number>[]
  lines: { key: string; label: string; color: string }[]
  height?: number
  title?: string
  unit?: string
}

export function MultiLineChart({
  data,
  lines,
  height = 240,
  title,
  unit,
}: MultiLineChartProps) {
  return (
    <div>
      {(title || unit) && (
        <div className="flex items-baseline gap-2 mb-2">
          {title && <span className="text-sm font-semibold text-foreground">{title}</span>}
          {unit && <span className="text-xs text-muted-foreground">单位：{unit}</span>}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
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
          <Legend
            wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
            iconType="circle"
            iconSize={8}
          />
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.label}
              stroke={line.color}
              strokeWidth={2}
              dot={{ r: 3, fill: line.color }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
