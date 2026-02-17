import React from "react";
import "../../styles/LoadingOverlay.css";

interface LoadingOverlayProps {
  show: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  show,
  message = "Loading...",
}) => {
  if (!show) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-overlay-content">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <i className="bi bi-heart-pulse loading-icon"></i>
        </div>
        <p className="loading-message">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
