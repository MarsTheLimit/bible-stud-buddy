"use client";

import { useState } from "react";

export default function EventInput({ onChange }: { onChange: (title : string, description: string, datetimeUTC: string, enddatetimeUTC: string, multiDay : boolean) => void }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [time, setTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [date, setDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [multiDay, setMultiDay] = useState(false);

    // Whenever date/time/timezone changes, re-parse and emit standardized UTC time
    function handleChange(d: string, t: string, ed: string, et: string) {
    if (!d || !t) {
      onChange(title, description, "", "", multiDay);
      return;
    }

    if (!ed) {
      ed = d;
    }
    
    try {
      const startUTC = new Date(`${d}T${t}`).toISOString();
      var endUTC = "";
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
          type="text"
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
