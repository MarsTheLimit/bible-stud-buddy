"use client";
import { addEventsToPlanner, createPlanner } from "@/lib/planners";
import { useState } from "react";
import { Spinner, Alert } from "react-bootstrap";
import { updateUserTokens, useUserAccount } from "@/lib/hooks/useUserAccount";
import { UserScheduleData } from "@/components/PreferencesPopup";

interface ScheduleResponse {
    message: string;
    scheduleEvents: ScheduleEvents[];
    usage: number;
}

type ScheduleEvents = {
    title: string;
    description: string;
    start: string;
    end: string;
}

export default function CreateStudyPlan({ 
    schedulePrefs, 
    onSubmit, 
    tokensLeft,
    onPlannerCreated
}: { 
    schedulePrefs: UserScheduleData | undefined, 
    userEvents: unknown[], 
    onSubmit: () => void, 
    tokensLeft: number,
    onPlannerCreated?: () => void
}) {
    const { user, refresh } = useUserAccount();
    const [title, setTitle] = useState('');
    const [studyArea, setStudyArea] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (schedulePrefs === undefined) return;
    
    const handleCreateStudyPlan = async (event: { preventDefault: () => void; }) => {
        event.preventDefault();
        
        // Reset states
        setLoading(true);
        setError(null);
        setSuccess(false);

        // Check tokens before starting
        if (tokensLeft < 2000) {
            setError('Insufficient tokens. You need at least 2000 tokens to create a study plan.');
            setLoading(false);
            return;
        }

        if (!user) {
            setError('User not authenticated. Please log in and try again.');
            setLoading(false);
            return;
        }

        try {
            const currentDate = new Date();
            currentDate.setMonth(currentDate.getMonth() + 1);
            const futureDateTimeISO = currentDate.toISOString();
        
            const studyPlanData = {
                name: title,
                userPrefs: schedulePrefs,
                studyArea: studyArea,
                dateEnds: futureDateTimeISO,
                userEvents: await onSubmit()
            };
        
            const apiRoute = '/api/calendar/schedule';

            console.log('Sending data to API:', studyPlanData);

            const response = await fetch(apiRoute, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(studyPlanData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error(`API Error (${response.status}):`, errorData.error || response.statusText);
                throw new Error(errorData.error || 'Failed to generate schedule. Please try again.');
            }

            const data: ScheduleResponse = await response.json();

            console.log('Schedule generated successfully!', data.scheduleEvents);
            console.log('Tokens used: ', data.usage);

            // Update tokens
            const newTokenCount = tokensLeft - data.usage;
            await updateUserTokens(user.id, newTokenCount);
            console.log(`Updated user tokens: ${newTokenCount}`);

            const currentYear = new Date().getFullYear();

            let sessionLength: number;

            if (schedulePrefs.study_session_length === null) {
                sessionLength = 15;
            } else {
                sessionLength = schedulePrefs.study_session_length;
            }

            // Fix the year on returned events
            const fixedEvents = data.scheduleEvents.map(event => {
                const startDate = new Date(event.start);
                const endDate = new Date(startDate.getTime() + sessionLength * 60000);

                startDate.setFullYear(currentYear);
                endDate.setFullYear(currentYear);

                return {
                    ...event,
                    start: startDate.toISOString(),
                    end: endDate.toISOString(),
                };
            });

            // Save fixed events
            const newPlanner = await createPlanner(user.id, title);
            await addEventsToPlanner(user.id, newPlanner.id, fixedEvents);

            // Refresh user account data
            await refresh();

            if (onPlannerCreated) {
                await onPlannerCreated();
            }

            // Reset form and show success
            setTitle('');
            setStudyArea('');
            setSuccess(true);

            // Auto-hide success message after 5 seconds
            setTimeout(() => setSuccess(false), 5000);

        } catch (error) {
            console.error('Submission failed:', error);
            
            // Set user-friendly error message
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="d-flex"><h3>Let&apos;s Get Started.</h3></div>
            
            {/* Error Alert */}
            {error && (
                <Alert 
                    variant="danger" 
                    dismissible 
                    onClose={() => setError(null)}
                    className="mb-3"
                >
                    <Alert.Heading>Error</Alert.Heading>
                    <p>{error}</p>
                </Alert>
            )}

            {/* Success Alert */}
            {success && (
                <Alert 
                    variant="success" 
                    dismissible 
                    onClose={() => setSuccess(false)}
                    className="mb-3"
                >
                    <Alert.Heading>Success!</Alert.Heading>
                    <p>Your study plan has been created successfully.</p>
                </Alert>
            )}

            <form onSubmit={handleCreateStudyPlan} style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="plan-title" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        New Study Plan Title:
                    </label>
                    <input
                        className="mb-4"
                        id="plan-title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter Title"
                        required
                        disabled={loading}
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <label htmlFor="study-area" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Area you would like to study:
                    </label>
                    <input
                        id="study-area"
                        type="text"
                        value={studyArea}
                        onChange={(e) => setStudyArea(e.target.value)}
                        placeholder="Enter Area of Study (leave blank if you already have study material)"
                        disabled={loading}
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>
                
                {/* Token Warning */}
                {tokensLeft < 2000 && (
                    <div style={{ 
                        padding: '10px', 
                        marginBottom: '15px', 
                        backgroundColor: '#fff3cd', 
                        border: '1px solid #ffc107', 
                        borderRadius: '4px',
                        color: '#856404'
                    }}>
                        You have {tokensLeft} tokens remaining. You need at least 2000 tokens to create a study plan. Your tokens will reset at the end of the month.
                    </div>
                )}

                {/* Submission Button */}
                <button
                    type="submit"
                    disabled={loading || tokensLeft < 2000}
                    style={{
                        padding: "10px 15px",
                        backgroundColor: loading || tokensLeft < 2000 ? "#6c757d" : "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: loading || tokensLeft < 2000 ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                    }}
                >
                    {loading ? (
                        <>
                            <Spinner animation="border" size="sm" role="status" />
                            <span>Creating Study Plan...</span>
                        </>
                    ) : (
                        "Create Study Plan"
                    )}
                </button>
            </form>
        </div>
    );
}