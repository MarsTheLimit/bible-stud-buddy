"use client";

import { useState } from "react";

type Event = {
  title: string,
  description: string,
  time: string,
  endTime: string,
  date: string | undefined,
  endDate: string | undefined,
  multiDay: boolean
}

export default function EventInput({ onChange, initial }: { onChange: (title : string, description: string, datetimeUTC: string, enddatetimeUTC: string, multiDay : boolean) => void, initial: Event }) {
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [time, setTime] = useState(initial.time);
  const [endTime, setEndTime] = useState(initial.endTime);
  const [date, setDate] = useState(initial.date);
  const [endDate, setEndDate] = useState(initial.endDate);
  const [multiDay, setMultiDay] = useState(initial.multiDay);

  if (initial.date === undefined || initial.endDate === undefined) return null;

  // Whenever date/time/timezone changes, re-parse and emit standardized UTC time
  function handleChange(d: string | undefined, t: string, ed: string | undefined, et: string) {
    if (!d || !t) {
      onChange(title, description, "", "", multiDay);
      return;
    }

    if (!ed) {
      ed = d;
    }
    
    try {
      const startUTC = new Date(`${d}T${t}`).toISOString();
      let endUTC = "";
      if (!multiDay) { 
        endUTC = et ? new Date(`${d}T${et}`).toISOString() : startUTC;
      } else {
        endUTC = (ed && et) ? new Date(`${ed}T${et}`).toISOString() : startUTC;
      }
      onChange(title, description, startUTC, endUTC, multiDay);
    } catch (err) {
      console.error("Failed to parse time:", err);
      onChange(title, description, "", "", multiDay);
    }
  }

  return (
    <div className="space-y-3">
        <input
          type="text"
          placeholder="Event title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="form-control mb-2"
        />
        <input
          type="textarea"
          placeholder="Event details"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="form-control mb-2"
        />
      <div>
        <label className="block m-2 font-semibold">Date:</label>
        <input
          type="date"
          className="border rounded p-2 mb-2 w-full"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            handleChange(e.target.value, time, endDate, endTime);
          }}
        />
      </div>

      <div>
        <label className="block m-2 font-semibold">Start Time:</label>
        <input
          type="time"
          className="border rounded p-2 mb-2 w-full"
          value={time}
          onChange={(e) => {
            setTime(e.target.value);
            handleChange(date, e.target.value, endDate, endTime);
          }}
        />
      </div>
      <div>
        <label className="block m-2 font-semibold">End Time:</label>
        <input
          type="time"
          className="border rounded p-2 mb-2 w-full"
          value={endTime}
          onChange={(e) => {
            setEndTime(e.target.value);
            handleChange(date, time, endDate, e.target.value);
          }}
        />
      </div>
      {multiDay && (<div>
        <input className="btn btn-outline-primary my-2" type="checkbox" onClick={() => {setMultiDay(false); setEndDate(date); handleChange(date, time, date, endTime);}} defaultChecked/>
        <label className="block m-2 font-semibold">End Date:</label>
        <input
          type="date"
          className="border rounded p-2 mb-2 w-full"
          value={endDate}
          onChange={(e) => {
              setEndDate(e.target.value);
              handleChange(date, time, e.target.value, endTime);
          }}
        />
      </div>)}
      {!multiDay && (<div>
        <button className="btn btn-outline-primary mb-2" onClick={() => setMultiDay(true)}>Multiple days</button>
      </div>)}
      
    </div>
  );
}
