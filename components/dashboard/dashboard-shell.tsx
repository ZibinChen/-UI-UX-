"use client"

import { useState } from "react"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { FilterBar } from "./filter-bar"
import { TabNavigation } from "./tab-navigation"
import { CreditCardPanel } from "./panels/credit-card-panel"
import { ScrollArea } from "@/components/ui/scroll-area"

const mainTabs = [
  { id: "comprehensive", label: "综合经营计划" },
]

export function DashboardShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [activeMainTab, setActiveMainTab] = useState("comprehensive")
  const [activeSidebarItem, setActiveSidebarItem] = useState("assets")
  const [selectedInstitution, setSelectedInstitution] = useState("all")
  const [selectedDate, setSelectedDate] = useState("2026/02/12")

  return (
    <div className="h-dvh flex flex-col bg-background overflow-hidden">
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          activeItem={activeSidebarItem}
          onItemClick={setActiveSidebarItem}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          <FilterBar
            breadcrumb={["\u7ba1\u7406\u9a7e\u9a76\u8231", "\u7efc\u5408\u7ecf\u8425\u8ba1\u5212"]}
            selectedInstitution={selectedInstitution}
            selectedDate={selectedDate}
            onInstitutionChange={setSelectedInstitution}
            onDateChange={setSelectedDate}
          />

          {/* Main Tab Bar */}
          <div className="px-6 bg-card">
            <TabNavigation
              tabs={mainTabs}
              activeTab={activeMainTab}
              onTabChange={setActiveMainTab}
              variant="underline"
            />
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-6">
              {activeMainTab === "comprehensive" && (
                <CreditCardPanel
                  selectedInstitution={selectedInstitution}
                  selectedDate={selectedDate}
                />
              )}
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>
  )
}
