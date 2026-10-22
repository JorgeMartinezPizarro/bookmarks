"use client";
import React from "react";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlineOutlined";
import { clampPct, severity, SEVERITY_LABEL } from "@/app/pages/monitor/lib";

type Props = {
  label: string;
  /** 0..100, or null when the report has no usable value. */
  value: number | null;
  icon: React.ReactNode;
  /** Secondary line, e.g. "4 cores". */
  hint?: string;
};

const SEVERITY_ICON = {
  good: <CheckCircleOutlineIcon fontSize="inherit" />,
  warning: <WarningAmberIcon fontSize="inherit" />,
  critical: <ErrorOutlineIcon fontSize="inherit" />,
};

export function StatTile({ label, value, icon, hint }: Props) {
  if (value === null) {
    return (
      <article className="tile tile--nodata" aria-label={`${label}: no data`}>
        <header className="tile__head">
          <span className="tile__icon" aria-hidden="true">{icon}</span>
          <span className="tile__label">{label}</span>
        </header>
        <div className="tile__value tile__value--nodata">—</div>
        <div className="meter" aria-hidden="true" />
        <footer className="tile__foot">
          <span className="status status--nodata">
            <HelpOutlineIcon fontSize="inherit" />
            No data
          </span>
          {hint && <span className="tile__hint">{hint}</span>}
        </footer>
      </article>
    );
  }

  const v = clampPct(value);
  const sev = severity(v);
  const [whole, frac] = v.toFixed(1).split(".");

  return (
    <article className={`tile tile--${sev}`} aria-label={`${label} ${v.toFixed(1)} percent, ${SEVERITY_LABEL[sev]}`}>
      <header className="tile__head">
        <span className="tile__icon" aria-hidden="true">{icon}</span>
        <span className="tile__label">{label}</span>
      </header>

      <div className="tile__value">
        {whole}
        <span className="tile__frac">.{frac}</span>
        <span className="tile__unit">%</span>
      </div>

      <div
        className="meter"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(v)}
        aria-label={label}
      >
        <div className="meter__fill" style={{ width: `${v}%` }} />
      </div>

      <footer className="tile__foot">
        <span className={`status status--${sev}`}>
          {SEVERITY_ICON[sev]}
          {SEVERITY_LABEL[sev]}
        </span>
        {hint && <span className="tile__hint">{hint}</span>}
      </footer>
    </article>
  );
}
