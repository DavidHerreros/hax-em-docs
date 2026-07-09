# Contact & Support

Hax is developed in the open. Whether you hit a bug, have a question, or want to suggest an
improvement, we'd love to hear from you.

---

## Report an issue or ask a question

The best place for bug reports, questions and feature requests is the project's GitHub issue
tracker:

<div class="hax-buttons" markdown>
[:material-github: Open an issue on GitHub](https://github.com/DavidHerreros/hax-em/issues){ .md-button .md-button--primary }
[:material-source-repository: Browse the repository](https://github.com/DavidHerreros/hax-em){ .md-button }
</div>

Before opening a new issue, it helps to **search the existing ones** — your question may
already be answered.

### Writing a useful bug report

To help us reproduce and fix a problem quickly, please include:

- [x] **What you ran** — the full `hax_project_manager … ` command line.
- [x] **What happened** — the full error message / traceback, copied as text.
- [x] **What you expected** to happen instead.
- [x] **Your environment** — Hax version (`python -c "import hax; print(hax.__version__)"`),
      the CUDA extra you installed (`cuda12`/`cuda13`), your GPU and NVIDIA driver version
      (`nvidia-smi`).
- [x] **Data shape**, when relevant — number of particles, box size, sampling rate.

!!! tip "Check the metrics first"
    If a training run behaved oddly, the curves shown by
    [Display Metrics](../programs/display_metrics.md) often reveal what went wrong (e.g. a
    diverging loss pointing at too high a learning rate). Attaching a screenshot can speed up
    diagnosis.

---

## Report a graphical interface (GUI) issue or improvement

Problems, questions and suggestions about the **Hax graphical interface** belong in its own
GitHub issue tracker, which is separate from the core `hax-em` one:

<div class="hax-buttons" markdown>
[:material-github: Open an issue on GitHub](https://github.com/DavidHerreros/hax-em-gui/issues){ .md-button .md-button--primary }
[:material-source-repository: Browse the repository](https://github.com/DavidHerreros/hax-em-gui){ .md-button }
</div>

As above, please **search the existing issues** before opening a new one — someone may have
already reported the same thing.

### Writing a useful GUI report

Because the interface is visual, **screenshots are the single most helpful thing you can
attach** — both for bugs and for improvement ideas:

- [x] **Screenshots** — capture the screen showing the problem (or the part you'd like to see
      improved). For a bug, include the moment the error or unexpected behaviour appears; for a
      suggestion, mark up the screenshot to show what you have in mind. You can drag-and-drop
      images straight into the GitHub issue text box.
- [x] **What you were doing** — the steps that led to the issue (which panel, which buttons,
      which program you were launching).
- [x] **What happened** vs. **what you expected** to happen instead.
- [x] **Any error text** — messages shown in the interface, and anything printed in the
      terminal / console the GUI was started from (copied as text).
- [x] **Your environment** — the GUI version, your operating system and browser (if you use the
      web interface), and the Hax version (`python -c "import hax; print(hax.__version__)"`).

!!! tip "Capturing a screenshot"
    On most systems: **Windows** — ++win+shift+s++; **macOS** — ++cmd+shift+4++;
    **Linux** — the *Screenshot* utility or ++print++. Recording a short screen capture (GIF or
    video) is even better when the problem only shows up while interacting with the interface.

---

## Tutorials

Step-by-step tutorials covering the use of Hax together with **Scipion** are in preparation.
They will be announced through the project's GitHub repository.

---

## References

If Hax contributes to your work, please cite the relevant method(s):

- **Zernike3Deep** — Herreros, D., Lederman, R.R., Krieger, J.M. *et al.* *Estimating
  conformational landscapes from Cryo-EM particles by 3D Zernike polynomials.*
  **Nature Communications** 14, 154 (2023).
  [https://doi.org/10.1038/s41467-023-35791-y](https://doi.org/10.1038/s41467-023-35791-y)

- **ZART / MoDART** — Herreros, D., Kiska, J., Ramirez-Aportela, E. *et al.* *ZART: A Novel
  Multiresolution Reconstruction Algorithm with Motion-blur Correction for Single Particle
  Analysis.* **Journal of Molecular Biology** 435, 168088 (2023).
  [https://doi.org/10.1016/j.jmb.2023.168088](https://doi.org/10.1016/j.jmb.2023.168088)

- **HetSIREN** (and ReconSIREN) — Herreros, D., Mata, C.P., Noddings, C. *et al.* *Real-space
  heterogeneous reconstruction, refinement, and disentanglement of CryoEM conformational
  states with HetSIREN.* **Nature Communications** 16, 3751 (2025).
  [https://doi.org/10.1038/s41467-025-59135-0](https://doi.org/10.1038/s41467-025-59135-0)

- **FlexConsensus** (and the latent deconvolution workflow) — Herreros, D., Perez Mata, C.,
  Sanchez Sorzano, C.O. *et al.* *Merging conformational landscapes in a single consensus
  space with the FlexConsensus algorithm.* **Nature Methods** (2025).
  [https://doi.org/10.1038/s41592-025-02841-w](https://doi.org/10.1038/s41592-025-02841-w)

---

## License

Hax is distributed under the license shown in the
[GitHub repository](https://github.com/DavidHerreros/hax-em).
