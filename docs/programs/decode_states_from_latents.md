# Decode States from Latents

!!! abstract "At a glance"
    **CLI name:** `decode_states_from_latents` · **Family:** Latent post-processing
    · **Trains a network:** no

## What it does

A conformational landscape tells you *where* each shape lives — but to **see** a shape you
need to turn its latent vector back into a 3D volume. **Decode States from Latents** does
exactly that: given a trained heterogeneity network (its *decoder*) and a list of latent
vectors, it generates one 3D map per vector.

This is how you go from "interesting points on the map" to "volumes I can open in ChimeraX".
The points can come from anywhere — cluster centres, a trajectory along a motion, the
deconvolved landscape, or selections you made interactively.

## When to use it

- To **materialize** specific conformations selected from a landscape.
- To generate a **trajectory** of volumes along a path through the latent space (a "movie" of
  the motion).
- To export representative states for figures or further refinement.

## Parameters

| Option | Required | Type | Description |
|--------|:---:|------|-------------|
| `--latents_file` | ✅ | path | File with the latent vectors to decode. Accepts `.txt` (NumPy text) or `.npy` (NumPy binary). One volume is produced per vector. |
| `--reload` | ✅ | path | Folder with a saved neural network — the network folder produced by a `train` run (e.g. `zernike_run/Zernike3Deep` or `hetsiren_run/HetSIREN`). |
| `--output_path` | ✅ | path | Folder where the decoded volumes are written. |

## Example command

```bash
hax_project_manager --gpu 0 decode_states_from_latents \
    --latents_file selected_states.txt \
    --reload zernike_run/Zernike3Deep \
    --output_path decoded_states/
```

## Outputs

In `--output_path`, one volume per input vector:

```text
decoded_volume_0000.mrc
decoded_volume_0001.mrc
decoded_volume_0002.mrc
...
```

The numbering follows the order of the vectors in `--latents_file`.

## Tips & pitfalls

- Point `--reload` at the **network folder** saved by a `train` run (e.g.
  `zernike_run/Zernike3Deep`).
- The latent vectors must have the **same dimensionality** the network was trained with.
- Latent vectors often come from [Annotate Space](annotate_space.md) selections, k-means
  cluster centres, or a [deconvolved landscape](latent_space_deconvolution.md).
