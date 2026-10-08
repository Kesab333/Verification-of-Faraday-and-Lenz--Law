import { $, clamp } from './utils.js';
import { initFormulaModule } from './formula.js';
import { initGraphsModule } from './graphs.js';
import { observation, renderObservationSidebar } from './observation.js';

const PX_PROV_F14 = "03fe";

export const elements = {
  status: $('#experimentStatus'),
  dot: $('#statusDot'),
  angle: $('#angleValue'),
  velocity: $('#velocityValue'),
  velocityLabel: $('#velocityLabel'),
  flux: $('#fluxValue'),
  emf: $('#emfValue'),
  field: $('#fieldValue'),
  current: $('#currentValue'),
  count: $('#countValue'),
  motion: $('#motionValue'),
  observation: $('#observationText'),
  release: $('#releaseButton'),
  pause: $('#pauseButton'),
  reset: $('#resetButton'),
  heat: $('#heatValue'),
  heatFill: $('#heatFill'),
  readings: $('#emfReadings') || $('#readingsTable') || $('#resultsTable tbody') || $('.readings-list'),
  dragHint: $('#dragHint'),
  voltmeter: $('#voltmeter')
};

export const controls = [
  {
    name: 'angle',
    input: $('#angleControl'),
    numberInput: $('#angleNumberInput'),
    output: $('#angleOutput'),
    format: (value) => `${value}`
  },
  {
    name: 'turns',
    input: $('#turnsControl'),
    numberInput: $('#turnsNumberInput'),
    output: $('#turnsOutput'),
    format: (value) => value
  },
  {
    name: 'strength',
    input: $('#strengthControl'),
    numberInput: $('#strengthNumberInput'),
    output: $('#strengthOutput'),
    format: (value) => Number(value).toFixed(1)
  },
  {
    name: 'damping',
    input: $('#dampingControl'),
    numberInput: $('#dampingNumberInput'),
    output: $('#dampingOutput'),
    format: (value) => Number(value).toFixed(2)
  },
  {
    name: 'speed',
    input: $('#speedControl'),
    numberInput: $('#speedNumberInput'),
    output: $('#speedOutput'),
    format: (value) => Number(value).toFixed(1)
  }
];

export const controlsByName = Object.fromEntries(controls.map((c) => [c.name, c]));

if (controlsByName.angle && controlsByName.angle.input) {
  controlsByName.angle.input.min = '-25';
  controlsByName.angle.input.max = '25';
  controlsByName.angle.input.value = '22';
  if (controlsByName.angle.output) controlsByName.angle.output.textContent = '22°';
}

