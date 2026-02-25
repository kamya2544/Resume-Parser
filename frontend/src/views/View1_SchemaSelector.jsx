import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

const CUSTOM_SCHEMA = {
    id: 'custom',
    label: 'Custom Fields',
    description: 'Tell us exactly which information to pull — great for custom use cases.',
    icon: '🖊️',
    fields: [],
}

export default function View1_SchemaSelector({ onSelect }) {
    const [schemas, setSchemas] = useState([])
    const [selected, setSelected] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Custom fields state
    const [customFields, setCustomFields] = useState([])
    const [fieldInput, setFieldInput] = useState('')
    const inputRef = useRef(null)

    useEffect(() => {
        axios.get('/api/schema-options')
            .then(res => { setSchemas([...res.data.schemas, CUSTOM_SCHEMA]); setLoading(false) })
            .catch(() => { setError('Could not load schema options. Make sure the backend is running.'); setLoading(false) })
    }, [])

    const addField = (raw) => {
        const trimmed = raw.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
        if (!trimmed || customFields.includes(trimmed)) return
        setCustomFields(prev => [...prev, trimmed])
        setFieldInput('')
    }

    const removeField = (f) => setCustomFields(prev => prev.filter(x => x !== f))

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addField(fieldInput)
        } else if (e.key === 'Backspace' && !fieldInput && customFields.length > 0) {
            setCustomFields(prev => prev.slice(0, -1))
        }
    }

    const handleContinue = () => {
        if (selected?.id === 'custom') {
            onSelect({ ...CUSTOM_SCHEMA, fields: customFields, customFields })
        } else {
            onSelect(selected)
        }
    }

    const isCustomValid = selected?.id === 'custom' ? customFields.length > 0 : !!selected

    return (
        <div className="page fade-in">
            <h1 className="page-title">What kind of resume are you working with?</h1>
            <p className="page-subtitle">Choose the option that fits best — we'll pull out the right information from your PDF.</p>

            {error && (
                <div className="error-banner">⚠️ {error}</div>
            )}

            {loading ? (
                <div className="spinner-wrap"><div className="spinner" /><span className="spinner-text">Getting things ready…</span></div>
            ) : (
                <>
                    <div className="schema-grid">
                        {schemas.map(schema => (
                            <div
                                key={schema.id}
                                className={`schema-card ${selected?.id === schema.id ? 'selected' : ''}`}
                                onClick={() => setSelected(schema)}
                            >
                                <div className="schema-check">✓</div>
                                <span className="schema-icon">{schema.icon}</span>
                                <div className="schema-card-title">{schema.label}</div>
                                <div className="schema-card-desc">{schema.description}</div>
                                {schema.id !== 'custom' && (
                                    <div className="schema-fields">
                                        {schema.fields.map(f => (
                                            <span key={f} className="schema-field-pill">{f.replace(/_/g, ' ')}</span>
                                        ))}
                                    </div>
                                )}
                                {schema.id === 'custom' && (
                                    <div className="schema-fields">
                                        <span className="schema-field-pill" style={{ opacity: 0.6, fontStyle: 'italic' }}>
                                            you'll define the fields below ↓
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* ── Custom field input — only shown when Custom is selected ── */}
                    {selected?.id === 'custom' && (
                        <div className="custom-fields-panel">
                            <div className="custom-fields-label">
                                🏷️ Type a field name and hit <kbd>Enter</kbd> or <kbd>,</kbd> to add it
                            </div>
                            <div
                                className="custom-fields-input-wrap"
                                onClick={() => inputRef.current?.focus()}
                            >
                                {customFields.map(f => (
                                    <span key={f} className="custom-tag">
                                        {f.replace(/_/g, ' ')}
                                        <button
                                            className="custom-tag-remove"
                                            onClick={(e) => { e.stopPropagation(); removeField(f) }}
                                            aria-label={`Remove ${f}`}
                                        >×</button>
                                    </span>
                                ))}
                                <input
                                    ref={inputRef}
                                    className="custom-fields-input"
                                    value={fieldInput}
                                    onChange={e => setFieldInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    onBlur={() => fieldInput.trim() && addField(fieldInput)}
                                    placeholder={customFields.length === 0 ? 'e.g. name, email, years of experience…' : 'Add more fields…'}
                                />
                            </div>
                            {customFields.length === 0 && (
                                <div className="custom-fields-hint">⚠️ Please add at least one field to continue.</div>
                            )}
                        </div>
                    )}

                    <button
                        className="btn btn-primary"
                        disabled={!isCustomValid}
                        onClick={handleContinue}
                    >
                        Continue with "{selected?.label || '…'}" →
                    </button>
                </>
            )}
        </div>
    )
}
