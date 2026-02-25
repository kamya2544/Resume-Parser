import { useState } from 'react'
import StepIndicator from './components/StepIndicator'
import View1_SchemaSelector from './views/View1_SchemaSelector'
import View2_PDFUpload from './views/View2_PDFUpload'
import View3_Results from './views/View3_Results'

export default function App() {
    const [step, setStep] = useState(1)
    const [selectedSchema, setSelectedSchema] = useState(null)
    const [sessionId, setSessionId] = useState(null)
    const [parsedJson, setParsedJson] = useState(null)

    const handleSchemaSelected = (schema) => {
        setSelectedSchema(schema)
        setStep(2)
    }

    const handleUploadComplete = ({ sessionId, jsonData }) => {
        setSessionId(sessionId)
        setParsedJson(jsonData)
        setStep(3)
    }

    const handleStartOver = () => {
        setStep(1)
        setSelectedSchema(null)
        setSessionId(null)
        setParsedJson(null)
    }

    return (
        <div className="app-shell">
            <nav className="nav">
                <a className="nav-logo" href="#" onClick={handleStartOver}>
                    <span>Resume</span><span className="logo-dot">Parser</span>
                </a>
                <span className="nav-badge">Resume PDF to JSON</span>
            </nav>

            <StepIndicator current={step} />

            {step === 1 && (
                <View1_SchemaSelector onSelect={handleSchemaSelected} />
            )}
            {step === 2 && (
                <View2_PDFUpload
                    schema={selectedSchema}
                    onComplete={handleUploadComplete}
                    onBack={() => setStep(1)}
                />
            )}
            {step === 3 && (
                <View3_Results
                    jsonData={parsedJson}
                    sessionId={sessionId}
                    schema={selectedSchema}
                    onStartOver={handleStartOver}
                />
            )}

            <footer className="footer">
                By Kamya Mehra and Diya Arya - Built with Groq LLM + HuggingFace Embeddings
            </footer>
        </div>
    )
}
