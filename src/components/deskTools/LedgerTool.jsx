import { useEffect, useState } from 'react'
import { useGardenStore } from '../../lib/store'
import '../DeskTools.css'
import './LedgerTool.css'

// What it'll actually take: resources, people, and a simple budget.
export default function LedgerTool({ idea }) {
  const addLedgerResource = useGardenStore((s) => s.addLedgerResource)
  const toggleLedgerResource = useGardenStore((s) => s.toggleLedgerResource)
  const addLedgerPerson = useGardenStore((s) => s.addLedgerPerson)
  const setLedgerBudget = useGardenStore((s) => s.setLedgerBudget)

  const ledger = idea.ledger || {}
  const resources = ledger.resources || []
  const people = ledger.people || []

  const [resourceDraft, setResourceDraft] = useState('')
  const [personDraft, setPersonDraft] = useState('')
  const [estimate, setEstimate] = useState(ledger.budgetEstimate ?? '')
  const [spent, setSpent] = useState(ledger.budgetSpent ?? '')

  useEffect(() => {
    setEstimate(ledger.budgetEstimate ?? '')
    setSpent(ledger.budgetSpent ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idea.id])

  function submitResource(e) {
    e.preventDefault()
    if (!resourceDraft.trim()) return
    addLedgerResource(idea.id, resourceDraft.trim())
    setResourceDraft('')
  }

  function submitPerson(e) {
    e.preventDefault()
    if (!personDraft.trim()) return
    addLedgerPerson(idea.id, personDraft.trim())
    setPersonDraft('')
  }

  function saveBudget() {
    setLedgerBudget(idea.id, 'budgetEstimate', estimate === '' ? null : Number(estimate))
    setLedgerBudget(idea.id, 'budgetSpent', spent === '' ? null : Number(spent))
  }

  return (
    <div className="desk-tool">
      <p className="desk-tool-intro">Money, materials, tools, and people — what it'll actually take.</p>

      <div className="desk-tool-section">
        <p className="desk-tool-label">Resources</p>
        {resources.length > 0 ? (
          <ul className="desk-tool-list">
            {resources.map((r, i) => (
              <li key={i} className={`ledger-resource ${r.have ? 'have' : ''}`}>
                <label>
                  <input type="checkbox" checked={r.have} onChange={() => toggleLedgerResource(idea.id, i)} />
                  <span>{r.text}</span>
                </label>
                <span className="ledger-resource-status">{r.have ? 'have it' : 'still need'}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="desk-tool-empty">No resources listed yet.</p>
        )}
        <form className="desk-tool-form" onSubmit={submitResource}>
          <input
            type="text"
            value={resourceDraft}
            onChange={(e) => setResourceDraft(e.target.value)}
            placeholder="Add a resource, material, or tool…"
          />
          <button type="submit" disabled={!resourceDraft.trim()}>
            Add
          </button>
        </form>
      </div>

      <div className="desk-tool-section">
        <p className="desk-tool-label">People</p>
        {people.length > 0 ? (
          <ul className="desk-tool-list">
            {people.map((p, i) => (
              <li key={i} className="desk-tool-item">
                {p.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="desk-tool-empty">No one listed yet.</p>
        )}
        <form className="desk-tool-form" onSubmit={submitPerson}>
          <input
            type="text"
            value={personDraft}
            onChange={(e) => setPersonDraft(e.target.value)}
            placeholder="Who do you need to talk to or bring in?"
          />
          <button type="submit" disabled={!personDraft.trim()}>
            Add
          </button>
        </form>
      </div>

      <div className="desk-tool-section">
        <p className="desk-tool-label">Budget</p>
        <div className="ledger-budget-row">
          <label>
            Estimated
            <input type="number" value={estimate} onChange={(e) => setEstimate(e.target.value)} onBlur={saveBudget} />
          </label>
          <label>
            Spent so far
            <input type="number" value={spent} onChange={(e) => setSpent(e.target.value)} onBlur={saveBudget} />
          </label>
        </div>
      </div>
    </div>
  )
}
