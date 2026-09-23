import { PageHeader } from '../../components/PageHeader'

export function FridgePage() {
  return (
    <>
      <PageHeader title="Mon frigo" subtitle="Ce que vous avez chez vous, avec les quantités." />
      <p className="rounded-xl bg-white p-4 text-stone-600 shadow-sm">Votre frigo est vide pour l'instant.</p>
    </>
  )
}
