# The Command Line

Everything in Hax is launched through a **single command**: `hax_project_manager`. It is a
*dispatcher* — you tell it which program you want to run, on which GPU, and then pass that
program's own arguments.

!!! tip "Prefer a graphical interface?"
    Everything on this page can also be done from your browser with the optional
    [Hax GUI](gui.md) (`hax-em-gui`), which turns each program into an auto-generated form.

## The general pattern

```bash
hax_project_manager [--gpu <ids>] <program> [program arguments...]
```

- **`--gpu <ids>`** — *(optional)* which GPU(s) Hax is allowed to use.
- **`<program>`** — the name of the Hax tool to run (e.g. `hetsiren`, `zernike3deep`, `modart`).
- **program arguments** — everything after the program name is handed straight to that
  program (e.g. `--md`, `--sr`, `--mode`…).

## Discovering what is available

List every program with a one-line description:

```bash
hax_project_manager -h
```

Get the full, detailed help for a single program — including every parameter and what it
does:

```bash
hax_project_manager <program> -h
```

For example:

```bash
hax_project_manager hetsiren -h
```

!!! tip "This documentation mirrors the built-in help"
    Each [program page](../programs/index.md) in this site expands on the same help text you
    get from `-h`, with extra explanation and examples. The `-h` output is always the
    authoritative source for the exact version you have installed.

## Choosing a GPU with `--gpu`

If your machine has more than one GPU, use `--gpu` to pick which one(s) Hax runs on. The
value is a comma-separated list of GPU indices (as shown by `nvidia-smi`).

```bash
# Run only on GPU 0
hax_project_manager --gpu 0 hetsiren ...

# Allow GPUs 0 and 1
hax_project_manager --gpu 0,1 hetsiren ...
```

!!! info "Why the flag comes *before* the program name"
    `--gpu` sets the `CUDA_VISIBLE_DEVICES` environment variable **before** Hax imports JAX.
    That ordering is required for the GPU restriction to take effect, which is why `--gpu`
    must appear between `hax_project_manager` and the program name — not among the program's
    own arguments.

## What the dispatcher sets up for you

When you launch a program, `hax_project_manager` automatically configures a few things so
you don't have to:

- Restricts the visible GPUs to those you passed with `--gpu`.
- Disables JAX/XLA memory pre-allocation (`XLA_PYTHON_CLIENT_PREALLOCATE=false`) so the
  process only grabs the GPU memory it actually needs.
- Enables a set of XLA performance flags.
- Silences low-level TensorFlow/XLA log spam.

## A first end-to-end command

A complete invocation looks like this:

```bash
hax_project_manager --gpu 0 zernike3deep \
    --md particles.xmd \
    --vol reference.mrc \
    --sr 1.5 \
    --ctf_type apply \
    --mode train \
    --output_path results/
```

Read this as: *"On GPU 0, run `zernike3deep` in training mode on these particles and this
reference volume, saving everything to `results/`."*

If many of these options (`--md`, `--sr`, `--ctf_type`, `--mode`, `--output_path`…) look
unfamiliar, the next page — [Core Concepts](concepts.md) — explains the ideas they all
share before you reach the individual program pages.
