// components/ui/Counter.tsx
import { Minus, Plus } from "lucide-react";
import React from "react";
import styles from "./index.module.css";

interface CounterProps {
  label: string;
  value: number;
  onInc: React.Dispatch<React.SetStateAction<number>>;
  onDec: React.Dispatch<React.SetStateAction<number>>;
  min?: number;
  max?: number;
  className?: string;
}

export default function Counter({
  label,
  value,
  onInc,
  onDec,
  min = 0,
  max = Infinity,
  className = ""
}: CounterProps) {
  const inc = () => {
    if (value < max) {
      onInc((s: number) => s + 1);
    }
  };

  const dec = () => {
    if (value > min) {
      onDec((s: number) => Math.max(min, s - 1));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  };

  const isMin = value <= min;
  const isMax = value >= max;

  return (
    <div className={`${styles.wrap} ${className}`}>
      <span className={styles.counterLabel}>{label}</span>
      <div className={styles.counterRow}>
        <button
          className={`${styles.counterButton} ${isMin ? styles.disabled : ""}`}
          onClick={dec}
          onKeyPress={(e) => handleKeyPress(e, dec)}
          disabled={isMin}
          aria-label={`Уменьшить ${label}`}
          type="button"
        >
          <Minus size={20} color={isMin ? "#666" : "var(--fg)"} />
        </button>

        <span className={styles.counterValue}>{value}</span>

        <button
          className={`${styles.counterButton} ${isMax ? styles.disabled : ""}`}
          onClick={inc}
          onKeyPress={(e) => handleKeyPress(e, inc)}
          disabled={isMax}
          aria-label={`Увеличить ${label}`}
          type="button"
        >
          <Plus size={20} color={isMax ? "#666" : "var(--fg)"} />
        </button>
      </div>
    </div>
  );
}