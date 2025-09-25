"use client";
import React from "react";

type ChartProps = {
  label: string;
  value: number; // porcentaje 0–100
};

export function Chart({ label, value }: ChartProps) {
  return (
    <div className="my-chart">
      <div className="progress-bar">
		<div className="progress-fill" style={{width: value + "%"}}></div>
	  </div>
      <div className="my-label">
        {label}: {value.toFixed(1)}%
      </div>
    </div>
  );
}
