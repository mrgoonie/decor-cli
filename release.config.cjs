module.exports = {
  branches: [
    "main",
    { name: "dev", prerelease: "beta", channel: "beta" }
  ],
  tagFormat: "v${version}",
  plugins: [
    ["@semantic-release/commit-analyzer", { preset: "conventionalcommits" }],
    ["@semantic-release/release-notes-generator", { preset: "conventionalcommits" }],
    ["@semantic-release/changelog", { changelogFile: "CHANGELOG.md" }],
    ["@semantic-release/npm", { npmPublish: true, pkgRoot: "packages/core", tarballDir: "dist-releases" }],
    ["@semantic-release/npm", { npmPublish: true, pkgRoot: "packages/cli", tarballDir: "dist-releases" }],
    ["@semantic-release/npm", { npmPublish: true, pkgRoot: "packages/mcp", tarballDir: "dist-releases" }],
    ["@semantic-release/github", { successComment: false, failComment: false }],
    ["@semantic-release/git", { assets: ["CHANGELOG.md", "package.json", "packages/*/package.json", "package-lock.json"], message: "build(release): ${nextRelease.version} [skip ci]" }]
  ]
};
