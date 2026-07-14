# Reconstruct Volume

!!! abstract "At a glance"
    **CLI name:** `reconstruct_volume` · **Family:** Reconstruction · **Trains a network:** no
    (a single, non-iterative pass over the particles)

## What it does

Your particles already carry **poses**. That is all a consensus map needs: by the
projection-slice theorem each image is a central slice of the molecule's 3D Fourier
transform, so the map is recovered by inserting every CTF-weighted slice at its posed
orientation and dividing by the accumulated CTF power. **Reconstruct Volume** does exactly
that, in **one streaming pass** — no iteration, no refinement, no network — and reaches
whatever resolution the data supports.

Three things come for free with that formulation:

- **It knows its own resolution.** The particles are split into two independent halves,
  reconstructed separately, and the FSC between the half-maps is measured. The resolution at
  FSC = 0.143 is printed at the end of the run.
- **It denoises optimally.** That half-map FSC is turned into the MMSE filter and applied to
  the combined map: shells that carry signal pass untouched (no resolution is thrown away),
  shells that are noise are driven to zero (none is kept).
- **It is on the gray scale of your images.** The finished map is forward-projected at a
  subset of the real poses and least-squares scaled against the actual images, so
  re-projecting it reproduces their contrast and value range — which is what makes it usable
  as a reference for the programs downstream.

It can also derive a **binary mask** of the protein region from the map it just produced
(`--write_mask`), which is the `--mask` the heterogeneity programs expect.

## When to use it

