# Pipelines

Hax programs are designed to be **chained**. The output of one is the input of the next: a
metadata file becomes a landscape, a landscape becomes states, states become motion-corrected
maps. This page shows how the pieces fit together so you can plan a project end to end.

!!! tip "Read this alongside the [Programs overview](../programs/index.md)"
    Each box below links to the program that performs it. For runnable, copy-paste sequences
    see [Real-Case Examples](examples.md).

---

## The big picture

```mermaid
flowchart TD
    A[Particle images + metadata<br/>.xmd / .star / .cs] --> B{Have reliable<br/>poses & a map?}
    B -- No --> C[ReconSIREN<br/>ab initio pose / shift + initial volume]
    B -- Yes --> D[Heterogeneity analysis]
    C --> D

    D --> E[Zernike3Deep<br/>continuous motion from a reference]
    D --> F[HetSIREN<br/>real-space heterogeneous reconstruction]

    E --> G[predicted_latents<br/>latent space]
    F --> G

    G --> H[Filter Latents<br/>remove outliers]
    H --> I[Annotate Space<br/>explore & select states]
    I --> J[Decode States from Latents<br/>latent vectors -> volumes]

    E --> K[MoDART<br/>motion-corrected reconstruction]
    F --> K
    J --> L[Final volumes / movies]
    K --> L
```

---

## Stage 1 — Get a starting point

Before studying *motion*, you need decent **poses** (orientations + shifts) and, ideally, a
**consensus map**.

- If your particles already have a good alignment from an upstream package (Relion, Xmipp,
  cryoSPARC…), you can go straight to Stage 2.
- If not, or to refine what you have, use **[ReconSIREN](../programs/reconsiren.md)** for an
  ab initio assignment and an initial volume.

```mermaid
flowchart LR
    A[Raw particles] --> B[ReconSIREN]
    B --> C[poses + shifts]
    B --> D[reconsiren_map.mrc]
```

---

## Stage 2 — Estimate the conformational landscape

This is the heart of Hax. Pick the method that matches your situation:

| Choose… | When |
|---------|------|
| **[Zernike3Deep](../programs/zernike3deep.md)** | You have a good reference volume and want smooth, interpretable deformations (and want to feed [MoDART](../programs/modart.md) later). |
| **[HetSIREN](../programs/hetsiren.md)** | You want flexible, high-fidelity real-space heterogeneous reconstruction, with optional mass transport / local refinement. |

Both produce, after a `predict` run, a **latent space** describing every particle's
conformation (`predicted_latents.xmd`/`.star`, and a `.npy` of the latent vectors).

```mermaid
flowchart LR
    A[particles + reference] --> B[Zernike3Deep / HetSIREN<br/>mode: train]
    B --> C[trained network]
    C --> D[mode: predict]
    D --> E[predicted_latents<br/>latent space]
```

---

## Stage 3 — Clean, merge and sharpen the landscape

Optional refinements that make the landscape more trustworthy:

- **[Filter Latents](../programs/filter_latents.md)** — drop outlier particles.
- **[FlexConsensus](../programs/flexconsensus.md)** — merge landscapes from *several* methods
  into one consensus space (and check what is reproducible).
- **[Estimate Latent Covariances](../programs/estimate_latent_covariances.md)** →
  **[Latent Space Deconvolution](../programs/latent_space_deconvolution.md)** — remove the
  estimation blur so distinct states separate cleanly.

```mermaid
flowchart TD
    A[latent space] --> B[Filter Latents]
    A --> C[Estimate Latent Covariances]
    C --> D[Latent Space Deconvolution]
    M1[method 1 latents] --> E[FlexConsensus]
    M2[method 2 latents] --> E
    E --> F[consensus space]
    B --> G[cleaner landscape]
    D --> G
    F --> G
```

---

## Stage 4 — Explore and materialize states

- **[Annotate Space](../programs/annotate_space.md)** — explore the landscape interactively,
  cluster it, and select the conformations you care about.
- **[Decode States from Latents](../programs/decode_states_from_latents.md)** — turn the
  selected latent vectors (cluster centres, a trajectory, …) into 3D volumes.

```mermaid
flowchart LR
    A[cleaned landscape] --> B[Annotate Space<br/>select / cluster]
    B --> C[latent vectors]
    C --> D[Decode States from Latents]
    D --> E[volumes / movie]
```

---

## Stage 5 — Motion-corrected reconstruction

To obtain a **sharp** map that is not blurred by flexibility, feed a motion model
(Zernike3Deep, or HetSIREN trained with transport of mass) into
**[MoDART](../programs/modart.md)**.

```mermaid
flowchart LR
    A[particles] --> C[MoDART]
    B[Zernike3Deep / HetSIREN<br/>motion model] --> C
    C --> D[modart_map.mrc<br/>+ optional half-maps]
```

---

## Supporting steps you can drop in anywhere

- **[Display Metrics](../programs/display_metrics.md)** — monitor any training run's curves.
- **[Image](../programs/image_gray_scale_adjustment.md) / [Volume](../programs/volume_gray_scale_adjustment.md)
  Gray-Scale Adjustment** — match intensity levels when comparing or combining maps and
  images.

Ready for concrete commands? Continue to [Real-Case Examples](examples.md).
