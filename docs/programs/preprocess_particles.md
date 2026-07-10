# Preprocess Particles

!!! abstract "At a glance"
    **CLI name:** `preprocess_particles` · **Family:** Preprocessing · **Trains a network:** no

## What it does

**Preprocess Particles** rewrites a particle stack into a smaller, optionally CTF-corrected one,
and writes an updated metadata file to go with it.

Running a heterogeneity network on a smaller box is the single cheapest way to cut GPU memory
and training time. Halving the box size divides the number of pixels — and roughly the memory a
network needs — by **four**, at the cost of resolution: the new Nyquist frequency becomes
`2 × sr × box_in / box_out` Å. Doing that conversion once, up front, is much cheaper than making
every downstream run resize on the fly.

The program applies up to three steps, in this order:

1. **Crop** (`--crop_box_size`) — a real-space centred crop. It trims the field of view; the
   sampling rate is untouched, and so are the in-plane shifts.
2. **Resize** (`--new_box_size`) — a Fourier crop/pad. It changes the sampling rate, so the
   in-plane shifts stored in the metadata are rescaled to match the new pixel size.
3. **CTF correction** (`--ctf_correction`) — Wiener deconvolution or phase flipping.

!!! info "Why the CTF step comes last"
    A CTF filter is diagonal in Fourier space, so it **commutes** with the spectral truncation
    that Fourier cropping performs. Correcting the CTF on the already-small box gives the same
    result on the retained band as correcting on the full box would, using a much cheaper FFT.
    The CTF oscillations beyond the new Nyquist frequency are exactly the ones the resize
    discards anyway.

Reading, computing and writing are **overlapped**: threads read batches ahead of the GPU, the
GPU processes one batch at a time, and more threads stream the results into a memory-mapped
output stack. Peak memory therefore scales with `--batch_size`, **not** with the number of
particles — a 10⁶-particle stack costs about as much RAM as a 10⁴-particle one.

## When to use it

- To **fit a bigger job on a smaller GPU**, or to make a long training run finish sooner, when
  you do not need the highest-resolution detail.
- To trim a **generously padded box** down to the particle (`--crop_box_size`) before
  downsampling.
- To hand the networks **CTF-corrected** images once, instead of correcting them every epoch.

## Parameters

### Required

| Option | Type | Description |
|--------|------|-------------|
| `--md` | path | Metadata with the images (plus alignments / CTF) — Xmipp `.xmd`, Relion `.star`, or CryoSPARC `.cs`. |
| `--sr` | float | Sampling rate of the **input** images, in Å/px. |
| `--output_path` | path | Folder where the new stack and metadata are written. |

### Box geometry

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--crop_box_size` | int | — | Real-space centred crop, applied **first**. Trims the field of view at the original sampling rate. A value larger than the input box zero-pads instead. |
| `--new_box_size` | int | — | Box size after Fourier resizing, applied **after** the crop. This is the parameter that trades resolution for speed and VRAM. |

Both must be **even**: hax evaluates CTFs on a zero-padded box, and an odd size would make the
padded spectrum and the CTF grid disagree.

### CTF correction

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--ctf_correction` | choice | `none` | `none`, `wiener` (regularized CTF inversion — amplitudes **and** phases), or `phase_flip` (phases only). |
| `--wiener_epsilon` | float | — | Fixed Wiener regularization constant. Omit it to use the adaptive, per-image and frequency-dependent regularizer estimated from each image's spectral SNR — the recommended behaviour. |

