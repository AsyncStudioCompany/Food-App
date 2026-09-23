import { PageHeader } from '../../components/PageHeader'

export function SuggestionsPage() {
  return (
    <>
      <PageHeader title="Que puis-je cuisiner ?" subtitle="Les recettes réalisables avec ce que vous avez." />
      <p className="rounded-xl bg-white p-4 text-stone-600 shadow-sm">
        Ajoutez des aliments dans votre frigo pour voir vos suggestions ici.
      </p>
    </>
  )
}
