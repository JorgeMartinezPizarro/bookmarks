"use client";

import React from "react";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import MemoryOutlinedIcon from "@mui/icons-material/MemoryOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import "./styles.css";
import { useStats } from "@/app/hooks/useStats";
import { StatTile } from "@/app/components/monitor/StatTile";
import { LiveBadge } from "@/app/components/monitor/LiveBadge";
import { DockerPanel } from "@/app/components/monitor/DockerPanel";
import { SecurityPanel } from "@/app/components/monitor/SecurityPanel";
import type { AccessReport, DockerContainer, SystemReport } from "./types";

export default function Monitor() {
  const { stats, timestamp, lastFetch, error } = useStats();

  const system = stats["system.json"]?.content as SystemReport | undefined;
  const docker = stats["docker.json"]?.content as DockerContainer[] | undefined;
  const access = stats["access.json"]?.content as AccessReport | undefined;

  const cores = system?.resources?.cpu?.cores || 1;
  const hasAnything = Boolean(system || docker || access);

  return (
    <main className="dash">
      <header className="dash__header">
        <div>
          <h1 className="dash__title">System monitor</h1>
          <p className="dash__host">{system?.model ?? "—"}</p>
        </div>
        <LiveBadge timestamp={timestamp} lastFetch={lastFetch} error={error} />
      </header>

      {!hasAnything && (
        <section className="empty" aria-busy="true">
          <div className="kpis kpis--ghost" aria-hidden="true">
            <div className="tile tile--ghost" />
            <div className="tile tile--ghost" />
            <div className="tile tile--ghost" />
          </div>
          <p className="empty__text">
            {error ? `Cannot reach the report endpoint (${error}).` : "Waiting for the first report…"}
          </p>
        </section>
      )}

      {system && (
        <section className="kpis" aria-label="Resources">
          <StatTile
            label="CPU"
            value={system.summary?.cpu_usage ?? 0}
            icon={<SpeedOutlinedIcon fontSize="inherit" />}
            hint={`${cores} ${cores === 1 ? "core" : "cores"}`}
          />
          <StatTile label="Memory" value={system.summary?.ram_usage ?? 0} icon={<MemoryOutlinedIcon fontSize="inherit" />} />
          <StatTile label="Disk" value={system.summary?.disk_usage ?? 0} icon={<StorageOutlinedIcon fontSize="inherit" />} />
        </section>
      )}

      {(docker || access) && (
        <section className="panels">
          {docker && <DockerPanel containers={docker} cores={cores} />}
          {access && <SecurityPanel access={access} />}
        </section>
      )}
    </main>
  );
}
