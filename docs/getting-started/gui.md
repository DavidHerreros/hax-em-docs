# The Hax GUI

Prefer clicking to typing? The **Hax GUI** (`hax-em-gui`) is a modern **web interface** that
lets you run every Hax program from your browser — with friendly auto-generated forms, a job
manager with live logs, a server file browser, GPU selection and an embedded TensorBoard.

It runs on the **GPU server** and is reached from **any browser, on any machine** — no
desktop install, no Node, no build step.

!!! info "A separate, optional package"
    The GUI ships as its own package, `hax-em-gui`. It is **optional**: everything it does can
    also be done from [the command line](cli.md). Install it on top of an environment that
    already has `hax-em`.

!!! note "New and actively developed"
    The GUI is a recent addition. Core features — the program launcher, job console, file
    browser and TensorBoard embedding — are in place. Interactive `annotate_space` 3D
    visualization and a visual workflow builder are on the roadmap.

---

## What you get

- **Auto-generated forms** for all Hax programs. Each program's command-line options become
  labelled fields (with the same help text you see on the [program pages](../programs/index.md)),
  so you never have to remember flag names.
- **A job manager** — launch runs, watch **live logs** stream in, and revisit past jobs.
- **A server file browser** for picking input metadata, volumes and masks without typing paths.
- **GPU selection** discovered from `nvidia-smi`.
- **Embedded TensorBoard** for [`display_metrics`](../programs/display_metrics.md), so training
  curves appear right inside the GUI.
- **Projects & output folders** — organize runs per project, each with its own output folder.

The frontend is intentionally **build-tool-free** (plain ES modules + hand-written CSS served
directly by the backend), so there is no npm/`node_modules` supply chain and the browser only
ever talks to your server.

---

## Prerequisites

- A working **`hax-em` installation** in a Conda environment (see [Installation](installation.md)).
  The GUI launches your programs through `hax_project_manager`, so it must run in (or be able
  to reach) that environment.
- **Python ≥ 3.10**.

---

## Install

In the same Conda environment that has `hax-em` installed:

=== "From PyPI"

    ```bash
    pip install hax-em-gui
    ```

=== "From a clone (development)"

    ```bash
    git clone https://github.com/DavidHerreros/hax-em-gui.git
    cd hax-em-gui
    pip install -e .
    ```

This installs the backend dependencies (FastAPI, Uvicorn…) and the **`hax-gui`** command. The
web interface and a seed schema cache are bundled inside the package, so plain, editable and
`pip install git+<url>` installs all work out of the box.

### Refresh the program schemas (recommended)

The GUI builds its forms from a cached description of each program's CLI. A seed cache ships
with the package; regenerate it whenever a Hax program's options change:

```bash
hax-gui schemas        # from a clone: python backend/scripts/generate_schemas.py
```

!!! tip
    Schema generation imports JAX (to introspect the programs), so it is **not** run
    automatically. Run it once after installing, and again after upgrading `hax-em`.

---

## Run it

The `hax-gui` command manages the server:

```bash
hax-gui start                 # start in the background on http://127.0.0.1:8000
hax-gui status                # is it running? where? (pid + health)
hax-gui restart               # relaunch, keeping the current host/port
hax-gui stop                  # stop it
```

Useful flags for `hax-gui start`:

| Flag | Purpose |
|------|---------|
| `--host 0.0.0.0` | Listen on all interfaces so other machines can connect. |
| `--port 8051` | Use a different port. |
| `--foreground` | Run attached to the terminal (instead of in the background). |
| `--reload` | Auto-reload on code edits (development). |

Then open **`http://<server>:<port>`** in any browser. Because the page and the API share an
origin, there is no CORS or proxy to configure for local use.

!!! note "Classic launch still works"
    If you prefer, you can start the backend directly with
    `uvicorn hax_gui.app:app --host 0.0.0.0 --port 8000`.

---

## A typical GUI session

1. **Open the GUI** at `http://<server>:<port>` and pick (or create) a **project**.
2. **Choose a program** from the catalog — the programs are grouped exactly like the
   [Programs overview](../programs/index.md).
3. **Fill in the form.** Use the file browser to select your `--md` metadata, reference volume
   and mask; pick a GPU; set options like `--sr`, `--ctf_type` and `--mode`.
4. **Launch the job** and watch the **live log** in the job console.
5. For training runs, open the **TensorBoard** tab to follow loss/validation curves
   (this is `display_metrics` embedded in the GUI).
6. Find outputs in the project's per-run output folder, ready for the next step in your
   [workflow](../workflows/pipelines.md).

---

## Configuration (backend environment variables)

For most local use the defaults are fine. For remote/server deployments you can tune:

| Variable | Default | Purpose |
|----------|---------|---------|
| `HAX_GUI_DATA_DIR` | `~/.hax_gui` | SQLite database + per-job log files. |
| `HAX_GUI_SCHEMA_CACHE` | *(bundled cache)* | Path to the cached program form-schemas. |
| `HAX_PROJECT_MANAGER` | `hax_project_manager` | The launcher command (supports multi-token, e.g. `python -m hax.cli`). |
| `HAX_GUI_FILE_ROOTS` | `$HOME` | Colon-separated roots the file browser is allowed to expose. |
| `HAX_GUI_TOKEN` | *(empty)* | Shared bearer token; empty means open — **dev only**. |
| `HAX_GUI_CORS_ORIGINS` | `localhost:5173` | Allowed dev SPA origins. |

---

## Remote use & security

The backend is meant to run on the **GPU server** while the browser can be anywhere. The
current model is **single-tenant**: protect it with a shared token (`HAX_GUI_TOKEN`) behind
**TLS**, and put a reverse proxy (Caddy or nginx) in front to terminate TLS and route the API,
the WebSocket and the web app.

!!! warning "Do not expose an untokenized GUI to a network"
    With an empty `HAX_GUI_TOKEN` the GUI is open to anyone who can reach the port, and it can
    launch jobs and browse files within the configured roots. Only run it that way on
    `127.0.0.1`, and always set a token (and TLS) before exposing it beyond localhost.

---

## See also

- [Installation](installation.md) — set up `hax-em` first.
- [The Command Line](cli.md) — the equivalent CLI workflow.
- [Programs overview](../programs/index.md) — every program the GUI can launch.
