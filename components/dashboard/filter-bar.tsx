"use client"

import { CalendarDays, ChevronDown, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { institutions, availableDates } from "@/lib/credit-card-data"

interface FilterBarProps {
  breadcrumb?: string[]
  selectedInstitution: string
  selectedDate: string
  onInstitutionChange: (id: string) => void
  onDateChange: (date: string) => void
}

export function FilterBar({
  breadcrumb,
  selectedInstitution,
  selectedDate,
  onInstitutionChange,
  onDateChange,
}: FilterBarProps) {
  const currentInst = institutions.find((i) => i.id === selectedInstitution)
  const items = breadcrumb ?? []

  return (
    <div className="px-6 py-3 border-b border-border bg-card">
      {/* Breadcrumb - rendered client-only to avoid SSR encoding issues with CJK */}
      {items.length > 0 && (
        <p className="text-xs text-muted-foreground mb-2" suppressHydrationWarning>
          {items.map((item, index) => (
            <span key={index} suppressHydrationWarning>
              {index > 0 && <span className="mx-1">{'/'}</span>}
              <span
                suppressHydrationWarning
                className={index === items.length - 1 ? "text-foreground" : ""}
              >
                {item}
              </span>
            </span>
          ))}
        </p>
      )}

      {/* Filter row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground font-medium" suppressHydrationWarning>
              {'机构选择'}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-sm text-foreground bg-card border-border"
                >
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span suppressHydrationWarning>{currentInst?.name ?? '请选择机构'}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 max-h-[420px]">
                <ScrollArea className="h-[400px]">
                  {institutions.map((inst) => (
                    <DropdownMenuItem
                      key={inst.id}
                      className={
                        inst.id === selectedInstitution
                          ? "bg-primary/10 text-primary font-medium"
                          : ""
                      }
                      onSelect={() => onInstitutionChange(inst.id)}
                    >
                      {inst.name}
                    </DropdownMenuItem>
                  ))}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground" suppressHydrationWarning>
            {'统计截至：'}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-sm text-foreground bg-card border-border"
              >
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                {selectedDate}
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 max-h-[320px]">
              <ScrollArea className="h-[300px]">
                {availableDates.map((d) => (
                  <DropdownMenuItem
                    key={d}
                    className={
                      d === selectedDate
                        ? "bg-primary/10 text-primary font-medium"
                        : ""
                    }
                    onSelect={() => onDateChange(d)}
                  >
                    {d}
                  </DropdownMenuItem>
                ))}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
