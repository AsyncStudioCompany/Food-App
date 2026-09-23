import { Navigate, Route, Routes, useLocation } from 'react-router'
import { useAccount } from './account/account'
import { FridgeScreen } from './screens/FridgeScreen'
import { ListDetailScreen, ListsScreen } from './screens/ListsScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { RecipeScreen } from './screens/RecipeScreen'
import { ResultsScreen } from './screens/ResultsScreen'
import { SearchScreen } from './screens/SearchScreen'
import { Celebration } from './screens/Celebration'
import { Onboarding } from './screens/Onboarding'
import { Welcome } from './screens/Welcome'
import { useLoadPhotos } from './state/photos'
import { useAllRecipes } from './state/recipes'
import { useStore } from './state/store'
import { TabBar } from './ui/TabBar'

export default function App() {
  useLoadPhotos(useAllRecipes())
  const { pathname } = useLocation()
  const toast = useStore((s) => s.toast)
  const account = useAccount()
  const onboarded = useStore((s) => s.prefs.onboarded)

  // Signed out: only the way in, no recipes. Without an account server, a local profile does the job.
  if (account.status === 'loading') return <div className="app" />
  const inside = account.status === 'signedIn' || (account.status === 'unavailable' && onboarded)
  if (!inside)
    return (
      <div className="app">
        <Welcome />
      </div>
    )
  if (!onboarded)
    return (
      <div className="app">
        <Onboarding />
      </div>
    )

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<FridgeScreen />} />
        <Route path="/recettes" element={<ResultsScreen />} />
        <Route path="/chercher" element={<SearchScreen />} />
        <Route path="/listes" element={<ListsScreen />} />
        <Route path="/listes/:id" element={<ListDetailScreen />} />
        <Route path="/profil" element={<ProfileScreen />} />
        <Route path="/recette/:id" element={<RecipeScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {/* Hidden on the recipe page, like in the design. */}
      {!pathname.startsWith('/recette/') && <TabBar />}
      <Celebration />
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
