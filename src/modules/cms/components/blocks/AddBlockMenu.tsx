'use client'

import type React from 'react'
import { AlignLeft, Image as ImageIcon, LayoutGrid, Megaphone, Plus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/shared/ui/patterns'
import { BLOCK_TYPE_META, type BlockType } from '../../domain/blocks'

const TYPE_ORDER: ReadonlyArray<BlockType> = ['hero', 'text', 'gallery', 'cta']

const ICONS: Record<BlockType, React.ComponentType<{ className?: string }>> = {
  hero: ImageIcon,
  text: AlignLeft,
  gallery: LayoutGrid,
  cta: Megaphone,
}

export interface AddBlockMenuProps {
  onPick: (type: BlockType) => void
}

/**
 * Dropdown that appears when clicking the "+ Ajouter un bloc" button at
 * the bottom of the BlockList. Lists the available block types with an
 * icon, label, and one-line description.
 */
export function AddBlockMenu({ onPick }: AddBlockMenuProps): React.JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border bg-surface-elevated px-4 py-3 text-sm font-medium text-muted-fg transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-accent-text"
        >
          <Plus className="h-3.5 w-3.5" /> Ajouter un bloc
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="min-w-[280px]">
        <DropdownMenuLabel>Choisir un type de bloc</DropdownMenuLabel>
        {TYPE_ORDER.map((type) => {
          const meta = BLOCK_TYPE_META[type]
          const Icon = ICONS[type]
          return (
            <DropdownMenuItem key={type} onSelect={() => onPick(type)}>
              <span className="mr-2 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-fg">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium text-foreground">
                  {meta.label}
                </span>
                <span className="block text-[11px] text-muted-fg">
                  {meta.description}
                </span>
              </span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
