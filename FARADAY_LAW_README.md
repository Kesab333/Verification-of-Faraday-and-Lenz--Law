# Faraday's and Lenz's Law Virtual Lab

An interactive browser-based experiment for verifying Faraday's law of electromagnetic induction and Lenz's law. The simulation lets learners observe induced emf and current while changing the motion and polarity of a magnet relative to a coil.

## Learning objectives

- Relate magnetic flux change to induced emf.
- Verify the direction of induced current using Lenz's law.
- Explore the effects of motion, pole orientation, coil turns, and circuit resistance.
- Record observations, view live graphs, and compare calculated and simulated results.

## Features

- Interactive 3D laboratory scene and apparatus controls.
- Diagram, formula, calculation, observation, graph, and results sections.
- Responsive layout for desktop, tablet, and mobile screens.
- KaTeX-rendered mathematical notation.
- No build process or application server required.

## Run locally

This is a standalone static website. Serve the folder with any static HTTP server (recommended because the application uses JavaScript modules and an import map), then open `index.html` in a modern browser.

For example, from this directory:

```text
python -m http.server 8000
```

Open `http://localhost:8000` in the browser. The page loads KaTeX, fonts, and Three.js from public CDNs, so an internet connection is required for those external assets.

## Project structure

- `index.html` — application shell and experiment sections.
- `css/` — layout, apparatus, controls, graph, and responsive styles.
- `js/` — simulation model, apparatus, navigation, graphs, and UI logic.
- `images/` — diagrams, icons, and institutional branding.

## Developer and attribution

- **Developer/maintainer:** SOLVE Virtual Lab team
- **Institution:** National Institute of Technology Karnataka (NITK), Surathkal
- **Project:** SOLVE Virtual Lab
- **Contact:** No individual contact details are defined in this distribution. Please use the official NITK/SOLVE project channel when publishing or adapting this work.

The educational model is a teaching approximation and should not be treated as a calibration certificate for physical laboratory equipment.

## License

### Software

The source code of this project is licensed under the **GNU Affero General Public License, Version 3 (AGPL-3.0)**. See [LICENSE](LICENSE).

### Educational content

Applicable educational and instructional content is licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)** license. See [CONTENT-LICENSE.md](CONTENT-LICENSE.md).

### Third-party and institutional material

Third-party libraries, fonts, icons, images, diagrams, models, and other externally sourced assets are subject to their respective licenses or permissions and are not automatically covered by the licenses above.

The names, logos, seals, emblems, trademarks, and service marks of **NITK**, **SOLVE**, **Virtual Labs**, or other organizations are not licensed by this notice and must not be used in a way that implies endorsement of a modified or redistributed version without separate authorization.
