"use client"

import { ChevronDown, Building2, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { institutions, availableDates } from "@/lib/credit-card-data"

interface MobileFilterBarProps {
  selectedInstitution: string
  selectedDate: string
  onInstitutionChange: (id: string) => void
  onDateChange: (date: string) => void
}

export function MobileFilterBar({
  selectedInstitution,
  selectedDate,
  onInstitutionChange,
  onDateChange,
}: MobileFilterBarProps) {
  const currentInst = institutions.find((i) => i.id === selectedInstitution)

  return (
    <div className="px-3 py-2 bg-card border-b border-border shrink-0">
      <div className="flex items-center justify-between gap-2">
        {/* Institution selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs text-foreground bg-card border-border flex-1 justify-start"
            >
              <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="truncate" suppressHydrationWarning>{currentInst?.name ?? '选择机构'}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground ml-auto shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 max-h-[300px]">
            <ScrollArea className="h-[280px]">
              {institutions.map((inst) => (
                <DropdownMenuItem
                  key={inst.id}
                  className={
                    inst.id === selectedInstitution
                      ? "bg-primary/10 text-primary font-medium text-xs"
                      : "text-xs"
                  }
                  onSelect={() => onInstitutionChange(inst.id)}
                >
                  {inst.name}
                </DropdownMenuItem>
              ))}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Date selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs text-foreground bg-card border-border"
            >
              <CalendarDays className="h-3 w-3 text-muted-foreground" />
              <span className="whitespace-nowrap">{selectedDate}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36 max-h-[280px]">
            <ScrollArea className="h-[260px]">
              {availableDates.map((d) => (
                <DropdownMenuItem
                  key={d}
                  className={
                    d === selectedDate
                      ? "bg-primary/10 text-primary font-medium text-xs"
                      : "text-xs"
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
  )
}
