// components/ui/Button.tsx
import { CSSProperties, ReactNode } from 'react';
import styles from './index.module.css';

interface ButtonProps {
  title?: string;
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
  stroke?: boolean;
  disabled?: boolean;
}

export default function Button({
  title,
  onClick,
  className = '',
  style = {},
  children,
  stroke = false,
  disabled = false,
}: ButtonProps) {
  const buttonClass = `${styles.button} ${stroke ? styles.stroke : styles.solid} ${disabled ? styles.disabled : ''} ${className}`;

  return (
    <button
      className={buttonClass}
      style={style}
      onClick={onClick}
      disabled={disabled}
    >
      {children ?? <span>{title}</span>}
    </button>
  );
}