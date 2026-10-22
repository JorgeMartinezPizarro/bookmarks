/**
 * Shapes of the JSON reports written by the private producer tool.
 * Every field is optional on purpose: the UI must degrade gracefully when a
 * file is missing or a field is absent.
 */

export type SystemReport = {
  model?: string;
  resources?: { cpu?: { cores?: number } };
  summary?: { cpu_usage?: number; ram_usage?: number; disk_usage?: number };
};

export type DockerContainer = {
  name: string;
  /** e.g. "Up 3 days (healthy)", "Up 5 minutes (unhealthy)", "Up 2 hours (Paused)" */
  status: string;
  /** Percent string as printed by `docker stats`, e.g. "4.21%" */
  cpu?: string;
  memory?: string;
};

export type IpCount = { ip: string; count: number };

export type AccessReport = {
  login?: IpCount[];
  fails?: IpCount[];
  banned_ips?: string[];
};