- You have **poses but no map** (or a map you don't trust) and need a consensus reference to
  start a heterogeneity analysis with.
- To produce the **reference volume + mask** pair that [HetSIREN](hetsiren.md),
  [Zernike3Deep](zernike3deep.md) and [MoDART](modart.md) take in `--vol` / `--mask`, once,
  so that every downstream run reuses the same reference instead of rebuilding it.
- As a **baseline** to compare a flexible reconstruction against: this is the map you get when
  the heterogeneity is *averaged away*, so it shows you exactly which regions the flexible
  methods sharpen.

!!! tip "HetSIREN does this on its own"
    If you launch [HetSIREN](hetsiren.md) with neither `--vol` nor `--mask`, it runs this same
    reconstruction internally and writes `consensus_reconstruction.mrc` + `consensus_mask.mrc`
    into its output folder. Running `reconstruct_volume` separately is worth it when you want
    to *inspect* the reference before training, tune the mask, or share one reference across
    several runs.

## Parameters

### Required

| Option | Type | Description |
|--------|------|-------------|
| `--md` | path | Metadata file with the images **and their alignments** (plus CTF) — Xmipp `.xmd`, Relion `.star`, or CryoSPARC `.cs`. The poses are what makes the reconstruction possible, so this program cannot run on an unaligned set. |
| `--sr` | float | Sampling rate (pixel size), in Å/px. |
| `--ctf_type` | choice | `None`, `apply`, `wiener`, or `precorrect`. Only *whether* the images carry a CTF matters here: all modes except `None` mean they do. |
| `--output_path` | path | Folder where the map (and mask) are written. |

### Reconstruction

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--tau` | float | 0.05 | Wiener floor of the reconstruction quotient. A numerical regularizer only — it keeps the shells with little CTF power from blowing up; the **resolution is set by the data, not by this**. Raise it if the map looks noisy at high frequency, lower it if it looks over-smoothed. |
| `--no_denoise` | flag | off | Skip the half-map FSC denoising and write the **raw** map. You then get no resolution estimate either. |
| `--no_gray_scale_calibration` | flag | off | Skip the global gray-scale calibration and keep the raw amplitudes. |

### Mask

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--write_mask` | flag | off | Also derive a **binary mask** of the protein region from the reconstructed map and write it as `consensus_mask.mrc`. |
| `--mask_threshold` | float | 0.02 | Fraction of the map's maximum above which a voxel counts as protein. Raise for a tighter mask, lower for a looser one. Only used with `--write_mask`. |
| `--mask_dilate` | int | 2 | How many voxels to grow the mask by, so that a deformation estimated later has somewhere to move the mass into. Only used with `--write_mask`. |

### Performance

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--batch_size` | int | 1024 | Images read and inserted at once. The images are read on a thread pool while the GPU accumulates, so **peak RAM tracks this value, not the number of particles**. Lower it if you run out of memory. |
| `--threads` | int | 8 | Reader threads feeding the GPU with image chunks. On a **spinning disk (HDD)**, several threads read different regions of the stack at once and the head seeks between them — try `1` or `2` there, it is often *faster* than the default. |
| `--ssd_scratch_folder` | path | — | Folder on a fast (SSD/NVMe) disk where the particles are cached as a local **float16** copy (half the bytes) and streamed from. See the note below. |

!!! tip "If your particles live on a slow disk, the read *is* the run"
    This program touches every particle exactly once, so its wall clock is set by how fast the
    images arrive. 1M particles at box 320 is **410 GB** — about an hour off a spinning disk,
    during which the GPU sits idle. `--ssd_scratch_folder` caches the stack on fast storage as
    float16 and streams from there.

    It does **not** make a single cold run faster: building the cache still costs one full read
    of the original stack. It pays off because the copy is **reused** — by later runs, and by the
    other hax programs ([HetSIREN](hetsiren.md), [Zernike3Deep](zernike3deep.md),
    [MoDART](modart.md)…) pointed at the same scratch folder, which build and read *exactly the
    same cache*. Whichever program runs first pays for it; everything after reads from the SSD.
    That matters most for the training programs, which re-read every particle **every epoch**.

## Example commands

**Consensus map + mask** from a posed, CTF-carrying particle set — the usual invocation:

```bash
hax_project_manager --gpu 0 reconstruct_volume \
    --md particles.xmd \
    --sr 1.5 \
    --ctf_type apply \
    --write_mask \
    --output_path consensus/
```

**Raw map**, with no FSC filtering and no gray-scale calibration (e.g. to inspect what the
denoising is actually removing):

```bash
hax_project_manager --gpu 0 reconstruct_volume \
    --md particles.xmd \
    --sr 1.5 \
    --ctf_type apply \
    --no_denoise \
    --no_gray_scale_calibration \
    --output_path consensus_raw/
```

**Already CTF-corrected images** (e.g. coming from
[Preprocess Particles](preprocess_particles.md) with `--ctf_correction`):

```bash
hax_project_manager --gpu 0 reconstruct_volume \
    --md preprocessed_particles.xmd \
    --sr 3.0 \
    --ctf_type None \
    --output_path consensus/
```

## Outputs

In `--output_path`:

- `consensus_reconstruction.mrc` — the reconstructed map, FSC-filtered and gray-scale
  calibrated unless you disabled either.
- `consensus_mask.mrc` — the binary mask derived from it, only with `--write_mask`.
- `run_config.json` — the fully-resolved parameters of the run (reusable as a `--config`).

The measured resolution (half-map FSC = 0.143) is printed at the end of the run.

## Tips & pitfalls

- **`--ctf_type` must match your data.** Weighting CTF-free images by a CTF is not a harmless
  no-op — it reweights the slices and visibly degrades the map. If your images were already
  CTF-corrected during preprocessing, pass `--ctf_type None`.
- **The poses have to be right.** This program trusts the alignments in `--md` completely; it
  does not refine them. If the map comes out as a featureless blob, suspect the poses first —
  [ReconSIREN](reconsiren.md) can estimate them ab initio.
- The map is deliberately **not sharpened**: it is filtered to the resolution the two halves
  actually agree on. That is what makes it safe as a reference — noise in it would otherwise
  propagate straight into the mask and into everything trained against it.
- Feed the resulting map **and** mask into [HetSIREN](hetsiren.md) / [Zernike3Deep](zernike3deep.md)
  (`--vol` / `--mask`) rather than only the map: the mask is what gives the deformation
  somewhere to act.
- **If the run feels slow, watch `nvidia-smi` before tuning anything.** A GPU that idles and
  spikes is starved by the disk, not short of compute — and no parameter here will change that.
  Reach for `--ssd_scratch_folder`, a lower `--threads`, or a smaller box via
  [Preprocess Particles](preprocess_particles.md).
