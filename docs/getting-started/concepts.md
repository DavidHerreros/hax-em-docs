# Core Concepts

Almost every Hax program shares the same handful of ideas and command-line options. Read
this page once and the individual [program pages](../programs/index.md) will feel familiar.

---

## Conformational heterogeneity

Macromolecules are not rigid — they bend, twist, open and close as they work. In a Cryo-EM
experiment, each particle image captures the molecule in *one* of these many shapes. The
collection of all the shapes your molecule can adopt is its **conformational heterogeneity**.

- **Continuous heterogeneity** — smooth, gradual motion (a hinge slowly closing).
- **Discrete heterogeneity** — a few distinct states (bound vs. unbound).

Hax focuses primarily on recovering and describing **continuous** motion, while still
letting you pick out discrete states from the result.

---

## The latent space (your "map of shapes")

Hax describes every particle by a short list of numbers called a **latent vector**. Think of
it as the molecule's *coordinates on a map of all its possible shapes*. Particles with
similar shapes sit close together on this map; very different shapes sit far apart. The map
itself is the **latent space** (also called the *conformational landscape*).

- **`--lat_dim`** sets how many numbers describe each shape (the *dimensionality* of the
  latent space). More dimensions can capture more complex motion but are harder to interpret
  and visualize. A typical starting value is small (e.g. 8 for the heterogeneity networks,
  3 when you want something you can plot directly).

Once you have a latent space you can **explore it** ([Annotate Space](../programs/annotate_space.md)),
**clean it** ([Filter Latents](../programs/filter_latents.md)), **merge several of them**
([FlexConsensus](../programs/flexconsensus.md)), or **turn points back into 3D volumes**
([Decode States from Latents](../programs/decode_states_from_latents.md)).

---

## Metadata files (`.xmd` / `.star` / `.cs`)

Hax never reads raw images on their own — it reads a **metadata file** that lists your
particle images *together with* the information needed to interpret them: their pose
(orientation), shifts (centering), and CTF parameters.

Hax reads the three most common formats directly, so you can plug it into almost any
pipeline without converting your files first:

- **`.xmd`** — Xmipp metadata format.
- **`.star`** — Relion/RELION-style metadata format.
- **`.cs`** — **CryoSPARC** metadata format, read directly (support is provided through the
  `xmipp_metadata` library that Hax builds on).

You point Hax at one of these with the **`--md`** option. The images themselves are
referenced from inside the metadata file, so they must remain accessible at the paths it
records.

!!! note "Where do these files come from?"
    Metadata files are produced by upstream Cryo-EM packages (CryoSPARC, Xmipp, Relion,
    Scipion, …) during particle picking, 2D/3D classification and refinement. Hax consumes
    the output of that pipeline.

!!! tip "Coming from CryoSPARC?"
    You can pass a CryoSPARC `.cs` file straight to `--md` — there is no need to export it to
    a `.star` file first.

---

## Sampling rate (`--sr`)

The **sampling rate** (also called pixel size) is the physical size of one pixel, in
**ångströms per pixel (Å/px)**. It is how Hax relates pixels to real-world distances.

- Supplied with **`--sr`** (a number, e.g. `1.5`).
- It **must match** the images and reference volume you provide. Getting it wrong throws off
  every distance-dependent calculation (the CTF, the geometry of motion, resolution).

---

## The CTF and `--ctf_type`

The **Contrast Transfer Function (CTF)** describes how the microscope's optics distort the
recorded image — it modulates and partially inverts the contrast at different spatial
frequencies. To get faithful results, this distortion has to be accounted for.

The **`--ctf_type`** option tells Hax how to handle it:

| Value | What it does | When to use it |
|-------|--------------|----------------|
| `None` | Ignore the CTF entirely. | Only for already CTF-corrected data, or quick tests. |
| `apply` | Apply the CTF to the *generated projections* so they match the (uncorrected) experimental images. | The usual, robust choice for raw experimental particles. |
| `wiener` | CTF-correct the experimental images using a Wiener filter. | When you prefer to correct the data side. |
| `precorrect` | Use a pre-correction of the experimental images. | Alternative correction strategy. |

