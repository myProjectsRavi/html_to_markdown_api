import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const packages = lock.packages ?? {};

function exactVersion(value) {
  return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(value);
}

const manifestProblems = [];
for (const section of ["dependencies", "devDependencies"]) {
  for (const [name, version] of Object.entries(pkg[section] ?? {})) {
    if (!exactVersion(String(version))) {
      manifestProblems.push(`${section} ${name} is not exact: ${version}`);
    }
  }
}
if (pkg.packageManager !== "npm@10.9.7") {
  manifestProblems.push(`unexpected packageManager: ${pkg.packageManager}`);
}

const allowedInstallScripts = new Map([
  ["node_modules/esbuild", "0.28.1"],
  ["node_modules/fsevents", "2.3.3"],
  ["node_modules/workerd", "1.20260925.1"],
]);

const installScripts = [];
const runtimePackages = [];
const runtimeLicenses = new Set();
const dependencyProblems = [];

for (const [path, meta] of Object.entries(packages)) {
  if (!path || typeof meta !== "object" || meta === null) continue;
  const value = meta;
  if (value.hasInstallScript) {
    installScripts.push({ path, version: value.version, dev: Boolean(value.dev) });
    if (allowedInstallScripts.get(path) !== value.version) {
      dependencyProblems.push(`unreviewed install script: ${path}@${value.version ?? "unknown"}`);
    }
    if (!value.dev) {
      dependencyProblems.push(`runtime dependency has install script: ${path}@${value.version ?? "unknown"}`);
    }
  }
  if (!value.dev && path.startsWith("node_modules/")) {
    runtimePackages.push({
      path,
      version: value.version ?? null,
      license: value.license ?? null,
      integrity: Boolean(value.integrity),
    });
    if (!value.version || !value.license || !value.integrity) {
      dependencyProblems.push(`runtime metadata incomplete: ${path}`);
    }
    if (value.license) runtimeLicenses.add(value.license);
  }
}

for (const [path, version] of allowedInstallScripts) {
  if (!installScripts.some((item) => item.path === path && item.version === version)) {
    dependencyProblems.push(`reviewed install-script package changed or disappeared: ${path}@${version}`);
  }
}

if (manifestProblems.length || dependencyProblems.length) {
  console.error(JSON.stringify({ manifestProblems, dependencyProblems, installScripts, runtimePackages }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  package_manager: pkg.packageManager,
  runtime_package_count: runtimePackages.length,
  runtime_packages: runtimePackages,
  runtime_licenses: [...runtimeLicenses].sort(),
  reviewed_install_scripts: installScripts,
  policy_findings: 0,
}, null, 2));
