// Rewrites mock/system.json and mock/docker.json every 2 s with jittered
// values so the dashboard can be exercised locally without the real producer.
//   WATCH_DIR=./mock npm run dev   (in another terminal: npm run mock)
const fs = require("fs");
const path = require("path");

const dir = __dirname;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const jitter = (v, amt) => Math.round(clamp(v + (Math.random() - 0.5) * amt, 0, 100) * 10) / 10;

setInterval(() => {
  const sysPath = path.join(dir, "system.json");
  const system = JSON.parse(fs.readFileSync(sysPath, "utf8"));
  const s = system.summary;
  s.cpu_usage = jitter(s.cpu_usage, 20);
  s.ram_usage = jitter(s.ram_usage, 4);
  s.disk_usage = jitter(s.disk_usage, 0.4);
  fs.writeFileSync(sysPath, JSON.stringify(system, null, 2));

  const dockPath = path.join(dir, "docker.json");
  const docker = JSON.parse(fs.readFileSync(dockPath, "utf8"));
  for (const c of docker) {
    c.cpu = jitter(parseFloat(c.cpu), 3).toFixed(2) + "%";
    c.memory = jitter(parseFloat(c.memory), 0.6).toFixed(2) + "%";
  }
  fs.writeFileSync(dockPath, JSON.stringify(docker, null, 2));
  process.stdout.write(`\rcpu ${s.cpu_usage}%  ram ${s.ram_usage}%  disk ${s.disk_usage}%   `);
}, 2000);
