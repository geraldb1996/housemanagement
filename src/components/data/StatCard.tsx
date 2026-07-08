import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { type LucideIcon } from "lucide-react"

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  onClick,
}: {
  title: string
  value: string
  subtitle?: string
  icon?: LucideIcon
  trend?: "up" | "down" | "neutral"
  className?: string
  onClick?: () => void
}) {
  return (
    <Card
      className={cn("transition-shadow hover:shadow-md", onClick && "cursor-pointer", className)}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && (
          <div
            className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center",
              trend === "up" && "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600",
              trend === "down" && "bg-red-100 dark:bg-red-900/30 text-red-600",
              trend === "neutral" && "bg-muted text-muted-foreground",
              !trend && "bg-muted text-muted-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}