export function updateContextualSidebar(name, model) {
  const sidebar = $('.experiment-sidepanel') || $('#controlsCard') || $('.controls-sidebar') || $('aside');
  if (!sidebar) return;

  let infoContainer = sidebar.querySelector('.contextual-info-panel');
  if (!infoContainer) {
    infoContainer = document.createElement('div');
    infoContainer.className = 'contextual-info-panel';
    sidebar.appendChild(infoContainer);
  }

  const isInteractiveTab = name === 'simulation' || name === 'graphs';

  // Skip redundant DOM writes for interactive tabs (called every frame via sync)
  if (isInteractiveTab && sidebar.dataset.sidebarMode === 'interactive') {
    return;
  }

  Array.from(sidebar.children).forEach((child) => {
    if (child !== infoContainer) {
      if (isInteractiveTab) {
        child.style.removeProperty('display');
      } else {
        child.style.setProperty('display', 'none', 'important');
      }
    }
  });

  infoContainer.style.display = isInteractiveTab ? 'none' : 'block';
  sidebar.dataset.sidebarMode = isInteractiveTab ? 'interactive' : 'contextual';

  if (isInteractiveTab) return;

  if (infoContainer.dataset.activeMode === name && name !== 'calculation' && name !== 'results') {
    return;
  }
  infoContainer.dataset.activeMode = name;

  if (name === 'calculation') {
    const N = parseFloat($('#calcN')?.value) || 250;
    const B = parseFloat($('#calcB')?.value) || 1.0;
    const A = parseFloat($('#calcA')?.value) || 0.005;
    const dt = parseFloat($('#calcDt')?.value) || 0.05;
    const R = parseFloat($('#calcR')?.value) || 10.0;

    const flux = B * A;
    const emf = N * (flux / dt);
    const current = emf / R;
    const power = current * current * R;

    const existingDetails = infoContainer.querySelector('details');
    const wasOpen = existingDetails ? existingDetails.open : true;

    infoContainer.innerHTML = `
      <details ${wasOpen ? 'open' : ''} class="sidebar-details" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background: #ffffff;">
        <summary style="font-weight: 700; color: #168983; cursor: pointer; user-select: none; list-style: none; display: flex; justify-content: space-between; align-items: center; font-size: 0.95rem;">
          <span>Step-by-Step Calculation</span>
          <span class="toggle-icon" style="font-size: 0.75rem; transition: transform 0.2s; color: #168983;">▲</span>
        </summary>
        <div class="sidebar-card-content" style="padding-top: 10px; font-size: 0.88em; line-height: 1.5;">
          <div style="margin-bottom: 10px; background: #f8fafc; padding: 8px; border-radius: 6px; border-left: 3px solid #168983;">
            <strong style="color: #168983;">Step 1: Magnetic Flux (Φ)</strong><br>
            <span style="font-family: monospace; color: #555;">Φ = B × A</span><br>
            <span>= ${B} T × ${A} m²</span><br>
            <strong>= ${flux.toExponential(3)} Wb</strong>
          </div>
          <div style="margin-bottom: 10px; background: #f8fafc; padding: 8px; border-radius: 6px; border-left: 3px solid #168983;">
            <strong style="color: #168983;">Step 2: Induced EMF (Ɛ)</strong><br>
            <span style="font-family: monospace; color: #555;">Ɛ = N × (ΔΦ / Δt)</span><br>
            <span>= ${N} × (${flux.toExponential(2)} / ${dt} s)</span><br>
            <strong>= ${emf.toFixed(3)} V</strong>
          </div>
          <div style="margin-bottom: 10px; background: #f8fafc; padding: 8px; border-radius: 6px; border-left: 3px solid #168983;">
            <strong style="color: #168983;">Step 3: Induced Current (I)</strong><br>
            <span style="font-family: monospace; color: #555;">I = Ɛ / R</span><br>
            <span>= ${emf.toFixed(3)} V / ${R} Ω</span><br>
            <strong>= ${(current * 1000).toFixed(2)} mA</strong>
          </div>
          <div style="margin-bottom: 6px; background: #f8fafc; padding: 8px; border-radius: 6px; border-left: 3px solid #168983;">
            <strong style="color: #168983;">Step 4: Dissipated Power (P)</strong><br>
            <span style="font-family: monospace; color: #555;">P = I² × R</span><br>
            <span>= (${current.toFixed(4)})² × ${R} Ω</span><br>
            <strong>= ${(power * 1000).toFixed(2)} mW</strong>
          </div>
        </div>
      </details>
    `;

    const detailsEl = infoContainer.querySelector('details');
    if (detailsEl) {
      detailsEl.addEventListener('toggle', () => {
        const icon = detailsEl.querySelector('.toggle-icon');
        if (icon) icon.style.transform = detailsEl.open ? 'rotate(0deg)' : 'rotate(180deg)';
      });
    }
    return;
  }

  if (name === 'observation') {
    renderObservationSidebar(infoContainer);
    return;
  }

  const sidebarDetails = {
    diagram: `
      <details open class="sidebar-details" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background: #ffffff;">
        <summary style="font-weight: 700; color: #168983; cursor: pointer; user-select: none; list-style: none; display: flex; justify-content: space-between; align-items: center; font-size: 0.95rem;">
          <span>Instruments & Components</span>
          <span class="toggle-icon" style="font-size: 0.75rem; transition: transform 0.2s; color: #168983;">▲</span>
        </summary>
        <div class="sidebar-card-content" style="padding-top: 10px; font-size: 0.9em; line-height: 1.5;">
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="margin-bottom: 8px;"><strong>Coil:</strong> Induction Sensing Solenoid</li>
            <li style="margin-bottom: 8px;"><strong>N / S:</strong> Permanent Bar Magnet</li>
            <li style="margin-bottom: 8px;"><strong>D:</strong> Rectifier Diode (1N4007)</li>
            <li style="margin-bottom: 8px;"><strong>C:</strong> Smoothing Capacitor (100 µF)</li>
            <li style="margin-bottom: 8px;"><strong>SW:</strong> SPST Circuit Switch</li>
            <li style="margin-bottom: 8px;"><strong>mA:</strong> DC Milliammeter</li>
            <li style="margin-bottom: 8px;"><strong>V:</strong> Precision Voltmeter</li>
          </ul>
        </div>
      </details>
    `,
    formula: `
      <details open class="sidebar-details" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background: #ffffff;">
        <summary style="font-weight: 700; color: #168983; cursor: pointer; user-select: none; list-style: none; display: flex; justify-content: space-between; align-items: center; font-size: 0.95rem;">
          <span>Physical Constants</span>
          <span class="toggle-icon" style="font-size: 0.75rem; transition: transform 0.2s; color: #168983;">▲</span>
        </summary>
        <div class="sidebar-card-content" style="padding-top: 10px; font-size: 0.9em; line-height: 1.5;">
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="margin-bottom: 8px;"><strong>μ₀:</strong> 4π × 10⁻⁷ H/m</li>
            <li style="margin-bottom: 8px;"><strong>g:</strong> 9.81 m/s²</li>
            <li style="margin-bottom: 8px;"><strong>e:</strong> 1.602 × 10⁻¹⁹ C</li>
            <li style="margin-bottom: 8px;"><strong>Φ_B:</strong> Magnetic Flux (Wb)</li>
            <li style="margin-bottom: 8px;"><strong>Ɛ:</strong> Induced EMF (Volts)</li>
          </ul>
        </div>
      </details>
    `,
    results: `
      <details open class="sidebar-details" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background: #ffffff;">
        <summary style="font-weight: 700; color: #168983; cursor: pointer; user-select: none; list-style: none; display: flex; justify-content: space-between; align-items: center; font-size: 0.95rem;">
          <span>Experiment Output</span>
          <span class="toggle-icon" style="font-size: 0.75rem; transition: transform 0.2s; color: #168983;">▲</span>
        </summary>
        <div class="sidebar-card-content" style="padding-top: 10px; font-size: 0.9em; line-height: 1.5;">
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="margin-bottom: 8px;"><strong>Recorded Peaks:</strong> ${model?.state?.readings ? model.state.readings.length : 0}</li>
            <li style="margin-bottom: 8px;"><strong>Energy Dissipation:</strong> ${((model?.state?.electricalEnergy || 0) * 1000).toFixed(4)} mJ</li>
            <li style="margin-bottom: 8px;"><strong>Max Field:</strong> ${(model?.state?.fieldMilliTesla || 0).toFixed(1)} mT</li>
          </ul>
        </div>
      </details>
    `
  };

  if (sidebarDetails[name]) {
    infoContainer.innerHTML = sidebarDetails[name];
    const detailsEl = infoContainer.querySelector('details');
    if (detailsEl) {
      detailsEl.addEventListener('toggle', () => {
        const icon = detailsEl.querySelector('.toggle-icon');
        if (icon) icon.style.transform = detailsEl.open ? 'rotate(0deg)' : 'rotate(180deg)';
      });
    }
  } else {
    renderObservationSidebar(infoContainer);
  }
}

