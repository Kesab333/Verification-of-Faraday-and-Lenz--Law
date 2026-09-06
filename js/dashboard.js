import * as THREE from 'three';
import { buildApparatus, setCoilTurns } from './apparatus.js';
import { createFieldLines, updateFieldLines, updatePoles } from './fieldLines.js';
import { buildVoltmeter, drawMeter } from './voltmeter.js';

const DASHBOARD_SECTIONS = [
  { id: 'diagram', title: 'Diagram', iconSrc: './images/diagram.svg', workspace: 'diagram' },
  { id: 'formula', title: 'Formula', iconSrc: './images/formula.svg', workspace: 'formula' },
  { id: 'simulation', title: 'Simulation', iconSrc: './images/simulation.svg', workspace: 'simulation' },
  { id: 'observation', title: 'Observation', iconSrc: './images/observation.svg', workspace: 'observation' },
  { id: 'graphs', title: 'Live Graph', iconSrc: './images/graphbutton.svg', workspace: 'graphs' },
  { id: 'calculation', title: 'Calculation', iconSrc: './images/calculation.svg', workspace: 'calculation' },
  { id: 'results', title: 'Results', iconSrc: './images/results.svg', workspace: 'results' }
];

/**
 * Initialise the dashboard.
 *
 * @param {Object}   opts
 * @param {Function} opts.onSelectSection  — called with workspace-id when a card is clicked
 * @param {Function} opts.onReturnHome     — called when the close button returns to dashboard
 */
export function initDashboard({ onSelectSection, onReturnHome } = {}) {
  // ---- 1. Grab (or bail on) the container already in the HTML ----
  const dashboardView = document.getElementById('dashboardView');
  if (!dashboardView) {
    console.warn('[Dashboard] #dashboardView container not found in HTML.');
    return null;
  }

  // ---- 2. Build card markup with rich background contents ----
  dashboardView.innerHTML = `
    <div class="dashboard-cards-grid">
      ${DASHBOARD_SECTIONS.map(sec => `
        <div class="dash-preview-card" data-section="${sec.workspace}" tabindex="0" role="button" aria-label="Open ${sec.title}">
          <div class="dash-preview-area">
            <!-- Specific section background preview -->
            <div class="dash-preview-content" id="dashPreview_${sec.id}">
              ${getCardPreviewHTML(sec.id)}
            </div>

            <!-- Top-right corner section badge -->
            <div class="dash-preview-badge" title="${sec.title}">
              <img src="${sec.iconSrc}" alt="${sec.title} icon" class="dash-icon-img" draggable="false" />
            </div>
          </div>
          <div class="dash-card-label">
            <span>${sec.title}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // Render LaTeX on Formula card after markup injection
  renderFormulaCardLatex();

  // Initialize interactive preview loops (Live Graph, Observation fluctuation, Simulation 3D preview)
  initLiveGraphPreview();
  initObservationFluctuation();
  initSimulationMiniPreview();

  // ---- 3. Card click → open section ----
  dashboardView.querySelectorAll('.dash-preview-card').forEach(card => {
    const handler = () => {
      const sectionId = card.dataset.section;
      openSection(sectionId);
    };
    card.addEventListener('click', handler);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
    });
  });

  // ---- 4. Wire up the close button (already in HTML heading bar) ----
  const closeBtn = document.getElementById('dashboardCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showDashboard();
    });
  }

  // ---- Helpers ----

  function showDashboard() {
    document.body.classList.add('dashboard-active');
    if (closeBtn) closeBtn.style.display = 'none';

    // Deactivate sidebar highlights
    document.querySelectorAll('.workspace-link').forEach(l => l.classList.remove('is-active'));

    if (typeof onReturnHome === 'function') onReturnHome();
  }

  function openSection(workspaceId) {
    document.body.classList.remove('dashboard-active');
    if (closeBtn) closeBtn.style.display = 'inline-flex';

    // Highlight correct sidebar item
    document.querySelectorAll('.workspace-link').forEach(link => {
      link.classList.toggle('is-active', link.dataset.workspace === workspaceId);
    });

    if (typeof onSelectSection === 'function') onSelectSection(workspaceId);
  }

  // ---- 5. Start in dashboard mode ----
  showDashboard();

  return { showDashboard, openSection };
}

// ============================================================
// Preview HTML Templates
// ============================================================

