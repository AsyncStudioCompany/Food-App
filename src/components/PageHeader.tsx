export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      {subtitle && <p className="mt-1 text-stone-600">{subtitle}</p>}
    </header>
  )
}
