"use client"

import { cn } from "@/lib/utils"
import { ArrowUp, ArrowDown, Minus } from "lucide-react"
import type { IndicatorRow } from "@/lib/credit-card-data"

interface IndicatorsTableProps {
  data: IndicatorRow[]
  title?: string
  isSummary?: boolean
}

function ValueArrow({ value }: { value: string }) {
  const numericStr = value.replace(/[^0-9.\-+]/g, "")
  const n = parseFloat(numericStr)
  if (isNaN(n) || Math.abs(n) < 0.005) {
    return <Minus className="h-3 w-3 text-muted-foreground shrink-0" />
  }
  if (n < 0) return <ArrowDown className="h-3 w-3 text-bank-green shrink-0" />
  return <ArrowUp className="h-3 w-3 text-primary shrink-0" />
}

function colorClass(value: string): string {
  const numericStr = value.replace(/[^0-9.\-+]/g, "")
  const n = parseFloat(numericStr)
  if (isNaN(n) || Math.abs(n) < 0.005) return "text-muted-foreground"
  return n < 0 ? "text-bank-green" : "text-primary"
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
              <th className="text-left px-3 py-2.5 font-semibold text-foreground border-b border-border whitespace-nowrap">
                业务指标
              </th>
              <th className="text-right px-3 py-2.5 font-semibold text-foreground border-b border-border whitespace-nowrap">
                业务量
              </th>
              <th className="text-right px-3 py-2.5 font-semibold text-foreground border-b border-border whitespace-nowrap">
                同比/较年初
              </th>
              {!isSummary && (
                <>
                  <th className="text-right px-3 py-2.5 font-semibold text-foreground border-b border-border whitespace-nowrap">
                    增速较全辖
                  </th>
                  <th className="text-center px-3 py-2.5 font-semibold text-foreground border-b border-border whitespace-nowrap">
                    排名
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const isEvenRow = index % 2 === 0
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
                      "px-3 py-2 border-b border-border text-foreground whitespace-nowrap",
                      row.indent === 0 ? "font-semibold" : "font-normal"
                    )}
                    style={{ paddingLeft: `${(row.indent ?? 0) * 20 + 12}px` }}
                  >
                    {row.name}
                  </td>

                  {/* Value + unit */}
                  <td className="px-3 py-2 border-b border-border text-right whitespace-nowrap">
                    <span className="tabular-nums text-foreground font-medium">{row.value}</span>
                    <span className="text-xs text-muted-foreground ml-1">{row.unit}</span>
                  </td>

                  {/* Comparison */}
                  <td className="px-3 py-2 border-b border-border text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">{row.comparisonType}</span>
                      <span className={cn("tabular-nums font-semibold text-sm", colorClass(row.comparison))}>
                        {row.comparison}
                      </span>
                      <ValueArrow value={row.comparison} />
                    </div>
                  </td>

                  {/* Growth vs national — hidden for summary */}
                  {!isSummary && (
                    <>
                      <td className="px-3 py-2 border-b border-border text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <span className={cn("tabular-nums font-medium text-sm", colorClass(row.growthVsAll))}>
                            {row.growthVsAll}
                          </span>
                          <ValueArrow value={row.growthVsAll} />
                        </div>
                      </td>
                      <td className="px-3 py-2 border-b border-border text-center whitespace-nowrap">
                        <span
                          className={cn(
                            "tabular-nums font-semibold text-sm",
                            row.growthRank <= 3 ? "text-primary" : row.growthRank >= 34 ? "text-bank-green" : "text-foreground"
                          )}
                        >
                          {row.growthRank}/36
                        </span>
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
