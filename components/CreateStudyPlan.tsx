"use client";
import { addEventsToPlanner, createPlanner } from "@/lib/planners";
import { useState } from "react";
import { Spinner } from "react-bootstrap";
import { updateUserTokens, useUserAccount } from "@/lib/hooks/useUserAccount";

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

export default function CreateStudyPlan({ schedulePrefs, onSubmit, tokensLeft }: { schedulePrefs: unknown, userEvents: unknown[], onSubmit: () => void, tokensLeft: number }) {
    const { 
        user,
        refresh
    } = useUserAccount();
    const [title, setTitle] = useState('');
    const [studyArea, setStudyArea] = useState('');
    const [loading, setLoading] = useState(false);
    
    const handleCreateStudyPlan = async (event: { preventDefault: () => void; }) => {
        // Prevents the default browser form submission, which would cause a page reload
        event.preventDefault();

        setLoading(true);

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

        if (tokensLeft >= 2000) {
            try {
                if (!user) return;
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
                    // Throw an error or return null to handle failure in the UI
                    throw new Error(errorData.error || 'Failed to generate schedule.');
                }

                // Parse the successful JSON response
                const data: ScheduleResponse = await response.json();
                
                console.log('Schedule generated successfully!', data.scheduleEvents);
                console.log('Tokens used: ', data.usage);

                const newTokenCount = tokensLeft - data.usage;

                await updateUserTokens(user.id, newTokenCount);
                console.log(`Updated user tokens: ${newTokenCount}`);

                const newPlanner = await createPlanner(user.id, title);
                await addEventsToPlanner(user.id, newPlanner.id, data.scheduleEvents);

                await refresh();

            } catch (error) {
                console.error('Submission failed:', error);
                return null;
            } finally {
                setTitle('');
                setStudyArea('');
                setLoading(false);
            }
        }
    };

    return (
        <div>
            <div className="d-flex"><h3>Let&apos;s Get Started.</h3></div>
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
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <label htmlFor="plan-title" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Area you would like to study:
                    </label>
                    <input
                        id="plan-title"
                        type="text"
                        value={studyArea}
                        onChange={(e) => setStudyArea(e.target.value)}
                        placeholder="Enter Area of Study (leave blank if you already have study material)"
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>
                {/* Submission Button */}
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: "10px 15px",
                        backgroundColor: loading ? "#6c757d" : "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: loading ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                    }}
                    >
                    {loading ? (
                        <>
                        <Spinner animation="border" size="sm" role="status" />
                        <span>Please Wait...</span>
                        </>
                    ) : (
                        "Create Study Plan"
                    )}
                </button>
            </form>
        </div>
    )
}