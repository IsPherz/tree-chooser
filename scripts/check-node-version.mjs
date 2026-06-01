const required = [
  { major: 20, minor: 19 },
  { major: 22, minor: 12 },
];

const version = process.versions.node.split(".").map(Number);
const [major, minor] = version;

const supported =
  (major === 20 && minor >= 19) ||
  (major > 20 && major < 22) ||
  (major === 22 && minor >= 12) ||
  major > 22;

if (!supported) {
  console.error(
    `Node.js ${process.versions.node} is not supported. Use Node.js 20.19+ or 22.12+ (see .nvmrc).`,
  );
  console.error("Windows: winget install OpenJS.NodeJS.LTS — then reopen the terminal.");
  process.exit(1);
}
