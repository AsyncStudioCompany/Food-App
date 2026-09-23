import { Navigate, Route, Routes } from 'react-router'
import { BottomNav } from './components/BottomNav'
import { FridgePage } from './features/fridge/FridgePage'
import { PreferencesPage } from './features/preferences/PreferencesPage'
import { RecipesPage } from './features/recipes/RecipesPage'
import { SuggestionsPage } from './features/suggestions/SuggestionsPage'

export default function App() {
  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col">
      <main className="flex-1 px-4 pt-6 pb-24">
        <Routes>
          <Route path="/" element={<SuggestionsPage />} />
          <Route path="/recettes" element={<RecipesPage />} />
          <Route path="/frigo" element={<FridgePage />} />
          <Route path="/profil" element={<PreferencesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
