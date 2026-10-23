# Volume Gray-Scale Adjustment

!!! abstract "At a glance"
    **CLI name:** `volume_gray_scale_adjustment` · **Family:** Gray-scale adjustment
    · **Trains a network:** no · **Modes:** none (a single pass over the particles)

## What it does

A map obtained elsewhere (another program, another data set, a simulation) is rarely on the
gray scale of your particles. **Volume Gray-Scale Adjustment** finds the **single scale** that
makes the projections of the map match the images, and applies it to the map.

The map is projected at the pose of every particle, with its shift and CTF applied, and the
scale is the least-squares fit of all the images to those projections, solved in closed form.
The output is the **input map multiplied by that scale**: nothing is resampled, masked or
fitted with Gaussians, and no offset is added (a constant in the map would also fill the
background).

## When to use it

- Before using a map as the reference of a program that compares its projections with the
  images (HetSIREN, Zernike3Deep, MoDART...), when the map does not come from these particles.
- To compare or combine maps from different sources on the gray scale of the same images.

## Parameters

### Required

| Option | Type | Description |
|--------|------|-------------|
| `--md` | path | Metadata file with the images, their poses and CTF — Xmipp `.xmd`, Relion `.star`, or CryoSPARC `.cs` (read directly). |
| `--vol` | path | Map to adjust. It must have the same box and sampling rate as the images. |
| `--sr` | float | Sampling rate (pixel size), in Å/px. |
| `--ctf_type` | choice | `None`, `apply`, `wiener`, `precorrect` or `premultiplied` (as in [Image Gray-Scale Adjustment](image_gray_scale_adjustment.md#parameters)). |
| `--output_path` | path | Folder where results are saved (created if needed). |

### Adjustment

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--fit_offset` | flag | off | Allow an offset per image while fitting the scale. Use it when the images are not normalized to a zero-mean background. The offsets are not applied to the map. |
| `--mask` | path | — | Binary mask of the region to match. The fit then only uses the pixels inside the projection of the mask. The scale is applied to the whole map either way. |

### Data loading

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--batch_size` | int | 256 | Images read and projected at once. Lower it if the GPU runs out of memory; it does not change the result. |
| `--threads` | int | 8 | Reader threads feeding the GPU. On a spinning disk, 1 or 2 can be faster. |
| `--ssd_scratch_folder` | path | — | Fast-disk folder where the images are cached (as `float16`) and read from — the same cache the other Hax programs build there. |

## Example command

```bash
hax_project_manager --gpu 0 volume_gray_scale_adjustment \
    --md particles.xmd \
    --vol reference.mrc \
    --sr 1.5 \
    --ctf_type apply \
    --output_path vol_adjust/
```

## Outputs

- `adjusted_volume.mrc` — the input map multiplied by the fitted scale.
- `gray_scale.txt` — the scale itself, so it can be applied to other copies of the map (for
  example, the same map at a different box).

## Tips & pitfalls

- The fit needs **reliable poses** and the **right CTF type**. If the projections come out
  anti-correlated with the images, the program stops: check that the images and the map have
  the same contrast (protein white) and that `--ctf_type` matches the data.
- Every particle is used, so the scale is very precise; what limits it is how well the map
  and the poses describe the data.
- [Reconstruct Volume](reconstruct_volume.md) already calibrates the gray scale of the maps it
  reconstructs, so they do not need this step.
- For a per-particle correction instead, see
  [Image Gray-Scale Adjustment](image_gray_scale_adjustment.md).
