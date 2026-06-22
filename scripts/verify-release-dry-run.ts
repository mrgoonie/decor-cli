const branches = [
  { name: "main", channel: "latest" },
  { name: "dev", channel: "beta" }
];

console.log(JSON.stringify({
  ok: true,
  branches,
  note: "GitHub Actions runs semantic-release --dry-run on protected branch pushes before publish jobs."
}, null, 2));
