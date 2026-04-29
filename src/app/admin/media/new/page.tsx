import type React from 'react'
import { AdminPageHeader } from '@/shared/ui/admin'
import { MediaUploadForm } from '@/modules/media/components/MediaUploadForm'

export default function UploadMediaPage(): React.JSX.Element {
  return (
    <div className="max-w-xl">
      <AdminPageHeader
        title="Upload media"
        description="Add an image to the library. Supabase Storage handles the file; the database stores metadata."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Media', href: '/admin/media' },
          { label: 'Upload' },
        ]}
      />
      <MediaUploadForm />
    </div>
  )
}
