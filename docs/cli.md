# CLI

Commands:

- `decor render`: render a decorated image or video.
- `decor preview`: render a preview through the same pipeline.
- `decor validate`: validate a config file.
- `decor list-templates`: list built-in templates.
- `decor doctor`: check `ffmpeg` and `ffprobe`.
- `decor config`: inspect config path resolution.

Common flags: `--json`, `--input`, `--input-url`, `--input-base64`, `--output`, `--template`, `--config`, `--padding`, `--radius`, `--alignment`, `--crop`, `--text`, `--quality`, `--overwrite`.

Exit codes: `0` success, `1` user/config error, `4` runtime or dependency error.
