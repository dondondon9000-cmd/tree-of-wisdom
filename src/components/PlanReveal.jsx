import { useGardenStore } from '../lib/store'
import './PlanReveal.css'

// The ceremony that happens the first time you walk through a bonsai's
// door — before you ever see the ordinary Workshop dashboard, you see
// the AI's plan revealed on its own, one paragraph unfolding after the
// next, with nothing else competing for attention. Only once you
// deliberately step forward ("start building") does revealPlan flip
// planRevealed to true (store.js) and every future visit through this
// same door goes straight to WorkshopDashboard instead — the reveal
// is a once-per-idea event, not a recurring screen.
export default function PlanReveal({ idea, visible }) {
  const generateBrief = useGardenStore((s) => s.generateBrief)
  const generatingBrief = useGardenStore((s) => s.generatingBrief)
  const briefError = useGardenStore((s) => s.briefError)
  const revealPlan = useGardenStore((s) => s.revealPlan)

  if (!idea) return null

  const paragraphs = idea.brief
    ? idea.brief
        .split('\n\n')
        .map((p) => p.trim())
        .filter(Boolean)
    : []

  const startBuildingDelay = 0.15 + paragraphs.length * 0.35 + 0.35

  return (
    <div className={`plan-reveal ${visible ? 'visible' : ''}`}>
      <div className="plan-reveal-inner">
        <p className="plan-reveal-eyebrow">{idea.title}</p>

        {paragraphs.length > 0 ? (
          <>
            <div className="plan-reveal-brief">
              {paragraphs.map((para, i) => (
                <p key={i} style={{ animationDelay: `${0.15 + i * 0.35}s` }}>
                  {para}
                </p>
              ))}
            </div>

            <div className="plan-reveal-actions" style={{ animationDelay: `${startBuildingDelay}s` }}>
              <button type="button" className="plan-reveal-start" onClick={() => revealPlan(idea.id)}>
                Start building →
              </button>
              <button
                type="button"
                className="plan-reveal-regenerate"
                onClick={() => generateBrief(idea)}
                disabled={generatingBrief}
              >
                {generatingBrief ? 'Reviewing everything…' : 'Try a different plan'}
              </button>
            </div>
          </>
        ) : (
          <div className="plan-reveal-pending">
            <p className="plan-reveal-pending-text">
              Your idea has bloomed — ready to see what the AI thinks the plan should be?
            </p>
            <button
              type="button"
              className="plan-reveal-start"
              onClick={() => generateBrief(idea)}
              disabled={generatingBrief}
            >
              {generatingBrief ? 'Reviewing everything…' : 'Reveal the plan'}
            </button>
          </div>
        )}

        {briefError && <p className="plan-reveal-error">{briefError}</p>}
      </div>
    </div>
  )
}