export function initCalculationModule(getWorkspaceMode, updateSidebarCallback) {
  const calcSection = $('#calculation');
  if (!calcSection) return;

  if (!calcSection.querySelector('.calc-input-container')) {
    const inputHTML = `
      <div class="calc-input-container" style="padding: 15px; background: #f9fbfb; border-radius: 8px; border: 1px solid #dce7e6; margin-bottom: 15px;">
        <h3 style="margin-top: 0; color: #168983; font-size: 1.1em; border-bottom: 1px solid #cce0df; padding-bottom: 6px;">Calculation Variables</h3>
        <div class="calc-input-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-top: 10px;">
          <label style="display: flex; flex-direction: column; font-size: 0.85em; font-weight: bold; color: #405150;">Turns (N)<input type="number" id="calcN" value="250" min="1" max="2000" style="padding: 6px; border: 1px solid #abc6c4; border-radius: 4px; margin-top: 4px;"></label>
          <label style="display: flex; flex-direction: column; font-size: 0.85em; font-weight: bold; color: #405150;">Field B (T)<input type="number" id="calcB" value="1.0" step="0.1" min="0.01" max="10" style="padding: 6px; border: 1px solid #abc6c4; border-radius: 4px; margin-top: 4px;"></label>
          <label style="display: flex; flex-direction: column; font-size: 0.85em; font-weight: bold; color: #405150;">Area A (m²)<input type="number" id="calcA" value="0.005" step="0.001" min="0.0001" max="1" style="padding: 6px; border: 1px solid #abc6c4; border-radius: 4px; margin-top: 4px;"></label>
          <label style="display: flex; flex-direction: column; font-size: 0.85em; font-weight: bold; color: #405150;">Time Δt (s)<input type="number" id="calcDt" value="0.05" step="0.01" min="0.001" max="10" style="padding: 6px; border: 1px solid #abc6c4; border-radius: 4px; margin-top: 4px;"></label>
          <label style="display: flex; flex-direction: column; font-size: 0.85em; font-weight: bold; color: #405150;">Resistance R (Ω)<input type="number" id="calcR" value="10.0" step="0.5" min="0.1" max="1000" style="padding: 6px; border: 1px solid #abc6c4; border-radius: 4px; margin-top: 4px;"></label>
        </div>
      </div>
    `;
    calcSection.insertAdjacentHTML('afterbegin', inputHTML);

    ['calcN', 'calcB', 'calcA', 'calcDt', 'calcR'].forEach((id) => {
      const input = $(`#${id}`);
      if (input) {
        input.addEventListener('input', () => {
          if (getWorkspaceMode() === 'calculation' && updateSidebarCallback) updateSidebarCallback('calculation');
        });
      }
    });
  }
}

