import { useState } from "react";
import "./StarRating.css";

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export default function StarRating({ value = 0, onRate, disabled = false }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value; // preview while hovering, otherwise the saved value

  // Which half of the star is the mouse over?
  function valueFromPointer(e, star) {
    const rect = e.currentTarget.getBoundingClientRect();
    const inLeftHalf = e.clientX - rect.left < rect.width / 2;
    return inLeftHalf ? star - 0.5 : star;
  }

  function handleKeyDown(e) {
    if (disabled) return;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onRate(Math.min(5, value + 0.5));
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onRate(Math.max(0.5, (value || 1) - 0.5));
    }
  }

  return (
    <div
      className={`stars ${disabled ? "stars-disabled" : ""}`}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label="Your rating"
      aria-valuemin={0.5}
      aria-valuemax={5}
      aria-valuenow={value || undefined}
      aria-valuetext={value ? `${value} out of 5 stars` : "Not rated"}
      aria-disabled={disabled}
      onKeyDown={handleKeyDown}
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.max(0, Math.min(1, shown - (star - 1))); // 0, 0.5 or 1
        return (
          <span
            key={star}
            className="star"
            onMouseMove={(e) => !disabled && setHover(valueFromPointer(e, star))}
            onClick={(e) => !disabled && onRate(valueFromPointer(e, star))}
          >
            <StarIcon />
            <span className="star-fill" style={{ width: `${fill * 100}%` }}>
              <StarIcon />
            </span>
          </span>
        );
      })}
    </div>
  );
}