function getCardPreviewHTML(sectionId) {
  switch (sectionId) {
    case 'diagram':
      return `
        <div class="dash-diagram-bg">
          <img src="images/Fig 1.png" alt="Circuit Diagram Preview" class="dash-diagram-img" />
        </div>
      `;

    case 'formula':
      return `
        <div class="dash-formula-bg">
          <div id="dashFormulaLatex" class="dash-formula-primary">
            \\mathcal{E} = -N \\frac{d\\Phi_B}{dt}
          </div>
        </div>
      `;

    case 'simulation':
      return `
        <div class="dash-sim-bg">
          <canvas id="dashSimMiniCanvas" class="dash-sim-canvas"></canvas>
        </div>
      `;

    case 'observation':
      return `
        <div class="dash-obs-bg">
          <div class="dash-obs-tag">
            <span class="dash-obs-pulse"></span>
            <span>Live Readings Table</span>
          </div>
          <table class="dash-obs-table">
            <thead>
              <tr>
                <th>Peak</th>
                <th>Angle</th>
                <th>Speed</th>
                <th>EMF (V)</th>
              </tr>
            </thead>
            <tbody id="dashObsTableBody">
              <tr class="active-row">
                <td>#1</td>
                <td id="dashObsAng">21.8°</td>
                <td id="dashObsSpd">3.42 rad/s</td>
                <td id="dashObsEmf">+0.842 V</td>
              </tr>
              <tr>
                <td>#2</td>
                <td>-19.5°</td>
                <td>-3.15 rad/s</td>
                <td>-0.781 V</td>
              </tr>
              <tr>
                <td>#3</td>
                <td>17.2°</td>
                <td>2.80 rad/s</td>
                <td>+0.695 V</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;

    case 'graphs':
      return `
        <div class="dash-graph-bg">
          <span class="dash-graph-label">Induced EMF vs Time (V)</span>
          <canvas id="dashGraphCanvas" class="dash-graph-canvas"></canvas>
        </div>
      `;

    case 'calculation':
      return `
        <div class="dash-calc-bg">
          <div class="dash-calc-step">
            <span class="dash-calc-step-title">Step 1: Magnetic Flux (Φ)</span>
            <span class="dash-calc-step-formula">Φ = B × A</span>
            <span class="dash-calc-step-value" id="dashCalcFlux">= 1.0 T × 0.005 m² = 5.000 mWb</span>
          </div>
          <div class="dash-calc-step">
            <span class="dash-calc-step-title">Step 2: Induced EMF (Ɛ)</span>
            <span class="dash-calc-step-formula">Ɛ = -N (ΔΦ / Δt)</span>
            <span class="dash-calc-step-value" id="dashCalcEmf">= 250 × (5.0 mWb / 0.05 s) = +1.250 V</span>
          </div>
        </div>
      `;

    case 'results':
      return `
        <div class="dash-results-bg">
          <div class="dash-result-pill">
            <span class="dash-result-pill-label">Peak Voltage</span>
            <span class="dash-result-pill-val" id="dashResPeak">+1.240 V</span>
          </div>
          <div class="dash-result-pill">
            <span class="dash-result-pill-label">Max Current</span>
            <span class="dash-result-pill-val" id="dashResCurr">124.0 mA</span>
          </div>
          <div class="dash-result-pill">
            <span class="dash-result-pill-label">Flux Density</span>
            <span class="dash-result-pill-val">48.2 mT</span>
          </div>
          <div class="dash-result-pill">
            <span class="dash-result-pill-label">Heat Energy</span>
            <span class="dash-result-pill-val">3.85 mJ</span>
          </div>
        </div>
      `;

    default:
      return '';
  }
}

// ============================================================
// Interactive Loops & Renderers
// ============================================================

/**
 * Render Formula Card using KaTeX or plain text fallback
 */
function renderFormulaCardLatex() {
  const latexEl = document.getElementById('dashFormulaLatex');
  if (!latexEl) return;

  if (window.katex) {
    try {
      katex.render('\\mathcal{E} = -N \\frac{d\\Phi_B}{dt}', latexEl, {
        displayMode: true,
        throwOnError: false
      });
    } catch (e) {
      latexEl.innerHTML = '<em>&Epsilon; = &minus;N (d&Phi;<sub>B</sub> / dt)</em>';
    }
  } else {
    // Retry when katex is loaded
    setTimeout(renderFormulaCardLatex, 300);
  }
}

/**
 * Live Graph: Continuous moving EMF vs Time sinusoidal oscillatory wave
 */
let graphAnimId = null;
function initLiveGraphPreview() {
  const canvas = document.getElementById('dashGraphCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let t = 0;

  function draw() {
    if (!document.body.classList.contains('dashboard-active')) {
      graphAnimId = requestAnimationFrame(draw);
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);

    if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
      canvas.width = w;
      canvas.height = h;
    }

    if (canvas.width === 0 || canvas.height === 0) {
      graphAnimId = requestAnimationFrame(draw);
      return;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    const width = rect.width;
    const height = rect.height;

    // Background: Pure White
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Subtle light-grey horizontal grid lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    const numGridLines = 5;
    for (let i = 1; i < numGridLines; i++) {
      const y = (height / numGridLines) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Center Zero Baseline (grey line matching screenshot)
    const centerY = height / 2;
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Faraday Induction Spike-Pair Pattern Wave:
    // When a magnet passes through a coil, it generates a sharp negative peak entering,
    // followed immediately by a sharp positive peak exiting (or vice versa), with flat 0V in between.
    ctx.strokeStyle = '#089b93';
    ctx.lineWidth = 2.0;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();
    const period = 75; // spacing between successive coil passes
    t += 0.85; // smooth scrolling speed

    // Damping envelope across multiple passes to mimic gradual damping
    for (let x = 0; x <= width; x += 1.5) {
      const scrollX = x + t;
      // Find position within current period
      let phase = (scrollX % period);
      if (phase < 0) phase += period;

      let val = 0;
      // Center of the double pulse event at phase = 25
      const center = 25;
      const d = phase - center;

      // Pulse 1: sharp negative dip at d = -5.5
      // Pulse 2: sharp positive peak at d = +5.5
      const w1 = d + 5.5;
      const w2 = d - 5.5;
      const dip = -Math.exp(-(w1 * w1) / 4.5);
      const peak = Math.exp(-(w2 * w2) / 4.5);

      // Pass amplitude with subtle oscillation modulation
      const passIdx = Math.floor(scrollX / period);
      const decay = 0.85 + 0.15 * Math.sin(passIdx * 0.7);
      val = (dip * 0.95 + peak * 1.05) * decay;

      const y = centerY - val * (height * 0.38);

      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.restore();
    graphAnimId = requestAnimationFrame(draw);
  }

  if (graphAnimId) cancelAnimationFrame(graphAnimId);
  graphAnimId = requestAnimationFrame(draw);
}

/**
 * Observation Card: Dynamic randomly fluctuating values on the active observation row
 */
let obsTimer = null;
function initObservationFluctuation() {
  if (obsTimer) clearInterval(obsTimer);

  const angEl = document.getElementById('dashObsAng');
  const spdEl = document.getElementById('dashObsSpd');
  const emfEl = document.getElementById('dashObsEmf');
  const resPeakEl = document.getElementById('dashResPeak');
  const resCurrEl = document.getElementById('dashResCurr');
  const calcFluxEl = document.getElementById('dashCalcFlux');
  const calcEmfEl = document.getElementById('dashCalcEmf');

  let step = 0;
  obsTimer = setInterval(() => {
    if (!document.body.classList.contains('dashboard-active')) return;

    step += 0.25;
    // Fluctuating realistic physics values
    const angle = (Math.sin(step) * 22.4).toFixed(1);
    const speed = (Math.cos(step) * 3.85).toFixed(2);
    const emfVal = (-Math.sin(step) * 1.15).toFixed(3);
    const sign = Number(emfVal) >= 0 ? '+' : '';

    if (angEl) angEl.textContent = `${angle}°`;
    if (spdEl) spdEl.textContent = `${speed} rad/s`;
    if (emfEl) emfEl.textContent = `${sign}${emfVal} V`;

    // Update Results card readout dynamically
    if (resPeakEl) resPeakEl.textContent = `${sign}${Math.abs(emfVal)} V`;
    if (resCurrEl) resCurrEl.textContent = `${(Math.abs(emfVal) * 100).toFixed(1)} mA`;

    // Update Calculation card live values dynamically
    const fluxVal = (4.5 + Math.sin(step * 0.8) * 1.2).toFixed(3);
    const calcEmfVal = (Math.abs(emfVal) * 1.12).toFixed(3);
    if (calcFluxEl) calcFluxEl.textContent = `= 1.0 T × 0.005 m² = ${fluxVal} mWb`;
    if (calcEmfEl) calcEmfEl.textContent = `= 250 × (${fluxVal} mWb / 0.05 s) = +${calcEmfVal} V`;
  }, 1200);
}

/**
 * Simulation Mini-Preview: Exact 3D Apparatus loaded in mini version
 */
let simAnimId = null;
let miniThreeInstance = null;

function initSimulationMiniPreview() {
  const canvas = document.getElementById('dashSimMiniCanvas');
  if (!canvas) return;

  // Clean up any previous Three.js instance or listeners
  if (miniThreeInstance) {
    try {
      miniThreeInstance.renderer.dispose();
    } catch (e) { /* ignore */ }
    miniThreeInstance = null;
  }
  if (simAnimId) {
    cancelAnimationFrame(simAnimId);
    simAnimId = null;
  }

  // Set up dedicated Three.js scene for the mini preview
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 2.7, 8.8);

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: false
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  // Lights matching main lab setup
  const light1 = new THREE.DirectionalLight(0xffffff, 0.9);
  light1.position.set(1, 4, 6);
  scene.add(light1);

  const light2 = new THREE.DirectionalLight(0xffeedd, 0.6);
  light2.position.set(-2, 3, 5);
  scene.add(light2);

  const light3 = new THREE.DirectionalLight(0xccddff, 0.5);
  light3.position.set(-1, 1, -4);
  scene.add(light3);

  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);

  // Build the complete apparatus (stand, coil, frame, magnet)
  const apparatus = buildApparatus(scene);
  const coilGroup = apparatus.coilGroup;
  const frameGroup = apparatus.frameGroup;
  const pendulumMagnet = apparatus.pendulumMagnet;

  // Build the digital voltmeter mounted on top
  const voltmeter = buildVoltmeter(scene);
  const meterContext = voltmeter.meterContext;
  const meterTexture = voltmeter.meterTexture;

  // Attach realistic 3D magnetic field lines to the magnet
  createFieldLines(pendulumMagnet);
  updatePoles(pendulumMagnet, apparatus.dropMagnet, 1);
  setCoilTurns(coilGroup, 250);

  miniThreeInstance = { scene, camera, renderer };

  let theta = 0.38; // Initial release angle ~22°
  let omega = 0.0;
  const gravity = 9.80665;
  const armLen = 2.8;

  function resizeMiniScene() {
    const parent = canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      camera.aspect = rect.width / rect.height;
      // Adjust camera distance to frame apparatus perfectly within the card
      camera.fov = rect.aspect < 1 ? 38 : 32;
      camera.position.set(0, 2.7, 9.2);
      camera.updateProjectionMatrix();
      renderer.setSize(rect.width, rect.height, false);
    }
  }

  resizeMiniScene();

  function animateMiniSim() {
    if (!document.body.classList.contains('dashboard-active')) {
      simAnimId = requestAnimationFrame(animateMiniSim);
      return;
    }

    resizeMiniScene();

    // Harmonic damped pendulum physics equation
    const alpha = -(gravity / armLen) * Math.sin(theta) - 0.25 * omega;
    const dt = 0.024;
    omega += alpha * dt;
    theta += omega * dt;

    if (frameGroup) {
      frameGroup.rotation.z = theta;
    }

    // Calculate induced voltage based on magnet passing through coil
    const posOffset = Math.sin(theta) * armLen;
    const velocity = omega * armLen;
    const dist = Math.abs(posOffset);
    // Gaussian flux gradient peak near center
    const fluxGrad = -Math.exp(-(dist * dist) / 0.18) * Math.sign(posOffset || 1);
    const emf = -250 * fluxGrad * velocity * 0.003;

    // Update digital voltmeter display on apparatus
    drawMeter(meterContext, meterTexture, 'DIGITAL', true, emf);

    // Update dynamic field lines intensity
    if (pendulumMagnet) {
      updateFieldLines(pendulumMagnet, 1.0, 1, Math.sign(velocity) || 1);
    }

    renderer.render(scene, camera);
    simAnimId = requestAnimationFrame(animateMiniSim);
  }

  if (simAnimId) cancelAnimationFrame(simAnimId);
  simAnimId = requestAnimationFrame(animateMiniSim);
}