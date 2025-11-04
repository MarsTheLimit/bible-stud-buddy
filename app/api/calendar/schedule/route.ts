import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// --- Interface Definitions ---

// Define the shape of the incoming user preferences
type SchedulePrefs = {
    morning_person: boolean;
    busyness: string;
    least_busy_days: string[] | null; // Assuming a list of strings (e.g., ["Saturday", "Sunday"])
    school_work: { type: string, hours: string } | null;
    earliest_awake: string | null;
    latest_asleep: string | null;
    other_info: string | null;
};

export type Event = {
  title: string;
  description: string;
  start: string;
  end: string;
};

// Define the shape of the incoming data
interface StudyPlanData {
    name: string;
    userPrefs: SchedulePrefs;
    dateEnds: string;
    studyArea: string | null;
    userEvents: Event[];
}

// Next.js App Router POST handler
export async function POST(request: Request) {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    try {
        const { name, userPrefs, dateEnds, studyArea, userEvents } : StudyPlanData = await request.json();

        // console.log(userEvents)

        const preferenceDetails = `
            - **Personal Schedule:** The user is a ${userPrefs.morning_person ? '**MORNING PERSON** (Schedule things early)' : 'night owl (Schedule things later)'}.
            - **Daily Availability:** The user describes their busyness level as **${userPrefs.busyness}**. The schedule should reflect this (e.g., longer sessions for "Light," shorter/fewer for "Very Busy").
            - **Optimal Days:** The user's least busy days are: **${userPrefs.least_busy_days?.join(', ') || 'None provided'}**. Schedule longer/more challenging sessions on these days.
            - **Daily Commitments:** The user has **${userPrefs.school_work?.type || 'No defined school/work'}** for **${userPrefs.school_work?.hours || '0'}** hours daily. Schedule study *around* this commitment.
            - **Wake/Sleep Times:** Study sessions must be **NO EARLIER** than **${userPrefs.earliest_awake || '4:00 AM'}** and **NO LATER** than **${userPrefs.latest_asleep || '11:00 PM'}**.
            - **Other Notes:** **${userPrefs.other_info || 'No additional information.'}**
        `;

        // 2. Construct the main prompt
        const prompt = `
            You are an expert personal scheduling assistant. Your task is to generate a comprehensive Bible study plan based on the user's progress and detailed personal preferences.
            
            **Goal:** Create a study schedule to complete the remaining Bible content by the target end date.
            
            **Input Data:**
            - **Study Name:** "${name}"
            - **Target End Date:** ${dateEnds} (Do not schedule any event past this date/time).
            - **Existing Events:**  
              The user already has the following events scheduled. You **must NOT** create any new study events that overlap with or are too close to these.  
              Each event includes a start (date) and end (end_date) time in ISO 8601 format.  
              Ensure a **minimum 15-minute buffer** before and after any existing event to prevent scheduling conflicts.

              Here are the user's current events in JSON:
              ${JSON.stringify(
                userEvents.map(({ title, start, end }) => ({
                  title,
                  start,
                  end,
                })),
                null,
                2
              )}

            **Scheduling Rules (APPLY THESE STRICTLY):**
            ${preferenceDetails}
            
            **Output Format:**
            Generate a JSON array of events. Each event must strictly adhere to the provided TypeScript interface/shape.
            
            - **title:** ${(studyArea !== null && studyArea !== '') ? (`Must be an appropriate name for the study time followed the user-provided study name ("[Book of the Bible] 8:1-17 - ${name}") that is based around the user's study area: ${studyArea}. If the study area does not apply to to the Bible, diregard this and leave the title blank.`) : 
              (`Must be 'Bible Study' followed by the user-provided study name ('Bible Study - ${name}')`)}.
            - **description:** ${(studyArea !== null && studyArea !== '') ? (`Must be a clear, actionable task (e.g., "Read [Book of the Bible] 8:1-17 and write three insights.") that is based around the user's study area: ${studyArea}. If the study area does not apply to to the Bible, diregard this and leave the description blank.`) : ('leave blank')}.
            - **start/end:** Must be valid ISO 8601 timestamps, calculated using today's date and the scheduling rules. The duration of the event should be based on busyness and day.

            **Generate ONLY the JSON array.**
        `;

        // 3. Call OpenAI with JSON Mode
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a professional scheduler that outputs ONLY a valid JSON array of structured events. Do not include any preceding or trailing text."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            response_format: { type: "json_object" }, // Crucial for reliable JSON output
            temperature: 0.5,
        });

        // 4. Extract and Parse the JSON output
        const jsonString = completion.choices[0]?.message.content;
        if (!jsonString) {
             return NextResponse.json({ error: 'OpenAI returned empty content.' }, { status: 500 });
        }
        
        // The expected output is an object containing the array, so we must parse it carefully
        const responseData = JSON.parse(jsonString);
        
        // Assuming the model returns the array directly or inside a property like { events: [] }
        // We'll try to handle the JSON gracefully:
        const scheduleArray: Event[] = Array.isArray(responseData) 
            ? responseData 
            : responseData.schedule || responseData.events || []; // Check common wrapping keys

        if (scheduleArray.length === 0) {
             return NextResponse.json({ error: 'OpenAI returned a JSON object but no events were found.' }, { status: 500 });
        }

        if (!completion.usage) {
          return NextResponse.json({ error: 'OpenAI returned a JSON object with events but no token amount.' }, { status: 500 });
        }

        // 5. Success response
        return NextResponse.json({ 
            message: 'Schedule successfully generated and parsed.',
            scheduleEvents: [], //scheduleArray, // Return the structured array
            usage: 5000 //completion.usage.total_tokens
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error while generating schedule.', details: (error as Error).message }, 
            { status: 500 }
        );
    }
}