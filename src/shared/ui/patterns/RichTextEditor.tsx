'use client'

import type React from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Quote,
  Undo2,
  Redo2,
} from 'lucide-react'
import { cn } from '@/shared/ui/utils/cn'

/**
 * Minimal rich-text editor on TipTap (StarterKit).
 *
 * Supported marks/blocks (StarterKit defaults):
 *   - Bold, Italic, Strike, Code, Code block
 *   - H1-H3, paragraph
 *   - Bullet/Ordered lists, blockquote, horizontal rule
 *   - Undo/Redo
 *
 * The component is uncontrolled by default (initial `value`, emits HTML
 * via `onChange`). For most form usage, this is enough — the parent
 * stores the latest HTML in its own state and submits it.
 *
 *   <RichTextEditor value={html} onChange={setHtml} />
 */

export interface RichTextEditorProps {
  /** Initial HTML content. Updates after mount are not synced — set `key` to force remount. */
  value?: string
  /** Called with the current HTML on every change. */
  onChange?: (html: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  /** Min height of the content area. Default 'min-h-[180px]'. */
  contentClassName?: string
  /** Optional id for the content area (use with a label htmlFor). */
  id?: string
}

export function RichTextEditor({
  value = '',
  onChange,
  disabled = false,
  className,
  contentClassName,
  id,
}: RichTextEditorProps): React.JSX.Element {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getHTML())
    },
    editorProps: {
      attributes: {
        ...(id !== undefined ? { id } : {}),
        class: cn(
          'prose prose-sm max-w-none p-3 outline-none',
          'min-h-[180px]',
          contentClassName,
        ),
      },
    },
  })

  return (
    <div
      className={cn(
        'rounded-md border border-border bg-surface text-foreground',
        'focus-within:border-primary focus-within:ring-2 focus-within:ring-offset-1',
        disabled && 'pointer-events-none opacity-60',
        className,
      )}
    >
      <Toolbar editor={editor} />
      <div className="border-t border-border">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

interface ToolbarProps {
  editor: Editor | null
}

function Toolbar({ editor }: ToolbarProps): React.JSX.Element {
  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex flex-wrap items-center gap-1 px-2 py-1.5"
    >
      <ToolButton
        label="Bold"
        active={editor?.isActive('bold') ?? false}
        disabled={!editor?.can().chain().focus().toggleBold().run()}
        onClick={() => editor?.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        label="Italic"
        active={editor?.isActive('italic') ?? false}
        disabled={!editor?.can().chain().focus().toggleItalic().run()}
        onClick={() => editor?.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        label="Strikethrough"
        active={editor?.isActive('strike') ?? false}
        disabled={!editor?.can().chain().focus().toggleStrike().run()}
        onClick={() => editor?.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </ToolButton>
      <Separator />
      <ToolButton
        label="Heading 2"
        active={editor?.isActive('heading', { level: 2 }) ?? false}
        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        label="Heading 3"
        active={editor?.isActive('heading', { level: 3 }) ?? false}
        onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="h-4 w-4" />
      </ToolButton>
      <Separator />
      <ToolButton
        label="Bullet list"
        active={editor?.isActive('bulletList') ?? false}
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        label="Ordered list"
        active={editor?.isActive('orderedList') ?? false}
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        label="Quote"
        active={editor?.isActive('blockquote') ?? false}
        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        label="Code block"
        active={editor?.isActive('codeBlock') ?? false}
        onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
      >
        <Code className="h-4 w-4" />
      </ToolButton>
      <Separator />
      <ToolButton
        label="Undo"
        disabled={!editor?.can().chain().focus().undo().run()}
        onClick={() => editor?.chain().focus().undo().run()}
      >
        <Undo2 className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        label="Redo"
        disabled={!editor?.can().chain().focus().redo().run()}
        onClick={() => editor?.chain().focus().redo().run()}
      >
        <Redo2 className="h-4 w-4" />
      </ToolButton>
    </div>
  )
}

interface ToolButtonProps {
  label: string
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  children: React.ReactNode
}

function ToolButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: ToolButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded-sm text-muted-fg transition-colors duration-fast',
        'hover:bg-muted hover:text-foreground',
        active && 'bg-muted text-foreground',
        'disabled:pointer-events-none disabled:opacity-40',
      )}
    >
      {children}
    </button>
  )
}

function Separator(): React.JSX.Element {
  return <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
}
