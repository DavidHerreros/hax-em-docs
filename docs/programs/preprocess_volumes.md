# Preprocess Volumes

!!! abstract "At a glance"
    **CLI name:** `preprocess_volumes` · **Family:** Preprocessing · **Trains a network:** no

## What it does

**Preprocess Volumes** crops and/or resizes volumes — reference maps, masks, initial models — so
they match a particle set that has been through
[Preprocess Particles](preprocess_particles.md).

It is the companion of that program: whenever you resize particles, the volume handed to the same
network has to be resized **identically**, or its projections will not line up with the images.
Pass the map and its mask in one call so they cannot drift apart.

Two steps, in this order:

1. **Crop** (`--crop_box_size`) — a real-space centred crop, trimming the field of view at the
   original sampling rate. This is how you remove the empty solvent padding around a map.
2. **Resize** (`--new_box_size`) — a Fourier crop/pad, changing the sampling rate by
   `box_cropped / box_resized`.

Cropping first is both the cheaper order — the FFT then runs on a smaller cube — and the usual
intent: trim the solvent, *then* downsample what is left.

!!! info "This program runs on the CPU, deliberately"
    A GPU does the 3D transform a few times faster, but on the boxes volumes actually come in that
    is a **sub-second** saving on a job that handles a handful of files — while a large box (768³
    and up) will exhaust a mid-range card's memory during the complex-valued 3D FFT. A
    multi-threaded CPU FFT keeps a 512³ resize under a second with no such cliff. The batched,
    10⁶-image particle path is where the GPU actually pays off.

## When to use it

- Together with [Preprocess Particles](preprocess_particles.md), to keep the **reference volume,
  the mask and the images** on one box size and one sampling rate.
- To **trim the solvent padding** around a map without touching its sampling rate.
- To bring a map from another package onto the box your particles use.

## Parameters

### Required

| Option | Type | Description |
|--------|------|-------------|
| `--vol` | path… | One or more volumes. Pass several paths to process them all with the same settings — the way to keep a map and its mask consistent. |
| `--output_path` | path | Folder where the preprocessed volumes are written. |

At least one of `--crop_box_size` / `--new_box_size` must be given, or there is nothing to do.

### Box geometry

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--crop_box_size` | int | — | Real-space centred crop, applied **first**. A value larger than the input box zero-pads instead. |
| `--new_box_size` | int | — | Cube size after Fourier resizing, applied **after** the crop. Use the same value you gave `preprocess_particles`. |

### Other

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--sr` | float | header | Sampling rate of the **input** volumes, in Å/px. Read from each volume's header when omitted. |
| `--num_workers` | int | -1 | Threads used by the CPU FFT (`-1` uses every core). |

## Example commands

**Match a particle set** that was downsampled to a 128 box:

```bash
hax_project_manager preprocess_volumes \
    --vol reference.mrc mask.mrc \
    --sr 1.5 \
    --new_box_size 128 \
    --output_path 00_preprocessed_volumes/
```

**Trim the solvent, then downsample** — the volume counterpart of the particle example:

```bash
hax_project_manager preprocess_volumes \
    --vol reference.mrc mask.mrc \
    --sr 1.5 \
    --crop_box_size 192 \
    --new_box_size 96 \
    --output_path 00_preprocessed_volumes/
```

```text
     reference.mrc: (256, 256, 256) @ 1.5000 A/px -> (96, 96, 96) @ 3.0000 A/px
     mask.mrc:      (256, 256, 256) @ 1.5000 A/px -> (96, 96, 96) @ 3.0000 A/px
```

## Outputs

In `--output_path`, one file per input:

- `<name>_preprocessed.mrc` — the processed volume, with the new sampling rate in its header.
  Gray levels are preserved, so a resized map keeps the density scale of the original.
- `run_config.json` — the fully-resolved parameters, reusable as a `--config`.

## Tips & pitfalls

- **Use exactly the same `--crop_box_size` and `--new_box_size` you gave the particles.** The map
  and the images must end on the same box and the same sampling rate.
- **Resize the mask in the same call.** Processing it separately invites a mismatch. Note that a
  Fourier resize is not binary-preserving: re-threshold the result if a program demands a strictly
  binary mask.
- `--new_box_size` requires a **cubic** volume. Crop a non-cubic one to a cube first with
  `--crop_box_size`.
- If a volume's header carries no sampling rate, pass `--sr` explicitly.
- **Do not pass a particle stack to `--vol`.** A stack and a volume are both 3D arrays, so a
  stack of *N* *N*×*N* particles even looks cubic. When the MRC header marks the file as an
  image stack — as everything Hax writes does — the program refuses it and points you at
  [Preprocess Particles](preprocess_particles.md). A stack written by older software may carry
  no such flag, and then nothing can distinguish it from a volume.
- In the GUI, a run that writes **exactly one** volume can be wired straight into a downstream
  `--vol` input. A run that writes several (a map *and* a mask) deliberately offers no such
  connector — picking one for you would be a coin flip — so select the file with the path picker.
