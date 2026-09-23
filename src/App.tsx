import { Navigate, Route, Routes } from 'react-router'
import { BottomNav } from './components/BottomNav'
import { FridgePage } from './features/fridge/FridgePage'
import { PreferencesPage } from './features/preferences/PreferencesPage'
import { RecipePage } from './features/recipes/RecipePage'
import { RecipesPage } from './features/recipes/RecipesPage'
import { ResultsPage } from './features/results/ResultsPage'

export default function App() {
  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col">
      <main className="flex-1 px-4 pb-[calc(var(--safe-bottom)+10rem)]">
        <Routes>
          <Route path="/" element={<FridgePage />} />
          <Route path="/resultats" element={<ResultsPage />} />
          <Route path="/recherche" element={<RecipesPage />} />
          <Route path="/recette/:id" element={<RecipePage />} />
          <Route path="/preferences" element={<PreferencesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
