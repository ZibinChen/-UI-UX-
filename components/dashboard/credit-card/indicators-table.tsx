"use client"

import { cn } from "@/lib/utils"
import { ArrowUp, ArrowDown, Minus } from "lucide-react"
import type { IndicatorRow } from "@/lib/credit-card-data"

interface IndicatorsTableProps {
  data: IndicatorRow[]
  title?: string
  isSummary?: boolean
}

function ValueArrow({ raw }: { raw: number }) {
  if (Math.abs(raw) < 0.001) {
    return <Minus className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
  }
  if (raw < 0) return <ArrowDown className="h-2.5 w-2.5 text-bank-green shrink-0" />
  return <ArrowUp className="h-2.5 w-2.5 text-primary shrink-0" />
}

function colorClass(raw: number): string {
  if (Math.abs(raw) < 0.001) return "text-muted-foreground"
  return raw < 0 ? "text-bank-green" : "text-primary"
}

export function IndicatorsTable({ data, title, isSummary = false }: IndicatorsTableProps) {
  return (
    <div className="bg-card rounded border border-border overflow-hidden">
      {title && (
        <div className="px-2 py-1.5 border-b border-border">
          <h3 className="text-[10px] font-semibold text-foreground">{title}</h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] border-collapse min-w-[280px]">
          <thead>
            <tr className="bg-muted">
              <th className="text-left px-1.5 py-1.5 font-semibold text-foreground border-b border-border whitespace-nowrap min-w-[80px]">
                指标
              </th>
              <th className="text-right px-1.5 py-1.5 font-semibold text-foreground border-b border-border whitespace-nowrap min-w-[60px]">
                业务量
              </th>
              <th className="text-right px-1.5 py-1.5 font-semibold text-foreground border-b border-border whitespace-nowrap min-w-[50px]">
                同比
              </th>
              {!isSummary && (
                <>
                  <th className="text-right px-1.5 py-1.5 font-semibold text-foreground border-b border-border whitespace-nowrap min-w-[45px]">
                    较全辖
                  </th>
                  <th className="text-center px-1.5 py-1.5 font-semibold text-foreground border-b border-border whitespace-nowrap min-w-[35px]">
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
                    "transition-colors",
                    isEvenRow ? "bg-card" : "bg-muted/30"
                  )}
                >
                  {/* Indicator name */}
                  <td
                    className={cn(
                      "px-1.5 py-1 border-b border-border text-foreground whitespace-nowrap",
                      row.indent === 0 ? "font-semibold" : "font-normal"
                    )}
                    style={{ paddingLeft: `${(row.indent ?? 0) * 10 + 6}px` }}
                  >
                    {row.name}
                  </td>

                  {/* Value + unit */}
                  <td className="px-1.5 py-1 border-b border-border text-right whitespace-nowrap">
                    <span className="tabular-nums text-foreground font-medium">{row.value}</span>
                    <span className="text-[9px] text-muted-foreground ml-0.5">{row.unit}</span>
                  </td>

                  {/* Comparison */}
                  <td className="px-1.5 py-1 border-b border-border text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-0.5">
                      <span className={cn("tabular-nums font-semibold", colorClass(row.comparisonRaw))}>
                        {row.comparison}
                      </span>
                      <ValueArrow raw={row.comparisonRaw} />
                    </div>
                  </td>

                  {/* Growth vs national + rank — only for branch view */}
                  {!isSummary && (
                    <>
                      <td className="px-1.5 py-1 border-b border-border text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-0.5">
                          <span className={cn("tabular-nums font-medium", colorClass(row.growthVsAllRaw))}>
                            {row.growthVsAll}
                          </span>
                          <ValueArrow raw={row.growthVsAllRaw} />
                        </div>
                      </td>
                      <td className="px-1.5 py-1 border-b border-border text-center whitespace-nowrap">
                        <span
                          className={cn(
                            "tabular-nums font-semibold",
                            row.growthRank <= 3
                              ? "text-primary"
                              : row.growthRank >= 34
                                ? "text-bank-green"
                                : "text-foreground"
                          )}
                        >
                          {row.growthRank}
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
