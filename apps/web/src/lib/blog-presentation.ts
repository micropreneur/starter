import { Blocks, BookOpen, Bot, type LucideIcon, ShieldCheck } from 'lucide-react'

const categoryIcons: Readonly<Record<string, LucideIcon>> = {
  Architecture: ShieldCheck,
  'Developer experience': Bot,
  Interface: Blocks,
}

export function getBlogCategoryIcon(category: string): LucideIcon {
  return categoryIcons[category] ?? BookOpen
}
