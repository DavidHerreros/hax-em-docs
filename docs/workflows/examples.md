# Real-Case Examples

This page walks through complete, end-to-end sessions that combine several Hax programs. They
are written to be realistic and copy-paste-friendly.

!!! note "These examples are illustrative"
    File names (`particles.xmd`, `reference.mrc`, …), pixel sizes and epoch counts are
    placeholders. Replace them with your own data and tune the numbers to your dataset size
    and hardware. The *structure* of each workflow — the order of programs and how their
    outputs feed each other — is what matters.

!!! tip "Conventions used below"
    - `--gpu 0` runs everything on the first GPU; change as needed.
    - We assume a sampling rate of `1.5` Å/px and CTF handling with `apply`.
    - Each step writes into its own output folder so nothing is overwritten.
    - The `--md` files are written as `.xmd` here, but Relion `.star` and CryoSPARC `.cs`
      files work just as well — pass them directly.

---

## Example 1 — Continuous heterogeneity with Zernike3Deep + MoDART

**Goal:** starting from aligned particles and a consensus map, estimate the continuous motion
of a flexible complex, explore it, and reconstruct a **motion-corrected** map.

### Step 1 · Train the motion model

```bash
hax_project_manager --gpu 0 zernike3deep \
    --md particles.xmd \
    --vol reference.mrc \
    --mask mask.mrc \
    --sr 1.5 \
    --ctf_type apply \
    --mode train \
    --lat_dim 8 --L1 7 --L2 7 \
    --epochs 80 \
    --output_path 01_zernike_train/
```

Monitor it while it runs:

```bash
hax_project_manager display_metrics --logdir 01_zernike_train/Zernike3Deep_metrics
```

### Step 2 · Predict the landscape

```bash
hax_project_manager --gpu 0 zernike3deep \
    --md particles.xmd \
    --vol reference.mrc \
    --sr 1.5 \
    --ctf_type apply \
    --mode predict \
    --reload 01_zernike_train/ \
    --output_path 02_zernike_predict/
```

This produces `02_zernike_predict/predicted_latents.xmd` and the corresponding latent
vectors.

### Step 3 · Clean the landscape

```bash
hax_project_manager --gpu 0 filter_latents \
    --latents 02_zernike_predict/latents.npy \
    --thr 1.0 --n_neighbours 10 \
    --output_path 03_filtered/
```

### Step 4 · Explore and select states

```bash
hax_project_manager annotate_space \
    --z_space 03_filtered/filtered_latents.npy \
    --path 04_annotation/ \
    --only_view
```

Use the viewer to identify clusters / a motion trajectory and export the latent vectors of
interest (e.g. to `selected_states.txt`).

### Step 5 · Decode the selected states into volumes

Point the decoder straight at the network folder saved by the training run:

```bash
hax_project_manager --gpu 0 decode_states_from_latents \
    --latents_file 04_annotation/selected_states.txt \
    --reload 01_zernike_train/Zernike3Deep \
    --output_path 06_decoded/
```

### Step 6 · Motion-corrected reconstruction

```bash
hax_project_manager --gpu 0 modart \
    --md particles.xmd \
    --sr 1.5 \
    --ctf_type apply \
    --motion_correction 01_zernike_train/Zernike3Deep \
    --reconstruct_halves \
    --output_path 07_modart/
```

You now have `07_modart/modart_map.mrc` (and half-maps for resolution estimation) that is
sharper in the flexible regions than a plain average would be.

---

## Example 2 — Real-space heterogeneous reconstruction with HetSIREN

**Goal:** without necessarily having a perfect reference, recover and disentangle
conformational states directly in real space, then materialize representative maps.

### Step 1 · Train HetSIREN

```bash
hax_project_manager --gpu 0 hetsiren \
    --md particles.xmd \
    --mask roi_mask.mrc \
    --sr 1.5 \
    --ctf_type apply \
    --mode train \
    --lat_dim 8 \
    --epochs 100 \
    --output_path 01_hetsiren_train/
```

To model motion explicitly (helpful for large boxes), add `--transport_mass` and use a tight
mask. For very local motions, consider `--implicit_network`.

### Step 2 · Predict the landscape

