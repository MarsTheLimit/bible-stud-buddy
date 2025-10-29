export default function ProPill({accessLevel, hasActiveTrial} : {accessLevel: string, hasActiveTrial: boolean}) {
    return (
        <span className={`rounded-pill px-2 py-1 ${accessLevel === "pro" ? ("bg-gradient-primary-to-secondary") : null}`}>
            { accessLevel === "pro" ? (<span className="text-light fw-light">{accessLevel.toUpperCase()} { hasActiveTrial ? (`TRIAL`) : null }</span>) : null }
        </span>
    )
}