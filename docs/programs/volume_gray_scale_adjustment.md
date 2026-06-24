# Volume Gray-Scale Adjustment

!!! abstract "At a glance"
    **CLI name:** `volume_gray_scale_adjustment` · **Family:** Gray-scale adjustment
    · **Trains a network:** yes · **Modes:** `train`, `predict`

## What it does

This is the **volume-side counterpart** of
[Image Gray-Scale Adjustment](image_gray_scale_adjustment.md). It adjusts the intensity
("gray") levels of a **volume** so that they match a set of experimental images. The result
is a volume placed on the same intensity scale as your data — useful before comparison,
combination, or further processing.

The adjustment can be learned:

- **per voxel** (default) — a detailed, spatially-varying correction.
- **for the whole volume** — a single transformation, via `--predicts_value`.

## When to use it

- To bring a volume's gray levels in line with a set of experimental images.
- As a normalization step when combining maps from different sources or with experimental
  data.

## Parameters

### Required

| Option | Type | Description |
|--------|------|-------------|
| `--vol` | path | The volume to be adjusted according to the images. |
| `--sr` | float | Sampling rate (pixel size), in Å/px. |
| `--ctf_type` | choice | `None`, `apply`, `wiener`, or `precorrect`. |
| `--mode` | choice | `train` or `predict` (predict needs `--reload`). |
| `--output_path` | path | Folder where results are saved. |

### Inputs & adjustment configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--md` | path | — | Metadata file with the images (plus alignments / CTF) the volume is matched against — Xmipp `.xmd`, Relion `.star`, or CryoSPARC `.cs` (read directly). |
| `--mask` | path | sphere | Focus the adjustment on a region of interest. If omitted, an inscribed spherical mask is used. |
| `--predicts_value` | flag | off | Estimate one adjustment for the **whole volume** instead of the default **per-voxel** correction. |
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

**Train** a per-voxel volume adjustment against a set of images:

```bash
hax_project_manager --gpu 0 volume_gray_scale_adjustment \
    --md particles.xmd \
    --vol reference.mrc \
    --sr 1.5 \
    --ctf_type apply \
    --mode train \
    --output_path vol_adjust_run/
```

**Predict** the adjusted volume:

```bash
hax_project_manager --gpu 0 volume_gray_scale_adjustment \
    --md particles.xmd \
    --vol reference.mrc \
    --sr 1.5 \
    --ctf_type apply \
    --mode predict \
    --reload vol_adjust_run/ \
    --output_path vol_adjust_predict/
```

## Outputs

After **train**:

- `volumeAdjustment/` — the trained network, plus `Volume_adjustment_metrics/` and
  `volumeAdjustment_CHECKPOINT/`.
- `mask.mrc` — the spherical mask, when you did not supply one.

After **predict**:

- `adjusted_volume.mrc` — the gray-level-adjusted volume. With `--predicts_value` a single
  per-volume adjustment is applied; otherwise voxel values in the masked region are replaced
  by the learned per-voxel correction.

## Tips & pitfalls

- Provide a **mask** to focus the adjustment on the molecule.
- Choose **per-voxel** (default) for fine spatial control, or `--predicts_value` for a single
  global correction.
- For the image-side equivalent, see
  [Image Gray-Scale Adjustment](image_gray_scale_adjustment.md).
