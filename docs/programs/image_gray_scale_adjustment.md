# Image Gray-Scale Adjustment

!!! abstract "At a glance"
    **CLI name:** `image_gray_scale_adjustment` · **Family:** Gray-scale adjustment
    · **Trains a network:** yes · **Modes:** `train`, `predict`

## What it does

The intensity ("gray") levels of projections generated from a volume rarely match those of
your experimental images exactly — they differ in scale and offset. **Image Gray-Scale
Adjustment** learns the transformation that makes the projections of a volume **match a set
of experimental images**, so the two can be compared or combined on a common intensity scale.

The adjustment can be learned at two granularities:

- **per pixel** (default) — a detailed, spatially-varying correction.
- **per projection** — a single scale/offset per image, via `--predict_value`.

## When to use it

- To put generated projections and experimental images on the **same gray scale** before a
  comparison, subtraction, or downstream step that assumes matched intensities.
- As a preparatory/normalization step in pipelines that mix synthetic and experimental data.

## Parameters

### Required

| Option | Type | Description |
|--------|------|-------------|
| `--md` | path | Metadata file with the images (plus alignments / CTF) — Xmipp `.xmd`, Relion `.star`, or CryoSPARC `.cs` (read directly). |
| `--vol` | path | Volume used to generate the projections to be adjusted. |
| `--sr` | float | Sampling rate (pixel size), in Å/px. |
| `--ctf_type` | choice | `None`, `apply`, `wiener`, or `precorrect`. |
| `--mode` | choice | `train` or `predict` (predict needs `--reload`). |
| `--output_path` | path | Folder where results are saved. |

### Adjustment configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--mask` | path | sphere | Focus the adjustment on a region of interest. If omitted, an inscribed spherical mask is used. |
| `--predict_value` | flag | off | Estimate the adjustment **per projection** (one value) instead of the default **per pixel**. |
| `--lat_dim` | int | 3 | Dimensionality of the network's latent space. |

### Training control

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--epochs` | int | 50 | Passes over the dataset. |
| `--batch_size` | int | 64 | Images on the GPU at once (GPU-memory lever). |
| `--learning_rate` | float | 1e-5 | Step size of learning; lower ~10× if it diverges. |
| `--dataset_split_fraction` | list | 0.8,0.2 | Train/validation split (must sum to 1). |
| `--reload` | path | — | A saved network to fine-tune or to run `predict`. |

### Data loading

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--load_images_to_ram` | flag | off | Load all images into RAM (fastest). Otherwise memory-mapped. |
| `--ssd_scratch_folder` | path | — | Fast-SSD folder used when memory-mapping. |

## Example commands

**Train** a per-pixel adjustment:

```bash
hax_project_manager --gpu 0 image_gray_scale_adjustment \
    --md particles.xmd \
    --vol reference.mrc \
    --sr 1.5 \
    --ctf_type apply \
    --mode train \
    --output_path img_adjust_run/
```

**Predict** the adjusted images (per-projection adjustment):

```bash
hax_project_manager --gpu 0 image_gray_scale_adjustment \
    --md particles.xmd \
    --vol reference.mrc \
    --sr 1.5 \
    --ctf_type apply \
    --predict_value \
    --mode predict \
    --reload img_adjust_run/ \
    --output_path img_adjust_predict/
```

## Outputs

After **train**:

- `imageAdjustment/` — the trained network, plus `Image_adjustment_metrics/` and
  `imageAdjustment_CHECKPOINT/`.
- `mask.mrc` — the spherical mask, when you did not supply one.

After **predict**:

- `adjusted_images.mrcs` — the adjusted image stack.
- `adjusted_images.<ext>` — a new metadata file pointing at the adjusted images. With
  `--predict_value`, it also records `adjustment_a` and `adjustment_b` columns (the per-image
  scale and offset).

## Tips & pitfalls

- Use a **mask** to keep the adjustment focused on the molecule rather than background noise.
- Choose **per-pixel** (default) for spatially-varying corrections, or **per-projection**
  (`--predict_value`) when a single scale/offset per image is enough and you want the
  numeric coefficients.
- See also [Volume Gray-Scale Adjustment](volume_gray_scale_adjustment.md), the volume-side
  counterpart.
