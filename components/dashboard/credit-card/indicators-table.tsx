"use client"

import { cn } from "@/lib/utils"
import type { IndicatorRow } from "@/lib/credit-card-data"

interface IndicatorsTableProps {
  data: IndicatorRow[]
  title?: string
}

export function IndicatorsTable({ data, title }: IndicatorsTableProps) {
  return (
    <div className="bg-card rounded border border-border overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="text-left px-4 py-2.5 font-semibold text-foreground border-b border-border min-w-[220px]">
                业务指标（万户/亿元/%）
              </th>
              <th className="text-right px-4 py-2.5 font-semibold text-foreground border-b border-border min-w-[120px]">
                业务量
              </th>
              <th className="text-center px-4 py-2.5 font-semibold text-foreground border-b border-border min-w-[100px]">
                <span>同比/</span>
                <br />
                <span>较年初</span>
              </th>
              <th className="text-right px-4 py-2.5 font-semibold text-foreground border-b border-border min-w-[120px]">
                增速较全辖
              </th>
              <th className="text-center px-4 py-2.5 font-semibold text-foreground border-b border-border min-w-[80px]">
                <span>增速</span>
                <br />
                <span>排名</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const isNegative = row.comparison.startsWith("-")
              const isGrowthNegative = row.growthVsAll.startsWith("-")
              const isEvenRow = index % 2 === 0
              return (
                <tr
                  key={row.id}
                  className={cn(
                    "transition-colors hover:bg-muted/50",
                    isEvenRow ? "bg-card" : "bg-muted/30"
                  )}
                >
                  <td
                    className={cn(
                      "px-4 py-2.5 border-b border-border text-foreground",
                      row.indent === 0 ? "font-semibold" : "font-normal"
                    )}
                    style={{ paddingLeft: row.indent ? `${(row.indent ?? 0) * 24 + 16}px` : "16px" }}
                  >
                    {row.name}
                  </td>
                  <td className="px-4 py-2.5 border-b border-border text-right tabular-nums text-foreground font-medium">
                    {row.value}
                  </td>
                  <td className="px-4 py-2.5 border-b border-border text-center">
                    <span
                      className={cn(
                        "tabular-nums font-medium",
                        row.comparisonType === "较年初" ? "text-primary" : "text-foreground"
                      )}
                    >
                      {row.comparisonType === "较年初" ? "较年初 " : "同比 "}
                    </span>
                    <br />
                    <span
                      className={cn(
                        "tabular-nums font-semibold",
                        isNegative ? "text-bank-green" : "text-primary"
                      )}
                    >
                      {row.comparison}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 border-b border-border text-right">
                    <span
                      className={cn(
                        "tabular-nums font-medium",
                        isGrowthNegative ? "text-bank-green" : "text-primary"
                      )}
                    >
                      {row.growthVsAll}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 border-b border-border text-center tabular-nums font-medium text-foreground">
                    {row.growthRank}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