export function initWorkspace(model, scene, syncCallback, emfGraph, angleGraph) {
  const workspaceViewport = $('#workspaceViewport');
  const workspaceTitle = $('#workspaceTitle');
  const simulationCard = $('#simulation');
  const controlsLockButton = $('#controlsLockButton');

  const sectionList = document.createElement('div');
  sectionList.id = 'sectionList';
  sectionList.className = 'section-list';

  const mainSection = document.querySelector('.main-section');
  if (mainSection) {
    const footer = mainSection.querySelector('.footer');
    if (footer) mainSection.insertBefore(sectionList, footer);
    else mainSection.appendChild(sectionList);
  }

  const simulationWindow = $('#simulationWindow');
  const sectionNames = {
    simulation: 'Simulation', diagram: 'Diagram', formula: 'Formula',
    calculation: 'Calculation', graphs: 'Live Graphs', results: 'Results',
    observation: 'Observation'
  };

  const workspaceSections = {
    simulation: simulationWindow,
    diagram: $('#diagram'),
    formula: $('#formula'),
    calculation: $('#calculation'),
    graphs: $('#graphs'),
    results: $('#observations') || $('#results'),
    observation: $('#observation')
  };

  Object.entries(workspaceSections).forEach(([name, section]) => {
    if (name !== 'simulation' && section) sectionList.append(section);
  });
  if (simulationWindow) simulationWindow.classList.add('workspace-section', 'simulation-window', 'is-active-workspace');

  let workspaceMode = 'simulation';
  let controlsLocked = false;

  const refreshControlState = () => {
    controls.forEach((control) => {
      if (control.input) {
        control.input.disabled = (controlsLocked && model.running) || (control.name === 'angle' && model.parameters.mode === 'freefall');
      }
      if (control.numberInput) {
        control.numberInput.disabled = (controlsLocked && model.running) || (control.name === 'angle' && model.parameters.mode === 'freefall');
      }
    });
    if (controlsLockButton) {
      controlsLockButton.textContent = controlsLocked ? '🔒 Locked' : '🔓 Lock';
      controlsLockButton.classList.toggle('is-locked', controlsLocked);
    }
    if (elements.release) elements.release.disabled = model.running || model.parameters.mode === 'manual';
    if (elements.pause) elements.pause.disabled = model.parameters.mode === 'manual';
  };

  if (controlsLockButton) {
    controlsLockButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      controlsLocked = !controlsLocked;
      controlsLockButton.setAttribute('aria-pressed', String(controlsLocked));
      refreshControlState();
    });
  }

  function updateWorkspaceVisibility(name) {
    const isInteractiveTab = name === 'simulation' || name === 'graphs';

    const toolbarContainers = document.querySelectorAll(
      '.simulation-toolbar, .sim-action-bar, .workspace-toolbar, .card-toolbar, .control-bar, .simulation-header, .card-sub-header, .action-bar, .toolbar, .workspace-controls-header, .workspace-controls'
    );
    toolbarContainers.forEach((container) => {
      container.style.display = isInteractiveTab ? '' : 'none';
    });

    const targets = [
      elements.release,
      elements.pause,
      elements.reset,
      elements.status,
      elements.dot,
      $('#experimentStatus'),
      $('#statusDot'),
      $('#releaseButton'),
      $('#pauseButton'),
      $('#resetButton'),
      $('.status-chip'),
      $('.button-group'),
      $('.control-buttons-row')
    ];

    targets.forEach((el) => {
      if (el) {
        el.style.display = isInteractiveTab ? '' : 'none';
      }
    });

    const helpElements = document.querySelectorAll('#helpButton, .help-button, .help-btn, .help-icon');
    helpElements.forEach((el) => {
      el.style.display = '';
    });

    updateContextualSidebar(name, model);
  }

  function selectWorkspace(name) {
    const next = workspaceSections[name];
    if (!next || name === workspaceMode) return;

    if (workspaceMode === 'simulation') scene.resetView();
    workspaceSections[workspaceMode].classList.remove('is-active-workspace');
    sectionList.append(workspaceSections[workspaceMode]);
    if (next.tagName === 'DETAILS') next.open = true;
    workspaceViewport.append(next);
    next.classList.add('is-active-workspace');
    workspaceMode = name;

    document.querySelectorAll('.workspace-link').forEach((link) => link.classList.toggle('is-active', link.dataset.workspace === name));
    if (workspaceTitle) workspaceTitle.textContent = sectionNames[name];
    if (simulationCard) {
      simulationCard.classList.toggle('is-reference-mode', name !== 'simulation');
      simulationCard.classList.toggle('is-graph-mode', name === 'graphs');
    }

    updateWorkspaceVisibility(name);

    if (name === 'formula') {
      initFormulaModule();
    } else if (name === 'calculation') {
      initCalculationModule(() => workspaceMode, (mode) => updateContextualSidebar(mode, model));
    } else if (name === 'graphs') {
      initGraphsModule(emfGraph, angleGraph);
    }

    requestAnimationFrame(() => { scene.resize(); if (syncCallback) syncCallback(model.state); });
  }

  document.querySelectorAll('.workspace-link').forEach((link) => link.addEventListener('click', () => {
    // Dismiss dashboard if active
    document.body.classList.remove('dashboard-active');
    const closeBtn = document.getElementById('dashboardCloseBtn');
    if (closeBtn) closeBtn.style.display = 'inline-flex';
    selectWorkspace(link.dataset.workspace);
  }));

  updateWorkspaceVisibility(workspaceMode);

  // ---- Accordion: Only one side-details panel open at a time ----
  // Applies to both Simulation and Graphs views (shared sidebar)
  const controlsCard = document.getElementById('controlsCard');
  const variablesCard = document.getElementById('variablesCard');

  if (controlsCard && variablesCard) {
    controlsCard.addEventListener('toggle', () => {
      if (controlsCard.open && variablesCard.open) {
        variablesCard.open = false;
      }
    });
    variablesCard.addEventListener('toggle', () => {
      if (variablesCard.open && controlsCard.open) {
        controlsCard.open = false;
      }
    });
  }

  return { refreshControlState, updateWorkspaceVisibility, getWorkspaceMode: () => workspaceMode };
}

