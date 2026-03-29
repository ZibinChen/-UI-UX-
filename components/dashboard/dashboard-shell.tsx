"use client"

import { useState } from "react"
import { Bell, User, Building2, CalendarDays, ChevronDown, LayoutDashboard, BarChart3, Users, TrendingUp, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { CreditCardPanel } from "./panels/credit-card-panel"
import { KeyCustomerPanel } from "./panels/key-customer-panel"
import { CrossSellPanel } from "./panels/cross-sell-panel"
import { FourCustomerGroupPanel } from "./panels/four-customer-group-panel"
import { institutions, availableDates } from "@/lib/credit-card-data"

const mainTabs = [
  { id: "comprehensive", label: '综合经营计划' },
  { id: "key-customer", label: '信用卡重点客群' },
  { id: "cross-sell", label: '交叉销售' },
  { id: "four-customer", label: '对私折效四大客群' },
]

const bottomNavItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "驾驶舱" },
  { id: "assets", icon: BarChart3, label: "资产" },
  { id: "customers", icon: Users, label: "客户" },
  { id: "performance", icon: TrendingUp, label: "效益" },
  { id: "quality", icon: FileText, label: "质量" },
]

export function DashboardShell() {
  const [activeMainTab, setActiveMainTab] = useState("comprehensive")
  const [activeNavItem, setActiveNavItem] = useState("assets")
  const [selectedInstitution, setSelectedInstitution] = useState("all")
  const [selectedDate, setSelectedDate] = useState("2026/02/12")

  const currentInst = institutions.find((i) => i.id === selectedInstitution)

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Mobile Header */}
      <header className="h-10 border-b border-border bg-card flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-[10px] font-bold">B</span>
          </div>
          <span className="text-xs font-semibold text-foreground">管理驾驶舱</span>
        </div>
        <div className="flex items-center gap-1">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="消息">
            <Bell className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      </header>

      {/* Mobile Filter Bar - Compact horizontal layout */}
      <div className="px-2 py-1.5 border-b border-border bg-card flex items-center gap-1.5 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-6 gap-0.5 text-[10px] flex-1 max-w-[120px] px-1.5">
              <Building2 className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
              <span className="truncate">{currentInst?.name ?? '选择机构'}</span>
              <ChevronDown className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 max-h-[300px]">
            <ScrollArea className="h-[280px]">
              {institutions.map((inst) => (
                <DropdownMenuItem
                  key={inst.id}
                  className={cn("text-xs", inst.id === selectedInstitution && "bg-primary/10 text-primary font-medium")}
                  onSelect={() => setSelectedInstitution(inst.id)}
                >
                  {inst.name}
                </DropdownMenuItem>
              ))}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-6 gap-0.5 text-[10px] px-1.5">
              <CalendarDays className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
              <span>{selectedDate}</span>
              <ChevronDown className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36 max-h-[250px]">
            <ScrollArea className="h-[230px]">
              {availableDates.map((d) => (
                <DropdownMenuItem
                  key={d}
                  className={cn("text-xs", d === selectedDate && "bg-primary/10 text-primary font-medium")}
                  onSelect={() => setSelectedDate(d)}
                >
                  {d}
                </DropdownMenuItem>
              ))}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile Tab Navigation - Horizontal scroll */}
      <div className="border-b border-border bg-card shrink-0">
        <div className="flex overflow-x-auto scrollbar-hide">
          {mainTabs.map((tab) => {
            const isActive = activeMainTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMainTab(tab.id)}
                className={cn(
                  "px-2 py-2 text-[10px] font-medium whitespace-nowrap relative shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content - Scrollable */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {activeMainTab === "comprehensive" && (
            <CreditCardPanel selectedInstitution={selectedInstitution} selectedDate={selectedDate} />
          )}
          {activeMainTab === "key-customer" && (
            <KeyCustomerPanel selectedInstitution={selectedInstitution} selectedDate={selectedDate} />
          )}
          {activeMainTab === "cross-sell" && (
            <CrossSellPanel selectedInstitution={selectedInstitution} selectedDate={selectedDate} />
          )}
          {activeMainTab === "four-customer" && (
            <FourCustomerGroupPanel selectedInstitution={selectedInstitution} selectedDate={selectedDate} />
          )}
        </div>
      </ScrollArea>

      {/* Bottom Navigation */}
      <nav className="h-[48px] border-t border-border bg-card flex items-center justify-around shrink-0 px-1 pb-0.5">
        {bottomNavItems.map((item) => {
          const isActive = activeNavItem === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveNavItem(item.id)}
              className={cn(
                "flex flex-col items-center gap-0 py-0.5 px-1.5 rounded transition-colors min-w-[44px]",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="text-[9px]">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
