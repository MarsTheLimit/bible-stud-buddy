import { Button, Col, Form, Row } from "react-bootstrap";
import { UserScheduleData } from "./PreferencesPopup";
import { useState } from "react";

export function PreferencesInput({
  onSubmit,
}: {
  onSubmit: (prefs: UserScheduleData) => void;
}) {
  const [prefs, setPrefs] = useState<UserScheduleData>({
    morning_person: false,
    busyness: "",
    least_busy_days: [], 
    // school_work: { type: "", hours: "" },
    earliest_awake: null,
    latest_asleep: null,
    other_info: null,
    study_session_length: null
  });

  const handleChange = (field: keyof UserScheduleData, value: unknown) => {
    const updated = { ...prefs, [field]: value };
    setPrefs(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(prefs);
  };

  return (
    <Form className="p-3 border rounded bg-light shadow-sm" onSubmit={handleSubmit}>
      <h4 className="mb-4 text-center">Enter Your Preferences</h4>
      {/* Morning Person Toggle */}
      <Form.Group className="mb-3">
        <Form.Check
          type="switch"
          id="morning-person"
          label="I'm a morning person"
          checked={prefs.morning_person}
          onChange={(e) => handleChange("morning_person", e.target.checked)}
        />
      </Form.Group>

      {/* Busyness Dropdown */}
      <Form.Group className="mb-3">
        <Form.Label>How busy are you? <span className="text-danger">*</span></Form.Label>
        <Form.Select
          value={prefs.busyness}
          onChange={(e) => handleChange("busyness", e.target.value)}
          required
        >
          <option value="">Select option</option>
          <option value="very busy">Very busy</option>
          <option value="somewhat busy">Somewhat busy</option>
          <option value="not busy">Not busy</option>
          <option value="open schedule">Open schedule</option>
        </Form.Select>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>How long would you like your study sessions to be (minutes)?</Form.Label>
        <Row>
          <Col>
            <Form.Control
              type="number"
              placeholder="Ends"
              value={prefs.study_session_length || 15}
              onChange={(e) =>
                handleChange("study_session_length", e.target.value)
              }
              required
            />
          </Col>
        </Row>
      </Form.Group>

      {/* Least Busy Days (Checkboxes) */}
      <Form.Group className="mb-3">
        <Form.Label>Least busy days</Form.Label>
        <div>
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
            <Form.Check
              key={day}
              type="checkbox"
              id={`day-checkbox-${day}`}
              label={day}
              checked={prefs.least_busy_days?.includes(day) || false}
              onChange={(e) => {
                const isChecked = e.target.checked;
                let updatedDays: string[] = Array.isArray(prefs.least_busy_days) 
                  ? [...prefs.least_busy_days] 
                  : [];

                if (isChecked) {
                  if (!updatedDays.includes(day)) {
                    updatedDays.push(day);
                  }
                } else {
                  updatedDays = updatedDays.filter((d) => d !== day);
                }
                
                handleChange("least_busy_days", updatedDays.length > 0 ? updatedDays : null);
              }}
              inline
            />
          ))}
        </div>
      </Form.Group>

      {/* School/Work Info */}
      {/* <Form.Group className="mb-3">
        <Form.Label>When does your School, Work, etc. begin and end?</Form.Label>
        <Row>
          <Col>
            <Form.Control
              type="number"
              placeholder="Ends"
              value={prefs.school_work?.hours || ""}
              onChange={(e) =>
                handleChange("school_work", {
                  ...prefs.school_work,
                  ends: e.target.value,
                })
              }
            />
          </Col>
        </Row>
      </Form.Group> */}

      {/* Earliest Awake / Latest Asleep */}
      <Row>
        <Col>
          <Form.Group className="mb-3">
            <Form.Label>Earliest you wake up <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="time"
              value={prefs.earliest_awake || ""}
              onChange={(e) =>
                handleChange("earliest_awake", e.target.value || null)
              }
              required
            />
          </Form.Group>
        </Col>

        <Col>
          <Form.Group className="mb-3">
            <Form.Label>Latest you go to sleep <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="time"
              value={prefs.latest_asleep || ""}
              onChange={(e) =>
                handleChange("latest_asleep", e.target.value || null)
              }
              required
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Other Info */}
      <Form.Group className="mb-3">
        <Form.Label>Other Info</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          placeholder="Anything else you'd like us to know?"
          value={prefs.other_info || ""}
          onChange={(e) => handleChange("other_info", e.target.value || null)}
        />
      </Form.Group>
      
      {/* Submit Button */}
      <div className="d-flex justify-content-end">
        <Button type="submit" variant="primary">
          Save Preferences
        </Button>
      </div>

    </Form>
  );
}