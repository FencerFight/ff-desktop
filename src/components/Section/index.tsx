import styles from './index.module.css';
import React from 'react';

interface SectionProps {
  title?: string;
  children: React.ReactNode;
  row?: boolean;
  className?: string;
}

export default function Section({ title, children, row = false, className = '' }: SectionProps) {
  return (
    <div
      className={`${styles.section} ${className}`}
    >
      {title && (
        <h3
          className={styles.section_title}
        >
          {title}
        </h3>
      )}
      <div
        className={row ? styles.section_row : styles.section_content}
      >
        {children}
      </div>
    </div>
  );
}