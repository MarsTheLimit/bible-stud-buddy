import { Spinner } from "react-bootstrap";

export const LoadingSpinner = ({ text }: { text: string }) => (
    <div className="text-center py-5">
      <Spinner animation="border" role="status" variant="primary" className="mb-3">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      <p className="text-muted">{text}</p>
    </div>
  );