### Performance

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--batch_size` | int \| `auto` | 1024 | Images processed at once. The CTF steps zero-pad each image by a factor of 2, so device memory scales with `batch_size × (2 × box_out)²`. Pass `auto` to let hax pick the largest batch that fits — see below. |
| `--device` | choice | `auto` | `auto` (GPU when one is visible, else CPU), `gpu`, or `cpu`. |
| `--num_read_workers` | int | 8 | Threads reading batches from disk ahead of the device. Raise on a slow or networked filesystem. |
| `--num_write_workers` | int | 4 | Threads streaming processed batches into the output stack. |

### `--batch_size auto`

`auto` compiles the kernel ahead of time at two batch sizes, reads XLA's own memory
accounting, fits the (affine) peak-memory-vs-batch line, and solves for the largest batch that
stays inside a 60 % slice of your GPU's memory — capped at 2048. Nothing is executed and no
image data is allocated while probing, so it cannot itself OOM. On a CPU device, or any backend
that does not report memory statistics, it prints a notice and falls back to 1024.

!!! warning "Use `auto` to make a big box *fit*, not to go faster"
    Unlike a training program, this one is bound by how fast images come off the disk, and the
    kernel's throughput is already flat above a batch of ~1024. `auto` therefore does **not**
    speed up a job that already fits — it adds a few seconds of extra compilation. What it does
    is prevent an out-of-memory crash on a large box.

    On a 6 GiB card, a 512-box Wiener run at the default `--batch_size 1024` tries to allocate
    9 GiB and dies; `auto` selects 328 and completes. Conversely, at a 128-box the default
    already runs comfortably and `auto` merely picks the 2048 cap.

Reach for it when a run OOMs, or when you do not know how big a box your card can take.
The chosen batch never changes the output — results are identical for any batch size.

### Output

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--relative_image_paths` | flag | off | Reference the stack by file name instead of absolute path, making the output folder relocatable. See the pitfall below. |

## Example commands

**Halve the box** to fit a large dataset on a smaller GPU:

```bash
hax_project_manager --gpu 0 preprocess_particles \
    --md particles.xmd \
    --sr 1.5 \
    --new_box_size 128 \
    --output_path 00_preprocessed/
```

**Trim a padded box, then downsample, and Wiener-correct** the result:

```bash
hax_project_manager --gpu 0 preprocess_particles \
    --md particles.xmd \
    --sr 1.5 \
    --crop_box_size 192 \
    --new_box_size 96 \
    --ctf_correction wiener \
    --output_path 00_preprocessed/
```

The program prints the new sampling rate, which you pass to every downstream program:

```text
     box            : 256 -> crop 192 -> resize 96
     sampling rate  : 1.5000 -> 3.0000 A/px   (Nyquist 3.00 -> 6.00 A)
     in-plane shifts: rescaled by 0.5000
```

## Outputs

In `--output_path`:

- `preprocessed_particles.mrcs` — the new stack, with the new sampling rate in its header.
- `preprocessed_particles.xmd` (or `.star`, matching the input extension) — metadata pointing at
  the new stack, with **rescaled in-plane shifts**. CTF columns, angles and labels are carried
  over untouched.
- `run_config.json` — the fully-resolved parameters, reusable as a `--config`.

## Tips & pitfalls

- **Pass the new `--sr` downstream.** The program prints it; it is `sr × box_cropped / box_resized`.
  Forgetting this silently mis-models the CTF in every later run.
- **If you correct the CTF here, run downstream programs with `--ctf_type None`.** The images are
  already corrected, and correcting them twice will corrupt the analysis. The program warns you
  about this when it finishes.
- **Resize your reference volume and mask too**, with the same settings, using
  [Preprocess Volumes](preprocess_volumes.md). A map and images with different box sizes will not
  align.
- **Pick the box from the resolution you need**, not from the memory you have: the resized Nyquist
  is `2 × sr × box_in / box_out` Å, and no downstream program can recover detail beyond it.
- **Crop wide enough.** A centred crop keeps the box centre, so shifts stay valid — but a particle
  with a large in-plane shift can fall outside a tight crop.
- **Image paths are absolute by default**, so the output metadata reads back from any working
  directory. Use `--relative_image_paths` if you need to move or share the output folder; then
  downstream programs must be launched from inside it (the GUI does this automatically).
- The **GPU is the right choice here** and is used by default: over a stack of 10⁵–10⁶ images it
  beats a many-core CPU by roughly 4–9×, even counting the host↔device transfers. Force `--device cpu`
  only when the GPU is busy with another job.
- **If a run dies with `RESOURCE_EXHAUSTED`, pass `--batch_size auto`** rather than guessing a
  smaller number. Peak device memory grows with `batch_size × (2 × box_out)²`, so a big box needs a
  much smaller batch than a small one.
- Host RAM stays bounded no matter how large the batch: the read-ahead window is capped in
  **bytes**, not in batches, so peak RSS tracks `--batch_size` rather than the particle count.
