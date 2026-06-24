# MoDART

!!! abstract "At a glance"
    **CLI name:** `modart` · **Family:** Reconstruction · **Trains a reusable network:** no
    (performs an iterative ART reconstruction)

## What it does

Flexible molecules produce **motion-blurred** reconstructions: because every particle is in a
slightly different shape, averaging them smears the moving regions. **MoDART** is a real-space
**ART-based reconstruction** algorithm that can **correct for that motion blur** using a
deformation field learned by a heterogeneity network.

Run on its own, MoDART produces a standard reconstruction (or refinement of a provided
volume). When you also supply a trained motion model via `--motion_correction`, it warps each
particle's contribution according to its estimated conformation *before* adding it to the
reconstruction — sharpening the flexible regions that ordinary averaging blurs.

## Reference

> Herreros, D., Kiska, J., Ramirez-Aportela, E. *et al.* **ZART: A Novel Multiresolution
> Reconstruction Algorithm with Motion-blur Correction for Single Particle Analysis.**
> *Journal of Molecular Biology* **435**, 168088 (2023).
> [https://doi.org/10.1016/j.jmb.2023.168088](https://doi.org/10.1016/j.jmb.2023.168088)

## When to use it

- To reconstruct or refine a volume **after** a heterogeneity analysis, removing
  motion-induced blur.
- To produce **half-maps** for resolution estimation (`--reconstruct_halves`).
- To get a clean consensus/refined map that accounts for the flexibility you modelled with
  [HetSIREN](hetsiren.md) (with transport of mass) or [Zernike3Deep](zernike3deep.md).

## Parameters

### Required

| Option | Type | Description |
|--------|------|-------------|
| `--md` | path | Metadata file with the images (plus alignments / CTF) — Xmipp `.xmd`, Relion `.star`, or CryoSPARC `.cs` (read directly). |
| `--sr` | float | Sampling rate (pixel size), in Å/px. |
| `--ctf_type` | choice | `None`, `apply`, `wiener`, or `precorrect`. |
| `--output_path` | path | Folder where results are saved. |

### Reconstruction configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--vol` | path | — | If provided, MoDART **refines** this volume instead of reconstructing from scratch. |
| `--mask` | path | — | Binary mask setting the initial position of the mass available for reconstruction. Can be tight to the input volume. **Must be binary.** |
| `--symmetry_group` | str | `c1` | Point-group symmetry to apply. Only `c*` and `d*` groups are supported (lower-case). A symmetry-broken `c1` set of angles is still learned, so results plug into standard pipelines. |
| `--reconstruct_halves` | flag | off | Reconstruct **two half-maps** (even/odd split) instead of a single volume — useful for FSC/resolution estimation. |
| `--motion_correction` | path | — | Path to a trained **HetSIREN (with transport of mass)** or **Zernike3Deep** network. When given, MoDART corrects motion blur using that deformation field; otherwise a standard reconstruction is performed. |

### Performance

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--batch_size` | int | 8 | Images on the GPU at once (GPU-memory lever). |
| `--load_images_to_ram` | flag | off | Load all images into RAM (fastest). Otherwise memory-mapped. |
| `--ssd_scratch_folder` | path | — | Fast-SSD folder used when memory-mapping. |

## Example commands

**Standard reconstruction** (no motion correction):

```bash
hax_project_manager --gpu 0 modart \
    --md particles.xmd \
    --sr 1.5 \
    --ctf_type apply \
    --output_path modart_run/
```

**Motion-corrected reconstruction** using a trained Zernike3Deep model, producing half-maps:

```bash
hax_project_manager --gpu 0 modart \
    --md particles.xmd \
    --sr 1.5 \
    --ctf_type apply \
    --motion_correction zernike_run/Zernike3Deep \
    --reconstruct_halves \
    --output_path modart_motion/
```

## Outputs

In `--output_path`:

- `modart_map.mrc` — the reconstructed (or refined) volume. Intermediate snapshots are
  written as `modart_map_intermediate.mrc` during the run.
- `modart_first_half.mrc`, `modart_second_half.mrc` — the two half-maps when
  `--reconstruct_halves` is used.
- An updated metadata file with the angles/shifts used.
- `MoDART_metrics/` — TensorBoard logs (loss curves and intermediate volume slices), viewable
  with [Display Metrics](display_metrics.md).

## Tips & pitfalls

- For **motion correction**, the model at `--motion_correction` must be a HetSIREN trained
  **with transport of mass** or a Zernike3Deep network — these are the ones that carry a
  deformation field.
- Any `--mask` you pass must be **binary**.
- Use `--reconstruct_halves` when you need an FSC-based resolution estimate.
