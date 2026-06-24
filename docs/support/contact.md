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
