'use client'

import type React from 'react'
import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { Button, Select, SelectItem } from '@/shared/ui/primitives'
import { FormField } from '@/shared/ui/patterns'
import { moveAssetToFolderAction } from '../admin/folder-actions'

const NO_FOLDER_VALUE = '__none__'

export interface MediaFolderPickerProps {
  assetId: string
  /**
   * The asset's current folder id. `null` means "Non classés".
   */
  currentFolderId: string | null
  folders: ReadonlyArray<{ id: string; name: string }>
}

/**
 * Standalone folder picker on /admin/media/[id]. Calls the server action
 * directly via useTransition — kept separate from the alt-text form so a
 * folder change doesn't trigger an alt-text revalidation, and vice versa.
 *
 * `__none__` sentinel: Radix Select forbids empty-string item values, so
 * we round-trip via a sentinel and translate back to `null` before the
 * server call.
 */
export function MediaFolderPicker({
  assetId,
  currentFolderId,
  folders,
}: MediaFolderPickerProps): React.JSX.Element {
  const initialValue = currentFolderId ?? NO_FOLDER_VALUE
  const [value, setValue] = useState<string>(initialValue)
  const [savedValue, setSavedValue] = useState<string>(initialValue)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const dirty = value !== savedValue

  const onSave = (): void => {
    setError(null)
    startTransition(async () => {
      const folderId = value === NO_FOLDER_VALUE ? null : value
      const result = await moveAssetToFolderAction(assetId, folderId)
      if (!result.ok) {
        setError(result.error ?? 'Échec du déplacement.')
        return
      }
      setSavedValue(value)
    })
  }

  return (
    <div className="space-y-3">
      <FormField
        label="Dossier"
        htmlFor="media-folder"
        hint={
          folders.length === 0
            ? "Aucun dossier disponible. Créez-en un depuis la médiathèque."
            : 'Choisissez le dossier dans lequel ce média est rangé.'
        }
      >
        <Select
          id="media-folder"
          name="folderId"
          value={value}
          onValueChange={setValue}
          disabled={isPending}
        >
          <SelectItem value={NO_FOLDER_VALUE}>Non classé</SelectItem>
          {folders.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              {f.name}
            </SelectItem>
          ))}
        </Select>
      </FormField>

      {error !== null ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button
          intent="primary"
          type="button"
          onClick={onSave}
          disabled={!dirty || isPending}
          leadingIcon={isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : undefined}
        >
          {isPending ? 'Déplacement…' : 'Déplacer'}
        </Button>
      </div>
    </div>
  )
}
