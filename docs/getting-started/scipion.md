# Using Hax from Scipion

Already process your data in [Scipion](https://scipion-em.github.io/docs/)? The **Scipion
plugin** (`scipion-em-hax`) adds the Hax programs to Scipion's **Flexibility Hub** as ordinary
protocols. You pick your particles, reference map and mask from the project, fill in a form, and
the plugin converts the data, runs the Hax program and brings the results back as Scipion
objects, ready for the next protocol.

!!! info "A separate, optional package"
    The plugin ships as its own package, `scipion-em-hax`. It runs **the same programs**
    described on the [program pages](../programs/index.md): each protocol builds the
    equivalent command line and launches it through `hax_project_manager`. Use whichever
    front end suits you: the plugin, [the command line](cli.md) or [the Hax GUI](gui.md).

**Why use the plugin?**

- **No manual conversion.** Particles from RELION, cryoSPARC or Xmipp refinements are passed
  in directly, with their CTF and poses. You never write `--md` or `--sr` yourself.
- **Chaining.** Outputs (particles with latent vectors, volumes, classes) feed straight into
  other Scipion protocols, from Hax or from any other package.
- **Provenance.** Every run, its parameters and its log are recorded in the project.

---

## Prerequisites

- A working **Scipion 3** installation.
- **Conda** available to Scipion. The plugin creates its own environment for Hax.
- An **NVIDIA driver ≥ 525** on the machine that installs the plugin (see
  [Installation](installation.md)). You do not need to install CUDA yourself.
- The **Xmipp plugin** (`scipion-em-xmipp`). The Hax protocols use it to convert metadata and
  to resize images, volumes and masks.

---

## Install

=== "Plugin manager / command line"

    Install from the Scipion **Plugin manager**, or from a terminal:

    ```bash
    scipion3 installp -p scipion-em-hax
    ```

=== "From a clone (development)"

    ```bash
    git clone https://github.com/scipion-em/scipion-em-hax.git
    scipion3 installp -p ./scipion-em-hax --devel
    ```

    In development mode `hax-em` itself is installed in editable mode from its `devel`
    branch, with the sources placed under Scipion's `EM_ROOT` folder.

The commands above assume `scipion3` is an alias for your Scipion executable. During
installation the plugin:

1. Creates a Conda environment called **`hax`** (Python 3.11).
2. Reads `nvidia-smi` to find the highest CUDA version your driver supports, and installs
   `hax-em[cuda12]` or `hax-em[cuda13]` into that environment.

!!! warning "If the installation stops with a CUDA error"
    The installer refuses to continue when `nvidia-smi` does not run, or when the driver only
    supports CUDA 11 or older. Check `nvidia-smi` in a terminal, update the driver to 525 or
    newer if needed, and launch the installation again.

!!! tip "Using an existing Hax environment"
    Protocols activate Hax with the command stored in the plugin variable
    **`HAX_ENV_ACTIVATION`** (default: `conda activate hax`). Set it in your Scipion
    configuration to point the plugin at a different environment.

---

## Finding the protocols

Open a project and switch the protocol panel on the left to the **Flexibility Hub** view. The
Hax protocols are grouped as follows (you can also find any of them by name with the protocol
search box):

<!-- Screenshot: the Flexibility Hub view in the Scipion protocol panel, with the Hax groups expanded
![The Hax protocols in Scipion's Flexibility Hub view](../assets/scipion/protocol_tree.png){ .hax-demo }
-->

| Section | Protocol (as shown in Scipion) | Hax program |
|---------|--------------------------------|-------------|
| Landscape estimation | **train - Zernike3Deep** | [Zernike3Deep](../programs/zernike3deep.md) |
| Landscape estimation | **flexible align - HetSIREN** | [HetSIREN](../programs/hetsiren.md) |
| Landscape estimation | **predict - HetSIREN** | [HetSIREN](../programs/hetsiren.md) (`--mode predict` with a trained network) |
| Landscape consensus | **train - FlexConsensus** | [FlexConsensus](../programs/flexconsensus.md) |
| Landscape consensus | **interactive consensus - FlexConsensus** | [FlexConsensus](../programs/flexconsensus.md) (`--mode predict`) |
| Data analysis | **filter latent space** | [Filter Latents](../programs/filter_latents.md) |
| Data analysis | **annotate space** | [Annotate Space](../programs/annotate_space.md) |
| Map reconstruction | **reconstruct MoDART** | [MoDART](../programs/modart.md) |
| Map reconstruction | **angular align - ReconSIREN** | [ReconSIREN](../programs/reconsiren.md) |
| Gray level adjustment | **adjust gray scale - images** | [Image Gray-Scale Adjustment](../programs/image_gray_scale_adjustment.md) |
| Gray level adjustment | **adjust gray scale - volume** | [Volume Gray-Scale Adjustment](../programs/volume_gray_scale_adjustment.md) |

!!! note "Programs without a protocol"
    The following programs are only available from [the command line](cli.md) or
    [the Hax GUI](gui.md):

    - [Preprocess Particles](../programs/preprocess_particles.md) and
      [Preprocess Volumes](../programs/preprocess_volumes.md). In Scipion, use the
      **Downsample** option of the HetSIREN and Zernike3Deep protocols, or a resize protocol
      from another package.
    - [Reconstruct Volume](../programs/reconstruct_volume.md). Any Scipion reconstruction
      protocol gives you the consensus map.
    - [Estimate Latent Covariances](../programs/estimate_latent_covariances.md) and
      [Latent Space Deconvolution](../programs/latent_space_deconvolution.md).
    - [Decode States from Latents](../programs/decode_states_from_latents.md). The landscape
      protocols already decode a set of states for you (see [Outputs](#outputs)), and
      **annotate space** generates any other state you select.
    - [Display Metrics](../programs/display_metrics.md), which is replaced by the TensorBoard
      viewer (see [Viewers](#viewers)).

---

## What the plugin does for you

- **Converts the inputs.** The particle set, with its CTF and alignment, is written as Xmipp
  metadata, and the sampling rate is read from the set. Reference maps and masks are resized to
  the particle box when needed.
- **Downsamples on request.** With **Downsample the images before training?** set to *Yes*
  (HetSIREN, Zernike3Deep), the particles, reference and mask are resized to the chosen box
  before training. ReconSIREN always works at the box set in
  **Downsample particles to this box size**. Output volumes are resampled back to the original
  box and shifts are rescaled to the original pixel size.
- **Trains and predicts in one run.** The training protocols train the network and then run
  `--mode predict` on the same particles, so the latent space is available as soon as the run
  finishes. If you *Continue* a run whose network is already trained, training is skipped.
- **Uses one GPU per run.** Hax protocols run on the **first** GPU ID given in the form.
- **Returns Scipion objects.** Particles come back as Flexibility Hub particles carrying their
  latent vector, so any Flexibility Hub protocol (from Hax or another plugin) can use them.

---

## Form fields and command-line options

Most form fields correspond one to one to a command-line option, and their help texts follow
the [program pages](../programs/index.md). Fields marked as *advanced* only appear after you
raise the expert level in the protocol form. A few fields deserve a note:

| Form field | Command-line option | Note |
|------------|---------------------|------|
| CTF correction type | `--ctf_type` | Same choices as on the [Core Concepts](concepts.md#the-ctf-and-ctf_type) page. |
| Lazy loading into RAM | `--load_images_to_ram` | *Yes* loads every image into RAM; *No* memory-maps them. |
| Path to SSD scratch folder | `--ssd_scratch_folder` | Only used when images are memory-mapped. |
| Estimate batch size automatically? | `--batch_size auto` | |
| Mass transportation (HetSIREN) | `--transport_mass` | Unlocks the decoder options of the *Reconstruction* tab. |
| Fine tune previous network? (HetSIREN) | `--reload <previous run>` | Point it at an earlier **flexible align - HetSIREN** run. |
| Reconstruction mode (MoDART) | `--reconstruct_halves` | *Gold standard* keeps the two unfiltered half maps. |
| Correct motion blurred artifacts? (MoDART) | `--motion_correction <network>` | Uses the network stored with the input particles. |

---

## Outputs

| Protocol | Outputs |
|----------|---------|
| **flexible align - HetSIREN** | **outputParticles**: the particles with their latent vector and the poses refined by the network. **outputVolumes**: 20 states decoded at k-means centres of the landscape. **outputLearnedReference**: only when the reference is learned (*Learn reference epochs* > 0). |
| **predict - HetSIREN** | **outputParticles** and **outputVolumes**, as above, for new particles. |
| **train - Zernike3Deep** | **outputParticles** and **outputVolumes**, as for HetSIREN. |
| **angular align - ReconSIREN** | **outputParticles** with the estimated poses, **outputVolumes** with the consensus map, and **outputHetVolumes** with the preliminary heterogeneous maps. |
| **train - FlexConsensus** | One particle set per input landscape, each with the consensus coordinates and the per-particle consensus and representation errors. |
| **interactive consensus - FlexConsensus** | The subset of particles you keep in the error histogram (see [Viewers](#viewers)). |
| **filter latent space** | The particles that remain after removing landscape outliers. |
| **annotate space** | A set of classes and a set of volumes, one per selection you save in the viewer. |
| **reconstruct MoDART** | **outputVolume**: the FSC-filtered map. In *Gold standard* mode the half maps are attached to it. |
| **adjust gray scale - images** | **outputParticles**: the adjusted images, with the scale and offset applied to each one. |
| **adjust gray scale - volume** | **outputVolume**: the input volume multiplied by the fitted scale (at its own box, even if the particles have a different one). |

---

## Viewers

- **TensorBoard**: available for the HetSIREN, Zernike3Deep, ReconSIREN, FlexConsensus and
  MoDART runs. Analyze the results of the run to open TensorBoard in
  your browser, with the same curves and images as
  [Display Metrics](../programs/display_metrics.md). TensorBoard stops by itself when you close
  the browser tab.
- **FlexConsensus error histogram**: analyze an **interactive consensus - FlexConsensus** run
  and choose the consensus or the representation error. Selecting a threshold on the histogram
  creates a new particle set with the particles below it.
- **Annotate Space**: the **annotate space** protocol opens the
  [Annotate Space](../programs/annotate_space.md) window while it runs and waits for you. Save
  your selections, close the window, and the protocol turns them into classes and volumes.

<!-- Screenshot: the Annotate Space window opened from Scipion
![Annotate Space launched from Scipion](../assets/scipion/annotate_space.png){ .hax-demo }
-->

!!! tip "Landscapes from other plugins"
    **annotate space** also accepts landscapes computed by other Flexibility Hub plugins
    (CryoDRGN, OPUS-DSD, DynaMight in RELION and 3D Flex in cryoSPARC) when those plugins are
    installed.

---

## A typical Scipion session

1. **Bring in your data.** Import the particles (or use the output of a refinement protocol
   from RELION, cryoSPARC or Xmipp) together with the consensus map and, optionally, a mask.
2. **No poses yet?** Run **angular align - ReconSIREN** to estimate them and an initial map.
3. **Estimate the landscape** with **flexible align - HetSIREN** or **train - Zernike3Deep**.
   Follow the training with the TensorBoard viewer.
4. **Clean or merge landscapes** (optional). Run **filter latent space** to remove outliers, or
   **train - FlexConsensus** to compare the landscapes of several methods.
5. **Explore the landscape** with **annotate space** and save the states you are interested in
   as classes.
6. **Reconstruct** with **reconstruct MoDART**, either the whole set or the particles of a
   class. Set **Correct motion blurred artifacts?** to *Yes* when the particles come from
   HetSIREN (with mass transport) or Zernike3Deep.

<!-- Screenshot: a Scipion workflow graph with the steps above
![A Hax workflow in a Scipion project](../assets/scipion/workflow.png){ .hax-demo }
-->

For what happens at each stage, and how to choose between the programs, see
[Pipelines](../workflows/pipelines.md).

---

## See also

- [Installation](installation.md): the standalone `hax-em` installation.
- [The Command Line](cli.md) and [The Hax GUI](gui.md): the other ways to run Hax.
- [Programs overview](../programs/index.md): every option of every program.
- [Scipion documentation](https://scipion-em.github.io/docs/): installing and using Scipion.
