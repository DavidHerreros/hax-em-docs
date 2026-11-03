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

### Iterative refinement

A motion model is only as good as the reference it was trained on, and the motion-corrected
map is usually sharper than that reference. With `--refine_iterations N`, MoDART closes the
loop by itself. Each iteration:

1. reconstructs a motion-corrected map with the current network;
2. fine-tunes the network on that map, with the parameters of its original training plus the
   map as `--vol`, `--reload` and `--refit_reference`.

After the last iteration, a final map is reconstructed with the refined network. Every step
runs as its own process, so each one gets the whole GPU.

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
  [HetSIREN](hetsiren.md) (with transport of mass) or [Zernike3Deep](zernike3deep.md).
- To improve the motion model and the map together: `--refine_iterations` alternates MoDART
  maps and fine-tunes of the network on them.

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

### Motion correction

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--motion_correction` | path(s) | — | Path to a trained **HetSIREN (with transport of mass)** or **Zernike3Deep** network (the `HetSIREN` / `Zernike3Deep` folder). When given, each particle's deformation field and refined pose are used in the reconstruction; otherwise a standard reconstruction is performed. Two paths (gold standard): the first network moves the even particles (first half), the second the odd ones. |
| `--field_smoothing` | float | 0.0 | Width, in Å, of a local-linear Gaussian smoothing of each particle's motion field. It removes non-rigid jitter while keeping rigid (and affine) motions exact. `0` disables it. |
| `--poses_refined_by` | path | — | Network whose pose refinement the input poses already include (e.g. the particles written by its `predict`). MoDART removes it before applying the refinement of `--motion_correction`, so it is not applied twice. |
| `--remove_mean_field` | flag | off | Subtract each network's particle-average motion field, so the map is reconstructed in the frame of the network's reference. It removes a static deformation the network may learn (e.g. to sharpen a blurred reference by moving its points), which otherwise distorts the map. |

### Refinement

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--refine_iterations` | int | 0 | Number of [refinement iterations](#iterative-refinement) (map, then fine-tune of the network on it). Needs a single `--motion_correction` network trained on all the particles. `0` disables it. |
| `--refine_epochs` | int | training's | Epochs of each fine-tune. By default, the ones of the network's training. |
| `--refine_learning_rate` | float | training's | Learning rate of the fine-tunes. By default, the one of the network's training. |
| `--refine_batch_size` | int / `auto` | training's | Batch size of the fine-tunes. By default, the one of the network's training. |
| `--refine_config` | path | auto | `run_config.json` of the network's training, whose parameters the fine-tunes reuse. By default, the one next to the network folder (written by the training in its `--output_path`). |

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

**Iterative refinement** of a HetSIREN network (transport of mass, implicit decoder) and its
map, three iterations:

```bash
hax_project_manager --gpu 0 modart \
    --md particles.xmd \
    --sr 1.5 \
    --ctf_type apply \
    --motion_correction hetsiren_run/HetSIREN \
    --refine_iterations 3 \
    --output_path modart_refined/
```

The fine-tunes read the training parameters from `hetsiren_run/run_config.json`.

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

With `--refine_iterations`, the files above come from the final map (made with the refined
network), and each iteration `N` leaves:

- `iteration_N/modart/` — the MoDART run of that iteration (same files as above).
- `iteration_N/hetsiren/` or `iteration_N/zernike3deep/` — the fine-tune of the network on
  that map. The refined network is the `HetSIREN` / `Zernike3Deep` folder inside it.

## Tips & pitfalls

- For **motion correction**, the model at `--motion_correction` must be a HetSIREN trained
  **with transport of mass** or a Zernike3Deep network — these are the ones that carry a
  deformation field.
- With `--motion_correction`, pass the metadata **with the poses the network was trained on**.
  MoDART applies the network's pose refinement on top of them, so the `predicted_latents`
  metadata of a `predict` run, whose poses already include that refinement, would refine them
  twice. With such metadata, add `--poses_refined_by <network>`: MoDART then removes that
  refinement first.
- `--refine_iterations` needs the network folder as the training wrote it
  (`<output_path>/HetSIREN` or `<output_path>/Zernike3Deep`) and its `run_config.json` (next to
  it, or given with `--refine_config`). A HetSIREN must have been trained with transport of
  mass and an implicit or point transformer decoder, which `--refit_reference` requires.
- The fine-tunes take the MoDART map as `--vol` of the network's training, so run MoDART on
  particles with the **same box and pixel size** as that training (not the full-size
  particles of a network trained on downsampled ones).
- Each iteration costs a MoDART run plus a fine-tune, by default as long as the original
  training (same `--epochs`). `--refine_epochs` shortens the fine-tunes. Epoch-based schedules
  of the training (e.g. `--learn_reference_epochs`) still apply to each of them.
- Any `--mask` you pass must be **binary**.
- Out of GPU memory? Lower `--batch_size` or `--chunk_size`; neither changes the result.
