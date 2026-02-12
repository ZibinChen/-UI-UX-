"use client"

import { useState } from "react"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { FilterBar } from "./filter-bar"
import { TabNavigation } from "./tab-navigation"
import { AssetsPanel } from "./panels/assets-panel"
import { CustomersPanel } from "./panels/customers-panel"
import { PlaceholderPanel } from "./panels/placeholder-panel"
import { ScrollArea } from "@/components/ui/scroll-area"

const mainTabs = [
  { id: "assets", label: "资产负债" },
  { id: "customers", label: "客户基础" },
  { id: "performance", label: "经营效益" },
  { id: "quality", label: "资产质量" },
]

export function DashboardShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [activeMainTab, setActiveMainTab] = useState("assets")
  const [activeSidebarItem, setActiveSidebarItem] = useState("assets")

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
          <FilterBar />

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
              {activeMainTab === "assets" && <AssetsPanel />}
              {activeMainTab === "customers" && <CustomersPanel />}
              {activeMainTab === "performance" && <PlaceholderPanel title="经营效益" />}
              {activeMainTab === "quality" && <PlaceholderPanel title="资产质量" />}
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>
  )
}
