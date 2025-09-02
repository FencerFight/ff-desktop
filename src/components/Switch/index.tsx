// components/ui/Switch.tsx
import React from "react";
import styles from "./index.module.css";

interface SwitchProps {
  title: string;
  value: boolean;
  setValue: React.Dispatch<React.SetStateAction<boolean>>;
  className?: string;
}

export default function Switch({ title, value, setValue, className = "" }: SwitchProps) {
  const handleToggle = () => {
    setValue(!value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setValue(!value);
    }
  };

  return (
    <div className={`${styles.switchRow} ${className}`}>
      <span className={styles.switchLabel}>{title}</span>
      <label className={styles.switch}>
        <input
          type="checkbox"
          checked={value}
          onChange={handleToggle}
          className={styles.switchInput}
          aria-label={title}
        />
        <span
          className={`${styles.slider} ${value ? styles.sliderActive : ""}`}
          tabIndex={0}
          onKeyPress={handleKeyPress}
          role="switch"
          aria-checked={value}
        />
      </label>
    </div>
  );
}