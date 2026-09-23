import { useNavigate } from 'react-router'

export function Brand() {
  return (
    <div className="brand">
      <span className="brand__dot" aria-hidden="true" />
      <span className="brand__name">mijote</span>
    </div>
  )
}

/** Logo on the left (with an optional back button), search and profile buttons on the right. */
export function BrandBar({ back }: { back?: string }) {
  const navigate = useNavigate()
  return (
    <div className="brandbar">
      <div className="brandbar__left">
        {back && (
          <button type="button" className="round-btn" onClick={() => navigate(back)} aria-label="Retour">
            ←
          </button>
        )}
        <Brand />
      </div>
      <div className="brandbar__right">
        <button type="button" className="round-btn" onClick={() => navigate('/chercher')} aria-label="Chercher">
          <span className="glyph-search" />
        </button>
        <button type="button" className="round-btn" onClick={() => navigate('/profil')} aria-label="Tes goûts">
          <span className="glyph-filter">
            <span style={{ width: 15 }} />
            <span style={{ width: 10 }} />
            <span style={{ width: 5 }} />
          </span>
        </button>
      </div>
    </div>
  )
}
