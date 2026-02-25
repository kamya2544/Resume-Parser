import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

function formatLabel(key) {
    return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
}

function AutoTextarea({ value }) {
    const ref = useRef(null)

    useEffect(() => {
        if (ref.current) {
            ref.current.style.height = 'auto'
            ref.current.style.height = ref.current.scrollHeight + 'px'
        }
    }, [value])

    return (
        <textarea
            ref={ref}
            className="field-input field-textarea"
            readOnly
            value={value}
            rows={1}
        />
    )
}

function FieldRenderer({ data, depth = 0 }) {
    if (data === null || data === undefined) {
        return <span className="field-empty">Not provided</span>
    }

    if (Array.isArray(data)) {
        if (data.length === 0) {
            return <span className="field-empty">None listed</span>
        }
        if (typeof data[0] !== 'object') {
            return <AutoTextarea value={data.join(', ')} />
        }
        return (
            <div className="array-list">
                {data.map((item, i) => (
                    <div key={i} className="array-item">
                        <div className="array-item-header">Entry {i + 1}</div>
                        <FieldRenderer data={item} depth={depth + 1} />
                    </div>
                ))}
            </div>
        )
    }

    if (typeof data === 'object') {
        return (
            <div className={depth > 0 ? 'nested-fields' : ''}>
                {Object.entries(data).map(([key, value]) => (
                    <FieldRow key={key} label={key} value={value} depth={depth} />
                ))}
            </div>
        )
    }

    return <AutoTextarea value={String(data)} />
}

function FieldRow({ label, value, depth }) {
    const isComplex = typeof value === 'object' && value !== null
    return (
        <div className={`field-row ${isComplex ? 'field-row-complex' : ''}`}>
            <label className="field-label">{formatLabel(label)}</label>
            <div className="field-value">
                <FieldRenderer data={value} depth={depth + 1} />
            </div>
        </div>
    )
}

function ChatBubble({ role, text }) {
    return (
        <div className={`chat-bubble ${role === 'user' ? 'user' : 'bot'}`}>
            {text}
        </div>
    )
}

export default function View3_Results({ jsonData, sessionId, schema, onStartOver }) {
    const [messages, setMessages] = useState([
        { role: 'bot', text: `Hi there 👋 I've gone through the resume. Feel free to ask me anything — skills, experience, education, or anything else you'd like to know.` }
    ])
    const [input, setInput] = useState('')
    const [thinking, setThinking] = useState(false)
    const [copyLabel, setCopyLabel] = useState('Copy JSON')
    const messagesEndRef = useRef(null)

    // ── Persist to localStorage whenever a new result arrives ──
    useEffect(() => {
        if (jsonData && sessionId) {
            const record = {
                savedAt: new Date().toISOString(),
                schema: schema?.label || 'Unknown',
                sessionId,
                data: jsonData,
            }
            localStorage.setItem('resumeParser_lastResult', JSON.stringify(record))
        }
    }, [jsonData, sessionId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async () => {
        const text = input.trim()
        if (!text || thinking) return
        setInput('')
        setMessages(prev => [...prev, { role: 'user', text }])
        setThinking(true)
        try {
            const res = await axios.post('/api/chat', { message: text, session_id: sessionId })
            setMessages(prev => [...prev, { role: 'bot', text: res.data.answer }])
        } catch {
            setMessages(prev => [...prev, { role: 'bot', text: '⚠️ Something went wrong. Please try again.' }])
        } finally {
            setThinking(false)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
    }

    const copyJson = () => {
        navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2))
        setCopyLabel('Copied ✓')
        setTimeout(() => setCopyLabel('Copy JSON'), 2000)
    }

    const downloadJson = () => {
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `resume_${schema?.id || 'parsed'}_${Date.now()}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="page fade-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <h1 className="page-title" style={{ marginBottom: 0 }}>Here's What We Found ✓</h1>
                <button className="btn btn-ghost" onClick={onStartOver}>↩ Start Over</button>
            </div>
            <p className="page-subtitle">
                Pulled from your resume using the <strong style={{ color: 'var(--accent-light)' }}>{schema?.label}</strong> template. Copy or download the JSON below.
            </p>

            <div className="results-layout">
                {/* ── LEFT: Human-readable field output ── */}
                <div className="json-panel glass-card">
                    <div className="panel-header">
                        <span className="panel-icon">📝</span>
                        What We Extracted
                        <div className="panel-header-actions">
                            <button className="json-copy-btn" onClick={copyJson}>{copyLabel}</button>
                            <button className="json-copy-btn" onClick={downloadJson}>⤓ Download</button>
                        </div>
                    </div>
                    <div className="json-body" style={{ fontFamily: 'inherit', fontSize: '0.87rem' }}>
                        <FieldRenderer data={jsonData} />
                    </div>
                </div>

                {/* ── RIGHT: Chatbot ── */}
                <div className="chat-panel glass-card">
                    <div className="panel-header">
                        <span className="panel-icon">💬</span>
                        Chat with this Resume
                    </div>
                    <div className="chat-messages">
                        {messages.map((m, i) => (
                            <ChatBubble key={i} role={m.role} text={m.text} />
                        ))}
                        {thinking && (
                            <div className="chat-bubble bot thinking">Thinking it through…</div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="chat-input-row">
                        <input
                            className="chat-input"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask anything about the resume…"
                        />
                        <button
                            className="chat-send-btn"
                            onClick={sendMessage}
                            disabled={!input.trim() || thinking}
                            title="Send"
                        >
                            ➤
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
