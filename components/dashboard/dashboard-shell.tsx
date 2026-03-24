"use client"

import { useState } from "react"
import { MobileHeader } from "./mobile-header"
import { MobileFilterBar } from "./mobile-filter-bar"
import { MobileTabNavigation } from "./mobile-tab-navigation"
import { MobileBottomNav } from "./mobile-bottom-nav"
import { CreditCardPanel } from "./panels/credit-card-panel"
import { KeyCustomerPanel } from "./panels/key-customer-panel"
import { CrossSellPanel } from "./panels/cross-sell-panel"
import { FourCustomerGroupPanel } from "./panels/four-customer-group-panel"

const mainTabs = [
  { id: "comprehensive", label: '综合经营计划' },
  { id: "key-customer", label: '信用卡重点客群' },
  { id: "cross-sell", label: '交叉销售' },
  { id: "four-customer", label: '对私折效四大客群' },
]

export function DashboardShell() {
  const [activeMainTab, setActiveMainTab] = useState("comprehensive")
  const [activeNavItem, setActiveNavItem] = useState("dashboard")
  const [selectedInstitution, setSelectedInstitution] = useState("all")
  const [selectedDate, setSelectedDate] = useState("2026/02/12")

  return (
    // Mobile phone frame wrapper - centered on screen
    <div className="min-h-screen bg-neutral-800 flex items-center justify-center p-4">
      {/* Phone frame */}
      <div className="w-[375px] h-[812px] bg-background rounded-[40px] overflow-hidden shadow-2xl border-[8px] border-neutral-900 relative flex flex-col">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[28px] bg-neutral-900 rounded-b-2xl z-50" />
        
        {/* Status bar spacer */}
        <div className="h-11 bg-card shrink-0" />

        {/* Header */}
        <MobileHeader />

        {/* Filter Bar */}
        <MobileFilterBar
          selectedInstitution={selectedInstitution}
          selectedDate={selectedDate}
          onInstitutionChange={setSelectedInstitution}
          onDateChange={setSelectedDate}
        />

        {/* Main Tab Bar */}
        <MobileTabNavigation
          tabs={mainTabs}
          activeTab={activeMainTab}
          onTabChange={setActiveMainTab}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-3 py-3">
            {activeMainTab === "comprehensive" && (
              <CreditCardPanel
                selectedInstitution={selectedInstitution}
                selectedDate={selectedDate}
              />
            )}
            {activeMainTab === "key-customer" && (
              <KeyCustomerPanel
                selectedInstitution={selectedInstitution}
                selectedDate={selectedDate}
              />
            )}
            {activeMainTab === "cross-sell" && (
              <CrossSellPanel
                selectedInstitution={selectedInstitution}
                selectedDate={selectedDate}
              />
            )}
            {activeMainTab === "four-customer" && (
              <FourCustomerGroupPanel
                selectedInstitution={selectedInstitution}
                selectedDate={selectedDate}
              />
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        <MobileBottomNav
          activeItem={activeNavItem}
          onItemClick={setActiveNavItem}
        />

        {/* Home indicator */}
        <div className="h-5 bg-card flex items-center justify-center shrink-0">
          <div className="w-[134px] h-[5px] bg-foreground/20 rounded-full" />
        </div>
      </div>
    </div>
  )
}
