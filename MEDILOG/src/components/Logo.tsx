import React from "react";

interface LogoProps {
  size?: "small" | "medium" | "large";
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = "large", showText = true }) => {
  const sizeMap = {
    small: 35,
    medium: 50,
    large: 70,
  };

  const dimension = sizeMap[size];

  return (
    <div className="logo-section" style={showText ? {} : { gap: 0 }}>
      <div className="logo-icon">
        <svg
          width={dimension}
          height={dimension}
          viewBox="0 0 70 70"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background */}
          <rect width="70" height="70" fill="#2c5f2d" />
          {/* Folded corner */}
          <path d="M70 0L70 22L48 0L70 0Z" fill="white" />
          {/* Plus symbol - vertical */}
          <rect x="31" y="20" width="8" height="30" rx="2" fill="white" />
          {/* Plus symbol - horizontal */}
          <rect x="20" y="31" width="30" height="8" rx="2" fill="white" />
        </svg>
      </div>
      {showText && <h1 className="logo-text">MEDILOG</h1>}
    </div>
  );
};

export default Logo;
