import { useRef, useState } from 'react'
import axios from 'axios'

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
}

export default function View2_PDFUpload({ schema, onComplete, onBack }) {
    const [file, setFile] = useState(null)
    const [dragOver, setDragOver] = useState(false)
    const [loading, setLoading] = useState(false)
    const [stage, setStage] = useState('')
    const [error, setError] = useState('')
    const inputRef = useRef()

    const handleFile = (f) => {
        if (!f || !f.name.toLowerCase().endsWith('.pdf')) {
            setError('Please select a valid PDF file.')
            return
        }
        setError('')
        setFile(f)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setDragOver(false)
        handleFile(e.dataTransfer.files[0])
    }

    const handleSubmit = async () => {
        if (!file) return
        setLoading(true)
        setError('')

        try {
            setStage('Reading your resume…')
            const form = new FormData()
            form.append('pdf', file)
            form.append('schema_id', schema.id)
            if (schema.id === 'custom' && schema.customFields?.length) {
                form.append('custom_fields', schema.customFields.join(','))
            }
            const res = await axios.post('/api/parse-resume', form)
            onComplete({ sessionId: res.data.session_id, jsonData: res.data.json_data })
        } catch (err) {
            const msg = err.response?.data?.detail || err.message || 'An error occurred.'
            setError(msg)
            setLoading(false)
            setStage('')
        }
    }

    return (
        <div className="page fade-in">
            <h1 className="page-title">Drop in Your Resume PDF</h1>
            <p className="page-subtitle">
                We'll pull out the <strong style={{ color: 'var(--accent-light)' }}>{schema?.label}</strong> fields for you.
            </p>

            {loading ? (
                <div className="spinner-wrap">
                    <div className="spinner" />
                    <span className="spinner-text">{stage}</span>
                </div>
            ) : (
                <>
                    {/* Drop zone */}
                    <div
                        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                        onClick={() => inputRef.current.click()}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                    >
                        <span className="upload-icon">📄</span>
                        <div className="upload-title">Drop your PDF here</div>
                        <div className="upload-sub">or click to browse your files</div>
                        <button className="btn btn-ghost" onClick={(e) => { e.stopPropagation(); inputRef.current.click() }}>
                            Browse Files
                        </button>
                        <div className="upload-hint" style={{ marginTop: 16 }}>Only PDF files are accepted · Max size 20 MB</div>
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".pdf"
                            style={{ display: 'none' }}
                            onChange={(e) => handleFile(e.target.files[0])}
                        />
                    </div>

                    {/* File chosen indicator */}
                    {file && (
                        <div className="file-chosen">
                            <span className="file-chosen-icon">📄</span>
                            <div>
                                <div className="file-chosen-name">{file.name}</div>
                                <div className="file-chosen-size">{formatFileSize(file.size)}</div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="error-banner" style={{ marginTop: 16 }}>⚠️ {error}</div>
                    )}

                    <div style={{ display: 'flex', gap: 14, marginTop: 28 }}>
                        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
                        <button
                            className="btn btn-primary"
                            disabled={!file}
                            onClick={handleSubmit}
                        >
                            Parse Resume →
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
