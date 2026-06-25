import {
  LayoutDashboard,
  Database,
  Tags,
  FileText,
  Settings,
  Sparkles,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

const navItems = [
  {
    to: '/',
    label: '概览',
    icon: LayoutDashboard,
  },
  {
    to: '/datasets',
    label: '数据集',
    icon: Database,
  },
  {
    to: '/templates/annotation',
    label: '标注模版',
    icon: Tags,
  },
  {
    to: '/templates/prompts',
    label: 'Prompt 模版',
    icon: FileText,
  },
  {
    to: '/settings/llm',
    label: 'LLM 设置',
    icon: Settings,
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex h-screen w-64 flex-col border-r border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
          <Sparkles className="h-4 w-4 text-background" />
        </div>
        <span className="font-semibold">标注平台</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-secondary text-secondary-foreground'
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <div className="text-xs text-muted-foreground">
          v1.0.0 · 本地存储
        </div>
      </div>
    </aside>
  )
}
