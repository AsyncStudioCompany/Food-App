import { PageHeader } from '../../components/PageHeader'

export function PreferencesPage() {
  return (
    <>
      <PageHeader title="Profil" subtitle="Régime, allergies, goûts et placard de base." />
      <p className="rounded-xl bg-white p-4 text-stone-600 shadow-sm">Les préférences arrivent bientôt.</p>
    </>
  )
}
