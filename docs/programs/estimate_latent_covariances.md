# Estimate Latent Covariances

!!! abstract "At a glance"
    **CLI name:** `estimate_latent_covariances` · **Family:** Consensus & deconvolution
    · **Trains a network:** no

## What it does

When a heterogeneity network assigns a latent vector to a particle, that estimate carries
some **uncertainty** — a noisy particle could plausibly map to several nearby points on the
landscape. This program measures that uncertainty, producing a **covariance matrix** for each
particle's latent vector.

These covariances quantify how "smeared out" each point on the landscape is. They are the
required input for [Latent Space Deconvolution](latent_space_deconvolution.md), which uses
them to *sharpen* the landscape by removing that estimation blur.

## Reference

This tool supports the latent-space deconvolution workflow associated with the FlexConsensus
framework:

> Herreros, D., Perez Mata, C., Sanchez Sorzano, C.O. *et al.* **Merging conformational
> landscapes in a single consensus space with the FlexConsensus algorithm.**
> *Nature Methods* (2025).
> [https://doi.org/10.1038/s41592-025-02841-w](https://doi.org/10.1038/s41592-025-02841-w)

## When to use it

- Immediately **before** running [Latent Space Deconvolution](latent_space_deconvolution.md).
- After training a heterogeneity network (HetSIREN, Zernike3Deep): just point this program at
  the saved network folder.

## Parameters

### Required

| Option | Type | Description |
|--------|------|-------------|
| `--md` | path | Metadata file with the images (plus alignments / CTF) needed to estimate the covariances — Xmipp `.xmd`, Relion `.star`, or CryoSPARC `.cs` (read directly). |
| `--output_path` | path | Folder where the covariances and latents are saved. |

### Optional

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--nn_path` | path | — | Folder containing a saved neural network (HetSIREN, Zernike3Deep…) — the network folder produced by a `train` run (e.g. `zernike_run/Zernike3Deep`). |
| `--batch_size` | int | 64 | Images processed on the GPU at once (GPU-memory lever). |
| `--load_images_to_ram` | flag | off | Load all images into RAM (fastest). Otherwise memory-mapped. |
| `--ssd_scratch_folder` | path | — | Fast-SSD folder used when memory-mapping. |

## Example command

```bash
hax_project_manager --gpu 0 estimate_latent_covariances \
    --md particles.xmd \
    --nn_path zernike_run/Zernike3Deep \
    --batch_size 64 \
    --output_path covariances/
```

## Outputs

In `--output_path`:

- `covariance_matrices.npy` — the stacked per-particle covariance matrices
  (shape ≈ `[num_images, lat_dim, lat_dim]`).
- `latents.npy` — the latent vectors corresponding to those covariances.

Feed `covariance_matrices.npy` into
[Latent Space Deconvolution](latent_space_deconvolution.md) via its `--covariances` option.

## Tips & pitfalls

- Point `--nn_path` at the **network folder** saved by a `train` run (e.g.
  `zernike_run/Zernike3Deep`).
- This program does **not** have a `--mode` option — it always performs covariance
  estimation.
- The `--md` you pass should be the same particle set whose latents you want to deconvolve.
