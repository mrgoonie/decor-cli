# CLI

Commands:

- `decor render`: render a decorated image or video.
- `decor preview`: render a preview through the same pipeline.
- `decor validate`: validate a config file.
- `decor list-templates`: list built-in templates.
- `decor install-backgrounds`: download the default hosted background pack into a local folder.
- `decor doctor`: check `ffmpeg` and `ffprobe`.
- `decor config`: inspect config path resolution.

Common flags: `--json`, `--input`, `--input-url`, `--input-base64`, `--output`, `--template`, `--config`, `--padding`, `--radius`, `--alignment`, `--crop`, `--text`, `--quality`, `--overwrite`.

Default background install:

```bash
decor install-backgrounds
decor render --input screenshot.png --output output.png --background-folder ~/.decor-cli/backgrounds --overwrite
```

Installer flags:

- `--dir <path>`: install to a custom folder instead of `~/.decor-cli/backgrounds`.
- `--force`: redownload files that already match the committed manifest.
- `--json`: print `{ installDir, installed, updated, skipped, files }`.

Exit codes: `0` success, `1` user/config error, `4` runtime or dependency error.
