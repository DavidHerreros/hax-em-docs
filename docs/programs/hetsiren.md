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
- You want to study **very local motions** (consider `--implicit_network`) or motions in a
  **specific region** (use a `--mask`, optionally with `--local_reconstruction`).
- Your box size is large and you want to model motion by *transporting mass*
  (`--transport_mass`).

It also handles **tomography (subtomogram) data** automatically: if the input metadata
contains `subtomo_labels`, HetSIREN trains its TomoSIREN variant.

## Parameters

### Required

| Option | Type | Description |
|--------|------|-------------|
| `--md` | path | Metadata file with the images (plus alignments / CTF) to analyze — Xmipp `.xmd`, Relion `.star`, or CryoSPARC `.cs` (read directly). If the metadata contains the label `subtomo_labels`, the tomography variant (TomoSIREN) is trained instead, and pose/CTF decoupling is handled for you. |
| `--sr` | float | Sampling rate (pixel size) of the images/volume, in Å/px. |
| `--ctf_type` | choice | How to handle the CTF: `None`, `apply`, `wiener`, or `precorrect`. See [Core Concepts](../getting-started/concepts.md#the-ctf-and-ctf_type). |
| `--mode` | choice | `train` or `predict` (predict needs `--reload`). |
| `--output_path` | path | Folder where all results are saved. |

### Inputs & region of interest

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--vol` | path | — | Reference volume. If given, HetSIREN learns to *refine* this volume towards the heterogeneous states in the images. |
| `--mask` | path | — | Binary reconstruction mask. Should cover the volume where the motions of interest are expected to happen. |
| `--local_reconstruction` | flag | off | Switch to **local** heterogeneous reconstruction/refinement, focusing the analysis on the region enclosed by the reference mask. Requires a reference volume. Overrides `--transport_mass`. |
| `--transport_mass` | flag | off | Let HetSIREN **move** the mass inside the mask (model motion) rather than just reconstructing it. Useful for large box sizes that don't fit in GPU memory, or for a more thorough motion analysis. When combined with a reference volume, use a *tight* mask covering the protein regions to be analyzed. |

### Model configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--lat_dim` | int | 8 | Dimensionality of the latent space (the "map of shapes"). |
| `--num_gaussians` | int | auto | Number of Gaussians used to recreate the reference volume before training. By default the count is chosen automatically for high fidelity; set it to fix the number yourself (e.g. to the number of residues). |
| `--implicit_network` | flag | off | Use an implicit-network architecture: more memory-hungry but more accurate for very local motions. If you enable it, you are advised to also constrain the total mass to keep memory in check. |
| `--point_transformer` | flag | off | Use a point-transformer decoder operating directly on the Gaussian point cloud instead of the default decoder. Only takes effect with `--transport_mass`. Mutually exclusive with `--implicit_network` (which takes precedence if both are given). |
| `--train_inverse` | flag | off | Additionally train an inverse decoder mapping the deformed Gaussian positions back to latent vectors, giving a direct point-cloud → latent encoding. Only meaningful with `--transport_mass` (ignored otherwise). |
| `--denoising_strength` | float | 1e-4 | How strongly HetSIREN learns to remove noise from the resulting volumes. Higher = stronger denoising, but too high can erode protein signal. Recommended range: `1e-4` to `0.1`. |

### Regularization

Weights controlling HetSIREN's regularizers. The deformation-related terms
(`--deformation_lambda`, `--distance_preservation_lambda`, `--arap_lambda`) only take effect
with mass transport (`--transport_mass`) and a reference volume; each can be set to `0` to
disable it.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--kl_lambda` | float | 1e-3 | Weight (β) of the VAE KL divergence regularizing the latent posterior towards a standard-normal prior. Higher = smoother, more regularized latent space at the cost of reconstruction detail; `0` lets the encoder use the latent freely. |
| `--decoupling_lambda` | float | 1e-4 | Weight of the decoupling regularization encouraging the conformation latent to be invariant to pose and CTF. Increase for stronger decoupling; `0` to relax. |
| `--deformation_lambda` | float | 0.9 | Weight of the graph-based deformation regularization (regularity + repulsion) keeping the moving Gaussians' local geometry consistent. Lower (e.g. 0.3–0.5) for sharper/larger motions, higher for stiffer, more regular ones. |
| `--distance_preservation_lambda` | float | 1e-4 | Weight of the local distance-preservation term (penalizes deviations of the mass-weighted point positions from the consensus). Higher = stiffer, more locally rigid deformations; lower for more flexibility. |
| `--arap_lambda` | float | 0.0 | Weight of the as-rigid-as-possible (ARAP) prior. Factors out the best local rotation per Gaussian before penalizing deformation, so locally rigid motions (hinges, domain rotations) are not over-stiffened. `0` disables; try 0.05–0.2. |
| `--geometric_lambda` | float | 0.0 | Weight of the geometric-correction loss, penalizing local volume distortion of the heterogeneity decoder (via the Gram determinant of its Jacobian) to push the latent-to-shape map towards a locally volume-preserving embedding. Expensive to compute — enable only when needed. `0` disables. |

### Pose refinement

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--pose_refine_reg` | float | 0.1 | Strength of the geodesic anchor keeping the per-image rigid pose refinement close to the input poses. Larger = smaller/more conservative refinement; `0` disables it. |
| `--pose_refine_warmup_epochs` | float | 3.0 | Number of initial epochs over which the rigid pose refinement is ramped in from the identity, letting the latent and decoder settle before poses start moving. `0` refines from the first step. |

### Loss & coarse-to-fine annealing

Advanced controls for the reconstruction loss and a coarse-to-fine schedule that stabilizes
training on noisy data (reproducing the EMAN2/e2gmm band-limited-FRC recipe).

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--loss_type` | choice | `mse` | Reconstruction loss. `mse`: image-space L2 (robust on noise, blurs high frequencies). `frc`: Fourier Ring Correlation (sharp on clean data, but must be band-limited on experimental data — see the annealing options below). The point-transformer decoder always uses `frc`. |
| `--freq_anneal_epochs` | float | 0.0 | Coarse-to-fine annealing window: initial epochs over which the effective resolution (decoder SIREN `w0` and the FRC loss band) ramps up from `--freq_anneal_start` to full resolution, forcing low-frequency structure to be fit before high-frequency detail. `0` disables (full resolution from the first step). |
| `--freq_anneal_start` | float | 0.2 | Starting fraction (in (0, 1]) for the annealing: the resolution factor begins here and ramps linearly to 1.0. Smaller = coarser start. Ignored when `--freq_anneal_epochs` is 0. |
| `--sigma_anneal_factor` | float | 1.0 | Band-limits the Gaussian representation for the FRC loss: the render width starts at this factor × base sigma (broad, low-resolution blobs) and shrinks to the base width on the same clock as `--freq_anneal_epochs`. Only affects mass-transport rendering and requires `--freq_anneal_epochs > 0`. `1.0` disables; typical 2–2.5. |
| `--schedule_recon_split` | flag | off | Schedule the mass-transport reconstruction split instead of the fixed `0.1 / 0.9` weighting. The reconstruction loss blends an **amplitude** pathway (learned densities at frozen positions) and a **mass-transport** pathway (fixed reference densities at learned positions); the amplitude weight ramps from `--recon_split_start` to `--recon_split_final` (the motion term takes the complement). Starting near `0` makes early training explain the data almost purely by moving mass, so large-amplitude motions converge faster before the amplitude head absorbs residual density changes. Only meaningful with `--transport_mass`. Off = fixed `--recon_split_final` throughout (the historical `0.1 / 0.9`). |
| `--recon_split_start` | float | 0.0 | Amplitude-term weight at the **start** of training when `--schedule_recon_split` is on. `0.0` = pure mass transport early (reconstruction explained entirely by motion). Ignored when scheduling is off. |
| `--recon_split_final` | float | 0.1 | Amplitude-term weight at the **end** of the ramp — and the fixed weight used throughout when `--schedule_recon_split` is off. `0.1` reproduces the historical `0.1 / 0.9` split. The motion term always takes the complement (`1 −` this). |
| `--recon_split_epochs` | float | 0.0 | Epochs over which the amplitude weight ramps from `--recon_split_start` to `--recon_split_final` when scheduling is on. Left at `0`, it rides the coarse-to-fine clock and reuses `--freq_anneal_epochs` (amplitude is phased in as resolution refines); if both are `0` the weight jumps straight to `--recon_split_final`. |

### Training control

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--epochs` | int | 50 | Number of passes over the dataset (~50–100 for ≈100k particles). |
| `--batch_size` | int | 8 | Images on the GPU at once — the main GPU-memory lever. |
| `--learning_rate` | float | 1e-4 | Step size of learning. Lower it ~10× if training diverges/produces `NaN`s. |
| `--dataset_split_fraction` | list | 0.8,0.2 | Train/validation split as `train,val` (must sum to 1). |
| `--lr_schedule` | flag | off | Use a warmup + cosine-decay learning-rate schedule (ramp from `1e-5` to `--learning_rate` over the first 10% of training, then cosine decay to 0) instead of a constant rate. Warms up the SIREN safely and sharpens the final model. Resumes correctly from a checkpoint. |
| `--grad_clip_norm` | float | 1.0 | Global-norm gradient-clipping threshold; gradients above it are rescaled down to prevent occasional spikes. `0` disables clipping. |
| `--ema_decay` | float | 0.0 | Exponential moving average (Polyak averaging) of the trainable weights (typical: 0.999). When > 0 the averaged weights — not the last raw ones — are exported as the final model, giving cleaner, higher-resolution reconstructions on noisy data. The EMA buffer is checkpointed. `0` disables. |
| `--reload` | path | — | A previously saved network, to fine-tune or to run `predict`. If a reference volume was used, this folder must contain both `HetSIREN` and `Gaussian_volume_fitting` subfolders. |

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
- `HetSIREN_metrics/` — training/validation curves and sample volume slices (view with
  [Display Metrics](display_metrics.md)).
- `Gaussian_volume_fitting/`, `consensus_volume.mrc`, `consensus_volume_deltas.mrc` — the
  Gaussian fit of the reference used internally.
- `HetSIREN_CHECKPOINT/` — an intermediate checkpoint for resuming (removed on clean
  completion).

After **predict**:

- `predicted_latents.xmd` / `.star` — your metadata enriched with the predicted latent
  vector (and refined pose) of every particle. This is the file you feed to
  [Annotate Space](annotate_space.md), [Filter Latents](filter_latents.md) or
  [FlexConsensus](flexconsensus.md).

## Tips & pitfalls

- **`predict` requires `--reload`.** Train first, then point `--reload` at the training
  output.
- Out of GPU memory? Lower `--batch_size` first; consider `--transport_mass` for very large
  boxes.
- For motions confined to one region, a good **mask** dramatically improves results;
  `--local_reconstruction` (with a reference volume) takes this further.
- `--implicit_network` is the most accurate option for subtle local motion, at a memory
  cost.
- **Large-amplitude motions converging slowly (with `--transport_mass`)?** Give the moving
  Gaussians room to travel: enable coarse-to-fine rendering (`--freq_anneal_epochs` with
  `--sigma_anneal_factor` 2–2.5) so early gradients carry over large displacements, prefer
  `--arap_lambda` over a stiff `--deformation_lambda`, and turn on `--schedule_recon_split` so
  early training explains the data by *moving* mass before the amplitude head is phased in.
