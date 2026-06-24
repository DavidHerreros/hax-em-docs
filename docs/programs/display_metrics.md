# Display Metrics

!!! abstract "At a glance"
    **CLI name:** `display_metrics` · **Family:** Visualization · **Trains a network:** no

## What it does

Every Hax network writes its training progress — loss curves, validation curves and sample
volume slices — into a metrics folder inside its `--output_path`. **Display Metrics** launches
a **TensorBoard** dashboard pointed at one of those folders and opens it in your browser, so
you can monitor a run *while it trains* or inspect it afterwards.

Watching these curves is the simplest way to tell whether training is healthy: a loss that
steadily decreases and a validation curve that tracks it are good signs; a diverging or
`NaN`-producing loss usually means the learning rate is too high (see
[Core Concepts](../getting-started/concepts.md#common-training-knobs)).

## When to use it

- To **monitor** a training run live.
- To **diagnose** a run that failed or produced poor results.
- To **compare** training and validation behaviour.

## Parameters

| Option | Required | Type | Description |
|--------|:---:|------|-------------|
| `--logdir` | ✅ | path | Path to the TensorBoard log directory — i.e. the `*_metrics/` folder a Hax program created inside its `--output_path`. |

## Example command

```bash
hax_project_manager display_metrics \
    --logdir hetsiren_run/HetSIREN_metrics
```

The program prints the TensorBoard URL (typically `http://localhost:6006`) and opens it in a
browser. It keeps running until you stop it with ++ctrl+c++.

## Tips & pitfalls

- The `--logdir` is the **metrics folder**, not the top-level output path. Examples:
    - `HetSIREN_metrics/` (from [HetSIREN](hetsiren.md))
    - `Zernike3Deep_metrics/` (from [Zernike3Deep](zernike3deep.md))
    - `ReconSIREN_metrics/`, `FlexConsensus_metrics/`, `MoDART_metrics/`, …
- You can launch it **during** training to watch progress in near real time.
- Running on a remote server? Forward the TensorBoard port (e.g.
  `ssh -L 6006:localhost:6006 user@server`) to open the dashboard locally.
