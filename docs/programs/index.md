# Programs Overview

Hax bundles sixteen command-line programs, all launched through `hax_project_manager`
(see [The Command Line](../getting-started/cli.md)). They fall into seven families, listed
below in roughly the order you would use them in a project.

!!! tip "Every program page follows the same layout"
    *What it does → reference paper → when to use it → parameters → example commands →
    outputs → tips*. If a term is unfamiliar, check [Core Concepts](../getting-started/concepts.md)
    first.

---

## Preprocessing

Optional, but often the first thing you run: shrink the box to trade resolution for speed and
VRAM, and correct the CTF once instead of every epoch.

<div class="grid cards" markdown>

-   :material-image-size-select-small:{ .lg .middle } &nbsp; __Preprocess Particles__

    ---

    Resize/crop a particle stack and optionally Wiener- or phase-flip-correct it.

    [:octicons-arrow-right-24: Preprocess Particles](preprocess_particles.md)

-   :material-cube-scan:{ .lg .middle } &nbsp; __Preprocess Volumes__

    ---

    Resize/crop reference maps and masks to match a preprocessed particle set.

    [:octicons-arrow-right-24: Preprocess Volumes](preprocess_volumes.md)

</div>

## Heterogeneity analysis

The core of Hax: learn how your molecule moves and place every particle on a conformational
landscape.

<div class="grid cards" markdown>

-   :material-cube-scan:{ .lg .middle } &nbsp; __HetSIREN__

    ---

    Real-space heterogeneous reconstruction, refinement and disentanglement of
    conformational states.

    [:octicons-arrow-right-24: HetSIREN](hetsiren.md)

-   :material-sine-wave:{ .lg .middle } &nbsp; __Zernike3Deep__

    ---

    Deep-learning estimation of continuous motions using the 3D Zernike basis.

    [:octicons-arrow-right-24: Zernike3Deep](zernike3deep.md)

-   :material-target:{ .lg .middle } &nbsp; __ReconSIREN__

    ---

    Ab initio pose/shift assignment and initial volume estimation.

    [:octicons-arrow-right-24: ReconSIREN](reconsiren.md)

</div>

## Consensus & deconvolution

Combine and refine landscapes coming from one or several methods.

<div class="grid cards" markdown>

-   :material-vector-combine:{ .lg .middle } &nbsp; __FlexConsensus__

    ---

    Merge multiple conformational landscapes into one consensus space.

    [:octicons-arrow-right-24: FlexConsensus](flexconsensus.md)

-   :material-matrix:{ .lg .middle } &nbsp; __Estimate Latent Covariances__

    ---

    Estimate the per-particle uncertainty needed for landscape deconvolution.

    [:octicons-arrow-right-24: Estimate Latent Covariances](estimate_latent_covariances.md)

-   :material-blur-radial:{ .lg .middle } &nbsp; __Latent Space Deconvolution__

    ---

    Sharpen a landscape by removing the blurring caused by estimation noise.

    [:octicons-arrow-right-24: Latent Space Deconvolution](latent_space_deconvolution.md)

</div>

## Gray-scale adjustment

Match intensity levels between maps and images before further analysis.

<div class="grid cards" markdown>

-   :material-image-auto-adjust:{ .lg .middle } &nbsp; __Image Gray-Scale Adjustment__

    ---

    Adjust volume projections to match a set of experimental images.

    [:octicons-arrow-right-24: Image Gray-Scale Adjustment](image_gray_scale_adjustment.md)

-   :material-cube-outline:{ .lg .middle } &nbsp; __Volume Gray-Scale Adjustment__

    ---

    Adjust a volume's gray levels towards a set of images.

    [:octicons-arrow-right-24: Volume Gray-Scale Adjustment](volume_gray_scale_adjustment.md)

</div>

## Latent post-processing

Utilities to turn latent spaces into volumes or to clean them up.

<div class="grid cards" markdown>

-   :material-cube-send:{ .lg .middle } &nbsp; __Decode States from Latents__

    ---

    Generate 3D volumes from a trained network and a list of latent vectors.

    [:octicons-arrow-right-24: Decode States from Latents](decode_states_from_latents.md)

-   :material-filter-variant:{ .lg .middle } &nbsp; __Filter Latents__

    ---

    Remove outliers from a latent space using z-scores.

    [:octicons-arrow-right-24: Filter Latents](filter_latents.md)

</div>

## Reconstruction

<div class="grid cards" markdown>

-   :material-cube:{ .lg .middle } &nbsp; __Reconstruct Volume__

    ---

    Single-pass consensus map from posed particles, FSC-denoised and gray-scale calibrated.

    [:octicons-arrow-right-24: Reconstruct Volume](reconstruct_volume.md)

-   :material-blur:{ .lg .middle } &nbsp; __MoDART__

    ---

    ART-based reconstruction with motion-blur correction from deformation fields.

    [:octicons-arrow-right-24: MoDART](modart.md)

</div>

## Visualization

<div class="grid cards" markdown>

-   :material-chart-scatter-plot:{ .lg .middle } &nbsp; __Annotate Space__

    ---

    Interactive landscape exploration with real-time volume generation.

    [:octicons-arrow-right-24: Annotate Space](annotate_space.md)

-   :material-chart-line:{ .lg .middle } &nbsp; __Display Metrics__

    ---

    Launch a TensorBoard dashboard to monitor training metrics.

    [:octicons-arrow-right-24: Display Metrics](display_metrics.md)

</div>

---

## Quick reference

| Program | CLI name | Family | Trains a network? |
|---------|----------|--------|:---:|
| [Preprocess Particles](preprocess_particles.md) | `preprocess_particles` | Preprocessing | ❌ |
| [Preprocess Volumes](preprocess_volumes.md) | `preprocess_volumes` | Preprocessing | ❌ |
| [HetSIREN](hetsiren.md) | `hetsiren` | Heterogeneity | ✅ |
| [Zernike3Deep](zernike3deep.md) | `zernike3deep` | Heterogeneity | ✅ |
| [ReconSIREN](reconsiren.md) | `reconsiren` | Heterogeneity | ✅ |
| [FlexConsensus](flexconsensus.md) | `flexconsensus` | Consensus | ✅ |
| [Estimate Latent Covariances](estimate_latent_covariances.md) | `estimate_latent_covariances` | Consensus | ❌ |
| [Latent Space Deconvolution](latent_space_deconvolution.md) | `latent_space_deconvolution` | Consensus | ✅ |
| [Image Gray-Scale Adjustment](image_gray_scale_adjustment.md) | `image_gray_scale_adjustment` | Adjustment | ✅ |
| [Volume Gray-Scale Adjustment](volume_gray_scale_adjustment.md) | `volume_gray_scale_adjustment` | Adjustment | ✅ |
| [Decode States from Latents](decode_states_from_latents.md) | `decode_states_from_latents` | Post-processing | ❌ |
| [Filter Latents](filter_latents.md) | `filter_latents` | Post-processing | ❌ |
| [Reconstruct Volume](reconstruct_volume.md) | `reconstruct_volume` | Reconstruction | ❌ |
| [MoDART](modart.md) | `modart` | Reconstruction | ❌* |
| [Annotate Space](annotate_space.md) | `annotate_space` | Visualization | ❌ |
| [Display Metrics](display_metrics.md) | `display_metrics` | Visualization | ❌ |

<small>\* MoDART performs an iterative reconstruction rather than training a reusable network.</small>
