import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export default function Page() {
  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      {/* Phone Frame - iPhone 17 Pro Max dimensions (430x932) */}
      <div className="relative">
        {/* Phone outer frame */}
        <div className="w-[430px] h-[932px] bg-neutral-800 rounded-[55px] p-[12px] shadow-2xl border-[3px] border-neutral-700">
          {/* Phone inner bezel */}
          <div className="w-full h-full bg-neutral-900 rounded-[45px] overflow-hidden relative">
            {/* Dynamic Island */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[126px] h-[37px] bg-black rounded-full z-50" />
            
            {/* Screen content */}
            <div className="w-full h-full pt-[50px] pb-[5px]">
              <DashboardShell />
            </div>
            
            {/* Home indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[134px] h-[5px] bg-white/30 rounded-full" />
          </div>
        </div>
        
        {/* Side buttons - Volume */}
        <div className="absolute left-[-3px] top-[180px] w-[3px] h-[35px] bg-neutral-600 rounded-l" />
        <div className="absolute left-[-3px] top-[230px] w-[3px] h-[65px] bg-neutral-600 rounded-l" />
        <div className="absolute left-[-3px] top-[310px] w-[3px] h-[65px] bg-neutral-600 rounded-l" />
        
        {/* Side button - Power */}
        <div className="absolute right-[-3px] top-[250px] w-[3px] h-[100px] bg-neutral-600 rounded-r" />
      </div>
    </div>
  )
}
