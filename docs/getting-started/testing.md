# Verify Your Installation

A quick way to confirm Hax is installed correctly is to list the programs:

```bash
hax_project_manager -h
```

If that prints the summary of programs, the package imports and the CLI works. To be sure the
GPU stack (JAX, CUDA, cuML…) is actually working end to end, run the built-in **test suite**.

---

## The Hax test suite

Hax ships a suite of **fast, data-free smoke tests**. They generate a small **synthetic
phantom** with built-in conformational heterogeneity (a different conformation, pose, shift and
CTF per particle) and then drive **every program through its real CLI** across a broad sweep of
options. If your installation is healthy, everything passes; if something in the GPU stack is
broken, you get a clear failure pointing at the program and scenario that broke.

!!! info "No real data required"
    The phantom is created on the fly, so you do not need any of your own particles to run
    these tests — they are purely a check that the software runs.

### Get the tests

The tests live in the **`tests/` folder of the source repository** and are not included in the
PyPI package, so grab them from GitHub:

```bash
git clone https://github.com/DavidHerreros/hax-em.git
cd hax-em
```

If you already installed Hax from a clone, you can simply `cd` into that clone instead.

### Run them

Run the suite with the **Python of the environment where `hax-em` is installed** (the same
interpreter is used to spawn the CLI subprocesses):

```bash
# Run the whole suite on GPU 0
python tests/run_tests.py --gpu 0 all
```

You can also test a single program, or skip the slower scenarios:

```bash
# Just one program
python tests/run_tests.py --gpu 0 hetsiren

# Skip slow cases (those that fit Gaussians to a volume)
python tests/run_tests.py --gpu 0 --quick all
```

A successful run ends with:

```text
ALL TESTS PASSED
```

If anything fails, it ends with `SOME TESTS FAILED` and a non-zero exit code, and the offending
program/scenario is marked `FAIL` in the output.

### Useful options

| Option | Purpose |
|--------|---------|
| `--gpu <id>` | GPU to use for the runs (sets `CUDA_VISIBLE_DEVICES`). |
| `--quick` | Skip slow scenarios (e.g. those needing the Gaussian volume fit). |
| `--keep` | Keep the temporary work directory afterwards so you can inspect outputs. |
| `--workdir <path>` | Put the phantom data and run outputs in a specific folder. |
| `--python <exe>` | Use a specific Python interpreter to spawn the CLI subprocesses. |

### What is covered

The suite drives the following programs through their CLIs:

`hetsiren`, `zernike3deep`, `estimate_latent_covariances`, `latent_space_deconvolution`,
`filter_latents`, `flexconsensus`, `decode_states_from_latents`, `modart`, `annotate_space`,
`image_gray_scale_adjustment`, `volume_gray_scale_adjustment`, `display_metrics`.

Run `python tests/run_tests.py --help` to see the exact, up-to-date list for your version.

---

## Tips & troubleshooting

- **Use the right environment.** Run the suite inside the Conda environment where `hax-em` was
  installed, so JAX, cuML and the other GPU dependencies resolve correctly.
- **The phantom is built on the CPU.** The runner generates data on the CPU (so it holds no GPU
  memory) and only the program subprocesses use the GPU you select with `--gpu`.
- **Inspect a failure.** Re-run just the failing program with `--keep` to retain its work
  directory, then look at the produced files and logs:

    ```bash
    python tests/run_tests.py --gpu 0 --keep hetsiren
    ```

- **Out of GPU memory during tests?** This usually mirrors a real run — make sure no other
  process is using the GPU (`nvidia-smi`).
- A failing suite right after installation most often points to a **driver/CUDA mismatch** —
  revisit the [installation requirements](installation.md) (NVIDIA driver ≥ 525, matching CUDA
  extra).
