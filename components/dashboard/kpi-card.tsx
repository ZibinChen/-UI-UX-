"use client"

import { Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface KpiCardProps {
  label: string
  value: string
  growth?: string
  growthLabel?: string
  tooltip?: string
}

export function KpiCard({ label, value, growth, growthLabel = "增速", tooltip }: KpiCardProps) {
  const isPositive = growth ? !growth.startsWith("-") : true

  return (
    <div className="flex flex-col gap-1 min-w-[140px]">
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        {tooltip && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[240px] text-xs bg-foreground text-background">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="flex items-baseline gap-3">
        <span className="text-xl font-bold text-foreground tabular-nums">{value}</span>
        {growth && (
          <div className="flex flex-col items-start">
            <span className="text-xs text-muted-foreground">{growthLabel}</span>
            <span
              className={cn(
                "text-sm font-semibold tabular-nums",
                isPositive ? "text-primary" : "text-bank-green"
              )}
            >
              {growth}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
