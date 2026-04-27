import type React from 'react'

export default function AdminPage(): React.JSX.Element {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Welcome</h1>
      <p className="mt-2 text-sm text-muted-fg">
        Select an item from the sidebar to get started.
      </p>
    </div>
  )
}
