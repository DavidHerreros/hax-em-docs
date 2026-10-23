# Installation

Hax (`hax-em` on PyPI) is a pure-Python package. All of its heavy numerics run on the GPU
through JAX and CUDA, so a CUDA-capable **NVIDIA GPU** is required to use it in practice.

!!! info "Hardware & driver requirements"
    - An **NVIDIA GPU** (the more VRAM, the larger the box sizes and batches you can handle).
    - **NVIDIA driver ≥ 525**. You do **not** need to install CUDA yourself — the correct
      CUDA 12 or CUDA 13 runtime is installed automatically together with the package.
    - A Linux environment is recommended.

## 1. Create a dedicated Conda environment (recommended)

Python is pinned to **≥ 3.11, < 3.12**. Installing Hax inside its own Conda environment
keeps its tightly-pinned dependencies (JAX, Flax, cuML, cupy…) from clashing with anything
else on your system.

```bash
conda create -n hax python=3.11
conda activate hax
```

## 2. Install the package

Pick the command that matches the CUDA major version you want. If you are unsure, **CUDA 12**
is the safe choice on most current systems.

=== "CUDA 12"

    ```bash
    pip install hax-em[cuda12]
    ```

=== "CUDA 13"

    ```bash
    pip install hax-em[cuda13]
    ```

The `[cuda12]` / `[cuda13]` part is an *extra* — it pulls in JAX, cuML and cupy built for
that CUDA version. Installing `hax-em` **without** an extra will not give you a working GPU
setup.

## 3. Install from source (optional)

If you prefer a local, editable copy — for example to follow development or modify the
code — clone the repository and install from inside it:

```bash
git clone https://github.com/DavidHerreros/hax-em.git
cd hax-em
pip install .[cuda12]   # or .[cuda13]
```

## 4. Verify the installation

After installation a single command becomes available: **`hax_project_manager`**. Confirm
it works by listing the available programs:

```bash
hax_project_manager -h
```

You should see a summary of every Hax program. If you do, you are ready to go — continue to
[The Command Line](cli.md) to learn how launching works.

!!! tip "Want a thorough check?"
    To confirm the whole GPU stack (JAX, CUDA, cuML…) works end to end — not just that the
    CLI imports — run the built-in test suite on a synthetic phantom. See
    [Verify Your Installation](testing.md).

!!! info "Prefer a graphical interface?"
    There is an optional web GUI, `hax-em-gui`, that lets you run every program from your
    browser. See [The Hax GUI](gui.md).

!!! info "Working in Scipion?"
    The `scipion-em-hax` plugin installs Hax in its own environment and exposes the programs
    as Scipion protocols. See [Using Hax from Scipion](scipion.md).

!!! warning "If JAX cannot see your GPU"
    If programs run very slowly or report that no GPU was found:

    - Check your driver with `nvidia-smi` (it must report driver version ≥ 525).
    - Make sure you installed the **matching** CUDA extra for your system.
    - Confirm you did not accidentally restrict the visible GPUs (see the `--gpu` flag on
      the [CLI page](cli.md)).