If in doubt, **`apply`** is the most common and safe default for standard experimental
particles.

---

## Masks (`--mask`)

A **mask** is a binary 3D volume (1 inside a region, 0 outside) that tells Hax *where to
focus*. Masks let you concentrate the analysis on the part of the molecule you care about
and ignore noisy or static regions.

- For **reconstruction** masks, define the region to cover all the volume where the motions
  of interest happen.
- Masks must usually be **binary**. Check each program page for whether a mask is required,
  optional, or generated automatically when omitted.

---

## Training modes: `train` and `predict`

The neural-network programs work in distinct **modes**, selected with **`--mode`**:

- **`train`** — Learn from your data, building (training) a network from scratch, or
  continuing from a previous run if you also pass `--reload`. This is the step that actually
  *fits* the conformational landscape.
- **`predict`** — Use an already-trained network to compute results (e.g. the latent vector
  of every particle) for a dataset. **Requires `--reload`** to point at the trained network.

A normal session is therefore: **train once**, then **predict** as many times as you need.
The network saved by a `train` run can also be reused directly by post-processing tools such
as [Decode States from Latents](../programs/decode_states_from_latents.md) and
[Estimate Latent Covariances](../programs/estimate_latent_covariances.md).

---

## Saving and reloading (`--output_path`, `--reload`)

- **`--output_path`** — the folder where a program writes everything: the trained network,
  new metadata, predicted latents, volumes, training metrics, and so on. Each program page
  lists exactly what it produces.
- **`--reload`** — the path to a previously saved network. Use it to:
    - **continue / fine-tune** a training run,
    - run **`predict`** (where it is mandatory).

!!! tip "Checkpoints make training resumable"
    During training, Hax periodically writes an intermediate checkpoint (e.g.
    `*_CHECKPOINT/`). If a run is interrupted, you can resume it by pointing `--reload` at
    the output of the previous run instead of starting over.

---

## Common training knobs

These options appear on most network programs and behave the same way everywhere:

| Option | Meaning | Practical advice |
|--------|---------|------------------|
| `--epochs` | How many times the network sees the whole dataset. | ~50–100 is enough for ≈100k particles; scale up/down with dataset size. |
| `--batch_size` | How many images are on the GPU at once. | The main lever for GPU-memory usage — lower it if you run out of memory; watch with `nvidia-smi`. Very large batches can miss very local motions. |
| `--learning_rate` | The "step size" of learning. | Default `1e-4` is a good start. If training produces `NaN`s or blows up, make it ~10× smaller. |
| `--dataset_split_fraction` | How data is split into training/validation subsets, as `train,val`. | Defaults to `0.8,0.2`. The two fractions must sum to 1. The validation subset is only used to *measure* accuracy, never to train. |

---

## Reading data: RAM vs. memory-mapping

Cryo-EM datasets can be huge. Each program lets you choose how images are loaded:

- **`--load_images_to_ram`** — load all images into RAM. **Fastest**, but only if the
  dataset fits in memory.
- If you **omit** that flag, images are *memory-mapped* from disk instead. This trades a
  little speed (and some temporary disk space during the run) for a much smaller memory
  footprint. The temporary disk space is reclaimed when the run finishes.
- **`--ssd_scratch_folder`** — when memory-mapping, point this at a folder on a **fast SSD**
  to read data faster. Highly recommended if you are not loading to RAM.

---

## Monitoring training

While a network trains, Hax writes **metrics** (loss curves, validation curves, sample
volume slices) into a metrics folder inside your `--output_path`. You can watch these live —
including after the run — with the [Display Metrics](../programs/display_metrics.md) program,
which launches a TensorBoard dashboard in your browser.

---

With these concepts in hand, head to the [Programs overview](../programs/index.md) to find
the right tool for your task.
