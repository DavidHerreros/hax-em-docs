# ReconSIREN

!!! abstract "At a glance"
    **CLI name:** `reconsiren` · **Family:** Heterogeneity analysis · **Trains a network:** yes
    · **Modes:** `train`, `predict`

## What it does

**ReconSIREN** estimates the **pose (orientation), shifts (centering) and an initial 3D
volume** of your particles — from scratch if needed (*ab initio*). It is the tool to reach
for at the very start of a project, when you have particle images but no reliable angular
assignment yet, or when you want to refine an existing assignment.

It can also produce a set of preliminary **heterogeneous maps** by clustering its internal
latent space, giving you an early look at the conformational variability before committing to
a full heterogeneity analysis with [HetSIREN](hetsiren.md) or
[Zernike3Deep](zernike3deep.md).

## Reference

ReconSIREN is part of the SIREN-based real-space reconstruction framework introduced
alongside HetSIREN:

> Herreros, D., Mata, C.P., Noddings, C. *et al.* **Real-space heterogeneous reconstruction,
> refinement, and disentanglement of CryoEM conformational states with HetSIREN.**
> *Nature Communications* **16**, 3751 (2025).
> [https://doi.org/10.1038/s41467-025-59135-0](https://doi.org/10.1038/s41467-025-59135-0)

## When to use it

- You need an **ab initio** orientation/shift assignment and an initial map.
- You want to **refine** an existing assignment (use `--refine_current_assignment`).
- You have a **high-resolution reference** (e.g. from an atomic model) and only need angles,
  not a new map (use `--do_not_learn_volume`).
- Your particle has **symmetry** (`--symmetry_group`).

## Parameters

### Required

| Option | Type | Description |
|--------|------|-------------|
| `--md` | path | Metadata file with the images (plus alignments / CTF) — Xmipp `.xmd`, Relion `.star`, or CryoSPARC `.cs` (read directly). |
| `--sr` | float | Sampling rate (pixel size), in Å/px. |
| `--ctf_type` | choice | `None`, `apply`, `wiener`, or `precorrect`. |
| `--mode` | choice | `train` or `predict` (predict needs `--reload`). |
| `--output_path` | path | Folder where all results are saved. |

### Reconstruction behavior

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--vol` | path | — | Starting volume to assign angles/shifts against (otherwise ab initio). |
| `--mask` | path | — | Binary reconstruction mask covering the region where the relevant signal/motion lives. |
| `--do_not_learn_volume` | flag | off | Only learn an angular assignment with shifts — do not learn a map. Useful with a high-resolution reference that needs no refinement. |
| `--refine_current_assignment` | flag | off | Refine the angles/shifts already present in the metadata instead of finding them ab initio. |
| `--symmetry_group` | str | `c1` | Point-group symmetry to consider. Only `c*` and `d*` groups are supported (lower-case). Even with symmetry set, a symmetry-broken `c1` set of angles is learned, so the angles can be used directly in a downstream reconstruction/refinement. |

### Training control

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--epochs` | int | 50 | Passes over the dataset (~50–100 for ≈100k particles). |
| `--batch_size` | int | 8 | Images on the GPU at once (GPU-memory lever). |
| `--learning_rate` | float | 1e-4 | Step size of learning; lower ~10× if it diverges. |
| `--dataset_split_fraction` | list | 0.8,0.2 | Train/validation split (must sum to 1). |
| `--reload` | path | — | A saved network to fine-tune or to run `predict`. |

### Data loading

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--load_images_to_ram` | flag | off | Load all images into RAM (fastest). Otherwise memory-mapped. |
| `--ssd_scratch_folder` | path | — | Fast-SSD folder used when memory-mapping. |

## Example commands

**Ab initio** pose/shift assignment and initial volume:

```bash
hax_project_manager --gpu 0 reconsiren \
    --md particles.xmd \
    --sr 1.5 \
    --ctf_type apply \
    --mode train \
    --epochs 60 \
    --output_path reconsiren_run/
```

**Refine** an existing assignment, respecting C2 symmetry:

```bash
hax_project_manager --gpu 0 reconsiren \
    --md particles_aligned.xmd \
    --sr 1.5 \
    --ctf_type apply \
    --refine_current_assignment \
    --symmetry_group c2 \
    --mode train \
    --output_path reconsiren_refine/
```

**Predict** angles, shifts and heterogeneous maps with a trained network:

```bash
hax_project_manager --gpu 0 reconsiren \
    --md particles.xmd \
    --sr 1.5 \
    --ctf_type apply \
    --mode predict \
    --reload reconsiren_run/ \
    --output_path reconsiren_predict/
```

## Outputs

After **training**:

- `ReconSIREN/` — the trained network, plus `ReconSIREN_metrics/` and a
  `ReconSIREN_CHECKPOINT/` for resuming.
- `reconsiren_map.mrc` — the consensus 3D reconstruction.
- `reconsiren_hetmap_*.mrc` — preliminary heterogeneous maps (one per cluster).
- `volumeAdjustment/` — a gray-level adjustment network, when a reference volume was used.

After **predict**:

- `predicted_pose_shifts.xmd` / `.star` — metadata with predicted angles, shifts and latent
  codes — ready for a downstream reconstruction or heterogeneity analysis.
- `reconsiren_map.mrc` and a set of `reconsiren_hetmap_*.mrc` heterogeneous maps (obtained by
  k-means clustering of the latent codes).

## Tips & pitfalls

- For symmetric particles, set `--symmetry_group` (e.g. `c2`, `d7`) — note the requirement
  that it be lower-case and limited to `c*`/`d*`.
- With a trustworthy high-resolution reference, `--do_not_learn_volume` saves time by solving
  only the alignment.
- The output angles/shifts are in `c1` even when symmetry is provided, so they slot directly
  into standard reconstruction/refinement pipelines.
