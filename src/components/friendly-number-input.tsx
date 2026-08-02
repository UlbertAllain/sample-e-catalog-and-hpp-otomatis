"use client";

import { useEffect, useRef, useState } from "react";

type FriendlyNumberInputProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
};

function usesDecimal(step: string) {
  return step === "any" || step.includes(".");
}

function sanitizeInteger(raw: string) {
  return raw.replace(/\D/g, "");
}

function sanitizeDecimal(raw: string) {
  const compact = raw.replace(/\s/g, "").replace(/[^0-9.,]/g, "");

  // Format Indonesia: titik untuk ribuan dan koma untuk desimal.
  if (compact.includes(",")) {
    const [whole = "", ...decimalParts] = compact.split(",");
    const decimal = decimalParts.join("").replace(/\D/g, "");
    const integer = whole.replace(/\D/g, "");
    return decimalParts.length ? `${integer}.${decimal}` : integer;
  }

  const dots = compact.match(/\./g)?.length ?? 0;
  if (dots > 1) return compact.replace(/\./g, "");

  if (dots === 1) {
    const [whole = "", decimal = ""] = compact.split(".");
    // 1.000 lebih mungkin berarti seribu, sedangkan 0.5 berarti desimal.
    if (whole !== "0" && decimal.length === 3) return `${whole}${decimal}`;
    return `${whole}.${decimal}`;
  }

  return compact;
}

function toDraft(value: number) {
  return Number.isFinite(value) ? String(value) : "0";
}

export function FriendlyNumberInput({
  value,
  onChange,
  min = 0,
  max,
  step = "1",
  disabled = false,
  required = true,
  placeholder = "0",
  className = "",
  ariaLabel
}: FriendlyNumberInputProps) {
  const decimal = usesDecimal(step);
  const focused = useRef(false);
  const [draft, setDraft] = useState(() => toDraft(value));

  useEffect(() => {
    if (!focused.current) setDraft(toDraft(value));
  }, [value]);

  function update(raw: string) {
    const next = decimal ? sanitizeDecimal(raw) : sanitizeInteger(raw);
    setDraft(next);

    if (!next || next === ".") {
      onChange(0);
      return;
    }

    const parsed = Number(next);
    if (Number.isFinite(parsed)) onChange(parsed);
  }

  function finishEditing() {
    focused.current = false;

    const parsed = Number(draft);
    const safeValue = Number.isFinite(parsed) ? parsed : 0;
    setDraft(toDraft(safeValue));
    onChange(safeValue);
  }

  return (
    <input
      type="text"
      inputMode={decimal ? "decimal" : "numeric"}
      autoComplete="off"
      disabled={disabled}
      required={required}
      value={draft}
      placeholder={placeholder}
      aria-label={ariaLabel}
      data-min={min}
      data-max={max}
      onFocus={() => {
        focused.current = true;
        if (Number(value) === 0) setDraft("");
      }}
      onBlur={finishEditing}
      onChange={(event) => update(event.target.value)}
      className={className}
    />
  );
}
