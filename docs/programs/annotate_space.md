# Annotate Space

!!! abstract "At a glance"
    **CLI name:** `annotate_space` · **Family:** Visualization · **Trains a network:** no
    · **Interface:** interactive desktop GUI (PyQt5 + napari)

## What it does

**Annotate Space** is an **interactive viewer** for your conformational landscape. Instead of
staring at raw numbers, you see your latent space as a navigable point cloud: every point is a
particle, and nearby points are similar conformations. You can lasso regions, cluster along
any direction, and — when connected to a heterogeneity method — **generate the 3D volume for
any point in real time**.

It is the natural place to *explore* a landscape after you have estimated it: find the
distinct states, trace a motion, and export the conformations that matter.

When connected to **ChimeraX** (via `--chimerax_binary`), generated volumes can be displayed
and morphed live as you move through the landscape.

## Reference

The interactive annotation of conformational landscapes is part of the Hax heterogeneity
framework — see the [HetSIREN](hetsiren.md) and
[Zernike3Deep](zernike3deep.md) references on the [Support](../support/contact.md#references)
page for the underlying methods that produce the landscapes you explore here.

## When to use it

- To **explore** a latent space produced by any Hax method (or by an external method, as long
  as you can save it as `.txt`/`.npy`).
- To **select** conformational states or **cluster** the landscape.
- To **generate volumes on the fly** from selected points (requires a connected method) or to
  browse **pre-computed** volumes.

## Modes of operation

- **View only** — just inspect the landscape (no volume generation). This is automatic when
  neither `--env_name` nor `--volumes_path` is provided, or you can force it with
  `--only_view`.
- **Pre-saved volumes** — browse a fixed set of volumes you already computed (`--volumes_path`).
- **Live generation** — generate volumes in real time from the heterogeneity method that
  produced the landscape (`--env_name` + `--server_functions_path`).

## Parameters

### Required

| Option | Type | Description |
|--------|------|-------------|
| `--z_space` | path | The latent space to display, saved as `.txt` or `.npy`. |
| `--path` | path | Folder where the viewer's outputs (selections, generated volumes) are saved. |

### Display

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--z_space_reduced` | path | — | A reduced-dimensionality version of the latent space (`.txt`/`.npy`) to display. If omitted, the original `--z_space` is shown. |
| `--only_view` | flag | off | Display only — disable state generation. Automatic when neither `--env_name` nor `--volumes_path` is given. |

### Volume generation

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--volumes_path` | path | — | A `.txt` file listing one volume path per landscape point, **in the same order** as the points. Lets you browse pre-saved conformations without a live method. |
| `--env_name` | str | `hax` | Name of the Conda environment where the heterogeneity software used to estimate the landscape is installed (for live generation). |
| `--server_functions_path` | path | — | Required with `--env_name`. A Python `.py` file defining a class with `prepare_heterogeneity_program` and `decode_state_from_latent` methods, so the viewer can drive the method to generate conformations. An example ships in the source at `hax/viewers/server_loading_functions/load_model.py`. |
| `--chimerax_binary` | path | — | Absolute path to the ChimeraX binary, to display/morph generated volumes in ChimeraX. |

!!! note "Custom parameters"
    The viewer also accepts arbitrary extra parameters of the form `--my_parameter VALUE`
    (number or string). These are passed through to your heterogeneity method and are useful
    in combination with `--server_functions_path`.

## Example commands

**View only** — just explore a landscape:

```bash
hax_project_manager annotate_space \
    --z_space results/latents.npy \
    --path annotation/ \
    --only_view
```

**Browse pre-saved volumes** along the landscape:

```bash
hax_project_manager annotate_space \
    --z_space results/latents.npy \
    --volumes_path decoded_states/volume_list.txt \
    --path annotation/
```

**Live generation** with ChimeraX display:

```bash
hax_project_manager annotate_space \
    --z_space results/latents.npy \
    --env_name hax \
    --server_functions_path my_loader.py \
    --chimerax_binary /opt/chimerax/bin/ChimeraX \
    --path annotation/
```

## Outputs

In `--path`:

- `selections_layers/` — your saved selections and the representative volumes you generated.
- Any volumes generated during the session, plus related metrics.

## Tips & pitfalls

- Provide a **`--z_space_reduced`** (e.g. a 2D/3D UMAP of a high-dimensional space) for a
  clearer, plottable view while keeping the full space available.
- For **live generation**, both `--env_name` and `--server_functions_path` are required;
  model the `.py` loader on the example in the package source.
- This is a **GUI program** — run it on a machine with a display (or an X-forwarding /
  remote-desktop setup), not a headless batch node.
- Need the volumes for `--volumes_path`? Generate them with
  [Decode States from Latents](decode_states_from_latents.md).
