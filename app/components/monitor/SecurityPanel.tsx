"use client";
import React, { useMemo, useState } from "react";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import LoginIcon from "@mui/icons-material/Login";
import GppBadOutlinedIcon from "@mui/icons-material/GppBadOutlined";
import BlockIcon from "@mui/icons-material/Block";
import { Panel } from "./Panel";
import { banScript, compact, summarizeAccess } from "@/app/pages/monitor/lib";
import type { AccessReport, IpCount } from "@/app/pages/monitor/types";

type Props = { access: AccessReport | undefined };

const PREVIEW = 6;

function IpList({
  items,
  kind,
  unit,
  empty,
}: {
  items: IpCount[];
  kind: "fail" | "ok";
  unit: string;
  empty: string;
}) {
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, PREVIEW);
  const max = items[0]?.count || 1;

  if (items.length === 0) return <p className="muted">{empty}</p>;

  return (
    <>
      <ul className="ips">
        {shown.map((row) => (
          <li key={row.ip} className={`ip ip--${kind}`}>
            <code className="ip__addr">{row.ip}</code>
            <span className="ip__bar" aria-hidden="true">
              <span className="ip__fill" style={{ width: `${(row.count / max) * 100}%` }} />
            </span>
            <span className="ip__count">
              <strong>{compact(row.count)}</strong> {unit}
            </span>
          </li>
        ))}
      </ul>
      {items.length > PREVIEW && (
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAll(!all)}>
          {all ? "Show fewer" : `Show all ${items.length}`}
        </button>
      )}
    </>
  );
}

export function SecurityPanel({ access }: Props) {
  const s = useMemo(() => summarizeAccess(access), [access]);
  const script = useMemo(() => banScript(s.attackers.map((a) => a.ip)), [s.attackers]);
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied("done");
    } catch {
      // Clipboard is unavailable in insecure contexts / some iframes:
      // the script stays visible below for manual copy.
      setCopied("failed");
    }
    setTimeout(() => setCopied("idle"), 2500);
  };

  const threat = s.attackers.length > 0;

  return (
    <Panel
      title="SSH access"
      subtitle={`${compact(s.totalFailed)} failed attempts · ${compact(s.totalLogins)} successful`}
      icon={<ShieldOutlinedIcon fontSize="inherit" />}
    >
      <div className="ministats">
        <div className="ministat">
          <span className="ministat__icon ministat__icon--good"><LoginIcon fontSize="inherit" /></span>
          <span className="ministat__value">{s.logins.length}</span>
          <span className="ministat__label">Login IPs</span>
        </div>
        <div className="ministat">
          <span className={`ministat__icon ${threat ? "ministat__icon--critical" : "ministat__icon--good"}`}>
            <GppBadOutlinedIcon fontSize="inherit" />
          </span>
          <span className="ministat__value">{s.attackers.length}</span>
          <span className="ministat__label">Attackers</span>
        </div>
        <div className="ministat">
          <span className="ministat__icon"><BlockIcon fontSize="inherit" /></span>
          <span className="ministat__value">{s.banned.length}</span>
          <span className="ministat__label">Banned IPs</span>
        </div>
      </div>

      <div className="action">
        <button
          type="button"
          className={`btn btn--primary ${copied === "done" ? "btn--done" : ""}`}
          onClick={copy}
          disabled={!threat}
          aria-live="polite"
        >
          {copied === "done" ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
          {copied === "done"
            ? `Copied ${s.attackers.length} rules`
            : copied === "failed"
              ? "Clipboard blocked, copy below"
              : threat
                ? `Copy ban script (${s.attackers.length})`
                : "Nothing to ban"}
        </button>
        {threat && (
          <details className="script" open={copied === "failed" || undefined}>
            <summary>Show script</summary>
            <pre>{script}</pre>
          </details>
        )}
      </div>

      <div className="iplists">
        <div>
          <h3 className="sub">Attackers not yet banned</h3>
          <IpList items={s.attackers} kind="fail" unit="failed" empty="Every attacker is banned." />
        </div>
        <div>
          <h3 className="sub">Successful logins</h3>
          <IpList items={s.logins} kind="ok" unit="logins" empty="No successful logins." />
        </div>
      </div>

      {s.banned.length > 0 && (
        <details className="banned">
          <summary>Banned IPs ({s.banned.length})</summary>
          <p className="banned__list">
            {s.banned.map((ip) => (
              <code key={ip}>{ip}</code>
            ))}
          </p>
        </details>
      )}
    </Panel>
  );
}