```bash
hax_project_manager --gpu 0 hetsiren \
    --md particles.xmd \
    --sr 1.5 \
    --ctf_type apply \
    --mode predict \
    --reload 01_hetsiren_train/ \
    --output_path 02_hetsiren_predict/
```

### Step 3 · Explore interactively (with live volume generation)

```bash
hax_project_manager annotate_space \
    --z_space 02_hetsiren_predict/latents.npy \
    --env_name hax \
    --server_functions_path my_hetsiren_loader.py \
    --chimerax_binary /opt/chimerax/bin/ChimeraX \
    --path 03_annotation/
```

Here the viewer regenerates the 3D map for any point you hover, displaying it live in
ChimeraX. The `my_hetsiren_loader.py` file follows the example shipped in the package source
(`hax/viewers/server_loading_functions/load_model.py`).

### Step 4 · Decode a trajectory of states

```bash
hax_project_manager --gpu 0 decode_states_from_latents \
    --latents_file 03_annotation/trajectory.txt \
    --reload 01_hetsiren_train/HetSIREN \
    --output_path 05_trajectory_volumes/
```

The resulting `decoded_volume_*.mrc` series is a "movie" of the conformational change.

---

## Example 3 — Validating a landscape with FlexConsensus + deconvolution

**Goal:** you ran *two* heterogeneity methods on the same particles and want a single,
trustworthy, sharpened landscape.

### Step 1 · Produce two landscapes for the same particles

Run, for example, [Zernike3Deep](../programs/zernike3deep.md) and
[HetSIREN](../programs/hetsiren.md) in `predict` mode on the **same, identically-ordered**
particle set, giving `zernike_latents.npy` and `hetsiren_latents.npy`.

!!! warning "Same particles, same order"
    FlexConsensus requires every input space to have the same number of vectors, in the same
    order. Export both from the same particle list.

### Step 2 · Merge them into a consensus space

```bash
hax_project_manager --gpu 0 flexconsensus \
    --input_space Zernike:zernike_latents.npy \
    --input_space HetSIREN:hetsiren_latents.npy \
    --mode train \
    --epochs 150 \
    --output_path 01_flexconsensus_train/

hax_project_manager --gpu 0 flexconsensus \
    --input_space Zernike:zernike_latents.npy \
    --input_space HetSIREN:hetsiren_latents.npy \
    --mode predict \
    --reload 01_flexconsensus_train/ \
    --output_path 02_flexconsensus_predict/
```

The `*_consensus_error.npy` / `*_representation_error.npy` files tell you where the two
methods agree and where they don't.

### Step 3 · Sharpen the landscape by deconvolution

```bash
# Estimate the per-particle covariances from the trained network
hax_project_manager --gpu 0 estimate_latent_covariances \
    --md particles.xmd \
    --nn_path zernike_run/Zernike3Deep \
    --output_path 04_covariances/

# Deconvolve
hax_project_manager --gpu 0 latent_space_deconvolution \
    --md particles.xmd \
    --nn_path zernike_run/Zernike3Deep \
    --covariances 04_covariances/covariance_matrices.npy \
    --mode train \
    --output_path 05_deconv_train/

hax_project_manager --gpu 0 latent_space_deconvolution \
    --md particles.xmd \
    --nn_path zernike_run/Zernike3Deep \
    --covariances 04_covariances/covariance_matrices.npy \
    --mode predict \
    --reload 05_deconv_train/ \
    --output_path 06_deconv_predict/
```

`06_deconv_predict/latents_deconvolved.npy` is your final, sharpened landscape — ready to
explore with [Annotate Space](../programs/annotate_space.md).

---

## Choosing a path quickly

| If you want to… | Start here |
|-----------------|------------|
| Get poses / an initial map from scratch | [ReconSIREN](../programs/reconsiren.md) |
| Model smooth motion from a good reference | [Zernike3Deep](../programs/zernike3deep.md) |
| Do flexible real-space reconstruction | [HetSIREN](../programs/hetsiren.md) |
| Merge / validate multiple landscapes | [FlexConsensus](../programs/flexconsensus.md) |
| Remove estimation blur from a landscape | [Latent Space Deconvolution](../programs/latent_space_deconvolution.md) |
| See and select conformations | [Annotate Space](../programs/annotate_space.md) |
| Get a sharp, motion-corrected map | [MoDART](../programs/modart.md) |
