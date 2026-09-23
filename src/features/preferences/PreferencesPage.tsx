import type { ReactNode } from 'react'
import { AppHeader } from '../../components/AppHeader'
import { updatePreferences, usePreferences } from '../../data/preferencesStore'
import { ALLERGENS, CUISINES, type Allergen, type Diet } from '../../domain/types'
import { CUISINE_LABELS, DIET_LABELS, TAG_LABELS } from '../recipes/labels'

const ALLERGEN_LABELS: Record<Allergen, string> = {
  gluten: 'Gluten',
  lactose: 'Lactose',
  eggs: 'Œufs',
  peanuts: 'Arachides',
  tree_nuts: 'Fruits à coque',
  fish: 'Poisson',
  crustaceans: 'Crustacés',
  molluscs: 'Mollusques',
  soy: 'Soja',
  sesame: 'Sésame',
  celery: 'Céleri',
  mustard: 'Moutarde',
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

function Option({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-10 rounded-full px-4 text-sm font-medium ${
        active ? 'bg-stone-50 text-stone-950' : 'border border-stone-800 bg-stone-900 text-stone-200'
      }`}
    >
      {children}
    </button>
  )
}

function Section({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="font-semibold">{title}</h2>
      <p className="mb-3 text-sm text-stone-400">{hint}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  )
}

export function PreferencesPage() {
  const preferences = usePreferences()
  return (
    <>
      <AppHeader />
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">
        Préférences <span className="text-stone-500">de popote.</span>
      </h1>

      <Section title="Régime" hint="Les recettes incompatibles sont masquées.">
        {(Object.keys(DIET_LABELS) as Diet[]).map((diet) => (
          <Option key={diet} active={preferences.diet === diet} onClick={() => updatePreferences({ diet })}>
            {DIET_LABELS[diet]}
          </Option>
        ))}
        <Option active={preferences.excludePork} onClick={() => updatePreferences({ excludePork: !preferences.excludePork })}>
          Sans porc
        </Option>
      </Section>

      <Section title="Allergies et intolérances" hint="Aucune recette qui en contient ne sera proposée.">
        {ALLERGENS.map((allergen) => (
          <Option
            key={allergen}
            active={preferences.allergens.includes(allergen)}
            onClick={() => updatePreferences({ allergens: toggle(preferences.allergens, allergen) })}
          >
            {ALLERGEN_LABELS[allergen]}
          </Option>
        ))}
      </Section>

      <Section title="Cuisines préférées" hint="Elles remontent en tête des suggestions.">
        {CUISINES.map((cuisine) => (
          <Option
            key={cuisine}
            active={preferences.favoriteCuisines.includes(cuisine)}
            onClick={() => updatePreferences({ favoriteCuisines: toggle(preferences.favoriteCuisines, cuisine) })}
          >
            {CUISINE_LABELS[cuisine]}
          </Option>
        ))}
      </Section>

      <Section title="Ce que j'aime" hint="Un petit coup de pouce dans le classement.">
        {Object.entries(TAG_LABELS).map(([tag, label]) => (
          <Option
            key={tag}
            active={preferences.favoriteTags.includes(tag)}
            onClick={() => updatePreferences({ favoriteTags: toggle(preferences.favoriteTags, tag) })}
          >
            {label}
          </Option>
        ))}
      </Section>
    </>
  )
}
