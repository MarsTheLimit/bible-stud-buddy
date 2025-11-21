"use client";
import { useState } from "react";
import { Button, Form } from "react-bootstrap";

export default function ProfileContent({
  displayName,
  onChangeName
}: {
  displayName: string | null | undefined,
  onChangeName: (newName: string) => void
}) {
  const [showPopup, setShowPopup] = useState(false);
  const [inputValue, setInputValue] = useState("");

  function togglePopup() {
    setShowPopup(!showPopup);
    if (!showPopup) {
      setInputValue(displayName || "");
    }
  }

  function handleSubmit() {
    onChangeName(inputValue);  // Pass the value here
    setShowPopup(false);
  }

  return (
    <div>
        <div>
            <div className="card-body p-5 bg-gradient" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <div className="text-dark">
                    <h1 className="text-gradient display-4 fw-bold mb-3">
                        Welcome back, {displayName || 'Guest'}
                    </h1>
                    <p className="mb-4 opacity-90">
                        Manage your profile and preferences
                    </p>
                    <Button 
                        variant="light" 
                        size="lg" 
                        onClick={togglePopup}
                        className="px-4 py-2 fw-semibold shadow"
                    >
                        <i className="bi bi-pencil-square me-2"></i>
                        Change Display Name
                    </Button>
                </div>
            </div>
      </div>
      
      {showPopup && (
        <>
          {/* Backdrop - now covering entire viewport */}
          <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 9999  // Higher z-index to cover everything
            }}
            onClick={togglePopup}
          />
          
          {/* Popup */}
          <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10000,
                width: '90%',
                maxWidth: '500px'
                }}>
                <div className="card shadow-lg border-0 rounded-4">
                    <div className="card-header bg-primary text-white py-3">
                        <h4 className="mb-0">Change Display Name</h4>
                    </div>
                    <div className="card-body p-4">
                    <Form>
                        <Form.Group className="mb-4">
                            <Form.Label className="fw-semibold mb-2">Display Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Leave blank to revert to email"
                                className="form-control-lg"
                                autoFocus
                            />
                        </Form.Group>
                        <div className="d-flex gap-2 justify-content-end">
                            <Button 
                                variant="secondary" 
                                onClick={togglePopup}
                            >
                                Cancel
                            </Button>
                            <Button 
                                variant="primary" 
                                onClick={handleSubmit}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </Form>
                </div>
            </div>
            </div>
        </>
      )}
    </div>
  );
}