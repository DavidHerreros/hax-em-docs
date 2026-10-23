# Image Gray-Scale Adjustment

!!! abstract "At a glance"
    **CLI name:** `image_gray_scale_adjustment` · **Family:** Gray-scale adjustment
    · **Trains a network:** no · **Modes:** none (a single pass over the particles)

## What it does

The contrast of the particles in a data set is not uniform: ice thickness, defocus and dose
make some images brighter or darker than others. **Image Gray-Scale Adjustment** measures that
contrast for every particle and corrects it.

Each image is compared with the reference volume **projected at the particle's pose**, with
its shift and CTF applied. The gray scale of the image (and, optionally, an offset) is the
least-squares fit of the image to that projection, solved in closed form — the same per-image
contrast fit HetSIREN uses during training. The images are then rescaled and written as a new
stack.

## When to use it

- Before a heterogeneity analysis, so that differences in contrast between particles are not
  mistaken for differences in density.
- To put the particles on the gray scale of a reference map (`--per_image_contrast absolute`).

## Parameters

### Required

| Option | Type | Description |
|--------|------|-------------|
| `--md` | path | Metadata file with the images, their poses and CTF — Xmipp `.xmd`, Relion `.star`, or CryoSPARC `.cs` (read directly). |
| `--vol` | path | Reference volume. It must have the same box and sampling rate as the images. |
| `--sr` | float | Sampling rate (pixel size), in Å/px. |
| `--ctf_type` | choice | `None`, `apply`, `wiener`, `precorrect` or `premultiplied` (see below). |
| `--output_path` | path | Folder where results are saved (created if needed). |

### Adjustment

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--per_image_contrast` | choice | `relative` | `relative`: each image is divided by its gray scale relative to the mean of the data set, so the contrast becomes even while the overall gray level is kept. `absolute`: each image is divided by its own gray scale, which puts every particle on the gray scale of the reference volume. |
| `--fit_offset` | flag | off | Also fit and subtract an offset per image (`image = scale × projection + offset`). By default only the scale is fitted, which assumes images normalized to a zero-mean background. |
| `--mask` | path | — | Binary mask of the region to match. The fit then only uses the pixels inside the projection of the mask. Without it, the whole image is used. |

`--ctf_type` says what the stored images contain: `apply`, `wiener` and `precorrect` all mean
raw images that carry their CTF, so the CTF is applied to the projections; `premultiplied`
means the images were already multiplied by their CTF; `None` means they carry no CTF at all.

### Data loading

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--batch_size` | int | 256 | Images read and projected at once. Lower it if the GPU runs out of memory; it does not change the result. |
| `--threads` | int | 8 | Reader threads feeding the GPU. On a spinning disk, 1 or 2 can be faster. |
| `--ssd_scratch_folder` | path | — | Fast-disk folder where the images are cached (as `float16`) and read from — the same cache the other Hax programs build there. |

## Example command

```bash
hax_project_manager --gpu 0 image_gray_scale_adjustment \
    --md particles.xmd \
    --vol reference.mrc \
    --sr 1.5 \
    --ctf_type apply \
    --output_path img_adjust/
```

## Outputs

- `adjusted_images.mrcs` — the adjusted image stack.
- `adjusted_images.<ext>` — a copy of the input metadata pointing at the adjusted images, with
  two new columns, `adjustment_a` and `adjustment_b`: each adjusted image is
  `adjustment_a × image + adjustment_b`.

## Tips & pitfalls

- The fit needs **reliable poses** and the **right CTF type**. If most images come out
  anti-correlated with the projections, the program stops: check that the images and the
  volume have the same contrast (protein white) and that `--ctf_type` matches the data.
- Images whose projection explains nothing (empty or badly aligned particles) are not
  amplified into noise: they get the median scale, and every scale is kept within 5× of the
  median. The program reports how many images this affected.
- Up to a box of 256 px the projections are computed from a 2× oversampled transform, which
  keeps the fitted scales accurate to about 1%; above that size they are computed without
  oversampling to save memory, and are slightly less accurate.
- See also [Volume Gray-Scale Adjustment](volume_gray_scale_adjustment.md), which fits one
  scale for the volume instead.
