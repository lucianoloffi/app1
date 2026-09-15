import { useEffect, useRef, useState } from "react";
import styles from "./RangeSlider.module.css";

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  /** Um valor = alça única; dois valores = alça dupla (faixa). */
  values: number[];
  /** Distância mínima entre as duas alças (somente para alça dupla). */
  minGap?: number;
  onChange: (values: number[]) => void;
  /** Disparado quando o usuário solta a alça (útil para efeitos por mudança, como um toast). */
  onCommit?: (values: number[]) => void;
  ariaLabels?: string[];
}

export function RangeSlider({
  min,
  max,
  step = 1,
  values,
  minGap = step,
  onChange,
  onCommit,
  ariaLabels,
}: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const latestValues = useRef(values);
  latestValues.current = values;

  function snap(value: number) {
    const snapped = Math.round((value - min) / step) * step + min;
    return Math.min(max, Math.max(min, snapped));
  }

  function valueFromClientX(clientX: number) {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return min;
    const ratio = (clientX - rect.left) / rect.width;
    return snap(min + ratio * (max - min));
  }

  function commit(index: number, rawValue: number) {
    const next = [...values];
    if (values.length === 2) {
      if (index === 0) {
        next[0] = Math.min(rawValue, values[1] - minGap);
      } else {
        next[1] = Math.max(rawValue, values[0] + minGap);
      }
    } else {
      next[0] = rawValue;
    }
    onChange(next);
  }

  function nearestIndex(value: number) {
    if (values.length === 1) return 0;
    return Math.abs(value - values[0]) <= Math.abs(value - values[1]) ? 0 : 1;
  }

  function handleTrackPointerDown(e: React.PointerEvent) {
    const value = valueFromClientX(e.clientX);
    const index = nearestIndex(value);
    commit(index, value);
    setDraggingIndex(index);
  }

  function handleThumbPointerDown(index: number) {
    return (e: React.PointerEvent) => {
      e.stopPropagation();
      setDraggingIndex(index);
    };
  }

  useEffect(() => {
    if (draggingIndex === null) return;

    function handleMove(e: PointerEvent) {
      commit(draggingIndex as number, valueFromClientX(e.clientX));
    }
    function handleUp() {
      setDraggingIndex(null);
      onCommit?.(latestValues.current);
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingIndex, values]);

  function percent(value: number) {
    return ((value - min) / (max - min)) * 100;
  }

  const fillStart = values.length === 2 ? percent(values[0]) : 0;
  const fillEnd = values.length === 2 ? percent(values[1]) : percent(values[0]);

  return (
    <div ref={trackRef} className={styles.track} onPointerDown={handleTrackPointerDown}>
      <div className={styles.rail} />
      <div
        className={styles.fill}
        style={{ left: `${fillStart}%`, width: `${fillEnd - fillStart}%` }}
      />
      {values.map((value, index) => (
        <div
          key={index}
          role="slider"
          tabIndex={0}
          aria-label={ariaLabels?.[index]}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          className={styles.thumb}
          style={{ left: `${percent(value)}%` }}
          onPointerDown={handleThumbPointerDown(index)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowUp") commit(index, value + step);
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") commit(index, value - step);
          }}
        />
      ))}
    </div>
  );
}
