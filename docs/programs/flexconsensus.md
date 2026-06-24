# FlexConsensus

!!! abstract "At a glance"
    **CLI name:** `flexconsensus` · **Family:** Consensus & deconvolution · **Trains a network:** yes
    · **Modes:** `train`, `predict`

## What it does

Different heterogeneity methods (Zernike3Deep, HetSIREN, cryoDRGN, 3DVA…) each produce their
*own* latent space for the same particles — and those spaces are not directly comparable.
**FlexConsensus** learns a single **consensus latent space** that reconciles all of them.

It is an autoencoder-style network: it takes the latent vectors that several methods assigned
to the *same, identically-ordered* set of particles, and finds the common space that best
agrees with all inputs. The result lets you compare methods on equal footing, identify which
features are reproducible across methods, and obtain a more robust landscape than any single
method alone.

## Reference

> Herreros, D., Perez Mata, C., Sanchez Sorzano, C.O. *et al.* **Merging conformational
> landscapes in a single consensus space with the FlexConsensus algorithm.**
> *Nature Methods* (2025).
> [https://doi.org/10.1038/s41592-025-02841-w](https://doi.org/10.1038/s41592-025-02841-w)

## When to use it

- You ran **several** heterogeneity methods and want to **merge** their landscapes.
- You want to **validate** a landscape by checking which features survive across methods.
- You want a **consensus space** to drive downstream exploration or reconstruction.

## Input format

Each input space is a `.npy` file containing the latent vectors for **all** particles.

!!! warning "All inputs must be aligned and equal-length"
    Every input `.npy` must have the **same number of elements**, in the **same order** — the
    first vector in each file must correspond to the same particle, and so on. FlexConsensus
    relies on this one-to-one correspondence.

You may name each input using the `NAME:path` convention, which makes prediction much easier
later:

```text
--input_space Zernike:zernike.npy --input_space HetSIREN:hetsiren.npy
```

If you give just a path, inputs are auto-named `Input_0`, `Input_1`, … in command-line order.

## Parameters

### Required

| Option | Type | Description |
|--------|------|-------------|
| `--input_space` | path(s) | One or more `.npy` files with the input spaces to merge. Repeatable. Accepts either plain paths or the `NAME:path` form (recommended, especially for `predict`). All inputs must have the same number of elements, in the same order. |
| `--mode` | choice | `train` or `predict` (predict needs `--reload`). |
| `--output_path` | path | Folder where the trained network and consensus spaces are saved. |

### Model & training

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--lat_dim` | int | min input dim | Dimensionality of the consensus latent space. Defaults to the smallest dimension among the inputs. |
| `--epochs` | int | 100 | Number of passes over the data. |
| `--batch_size` | int | 1024 | Vectors processed at once (latent vectors are small, so the batch can be large). |
| `--learning_rate` | float | 1e-5 | Step size of learning; lower ~10× if it diverges. |
| `--reload` | path | — | A previously trained FlexConsensus network, to fine-tune or to run `predict`. |

## Example commands

**Train** a consensus from two methods' latent spaces:

```bash
hax_project_manager --gpu 0 flexconsensus \
    --input_space Zernike:zernike_latents.npy \
    --input_space HetSIREN:hetsiren_latents.npy \
    --mode train \
    --epochs 150 \
    --output_path flexconsensus_run/
```

**Predict** the consensus representation for those inputs:

```bash
hax_project_manager --gpu 0 flexconsensus \
    --input_space Zernike:zernike_latents.npy \
    --input_space HetSIREN:hetsiren_latents.npy \
    --mode predict \
    --reload flexconsensus_run/ \
    --output_path flexconsensus_predict/
```

## Outputs

After **training**:

- `FlexConsensus/` — the trained consensus network.
- `FlexConsensus_metrics/` — training curves (view with [Display Metrics](display_metrics.md)).

After **predict**, for each named input (e.g. `Zernike`):

- `Zernike_consensus.npy` — that input mapped into the consensus space.
- `Zernike_consensus_error.npy` — the consensus error per particle.
- `Zernike_representation_error.npy` — how well the consensus represents that input.

The error files are useful for spotting particles or regions where the methods *disagree*.

## Tips & pitfalls

- The **ordering and length** of every input space must match exactly — re-export them from
  the same particle set if unsure.
- Use the **`NAME:path`** form so the per-input output files are clearly labelled and easy to
  predict.
- A consensus `--lat_dim` cannot exceed your smallest input space's dimensionality.
