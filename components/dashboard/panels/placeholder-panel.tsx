"use client"

interface PlaceholderPanelProps {
  title: string
}

export function PlaceholderPanel({ title }: PlaceholderPanelProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] text-muted-foreground text-sm">
      <div className="text-center">
        <p className="text-lg font-medium text-foreground mb-2">{title}</p>
        <p>此页面内容待配置，请提供具体展示内容</p>
      </div>
    </div>
  )
}
