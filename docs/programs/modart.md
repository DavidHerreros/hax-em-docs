# MoDART

!!! abstract "At a glance"
    **CLI name:** `modart` · **Family:** Reconstruction · **Trains a reusable network:** no
    (solves a least-squares reconstruction by conjugate gradient)

## What it does

Flexible molecules produce **motion-blurred** reconstructions: because every particle is in a
slightly different shape, averaging them smears the moving regions. **MoDART** is a real-space
reconstruction algorithm that can **correct for that motion blur** using a deformation field
learned by a heterogeneity network.

MoDART looks for the map whose projections best match the particle images, through each
particle's pose and CTF. It solves this least-squares problem with a preconditioned
**conjugate gradient**, one pass over the particles per iteration (`--iterations`).

Run on its own, MoDART produces a standard reconstruction. When you also supply a trained
motion model via `--motion_correction`, it encodes every particle once with that network and,
in every pass, **warps the voxels with the particle's deformation field** before projecting
them. It also applies the pose refinement estimated by the network. The flexible regions then
add up in the reference conformation instead of being blurred.

Two half maps (even/odd particles) are always reconstructed. Their FSC weights their average,
so `modart_map.mrc` comes out filtered to the resolution the data support.

## Reference

> Herreros, D., Kiska, J., Ramirez-Aportela, E. *et al.* **ZART: A Novel Multiresolution
> Reconstruction Algorithm with Motion-blur Correction for Single Particle Analysis.**
> *Journal of Molecular Biology* **435**, 168088 (2023).
> [https://doi.org/10.1016/j.jmb.2023.168088](https://doi.org/10.1016/j.jmb.2023.168088)

## When to use it

- To reconstruct a volume **after** a heterogeneity analysis, removing motion-induced blur.
- To get **half-maps** and a half-map FSC for resolution estimation (`--reconstruct_halves`
  keeps the half maps).
- To get a sharp map that accounts for the flexibility you modelled with
  [HetSIREN](hetsiren.md) (with transport of mass) or [Zernike3Deep](zernike3deep.md). The map
  can then be fed back into HetSIREN with `--reload` and `--refit_reference`.

## Parameters

### Required

| Option | Type | Description |
|--------|------|-------------|
| `--md` | path | Metadata file with the images (plus alignments / CTF) — Xmipp `.xmd`, Relion `.star`, or CryoSPARC `.cs` (read directly). |
| `--sr` | float | Sampling rate (pixel size), in Å/px. |
| `--ctf_type` | choice | `None`, `apply`, `wiener` (treated as `apply`: the least-squares model already inverts the CTF), or `precorrect`. |
| `--output_path` | path | Folder where results are saved. |

### Reconstruction configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--vol` | path | — | Starting map. Its contrast is first matched to the images (median of the per-image least-squares scales). Without it, the reconstruction starts from an empty map. |
| `--mask` | path | auto | Binary mask with the voxels to reconstruct. If omitted, it is derived from `--vol`, or from a consensus reconstruction of the particles. **Must be binary.** |
| `--symmetry_group` | str | `c1` | Point-group symmetry: every particle is also used through each symmetry operator. Only `c*` and `d*` groups are supported. |
| `--reconstruct_halves` | flag | off | Also write the two **unfiltered half-maps** (even/odd particles). They are always reconstructed: their FSC filters the final map. |
| `--motion_correction` | path | — | Path to a trained **HetSIREN (with transport of mass)** or **Zernike3Deep** network (the `HetSIREN` / `Zernike3Deep` folder). When given, each particle's deformation field and refined pose are used in the reconstruction; otherwise a standard reconstruction is performed. |

### Solver

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--iterations` | int | 10 | Conjugate gradient iterations, one pass over the particles each. More iterations recover finer detail and also fit more noise. |
| `--regularization` | float | 0.0 | Tikhonov weight, relative to the mean diagonal of the normal equations. |

### Performance

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--batch_size` | int | 8 | Images processed at a time (`auto` uses 8). It changes speed and GPU memory, not the result. With symmetry, each image counts once per symmetry operator. |
| `--chunk_size` | int | 65536 | Voxels projected at a time. Lower it if the GPU runs out of memory; it does not change the result. |
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

**Motion-corrected reconstruction** using a trained Zernike3Deep model, keeping the half-maps:

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

- `modart_map.mrc` — the average of the two half maps, weighted per shell by
  √(2·FSC / (1 + FSC)). During the run, `modart_map_intermediate.mrc` (and the intermediate
  half maps with `--reconstruct_halves`) is rewritten after every iteration and removed at the
  end.
- `modart_first_half.mrc`, `modart_second_half.mrc` — the unfiltered half-maps, when
  `--reconstruct_halves` is used.
- `half_map_fsc.txt` — the half-map FSC (columns `1/A` and `FSC`), corrected for the mask by
  phase randomisation. The resolution at FSC = 0.143 is printed at the end of the run.
- `consensus_mask.mrc` — the mask derived when no `--mask` is given, plus
  `consensus_reconstruction.mrc` when there is no `--vol` either.
- `MoDART_metrics/` — TensorBoard logs (relative residual of every iteration), viewable with
  [Display Metrics](display_metrics.md).

## Tips & pitfalls

- For **motion correction**, the model at `--motion_correction` must be a HetSIREN trained
  **with transport of mass** or a Zernike3Deep network — these are the ones that carry a
  deformation field.
- With `--motion_correction`, pass the metadata **with the poses the network was trained on**.
  MoDART applies the network's pose refinement on top of them, so the `predicted_latents`
  metadata of a `predict` run, whose poses already include that refinement, would refine them
  twice.
- Any `--mask` you pass must be **binary**.
- Out of GPU memory? Lower `--batch_size` or `--chunk_size`; neither changes the result.
