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
| `--denoising_strength` | float | 1e-4 | How strongly HetSIREN learns to remove noise from the resulting volumes. Higher = stronger denoising, but too high can erode protein signal. Recommended range: `1e-4` to `0.1`. |

### Training control

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--epochs` | int | 50 | Number of passes over the dataset (~50–100 for ≈100k particles). |
| `--batch_size` | int | 8 | Images on the GPU at once — the main GPU-memory lever. |
| `--learning_rate` | float | 1e-4 | Step size of learning. Lower it ~10× if training diverges/produces `NaN`s. |
| `--dataset_split_fraction` | list | 0.8,0.2 | Train/validation split as `train,val` (must sum to 1). |
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
