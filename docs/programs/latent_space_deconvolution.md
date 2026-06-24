# Latent Space Deconvolution

!!! abstract "At a glance"
    **CLI name:** `latent_space_deconvolution` · **Family:** Consensus & deconvolution
    · **Trains a network:** yes · **Modes:** `train`, `predict`

## What it does

A conformational landscape estimated from noisy particles is always slightly **blurred**:
each true conformation gets spread out because the latent vector of every particle is
uncertain. **Latent Space Deconvolution** removes that blur, producing a **sharper, more
faithful** landscape in which distinct conformational states are easier to separate.

It uses the per-particle uncertainty measured by
[Estimate Latent Covariances](estimate_latent_covariances.md) to "undo" the smearing, much
like deconvolving a blurred photograph once you know the blur kernel. The latent vectors of
your images are recovered on the fly from the trained heterogeneity network you point it at.

## Reference

> Herreros, D., Perez Mata, C., Sanchez Sorzano, C.O. *et al.* **Merging conformational
> landscapes in a single consensus space with the FlexConsensus algorithm.**
> *Nature Methods* (2025).
> [https://doi.org/10.1038/s41592-025-02841-w](https://doi.org/10.1038/s41592-025-02841-w)

## When to use it

- After [Estimate Latent Covariances](estimate_latent_covariances.md), to obtain a cleaner
  landscape before exploring it or decoding states from it.
- When distinct conformations appear *overlapping* or *smeared* in your latent space.

## Parameters

### Required

| Option | Type | Description |
|--------|------|-------------|
| `--md` | path | Metadata file with the images — Xmipp `.xmd`, Relion `.star`, or CryoSPARC `.cs` (read directly). Their latent vectors are recovered on the fly from `--nn_path` and then deconvolved. |
| `--nn_path` | path | Folder with a saved neural network (HetSIREN, Zernike3Deep…); its encoder recovers the latent vectors on the fly. |
| `--covariances` | path | The `.npy` covariance file produced by [Estimate Latent Covariances](estimate_latent_covariances.md). |
| `--mode` | choice | `train` or `predict` (predict needs `--reload`). |
| `--output_path` | path | Folder where results are saved. |

### Model & training

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--lat_dim` | int | 3 | Dimensionality of the deconvolution network's latent space. |
| `--deconvolution_strength` | float | 1.0 | How aggressively to deconvolve. `1.0` matches the blur implied by the covariances; larger values deconvolve more strongly, smaller values are more conservative. |
| `--epochs` | int | 100 | Number of passes over the data. |
| `--batch_size` | int | 1024 | Vectors processed at once. |
| `--reload` | path | — | A previously trained deconvolution network, to fine-tune or to run `predict`. |

### Data loading

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--load_images_to_ram` | flag | off | Load all images into RAM (fastest). Otherwise memory-mapped. |
| `--ssd_scratch_folder` | path | — | Fast-SSD folder used when memory-mapping (defaults to the output path otherwise). |

## Example commands

**Train** the deconvolution from a network and its covariances:

```bash
hax_project_manager --gpu 0 latent_space_deconvolution \
    --md particles.xmd \
    --nn_path zernike_run/Zernike3Deep \
    --covariances covariances/covariance_matrices.npy \
    --lat_dim 3 \
    --deconvolution_strength 1.0 \
    --mode train \
    --output_path deconv_run/
```

**Predict** the deconvolved latents:

```bash
hax_project_manager --gpu 0 latent_space_deconvolution \
    --md particles.xmd \
    --nn_path zernike_run/Zernike3Deep \
    --covariances covariances/covariance_matrices.npy \
    --mode predict \
    --reload deconv_run/ \
    --output_path deconv_predict/
```

## Outputs

- After **train**: `deconvolver/` — the trained deconvolution network.
- After **predict**: `latents_deconvolved.npy` — the sharpened latent space, ready for
  [Annotate Space](annotate_space.md) or [Decode States from Latents](decode_states_from_latents.md).

## Tips & pitfalls

- Run [Estimate Latent Covariances](estimate_latent_covariances.md) **first** — its output is
  a required input here.
- Start with `--deconvolution_strength 1.0`. Increase it if states still overlap; decrease it
  if the landscape starts to look fragmented or artefactual.
- A small `--lat_dim` (the default `3`) gives a landscape you can plot and explore directly.
