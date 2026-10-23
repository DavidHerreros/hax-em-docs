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

Zernike3Deep also accepts **tomography (subtomogram) data**: if the input metadata contains
`subtomo_labels`, each particle's tilt stack is analyzed as one item.

## Parameters

You can also pass any of these options through a YAML/JSON file with `--config` (see
[The Command Line](../getting-started/cli.md#reusing-parameters-with-config)).

### Required

| Option | Type | Description |
|--------|------|-------------|
| `--md` | path | Metadata file with the images (plus alignments / CTF) — Xmipp `.xmd`, Relion `.star`, or CryoSPARC `.cs` (read directly). |
| `--vol` | path | The reference volume to be warped towards the images. |
| `--sr` | float | Sampling rate (pixel size), in Å/px. |
| `--ctf_type` | choice | `None`, `apply`, `wiener`, `precorrect` or `premultiplied` (images that already carry one CTF multiplication, as in many tomography exports). See [Core Concepts](../getting-started/concepts.md#the-ctf-and-ctf_type). |
| `--mode` | choice | `train` or `predict` (predict needs `--reload`). |
| `--output_path` | path | Folder where all results are saved. |

### Deformation model

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--mask` | path | auto | Binary mask enclosing all the mass that may move. If omitted, the volume is masked automatically (saved as `mask.mrc`). |
| `--lat_dim` | int | 8 | Dimensionality of the latent space. |
| `--L1` | int | 7 | Degree of the Zernike3D **radial** component. Higher captures more localized motion at higher memory cost. |
| `--L2` | int | 7 | Degree of the Zernike3D **angular** component. Higher captures more localized motion at higher memory cost. |
| `--num_gaussians` | int | auto | Number of Gaussians fitted to the reference volume before training. By default the count is grown until the fit reaches FSC ≥ 0.5 on every populated shell (see `--fit_resolution`); set it to fix the number yourself (e.g. to the residue count). |
| `--fit_resolution` | float | — | Resolution (Å) the automatic Gaussian fit has to reproduce. |
| `--deformation_strength` | float | 0.3 | Strength of the graph deformation priors (relative edge strain + repulsion) with respect to the reconstruction loss. After the first epoch the prior weight is set once (then kept fixed) so its gradient on the decoder is this fraction of the reconstruction gradient. Lower for larger motions, higher for stiffer ones; `0` disables it. |
| `--strain_penalty` | choice | `huber` | Penalty on the relative edge strain. `huber`: grows without limit with the strain; `bounded`: saturates, so domains stay rigid while a contact between them can open at a fixed cost. |

### Latent regularization

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--kl_lambda` | float | 0.0 | Weight of the VAE KL divergence towards a standard-normal prior (summed over the batch and the latent dimensions; `1e-6` was the previous built-in value). `0` disables the VAE and uses a deterministic latent. |
| `--decoupling_lambda` | float | 1e-4 | Weight of the decoupling regularization encouraging the latent to be invariant to pose and CTF. Increase for stronger decoupling; `0` to relax. |
| `--nested_dropout` | float | 0.0 | Nested dropout on the decoded latent: during training each sample keeps only its first *k* latent dimensions, with *k* drawn from a Geometric(*p*) distribution. This orders the dimensions by importance (PCA-like), so the first ones carry the dominant motions. Typical 0.1–0.5; `0` disables it. |
| `--noise_invariance_strength` | float | 0.0 | Penalizes latent dimensions that change when the noise changes: each image is encoded again with a second draw of noise, colored like the image background, and the loss is 1 − correlation between both latents, per dimension. After the first epoch its weight is recalibrated every epoch so its encoder gradient is this fraction of the reconstruction one. Typical 0.1–0.5; `0` disables it. Ignored for tomography data. |

### Pose refinement

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--pose_refine_reg` | float | 0.1 | Weight of the hinge penalizing pose refinements beyond `--pose_refine_max_angle`. `0` disables it. |
| `--pose_refine_max_angle` | float | 8.0 | Rotation (degrees) the pose refinement may apply freely; the excess is penalized with `--pose_refine_reg`. |
| `--shift_refine_reg` | float | 0.1 | Weight of the hinge penalizing shift refinements beyond `--shift_refine_max`. `0` disables it. |
| `--shift_refine_max` | float | 4.0 | Shift (pixels) the refinement may apply freely; the excess is penalized with `--shift_refine_reg`. |
| `--rigid_gauge` | choice | `core` | Remove the global rigid motion from the deformation field so pose errors go to the pose head. `core`: frame fitted on the least-moving points; `mass`: mass-weighted fit; `off`: diagnostic only. |
| `--rigid_drift_lambda` | float | 1.0 | Weight of the penalty on the rigid motion the gauge removes from the deformation field. |

### Images

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--normalize_images` | flag | off | Normalize each particle (zero mean, unit std in the background outside the particle) before the encoder, the loss and the contrast fit of the Gaussians. |
| `--particle_diameter` | float | auto | Particle diameter (Å), used as the background for `--normalize_images` and for the soft circular mask of the images. Default: the extent of the mask. |
| `--per_image_contrast` | choice | `off` | Fit one contrast scale per image before the reconstruction loss. `relative`: scales normalized to a unit batch mean; `absolute`: raw least-squares scale. |

### Training control

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--epochs` | int | 50 | Passes over the dataset (~50–100 for ≈100k particles). |
| `--batch_size` | int / `auto` | 8 | Images on the GPU at once (GPU-memory lever). `auto` estimates the largest batch that fits on your GPU, capped at the number of particles (tomography data and `predict` fall back to 8). |
| `--learning_rate` | float | 1e-4 | Step size of learning; lower ~10× if it diverges. |
| `--dataset_split_fraction` | list | 0.8,0.2 | Train/validation split (must sum to 1). |
| `--reload` | path | — | A saved network to fine-tune or to run `predict`. Because Zernike3Deep also learns a gray-level adjustment, this folder must contain both `Zernike3Deep` and `Gaussian_volume_fitting` subfolders. |

### Logging

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--log_images_every` | int | 1 | Epochs between the cheap TensorBoard logs (predicted images, central slices of the predicted volumes). `0` disables them. |
| `--log_landscape_every` | int | 5 | Epochs between the expensive logs (latent-space embedding, intermediate volumes, angular distribution plots). Raise it if logging dominates the training time on small datasets; `0` disables them. |
| `--log_checkpoint_every` | int | 5 | Epochs between the checkpoints used to resume an interrupted training. `0` disables them. |
| `--log_time_budget` | float | 0.0 | Maximum fraction of the wall clock that may be spent logging (e.g. `0.05`); above it the expensive logs are skipped until training catches up. `0` disables the guard. |
| `--log_sync` | flag | off | Log on the training thread instead of a background thread (useful for debugging). |

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
- `Intermediate_volumes/` — volumes decoded at cluster centres of the latent space, written
  every `--log_landscape_every` epochs.
- `Gaussian_volume_fitting/`, `consensus_volume.mrc`, `consensus_volume_deltas.mrc` — the
  Gaussian fit used internally.
- `mask.mrc` — the auto-generated mask, when you did not supply one.
- `Zernike3Deep_CHECKPOINT/` — intermediate checkpoint (removed on clean completion).
- `run_config.json` — the fully-resolved parameters of the run (reusable as a `--config`).

After **predict**:

- `predicted_latents.xmd` / `.star` — metadata with the latent coefficients and refined
  poses for every particle.

## Tips & pitfalls

- A **reference volume is mandatory** — Zernike3Deep deforms it. Make sure `--sr` matches
  both the volume and the images.
- Increase `--L1` / `--L2` to chase very localized motions, but watch GPU memory.
- Domains that should move as rigid blocks? Try `--strain_penalty bounded`, and lower
  `--deformation_strength` for large-amplitude motions.
- To get a compact, ordered latent space, combine `--nested_dropout` with
  `--noise_invariance_strength` (e.g. 0.1–0.5 each). The current noise-invariance loss and
  weight are shown in the progress bar (`noise_inv=loss/weight`) and logged as
  *Noise invariance (Zernike3Deep)* in the training metrics.
- The network saved by a `train` run can be reused directly by
  [Estimate Latent Covariances](estimate_latent_covariances.md),
  [Decode States from Latents](decode_states_from_latents.md) and
  [MoDART](modart.md) — just point them at the `Zernike3Deep` folder inside your output.
