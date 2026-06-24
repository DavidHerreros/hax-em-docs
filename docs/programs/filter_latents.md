# Filter Latents

!!! abstract "At a glance"
    **CLI name:** `filter_latents` · **Family:** Latent post-processing · **Trains a network:** no

## What it does

Estimated landscapes often contain **outliers** — latent vectors that sit far from any dense
region, usually corresponding to junk particles, misalignments, or noise. **Filter Latents**
detects and removes them using a **local z-score**: for each vector it looks at how far it is
from its nearest neighbours, and flags the ones that are unusually isolated.

The result is a cleaner latent space that gives more reliable clustering, exploration and
reconstruction downstream.

## When to use it

- To **clean** a latent space before exploring or decoding it.
- To obtain a list of **good-particle indices** you can apply to your metadata (use
  `--return_ids`).

## Parameters

| Option | Required | Type | Default | Description |
|--------|:---:|------|---------|-------------|
| `--latents` | ✅ | path | — | The `.npy` file with the latent space to filter. |
| `--output_path` | ✅ | path | — | Folder where the filtered output is written. |
| `--thr` | | float | 1.0 | Z-score threshold. Vectors more isolated than this are removed; lower values filter more aggressively. |
| `--n_neighbours` | | int | 10 | Number of nearest neighbours used to compute each z-score. Smaller values are more sensitive to local structure. |
| `--return_ids` | | flag | off | Return the **indices** of the kept vectors instead of the filtered vectors themselves. |
| `--batch_size` | | int | 1024 | Vectors processed at once (GPU-memory lever). |

## Example commands

**Filter** a latent space and keep the cleaned vectors:

```bash
hax_project_manager --gpu 0 filter_latents \
    --latents latents.npy \
    --thr 1.0 \
    --n_neighbours 10 \
    --output_path filtered/
```

**Return the indices** of the surviving particles (to subset your metadata yourself):

```bash
hax_project_manager --gpu 0 filter_latents \
    --latents latents.npy \
    --return_ids \
    --output_path filtered_ids/
```

## Outputs

In `--output_path`:

- `filtered_latents.npy` — by default, the filtered latent vectors.
- With `--return_ids`, the same file instead contains the integer **indices** of the vectors
  that passed the threshold.

## Tips & pitfalls

- Lower `--thr` to remove more aggressively; raise it to keep more.
- Use a **smaller `--n_neighbours`** to capture fine local structure (e.g. small, tight
  clusters), or a larger one for a smoother global notion of outlier.
- With `--return_ids` you keep full control: apply the indices to the *original* metadata to
  produce a cleaned particle set.
