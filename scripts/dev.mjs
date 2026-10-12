import { spawn } from "node:child_process";
const children = [
  spawn(process.execPath, ["--watch", "apps/api/server.js"], {
    stdio: "inherit",
  }),
  spawn("npm", ["run", "dev", "-w", "@rentdesk/web"], { stdio: "inherit" }),
];
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
}
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, stop);
for (const child of children)
  child.on("exit", (code) => {
    stop();
    if (code) process.exitCode = code;
  });
