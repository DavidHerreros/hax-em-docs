# Zernike3Deep

!!! abstract "At a glance"
    **CLI name:** `zernike3deep` · **Family:** Heterogeneity analysis · **Trains a network:** yes
    · **Modes:** `train`, `predict`

## What it does

**Zernike3Deep** estimates the **continuous motions** of your molecule by deforming a
reference volume to match each particle image. The deformation is expressed in the
mathematically compact **3D Zernike polynomial basis**, which describes smooth, physically
plausible movements with relatively few coefficients.

You provide a reference volume and your particles; Zernike3Deep learns, for every particle,
the set of Zernike coefficients that warps the reference into that particle's conformation.
Those coefficients form the latent space — your conformational landscape. It is a
*semi-classical* approach: a neural network drives a well-understood, interpretable
deformation model.

## Reference

> Herreros, D., Lederman, R.R., Krieger, J.M. *et al.* **Estimating conformational
> landscapes from Cryo-EM particles by 3D Zernike polynomials.**
> *Nature Communications* **14**, 154 (2023).
> [https://doi.org/10.1038/s41467-023-35791-y](https://doi.org/10.1038/s41467-023-35791-y)

## When to use it

- You have a **good reference volume** and want to model **smooth, continuous** deformations.
- You want an **interpretable** motion model (Zernike coefficients) rather than a fully
  implicit one.
- You plan to feed the result into [MoDART](modart.md) for motion-corrected reconstruction,
  or into [Estimate Latent Covariances](estimate_latent_covariances.md) →
  [Latent Space Deconvolution](latent_space_deconvolution.md).

If you do not have a reliable reference, or you need fully real-space implicit
reconstruction, consider [HetSIREN](hetsiren.md) instead.

## Parameters

### Required

| Option | Type | Description |
|--------|------|-------------|
| `--md` | path | Metadata file with the images (plus alignments / CTF) — Xmipp `.xmd`, Relion `.star`, or CryoSPARC `.cs` (read directly). |
| `--vol` | path | The reference volume to be warped towards the images. |
| `--sr` | float | Sampling rate (pixel size), in Å/px. |
| `--ctf_type` | choice | `None`, `apply`, `wiener`, or `precorrect`. |
| `--mode` | choice | `train` or `predict` (predict needs `--reload`). |
| `--output_path` | path | Folder where all results are saved. |

### Deformation model

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--mask` | path | auto | Binary mask enclosing all the mass that may move. If omitted, the volume is masked automatically. |
| `--lat_dim` | int | 8 | Dimensionality of the latent space. |
| `--L1` | int | 7 | Degree of the Zernike3D **radial** component. Higher captures more localized motion at higher memory cost. |
| `--L2` | int | 7 | Degree of the Zernike3D **angular** component. Higher captures more localized motion at higher memory cost. |
| `--num_gaussians` | int | auto | Number of Gaussians used to recreate the reference volume before training (auto by default; set to fix it, e.g. to the residue count). |

### Training control

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--epochs` | int | 50 | Passes over the dataset (~50–100 for ≈100k particles). |
| `--batch_size` | int | 8 | Images on the GPU at once (GPU-memory lever). |
| `--learning_rate` | float | 1e-4 | Step size of learning; lower ~10× if it diverges. |
| `--dataset_split_fraction` | list | 0.8,0.2 | Train/validation split (must sum to 1). |
| `--reload` | path | — | A saved network to fine-tune or to run `predict`. Because Zernike3Deep also learns a gray-level adjustment, this folder must contain both `Zernike3Deep` and `Gaussian_volume_fitting` subfolders. |

### Data loading

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--load_images_to_ram` | flag | off | Load all images into RAM (fastest). Otherwise memory-mapped. |
| `--ssd_scratch_folder` | path | — | Fast-SSD folder used when memory-mapping. |

## Example commands

**Train** a Zernike3D landscape from a reference and particles:

```bash
hax_project_manager --gpu 0 zernike3deep \
    --md particles.xmd \
    --vol reference.mrc \
    --sr 1.5 \
    --ctf_type apply \
    --mode train \
    --lat_dim 8 --L1 7 --L2 7 \
    --epochs 80 \
    --output_path zernike_run/
```

**Predict** the per-particle coefficients with the trained network:

```bash
hax_project_manager --gpu 0 zernike3deep \
    --md particles.xmd \
    --vol reference.mrc \
    --sr 1.5 \
    --ctf_type apply \
    --mode predict \
    --reload zernike_run/ \
    --output_path zernike_predict/
```

## Outputs

After **training**:

- `Zernike3Deep/` — the trained network.
- `Zernike3Deep_metrics/` — training/validation curves and volume slices.
- `Gaussian_volume_fitting/`, `consensus_volume.mrc`, `consensus_volume_deltas.mrc` — the
  Gaussian fit used internally.
- `mask.mrc` — the auto-generated mask, when you did not supply one.
- `Zernike3Deep_CHECKPOINT/` — intermediate checkpoint (removed on clean completion).

After **predict**:

- `predicted_latents.xmd` / `.star` — metadata with the latent coefficients and refined
  poses for every particle.

## Tips & pitfalls

- A **reference volume is mandatory** — Zernike3Deep deforms it. Make sure `--sr` matches
  both the volume and the images.
- Increase `--L1` / `--L2` to chase very localized motions, but watch GPU memory.
- The network saved by a `train` run can be reused directly by
  [Estimate Latent Covariances](estimate_latent_covariances.md),
  [Decode States from Latents](decode_states_from_latents.md) and
  [MoDART](modart.md) — just point them at the `Zernike3Deep` folder inside your output.
