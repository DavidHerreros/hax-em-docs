# HetSIREN

!!! abstract "At a glance"
    **CLI name:** `hetsiren` · **Family:** Heterogeneity analysis · **Trains a network:** yes
    · **Modes:** `train`, `predict`

## What it does

**HetSIREN** is a neural network that performs **heterogeneous reconstruction directly in
real space**. Instead of producing one averaged map, it learns a *conformational landscape*
— a compact description of how your molecule changes shape across the dataset — and can
reconstruct, refine and even *disentangle* the different conformational states hidden in
your particles.

In plain terms: you give HetSIREN your particle images (and, optionally, a reference
volume), and it learns both **what shapes are present** and **how to build the 3D map for
any given shape**. Because it works in real space, it can focus on a region of interest
through a mask, and it can either keep the molecular mass fixed (pure reconstruction) or
actively *move* the mass to model motion (the `--transport_mass` option).

## Reference

> Herreros, D., Mata, C.P., Noddings, C. *et al.* **Real-space heterogeneous reconstruction,
> refinement, and disentanglement of CryoEM conformational states with HetSIREN.**
> *Nature Communications* **16**, 3751 (2025).
> [https://doi.org/10.1038/s41467-025-59135-0](https://doi.org/10.1038/s41467-025-59135-0)

## When to use it

- You want a **flexible, high-fidelity** heterogeneous reconstruction in real space.
- You want to **refine an existing consensus map** towards the conformational states present
  in your data (provide it with `--vol`).
- You want to study **very local motions** (consider `--implicit_network` with
  `--transport_mass`) or motions in a **specific region** (use a `--mask`, optionally with
  `--local_reconstruction`).
- Your box size is large and you want to model motion by *transporting mass*
  (`--transport_mass`).
- You have a sharper map of the same particles (e.g. a motion-corrected [MoDART](modart.md)
  map) and want to fine-tune a trained network on it (`--reload` with `--refit_reference`).

It also handles **tomography (subtomogram) data** automatically: if the input metadata
contains `subtomo_labels`, HetSIREN trains its TomoSIREN variant.

No reference map? In `train` mode, if neither `--vol` nor `--mask` is given, HetSIREN first
reconstructs a consensus volume from the input poses and uses it as the reference.

## Parameters

You can also pass any of these options through a YAML/JSON file with `--config` (see
[The Command Line](../getting-started/cli.md#reusing-parameters-with-config)).

### Required

| Option | Type | Description |
|--------|------|-------------|
| `--md` | path | Metadata file with the images (plus alignments / CTF) to analyze — Xmipp `.xmd`, Relion `.star`, or CryoSPARC `.cs` (read directly). If the metadata contains the label `subtomo_labels`, the tomography variant (TomoSIREN) is trained instead, and pose/CTF decoupling is handled for you. |
| `--sr` | float | Sampling rate (pixel size) of the images/volume, in Å/px. |
| `--ctf_type` | choice | How to handle the CTF: `None`, `apply`, `wiener`, `precorrect` or `premultiplied` (images that already carry one CTF multiplication, as in many tomography exports). See [Core Concepts](../getting-started/concepts.md#the-ctf-and-ctf_type). |
| `--mode` | choice | `train` or `predict` (predict needs `--reload`). |
| `--output_path` | path | Folder where all results are saved. |

### Inputs & region of interest

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--vol` | path | — | Reference volume. If given, HetSIREN learns to *refine* this volume towards the heterogeneous states in the images. If neither `--vol` nor `--mask` is given in `train` mode, a consensus volume is reconstructed from the input poses and used as the reference. |
| `--mask` | path | auto | Binary reconstruction mask. Should cover the volume where the motions of interest are expected to happen. If omitted, a spherical mask is used, or (with `--transport_mass`) a mask derived from the reference. |
| `--local_reconstruction` | flag | off | Switch to **local** heterogeneous reconstruction/refinement, restricted to the region enclosed by the reference mask. Requires a reference volume. Overrides `--transport_mass`. |
| `--transport_mass` | flag | off | Let HetSIREN **move** the mass inside the mask (learned displacements of the points) instead of reconstructing on a fixed lattice. When combined with a reference volume, use a *tight* mask covering the regions to analyze. |

### Model configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--lat_dim` | int | 8 | Dimensionality of the latent space (the "map of shapes"). **Must be even**: the latent is split into a motion half and an occupancy half. |
| `--num_gaussians` | int | auto | Number of Gaussians fitted to the reference volume before training. By default the count is grown until the fit reaches FSC ≥ 0.5 on every populated shell (see `--fit_resolution`); set it to fix the number yourself (e.g. to the number of residues). |
| `--fit_resolution` | float | — | Resolution (Å) the automatic Gaussian fit has to reproduce. |
| `--lattice_stride` | int | 1 | Keep one fixed-lattice point every this many voxels along each axis. Trades resolution for memory. |
| `--bilinear_scatter` | flag | off | Spread each fixed-lattice point over its four neighbouring pixels instead of the nearest one. |
| `--implicit_network` | flag | off | Use an implicit (coordinate-based) decoder: more accurate for very local motions, at a higher memory cost. Only with `--transport_mass`. |
| `--point_transformer` | flag | off | Use a point-transformer decoder on the Gaussian point cloud. Only with `--transport_mass`; ignored if `--implicit_network` is also set. |
| `--film_heads` | flag | off | Replace the implicit SIREN heads (and the point-transformer occupancy head) by a coordinate SIREN modulated by the latent through FiLM layers. |
| `--motion_only` | flag | off | Estimate conformational changes only: the amplitudes stay at their reference values. Only with `--transport_mass`. |
| `--encoder_arch` | choice | `convnn` | Encoder mapping each image to its latent: `convnn` (convolutional), `mlpnn` (MLP) or `resmlp` (residual MLP with LayerNorm on the Fourier-cropped image and a bounded latent). |
| `--train_inverse` | flag | off | Additionally train an inverse decoder mapping the deformed point cloud back to the latent. Only meaningful with `--transport_mass` (disabled otherwise). |
| `--denoising_strength` | float | 1e-4 | Weight of the L1 denoising on the decoded densities. Higher = stronger denoising, but too high can erode protein signal. Recommended range: `1e-4` to `0.1`. |

### Regularization

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--kl_lambda` | float | 0.0 | Weight of the VAE KL divergence towards a standard-normal prior. `0` disables the VAE and uses a deterministic latent. |
| `--kl_free_bits` | float | 0.5 | KL floor (nats per latent dimension) below which a dimension is not penalized, to avoid posterior collapse. `0` gives a plain KL. Only used when `--kl_lambda` > 0. |
| `--decoupling_lambda` | float | 1e-4 | Weight of the decoupling regularization encouraging the conformation latent to be invariant to pose and CTF. Increase for stronger decoupling; `0` to relax. |
| `--nested_dropout` | float | 0.0 | Nested dropout on the decoded latent: during training each sample keeps only its first *k* latent dimensions, with *k* drawn from a Geometric(*p*) distribution. This orders the dimensions by importance (PCA-like), so the first ones carry the dominant motions. Typical 0.1–0.5; `0` disables it. |
| `--noise_invariance_strength` | float | 0.0 | Penalizes latent dimensions that change when the noise changes: each image is encoded again with a second draw of noise, colored like the image background, and the loss is 1 − correlation between both latents, per dimension. After the first epoch its weight is recalibrated every epoch so its encoder gradient is this fraction of the reconstruction one. Typical 0.1–0.5; `0` disables it. Ignored for tomography data. |
| `--deformation_strength` | float | 0.3 | Strength of the graph deformation priors (relative edge strain + repulsion) with respect to the reconstruction loss. After the first epoch the prior weight is recalibrated every epoch so its gradient on the decoder is this fraction of the reconstruction gradient, so the same value behaves alike on every dataset. Lower for larger motions, higher for stiffer ones; `0` disables it. Only with `--transport_mass` and a reference. |
| `--distance_preservation_lambda` | float | 1e-4 | Weight of the local distance preservation between the deformed and the mean state. Higher = stiffer deformations. |
| `--occupancy_strength` | float | 0.0 | Weight of the occupancy prior on the per-particle amplitude change: an L1 shrinkage (stronger where the reference is empty) plus a graph total variation favouring spatially coherent occupancy, both relative to the mean reference density so the value means the same on every dataset. Requires `--transport_mass` and a reference; `0` disables it. |
| `--occupancy_warmup_epochs` | float | 3.0 | Epochs over which the per-particle amplitude change is ramped in, so motion is learned before occupancy. `0` disables the ramp. |
| `--rigid_drift_lambda` | float | 1.0 | Weight of the penalty on the rigid motion that the rigid gauge removes from the decoder displacement field. |
| `--geometric_lambda` | float | 0.0 | Weight of the geometric-correction loss on the decoder Jacobian (Gram determinant), pushing towards a locally volume-preserving latent-to-shape map. Expensive; `0` disables it. |

### Pose refinement

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--pose_refine_reg` | float | 0.1 | Weight of the hinge penalizing pose refinements beyond `--pose_refine_max_angle`. `0` disables it. |
| `--pose_refine_max_angle` | float | 8.0 | Rotation (degrees) the pose refinement may apply freely; the excess is penalized with `--pose_refine_reg`. |
| `--shift_refine_reg` | float | 0.1 | Weight of the hinge penalizing shift refinements beyond `--shift_refine_max`. `0` disables it. |
| `--shift_refine_max` | float | 4.0 | Shift (pixels) the refinement may apply freely; the excess is penalized with `--shift_refine_reg`. |
| `--rigid_gauge` | choice | `core` | Remove the global rigid motion from the decoder output so pose errors go to the pose head. `core`: frame fitted on the least-moving points; `mass`: mass-weighted fit; `off`: diagnostic only. Without `--transport_mass` it requires a reference volume (otherwise it is disabled with a warning). |

### Reference update

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--refit_reference` | flag | off | With `--reload` in `train` mode: fit the Gaussians to `--vol` (e.g. a [MoDART](modart.md) map) and fine-tune the reloaded network on them. The architecture of the reloaded network is kept, and every weight whose shape still matches is reused. Needs `--vol` and a network trained with `--transport_mass` and an implicit or point-transformer decoder. |
| `--learn_reference_epochs` | int | 0 | Learn the positions of the reference Gaussians during the first *N* epochs, then freeze them. Every third epoch only the reference moves (the networks and the deformation prior are paused), and every three epochs it is re-centred on the mean deformed positions of the 100 least-deformed particles. The rest lengths of the deformation prior follow it. The distance moved is printed every epoch and the result is saved as `learned_reference.mrc`. Needs `--transport_mass` and an implicit decoder; `0` disables it. |
| `--reference_lr` | float | auto | Step size (Adam) of `--learn_reference_epochs`. Default: 2e-4 × √(batch_size / 128). |

### Images & reconstruction loss

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--loss_type` | choice | `mse` | Reconstruction loss: `mse` in image space or `frc` (Fourier Ring Correlation). The point-transformer decoder always uses `frc`. |
| `--whiten_loss` | flag | off | Weight every Fourier ring of the reconstruction loss by the inverse of the residual power: unweighted for the first 10 epochs, then updated every epoch from a running average of the residual, keeping the overall loss scale. Only changes the `mse` loss. |
| `--normalize_images` | flag | off | Normalize each particle (zero mean, unit std in the background outside 0.375 × box) before the encoder, the losses and the contrast fit of the Gaussians. |
| `--particle_diameter` | float | auto | Particle diameter (Å), used as the background for `--normalize_images` and for the soft circular mask of the images. Default: the extent of the mask. |
| `--per_image_contrast` | choice | `off` | Fit one contrast scale per particle inside the reconstruction loss instead of relying on the global contrast fixed before training. `relative`: scales normalized to a unit batch mean; `absolute`: raw least-squares scale. |
| `--recon_split_final` | float | 0.1 | Amplitude-term weight *w* of the reconstruction loss, from the first step: *w* × L(learned amplitudes, frozen positions) + (1 − *w*) × L(reference amplitudes, learned positions). Only with `--transport_mass`. |

### Training control

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--epochs` | int | 50 | Number of passes over the dataset (~50–100 for ≈100k particles). |
| `--batch_size` | int / `auto` | 8 | Images on the GPU at once — the main GPU-memory lever. `auto` estimates the largest batch that fits on your GPU (in `predict`, `auto` falls back to 8). |
| `--learning_rate` | float | 1e-4 | Step size of learning. Lower it ~10× if training diverges/produces `NaN`s. |
| `--dataset_split_fraction` | list | 0.8,0.2 | Train/validation split as `train,val` (must sum to 1). |
| `--lr_schedule` | flag | off | Linear warmup (first 10% of training) plus cosine-decay learning-rate schedule instead of a constant rate. |
| `--grad_clip_norm` | float | 1.0 | Global-norm gradient-clipping threshold. `0` disables clipping. |
| `--ema_decay` | float | 0.0 | Decay of the exponential moving average of the weights (typical: 0.999); the averaged weights are exported as the final model. `0` disables it. |
| `--reload` | path | — | A previously saved network, to fine-tune or to run `predict`. If a reference volume was used, this folder must contain both `HetSIREN` and `Gaussian_volume_fitting` subfolders. To fine-tune it on a new reference, add `--refit_reference`. |

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
| `--load_images_to_ram` | flag | off | Load all images into RAM (fastest; needs enough memory). Otherwise images are memory-mapped from disk. |
| `--ssd_scratch_folder` | path | — | When memory-mapping, a fast-SSD folder to read data from. Strongly recommended if not loading to RAM. |

## Example commands

**Train** a heterogeneous reconstruction from particles, applying the CTF:

```bash
hax_project_manager --gpu 0 hetsiren \
    --md particles.xmd \
    --sr 1.5 \
    --ctf_type apply \
    --mode train \
    --lat_dim 8 \
    --epochs 80 \
    --output_path hetsiren_run/
```

**Refine an existing map** and focus on a region with a mask, modelling motion by
transporting mass:

```bash
hax_project_manager --gpu 0 hetsiren \
    --md particles.xmd \
    --vol consensus.mrc \
    --mask tight_mask.mrc \
    --sr 1.5 \
    --ctf_type apply \
    --transport_mass \
    --mode train \
    --output_path hetsiren_refine/
```

**Fine-tune on a new reference**, e.g. the motion-corrected [MoDART](modart.md) map
reconstructed with the network above:

```bash
hax_project_manager --gpu 0 hetsiren \
    --md particles.xmd \
    --vol modart_run/modart_map.mrc \
    --sr 1.5 \
    --ctf_type apply \
    --transport_mass \
    --implicit_network \
    --mode train \
    --reload hetsiren_refine/ \
    --refit_reference \
    --epochs 30 \
    --output_path hetsiren_refit/
```

**Predict** the latent vectors of every particle with a trained network:

```bash
hax_project_manager --gpu 0 hetsiren \
    --md particles.xmd \
    --sr 1.5 \
    --ctf_type apply \
    --mode predict \
    --reload hetsiren_run/ \
    --output_path hetsiren_predict/
```

## Outputs

After **training**, `--output_path` contains, among others:

- `HetSIREN/` — the trained network.
- `HetSIREN_No_Inv/` — the network saved before the (optional) inverse-decoder stage of
  `--train_inverse`.
- `HetSIREN_metrics/` — training/validation curves and sample volume slices (view with
  [Display Metrics](display_metrics.md)).
- `Intermediate_volumes/` — volumes decoded at cluster centres of the latent space, written
  every `--log_landscape_every` epochs.
- `Gaussian_volume_fitting/`, `consensus_volume.mrc` — the Gaussian fit of the reference used
  internally (with `--refit_reference`, the new fit of `--vol`).
- `learned_reference.mrc` — the reference learned with `--learn_reference_epochs`.
- `consensus_reconstruction.mrc` (and `consensus_mask.mrc` with `--transport_mass`) — the
  automatic reference, when neither `--vol` nor `--mask` was given.
- `HetSIREN_CHECKPOINT/` — an intermediate checkpoint for resuming (removed on clean
  completion).
- `run_config.json` — the fully-resolved parameters of the run (reusable as a `--config`).

After **predict**:

- `predicted_latents.xmd` / `.star` — your metadata enriched with the predicted latent
  vector (and refined pose) of every particle. This is the file you feed to
  [Annotate Space](annotate_space.md), [Filter Latents](filter_latents.md) or
  [FlexConsensus](flexconsensus.md).

## Tips & pitfalls

- **`predict` requires `--reload`.** Train first, then point `--reload` at the training
  output.
- **`--lat_dim` must be even.** An odd value stops the run before the Gaussian fit.
- Out of GPU memory? Use `--batch_size auto` or lower `--batch_size`; without
  `--transport_mass`, `--lattice_stride 2` also cuts memory.
- For motions confined to one region, a good **mask** dramatically improves results;
  `--local_reconstruction` (with a reference volume) takes this further.
- `--implicit_network` (with `--transport_mass`) is the most accurate option for subtle
  local motion, at a memory cost.
- **Large-amplitude motions held back (with `--transport_mass`)?** Lower
  `--deformation_strength` (e.g. 0.1); raise it for stiffer, more regular motions. Use
  `--motion_only` if you only want conformational changes, not occupancy.
- **A deformation shared by all particles?** With `--transport_mass --implicit_network`,
  `--learn_reference_epochs` lets the reference positions move during the first epochs, so
  that common deformation goes into the reference instead of into every particle's field.
- **Iterating with MoDART?** Fine-tune the trained network on the new MoDART map with
  `--reload` and `--refit_reference` instead of training a new one from scratch: the fine-tune
  keeps what the first network learned.
- **Latent space looks like a featureless ball?** Combine `--nested_dropout` with
  `--noise_invariance_strength` (e.g. 0.1–0.5 each): dimensions that only fit noise are
  penalized and the remaining ones are ordered by importance, so the conformational
  variability concentrates in the first few dimensions. The current noise-invariance loss
  and weight are shown in the progress bar (`noise_inv=loss/weight`) and logged as
  *Noise invariance (HetSIREN)* in the training metrics.
