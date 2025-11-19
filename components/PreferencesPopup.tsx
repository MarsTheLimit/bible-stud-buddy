import { useUserAccount } from '@/lib/hooks/useUserAccount';
import React from 'react';
import { Modal, Spinner } from 'react-bootstrap';

export interface UserScheduleData {
  busyness: string;
  other_info: string | null;
  // school_work: {
  //   type: string;
  //   hours: string;
  // } | null;
  latest_asleep: string | null;
  earliest_awake: string | null;
  morning_person: boolean;
  least_busy_days: string[];
  study_session_length: number | null;
}

interface JsonPopupProps {
  show: boolean;
  onHide: () => void;
  data: UserScheduleData;
  onEdit: () => void;
}

export default function PreferencesPopupObject({ show, onHide, data, onEdit }: JsonPopupProps) {
  const formatTime = (time: string | null) => {
    if (time === null) return;
    const [hours, minutes] = time.split(':');
    if (!hours) return;
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  function editPrefs() {
    onEdit();
    onHide();
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <i className="bi bi-calendar-check me-2"></i>
          Your Preferences
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <div className="row g-3">
          {/* Busyness Level */}
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h6 className="text-muted mb-2">
                  <i className="bi bi-speedometer2 me-2"></i>
                  Busyness Level
                </h6>
                <h4 className="mb-0 text-capitalize">
                  <span className={`badge ${
                    data.busyness === 'very busy' ? 'bg-danger' :
                    data.busyness === 'busy' ? 'bg-warning' :
                    'bg-success'
                  }`}>
                    {data.busyness}
                  </span>
                </h4>
              </div>
            </div>
          </div>

          {/* School/Work Info
          { data.school_work && (
            <div className="col-md-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h6 className="text-muted mb-2">
                    <i className="bi bi-briefcase me-2"></i>
                    {data.school_work?.type === 'school' ? 'School' : 'Work'}
                  </h6>
                  <p className="mb-0 fs-5 fw-bold">{data.school_work?.hours} hours/day</p>
                </div>
              </div>
            </div>)} */}

          {/* Morning Person */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <h6 className="text-muted mb-2">
                  <i className="bi bi-sunrise me-2"></i>
                  Morning Person
                </h6>
                <p className="mb-0 fs-5">
                  {data.morning_person ? (
                    <span className="badge bg-success">
                      <i className="bi bi-check-circle me-1"></i>
                      Yes
                    </span>
                  ) : (
                    <span className="badge bg-secondary">
                      <i className="bi bi-x-circle me-1"></i>
                      No
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Sleep Schedule */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <h6 className="text-muted mb-2">
                  <i className="bi bi-moon-stars me-2"></i>
                  Latest Asleep
                </h6>
                <p className="mb-0 fs-5 fw-bold">{formatTime(data.latest_asleep)}</p>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <h6 className="text-muted mb-2">
                  <i className="bi bi-sun me-2"></i>
                  Earliest Awake
                </h6>
                <p className="mb-0 fs-5 fw-bold">{formatTime(data.earliest_awake)}</p>
              </div>
            </div>
          </div>

          {/* Least Busy Days */}
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h6 className="text-muted mb-3">
                  <i className="bi bi-calendar-week me-2"></i>
                  Least Busy Days
                </h6>
                <div className="d-flex flex-wrap gap-2">
                  {data.least_busy_days.map((day, index) => (
                    <span key={index} className="badge bg-primary fs-6 py-2 px-3">
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Other Info */}
          {data.other_info && data.other_info !== 'no' && (
            <div className="col-12">
              <div className="card border-0 shadow-sm bg-light">
                <div className="card-body">
                  <h6 className="text-muted mb-2">
                    <i className="bi bi-info-circle me-2"></i>
                    Additional Information
                  </h6>
                  <p className="mb-0">{data.other_info}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary" onClick={editPrefs}>
          Edit
        </button>
        <button className="btn btn-secondary" onClick={onHide}>
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
}

export function PreferencesPopup({ onEdit }: {onEdit: () => void }) {
  const [showPopup, setShowPopup] = React.useState(false);
  const {
    schedulePrefs,
    loading
  } = useUserAccount();
  if (loading || !schedulePrefs) return (
  <button className="btn btn-light btn-sm m-2 my-0">Calendar Preferences
      <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
      </Spinner>
  </button>)

  if (!schedulePrefs) return (
    <p>No schedule perferences</p>
  );
  
  const data: UserScheduleData = {
    busyness: schedulePrefs.busyness,
    other_info: schedulePrefs.other_info,
    // school_work: schedulePrefs.school_work,
    latest_asleep: schedulePrefs.latest_asleep,
    earliest_awake: schedulePrefs.earliest_awake,
    morning_person: schedulePrefs.morning_person,
    least_busy_days: schedulePrefs.least_busy_days,
    study_session_length: schedulePrefs.study_session_length
  };

  return (
    <div>
      <button 
        className="btn btn-light btn-sm m-2 my-0"
        onClick={() => setShowPopup(true)}
      >
        Calendar Preferences
      </button>
      
      <PreferencesPopupObject 
        show={showPopup}
        onHide={() => setShowPopup(false)}
        data={data}
        onEdit={onEdit}
      />
    </div>
  );
}