"use client"

import { cn } from "@/lib/utils"
import { ArrowUp, ArrowDown } from "lucide-react"
import type { IndicatorRow } from "@/lib/credit-card-data"

interface IndicatorsTableProps {
  data: IndicatorRow[]
  title?: string
  isSummary?: boolean // true when 境内分支机构汇总 is selected — hides growth columns
}

function ComparisonCell({ value, type }: { value: string; type: string }) {
  const isNegative = value.startsWith("-")
  return (
    <div className="flex items-center justify-end gap-1">
      <span className="text-xs text-muted-foreground shrink-0">{type}</span>
      <span
        className={cn(
          "tabular-nums font-semibold text-sm",
          isNegative ? "text-bank-green" : "text-primary"
        )}
      >
        {value}
      </span>
      {isNegative ? (
        <ArrowDown className="h-3.5 w-3.5 text-bank-green shrink-0" />
      ) : (
        <ArrowUp className="h-3.5 w-3.5 text-primary shrink-0" />
      )}
    </div>
  )
}

export function IndicatorsTable({ data, title, isSummary = false }: IndicatorsTableProps) {
  return (
    <div className="bg-card rounded border border-border overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="text-left px-3 py-2.5 font-semibold text-foreground border-b border-border w-[200px]">
                业务指标
              </th>
              <th className="text-right px-3 py-2.5 font-semibold text-foreground border-b border-border w-[160px]">
                业务量
              </th>
              <th className="text-right px-3 py-2.5 font-semibold text-foreground border-b border-border w-[180px]">
                同比/较年初
              </th>
              {!isSummary && (
                <>
                  <th className="text-right px-3 py-2.5 font-semibold text-foreground border-b border-border w-[160px]">
                    增速较全辖
                  </th>
                  <th className="text-center px-3 py-2.5 font-semibold text-foreground border-b border-border w-[80px]">
                    增速排名
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const isEvenRow = index % 2 === 0
              const isGrowthNegative = row.growthVsAll.startsWith("-")
              return (
                <tr
                  key={row.id}
                  className={cn(
                    "transition-colors hover:bg-muted/50",
                    isEvenRow ? "bg-card" : "bg-muted/30"
                  )}
                >
                  {/* Indicator name */}
                  <td
                    className={cn(
                      "px-3 py-2 border-b border-border text-foreground",
                      row.indent === 0 ? "font-semibold" : "font-normal"
                    )}
                    style={{
                      paddingLeft: `${(row.indent ?? 0) * 20 + 12}px`,
                    }}
                  >
                    {row.name}
                  </td>

                  {/* Value + unit */}
                  <td className="px-3 py-2 border-b border-border text-right">
                    <span className="tabular-nums text-foreground font-medium">
                      {row.value}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      {row.unit}
                    </span>
                  </td>

                  {/* Comparison — label + value + arrow on same line */}
                  <td className="px-3 py-2 border-b border-border text-right">
                    <ComparisonCell value={row.comparison} type={row.comparisonType} />
                  </td>

                  {/* Growth vs all (hidden for summary) */}
                  {!isSummary && (
                    <>
                      <td className="px-3 py-2 border-b border-border text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span
                            className={cn(
                              "tabular-nums font-medium text-sm",
                              isGrowthNegative ? "text-bank-green" : "text-primary"
                            )}
                          >
                            {row.growthVsAll}
                          </span>
                          {isGrowthNegative ? (
                            <ArrowDown className="h-3.5 w-3.5 text-bank-green shrink-0" />
                          ) : (
                            <ArrowUp className="h-3.5 w-3.5 text-primary shrink-0" />
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 border-b border-border text-center tabular-nums font-medium text-foreground">
                        {row.growthRank}
                      </td>
                    </>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
