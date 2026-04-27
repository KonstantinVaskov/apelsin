/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn } = require("child_process");
const os = require("os");
const path = require("path");

const projectRoot = path.join(__dirname, "..");
const port = String(process.env.PORT || "3000");

function getLanIps() {
  const out = new Set();
  for (const nets of Object.values(os.networkInterfaces())) {
    for (const n of nets || []) {
      if (n && n.family === "IPv4" && !n.internal) {
        out.add(n.address);
      }
    }
  }
  return [...out];
}

const ips = getLanIps();
if (ips.length > 0) {
  for (const ip of ips) {
    console.log(`  - Network:      http://${ip}:${port}`);
  }
  console.log("    ↑ открой это на телефоне (та же Wi‑Fi). Строка Next с 0.0.0.0 не подходит.\n");
} else {
  console.log("  (не найден IPv4 в LAN — проверь Wi‑Fi / ipconfig)\n");
}

const nextCli = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");

const child = spawn(
  process.execPath,
  [nextCli, "dev", "-H", "0.0.0.0", ...process.argv.slice(2)],
  {
    stdio: "inherit",
    cwd: projectRoot,
    env: process.env,
  }
);

child.on("exit", (code) => process.exit(typeof code === "number" ? code : 0));
child.on("error", (err) => {
  console.error(err);
  process.exit(1);
});