export function initFullscreen() {
  const fullscreenButton = $('#fullscreenButton');
  const viewportFullscreenButton = $('#viewportFullscreenButton');
  const simulationWindow = $('#simulationWindow');

  if (fullscreenButton) {
    fullscreenButton.addEventListener('click', async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
      } catch (_) {}
    });
  }

  if (viewportFullscreenButton && simulationWindow) {
    viewportFullscreenButton.addEventListener('click', async () => {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        } else {
          if (simulationWindow.requestFullscreen) {
            await simulationWindow.requestFullscreen();
          } else if (simulationWindow.webkitRequestFullscreen) {
            await simulationWindow.webkitRequestFullscreen();
          }
        }
      } catch (err) {
        console.error('Could not enter viewport full mode:', err);
      }
    });
  }

  document.addEventListener('fullscreenchange', () => {
    const isFullscreen = !!document.fullscreenElement;

    if (fullscreenButton) {
      fullscreenButton.textContent = isFullscreen ? '⊡' : '⛶';
    }

    if (viewportFullscreenButton) {
      viewportFullscreenButton.classList.toggle('is-active', isFullscreen);
      viewportFullscreenButton.title = isFullscreen ? 'Exit Viewport Full Mode' : 'Full Viewport Mode';
    }

    window.dispatchEvent(new Event('resize'));
  });
}

export function initDragDrop() {
  let draggedCard = null;
  document.querySelectorAll('.reference-card, .graphs-card').forEach((card) => {
    card.setAttribute('draggable', 'true');
    card.addEventListener('dragstart', (event) => { draggedCard = card; card.classList.add('is-dragging'); event.dataTransfer.effectAllowed = 'move'; });
    card.addEventListener('dragend', () => { card.classList.remove('is-dragging'); document.querySelectorAll('.drag-over').forEach((item) => item.classList.remove('drag-over')); draggedCard = null; });
    card.addEventListener('dragover', (event) => { if (!draggedCard || draggedCard === card) return; event.preventDefault(); card.classList.add('drag-over'); });
    card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
    card.addEventListener('drop', (event) => { event.preventDefault(); if (draggedCard && draggedCard !== card) card.parentNode.insertBefore(draggedCard, card); });
  });
}

export { observation };