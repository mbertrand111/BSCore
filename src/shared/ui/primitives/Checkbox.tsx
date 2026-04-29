'use client'

import type React from 'react'
import * as RadixCheckbox from '@radix-ui/react-checkbox'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/shared/ui/utils/cn'

export type CheckboxState = 'default' | 'error'

/**
 * Accessible checkbox built on Radix.
 *
 * Supports:
 *   - controlled (`checked` + `onCheckedChange`) and uncontrolled (`defaultChecked`)
 *   - indeterminate state via `checked='indeterminate'`
 *   - native form participation via `name` + `value`
 *   - error visual via `state='error'`
 */
export interface CheckboxProps {
  checked?: boolean | 'indeterminate'
  defaultChecked?: boolean | 'indeterminate'
  onCheckedChange?: (checked: boolean | 'indeterminate') => void
  disabled?: boolean
  required?: boolean
  name?: string
  value?: string
  id?: string
  state?: CheckboxState
  className?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  'data-testid'?: string
}

const STATE_CLASSES: Record<CheckboxState, string> = {
  default: 'border-border data-[state=checked]:border-primary',
  error:   'border-destructive data-[state=checked]:border-destructive',
}

export function Checkbox({
  state = 'default',
  className,
  ...rest
}: CheckboxProps): React.JSX.Element {
  return (
    <RadixCheckbox.Root
      className={cn(
        'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border bg-surface transition-colors duration-base',
        'data-[state=checked]:bg-primary data-[state=checked]:text-primary-fg',
        'data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-fg',
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
        STATE_CLASSES[state],
        className,
      )}
      {...rest}
    >
      <RadixCheckbox.Indicator className="inline-flex items-center justify-center">
        {rest.checked === 'indeterminate' ? (
          <Minus className="h-3.5 w-3.5" strokeWidth={3} />
        ) : (
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        )}
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  )
}
