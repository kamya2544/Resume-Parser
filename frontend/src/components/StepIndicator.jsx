const STEPS = [
    { label: 'Pick a Template' },
    { label: 'Upload Resume' },
    { label: 'See Results' },
]

export default function StepIndicator({ current }) {
    return (
        <div className="steps-bar">
            {STEPS.map((step, i) => {
                const num = i + 1
                const isDone = num < current
                const isActive = num === current
                return (
                    <div key={step.label} style={{ display: 'flex', alignItems: 'center' }}>
                        <div className={`step-item ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                            <div className="step-circle">
                                {isDone ? '✓' : num}
                            </div>
                            <span className="step-label">{step.label}</span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`step-connector ${isDone ? 'done' : ''}`} />
                        )}
                    </div>
                )
            })}
        </div>
    )
}
