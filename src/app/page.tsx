// Home page — minimal placeholder confirming the platform is running.
// Real page content will live in src/client/pages/ and be imported here.
// No business logic. No database. No auth.
export default function HomePage(): React.JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">BSCore</h1>
      <p className="text-lg text-muted-fg">Platform is running.</p>
    </main>
  )
}
