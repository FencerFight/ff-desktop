// components/ui/TimePicker.tsx
import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import styles from './index.module.css';

interface TimePickerProps {
  value: number; // время в секундах
  onChange: (seconds: number) => void;
  min?: number; // минимальное время в секундах
  max?: number; // максимальное время в секундах
  step?: number; // шаг изменения в секундах
  disabled?: boolean;
  className?: string;
}

export default function TimePicker({
  value,
  onChange,
  min = 0,
  max = 3600, // 1 час по умолчанию
  step = 1,
  disabled = false,
  className = ''
}: TimePickerProps) {
  const [isFocused, setIsFocused] = useState(false);
  const minutesInputRef = useRef<HTMLInputElement>(null);
  const secondsInputRef = useRef<HTMLInputElement>(null);

  // Преобразование секунд в минуты и секунды
  const getTimeParts = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return { minutes: mins, seconds: secs };
  };

  const { minutes, seconds } = getTimeParts(value);
  const [minutesValue, setMinutesValue] = useState(minutes.toString());
  const [secondsValue, setSecondsValue] = useState(seconds.toString().padStart(2, '0'));

  // Синхронизация с внешним value
  useEffect(() => {
    if (!isFocused) {
      const { minutes: mins, seconds: secs } = getTimeParts(value);
      setMinutesValue(mins.toString());
      setSecondsValue(secs.toString().padStart(2, '0'));
    }
  }, [value, isFocused]);

  // Обновление общего значения
  const updateTotalValue = (mins: number, secs: number) => {
    const totalSeconds = mins * 60 + secs;
    const clampedValue = Math.min(Math.max(totalSeconds, min), max);
    onChange(clampedValue);
  };

  // Обработчики для минут
  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue === '' || /^\d*$/.test(newValue)) {
      setMinutesValue(newValue);
    }
  };

  const handleMinutesBlur = () => {
    let numericValue = parseInt(minutesValue, 10) || 0;
    const maxMinutes = Math.floor(max / 60);
    numericValue = Math.min(Math.max(numericValue, 0), maxMinutes);

    setMinutesValue(numericValue.toString());
    updateTotalValue(numericValue, parseInt(secondsValue, 10));
  };

  const incrementMinutes = () => {
    if (disabled) return;
    const currentMins = parseInt(minutesValue, 10) || 0;
    const newMins = Math.min(currentMins + 1, Math.floor(max / 60));
    setMinutesValue(newMins.toString());
    updateTotalValue(newMins, parseInt(secondsValue, 10));
  };

  const decrementMinutes = () => {
    if (disabled) return;
    const currentMins = parseInt(minutesValue, 10) || 0;
    const newMins = Math.max(currentMins - 1, 0);
    setMinutesValue(newMins.toString());
    updateTotalValue(newMins, parseInt(secondsValue, 10));
  };

  // Обработчики для секунд
  const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue === '' || /^\d*$/.test(newValue)) {
      setSecondsValue(newValue);
    }
  };

  const handleSecondsBlur = () => {
    let numericValue = parseInt(secondsValue, 10) || 0;
    numericValue = Math.min(Math.max(numericValue, 0), 59);

    setSecondsValue(numericValue.toString().padStart(2, '0'));
    updateTotalValue(parseInt(minutesValue, 10), numericValue);
  };

  const incrementSeconds = () => {
    if (disabled) return;
    const currentSecs = parseInt(secondsValue, 10) || 0;
    let newSecs = currentSecs + step;
    let carryOverMins = 0;

    if (newSecs >= 60) {
      carryOverMins = Math.floor(newSecs / 60);
      newSecs = newSecs % 60;
    }

    const currentMins = parseInt(minutesValue, 10) || 0;
    const totalMins = currentMins + carryOverMins;
    const maxMinutes = Math.floor(max / 60);

    if (totalMins <= maxMinutes) {
      setSecondsValue(newSecs.toString().padStart(2, '0'));
      setMinutesValue(totalMins.toString());
      updateTotalValue(totalMins, newSecs);
    }
  };

  const decrementSeconds = () => {
    if (disabled) return;
    const currentSecs = parseInt(secondsValue, 10) || 0;
    let newSecs = currentSecs - step;
    let borrowMins = 0;

    if (newSecs < 0) {
      borrowMins = Math.ceil(Math.abs(newSecs) / 60);
      newSecs = 60 - (Math.abs(newSecs) % 60);
      if (newSecs === 60) newSecs = 0;
    }

    const currentMins = parseInt(minutesValue, 10) || 0;
    const totalMins = Math.max(currentMins - borrowMins, 0);

    setSecondsValue(newSecs.toString().padStart(2, '0'));
    setMinutesValue(totalMins.toString());
    updateTotalValue(totalMins, newSecs);
  };

  // Обработчики клавиш
  const handleMinutesKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      incrementMinutes();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      decrementMinutes();
    } else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      secondsInputRef.current?.focus();
    }
  };

  const handleSecondsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      incrementSeconds();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      decrementSeconds();
    } else if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      minutesInputRef.current?.focus();
    }
  };

  const handleFocus = () => setIsFocused(true);

  const disabledClass = disabled ? styles.disabled : '';

  return (
    <div className={`${styles.container} ${disabledClass} ${className}`}>
      {/* Минуты */}
      <div className={styles.timePart}>
        <div className={styles.buttons}>
          <button
            type="button"
            className={styles.button}
            onClick={incrementMinutes}
            disabled={disabled}
            aria-label="Увеличить минуты"
          >
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            className={styles.button}
            onClick={decrementMinutes}
            disabled={disabled}
            aria-label="Уменьшить минуты"
          >
            <ChevronDown size={14} />
          </button>
        </div>
        <input
          ref={minutesInputRef}
          type="text"
          inputMode="numeric"
          className={styles.input}
          value={minutesValue}
          onChange={handleMinutesChange}
          onBlur={handleMinutesBlur}
          onFocus={handleFocus}
          onKeyDown={handleMinutesKeyDown}
          disabled={disabled}
          aria-label="Минуты"
        />
      </div>

      <span className={styles.separator}>:</span>

      {/* Секунды */}
      <div className={styles.timePart}>
        <input
          ref={secondsInputRef}
          type="text"
          inputMode="numeric"
          className={styles.input}
          value={secondsValue}
          onChange={handleSecondsChange}
          onBlur={handleSecondsBlur}
          onFocus={handleFocus}
          onKeyDown={handleSecondsKeyDown}
          disabled={disabled}
          aria-label="Секунды"
        />
        <div className={styles.buttons}>
          <button
            type="button"
            className={styles.button}
            onClick={incrementSeconds}
            disabled={disabled}
            aria-label="Увеличить секунды"
          >
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            className={styles.button}
            onClick={decrementSeconds}
            disabled={disabled}
            aria-label="Уменьшить секунды"
          >
            <ChevronDown size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}