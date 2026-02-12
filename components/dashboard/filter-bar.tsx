"use client"

import { CalendarDays, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FilterBarProps {
  breadcrumb?: string[]
  institution?: string
  date?: string
}

export function FilterBar({
  breadcrumb = ["管理驾驶舱", "信用卡经营"],
  institution = "境内分支机构汇总",
  date = "2026/02/12",
}: FilterBarProps) {
  return (
    <div className="px-6 py-3 border-b border-border bg-card">
      {/* Breadcrumb */}
      <div className="text-xs text-muted-foreground mb-2">
        {breadcrumb.map((item, index) => (
          <span key={item}>
            {index > 0 && <span className="mx-1">{'/'}</span>}
            <span className={index === breadcrumb.length - 1 ? "text-foreground" : ""}>
              {item}
            </span>
          </span>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground font-medium">机构选择</span>
            <Button variant="outline" size="sm" className="h-8 gap-1 text-sm text-foreground bg-card border-border">
              {institution}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">统计截至：</span>
          <Button variant="outline" size="sm" className="h-8 gap-1 text-sm text-foreground bg-card border-border">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            {date}
          </Button>
        </div>
      </div>
    </div>
  )
}
