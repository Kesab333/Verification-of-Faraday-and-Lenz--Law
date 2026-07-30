import * as THREE from 'three';
import { InductionModel } from './physics.js';
import { InductionScene } from './scene.js';
import { DeviceDetector, $, clamp } from './utils.js';
import {
  elements, controls, controlsByName,
  initWorkspace, initFullscreen, initDragDrop,
  updateContextualSidebar
} from './ui.js';
import { drawGraph, initGraphsModule } from './graphs.js';
import { observation } from './observation.js';
import { applyPreset } from './presets.js';
import { initHelp } from './help.js';
import { initFormulaModule } from './formula.js';

const PX_PROV_F15 = "c3ab";

// ---- Integration Configuration ----
const FIXED_DT = 1 / 120;
const PHYSICS_SUB_STEPS = 16;
const SUB_DT = FIXED_DT / PHYSICS_SUB_STEPS;

let lastAngleTime = performance.now();
let lastManualTheta = 0;
let manualPeakEmf = 0;
let physicsAccumulator = 0;
let workspaceContext = null;

// ---- Graph Elements ----
const emfGraph = $('#emfGraph');
const angleGraph = $('#angleGraph');

// ---- Model & Scene ----
const model = new InductionModel();

// ============================================================
//  PARAMETER LIMITS CONFIGURATION
// ============================================================
const PARAM_LIMITS = {
  angle: { min: -25, max: 25 },
  turns: { min: 10, max: 1000 },
  strength: { min: 0.1, max: 2.0 },
  damping: { min: 0.0, max: 1.0 },
  speed: { min: 0.1, max: 3.0 }
};

function recalculateEMF(dt = 0.016) {
  if (typeof model.calculateFluxAndEmf === 'function') {
    model.calculateFluxAndEmf(dt);
  } else if (typeof model.recalculateState === 'function') {
    model.recalculateState();
  } else if (typeof model.updateFluxAndEmf === 'function') {
    model.updateFluxAndEmf(dt);
  }
}

const scene = new InductionScene($('#threeViewport'), (theta, omega) => {
  const deg = Math.round((theta * 180) / Math.PI);
  const clampedDeg = clamp(deg, -25, 25);
  const clampedRad = (clampedDeg * Math.PI) / 180;

  lastAngleTime = performance.now();

  const mode = model.parameters?.mode || model.state?.parameters?.mode;

  if (mode === 'manual') {
    model.setManualAngle(clampedRad, omega);
    recalculateEMF(0.016);
  } else if (mode === 'oscillate' && !model.running) {
    model.setInitialState({ theta: clampedRad, omega: 0 });
    model.state.theta = clampedRad;
    model.state.angleDegrees = clampedDeg;
    model.state.omega = 0;
    model.state.velocity = 0;
    recalculateEMF(0.016);
  }

  if (controlsByName.angle && controlsByName.angle.input) {
    controlsByName.angle.input.value = clampedDeg;
    controlsByName.angle.output.textContent = `${clampedDeg}°`;
  }

  sync(model.state);
});

// ---- Formatting Helpers ----
function getFormattedPosition(state) {
  const mode = state?.parameters?.mode || model.parameters?.mode;
  if (mode === 'freefall') {
    return `${(state.position || 0).toFixed(2)} m`;
  }
  const deg = state.angleDegrees !== undefined ? state.angleDegrees : (state.theta ? (state.theta * 180 / Math.PI) : 0);
  return `${deg.toFixed(1)}°`;
}

function getFormattedSpeed(state) {
  const mode = state?.parameters?.mode || model.parameters?.mode;
  if (mode === 'freefall') {
    return `${Math.abs(state.velocity || 0).toFixed(2)} m/s`;
  }
  const speed = Math.abs(state.velocity !== undefined ? state.velocity : (state.omega || 0));
  return `${speed.toFixed(2)} rad/s`;
}

// ---- Peak Detection ----
function processManualPeakDetection(dt) {
  const mode = model.parameters?.mode || model.state?.parameters?.mode;
  if (mode !== 'manual') {
    manualPeakEmf = 0;
    return;
  }

  const currentEmf = model.state.emf || 0;
  const currentAmps = (model.state.currentMilliAmps || 0) / 1000;
  const resistance = model.parameters?.resistance || 10;

  if (Math.abs(currentAmps) > 0.0001) {
    model.state.electricalEnergy = (model.state.electricalEnergy || 0) + (currentAmps * currentAmps * resistance * dt);
  }

  if (Math.abs(currentEmf) > Math.abs(manualPeakEmf)) {
    manualPeakEmf = currentEmf;
  }

  const hasSlowedOrStopped = Math.abs(currentEmf) < Math.abs(manualPeakEmf) * 0.4;
  const hasReversed = (currentEmf * manualPeakEmf < 0);

  if (Math.abs(manualPeakEmf) >= 0.005 && (hasSlowedOrStopped || hasReversed)) {
    if (!Array.isArray(model.state.readings)) {
      model.state.readings = [];
    }

    const lastReading = model.state.readings.length > 0
      ? model.state.readings[model.state.readings.length - 1]
      : null;

    const timeSinceLast = lastReading ? (model.time - lastReading.time) : 999;
    const isSignDifferent = lastReading ? (Math.sign(lastReading.emf) !== Math.sign(manualPeakEmf)) : true;

    if (timeSinceLast > 0.2 || isSignDifferent) {
      model.state.readings.push({
        time: Number(model.time.toFixed(2)),
        emf: manualPeakEmf,
        position: getFormattedPosition(model.state),
        speed: getFormattedSpeed(model.state)
      });
    }

    manualPeakEmf = currentEmf;
  }
}

// ============================================================
//  UPDATED setParameter: Dynamic bounds checking
// ============================================================
export function setParameter(name, value) {
  let safeValue = value;

  // Clamp value if min/max limits exist for this parameter
  if (PARAM_LIMITS[name]) {
    safeValue = clamp(value, PARAM_LIMITS[name].min, PARAM_LIMITS[name].max);
  }

  model.setParameter(name, safeValue);

  if (name === 'turns') {
    scene.setCoilTurns(safeValue);
  }

  // 1. Update slider input value
  if (controlsByName[name] && controlsByName[name].input) {
    controlsByName[name].input.value = safeValue;
  }

  // 2. Synchronize Direct Value Number Input Box
  if (controlsByName[name] && controlsByName[name].numberInput) {
    controlsByName[name].numberInput.value = safeValue;
  }

  // 3. Optional text readout update
  if (controlsByName[name] && controlsByName[name].output) {
    controlsByName[name].output.textContent = controlsByName[name].format(safeValue);
  }

  const mode = model.parameters?.mode || model.state?.parameters?.mode;

  if (name === 'angle') {
    const targetRad = (safeValue * Math.PI) / 180;
    const now = performance.now();
    const dt = Math.max((now - lastAngleTime) / 1000, 0.016);

    if (scene && typeof scene.setAngle === 'function') {
      scene.setAngle(targetRad);
    }

    if (mode === 'manual') {
      const omega = (targetRad - lastManualTheta) / dt;
      model.setManualAngle(targetRad, omega);
      recalculateEMF(dt);
    } else if (mode === 'oscillate') {
      model.setInitialState({ theta: targetRad, omega: 0 });
      if (!model.running) {
        model.state.theta = targetRad;
        model.state.angleDegrees = safeValue;
        model.state.omega = 0;
        model.state.velocity = 0;
        recalculateEMF(dt);
      }
    }

    lastAngleTime = now;
    lastManualTheta = targetRad;
  } else {
    recalculateEMF(0.016);
  }

  sync(model.state);
}

// ============================================================
//  UPDATED CONTROL BINDING: With Clamping on Change/Blur
// ============================================================
controls.forEach((c) => {
  // Slider input event (real-time, already clamped via setParameter)
  if (c.input) {
    c.input.addEventListener('input', () => setParameter(c.name, Number(c.input.value)));
  }

  if (c.numberInput) {
    // While typing, update live without forcing bounds mid-keystroke
    c.numberInput.addEventListener('input', () => {
      const rawVal = Number(c.numberInput.value);
      if (!isNaN(rawVal) && c.numberInput.value !== '') {
        // Apply bounds immediately for real-time feedback
        const clampedVal = PARAM_LIMITS[c.name] 
          ? clamp(rawVal, PARAM_LIMITS[c.name].min, PARAM_LIMITS[c.name].max)
          : rawVal;
        
        model.setParameter(c.name, clampedVal);
        if (c.input) c.input.value = clampedVal;
        // Update the number input to show the clamped value
        c.numberInput.value = clampedVal;
        if (c.output) c.output.textContent = c.format(clampedVal);
        
        // Handle angle-specific logic
        if (c.name === 'angle') {
          const targetRad = (clampedVal * Math.PI) / 180;
          const now = performance.now();
          const dt = Math.max((now - lastAngleTime) / 1000, 0.016);
          
          if (scene && typeof scene.setAngle === 'function') {
            scene.setAngle(targetRad);
          }
          
          const mode = model.parameters?.mode || model.state?.parameters?.mode;
          if (mode === 'manual') {
            const omega = (targetRad - lastManualTheta) / dt;
            model.setManualAngle(targetRad, omega);
            recalculateEMF(dt);
          } else if (mode === 'oscillate' && !model.running) {
            model.setInitialState({ theta: targetRad, omega: 0 });
            model.state.theta = targetRad;
            model.state.angleDegrees = clampedVal;
            model.state.omega = 0;
            model.state.velocity = 0;
            recalculateEMF(dt);
          }
          
          lastAngleTime = now;
          lastManualTheta = targetRad;
        } else {
          recalculateEMF(0.016);
        }
        
        sync(model.state);
      }
    });

    // Enforce min/max clamping when user exits the input box or submits (presses Enter)
    const commitValue = () => {
      let val = Number(c.numberInput.value);
      
      // Fallback to min if empty or invalid entry
      if (isNaN(val) || c.numberInput.value.trim() === '') {
        val = PARAM_LIMITS[c.name]?.min ?? 0;
      }
      
      setParameter(c.name, val); // setParameter automatically clamps and updates input text
    };

    c.numberInput.addEventListener('change', commitValue);
    c.numberInput.addEventListener('blur', commitValue);
  }
});

export function setMode(mode) {
  model.setMode(mode);
  manualPeakEmf = 0;
  physicsAccumulator = 0;

  if (model.state) {
    model.state.history = [];
    model.state.readings = [];
  }

  document.querySelectorAll('.mode-button').forEach((btn) => btn.classList.toggle('is-active', btn.dataset.mode === mode));

  if (controlsByName.angle && controlsByName.angle.input) {
    controlsByName.angle.input.disabled = mode === 'freefall';
  }

  const releaseBtn = elements.release || $('#releaseButton');
  const pauseBtn = elements.pause || $('#pauseButton');
  const dragHint = elements.dragHint || $('#dragHint');

  if (releaseBtn) releaseBtn.disabled = mode === 'manual';
  if (pauseBtn) pauseBtn.disabled = mode === 'manual';
  if (dragHint) dragHint.hidden = mode !== 'manual';

  if (mode === 'oscillate') {
    const currentSliderAngle = controlsByName.angle ? Number(controlsByName.angle.input.value) : 22;
    const defaultAngle = (currentSliderAngle * Math.PI) / 180;
    model.setInitialState({ theta: defaultAngle, omega: 0 });
    model.state.theta = defaultAngle;
    model.state.angleDegrees = currentSliderAngle;
    model.state.omega = 0;
    model.state.velocity = 0;
    recalculateEMF(0.016);
    if (scene && typeof scene.setAngle === 'function') {
      scene.setAngle(defaultAngle);
    }
  } else if (mode === 'manual') {
    const currentSliderAngle = controlsByName.angle ? Number(controlsByName.angle.input.value) : 0;
    const rad = (currentSliderAngle * Math.PI) / 180;
    lastManualTheta = rad;
    lastAngleTime = performance.now();
    model.setManualAngle(rad, 0);
    recalculateEMF(0.016);
    if (scene && typeof scene.setAngle === 'function') {
      scene.setAngle(rad);
    }
  }

  if (workspaceContext) workspaceContext.refreshControlState();
  sync(model.state);
}

document.querySelectorAll('.mode-button').forEach((btn) => btn.addEventListener('click', () => setMode(btn.dataset.mode)));
document.querySelectorAll('.preset-button').forEach((btn) => btn.addEventListener('click', () => applyPreset(btn.dataset.preset, setMode, setParameter, model, sync)));

// ---- Field Toggles ----
const fieldToggle = $('#magneticFieldToggle');
if (fieldToggle) {
  fieldToggle.addEventListener('change', (event) => {
    const visible = event.target.checked;
    model.setDisplay('fields', visible);
    scene.setFieldVisibility(visible);
  });
  fieldToggle.checked = true;
  model.setDisplay('fields', true);
}

const currentToggle = $('#inducedCurrentToggle');
if (currentToggle) {
  currentToggle.addEventListener('change', (event) => model.setDisplay('current', event.target.checked));
}

// ---- Sync UI State ----
function sync(state) {
  if (!state) return;

  const mode = state.parameters?.mode || model.parameters?.mode || 'oscillate';
  const emfVal = state.emf ?? 0;
  const emfSign = emfVal >= 0 ? '+' : '';
  const formattedEmf = `${emfSign}${emfVal.toFixed(3)} V`;

  // Voltmeter Displays
  const voltmeterEl = elements.voltmeter || $('#voltmeter');
  if (voltmeterEl) {
    if ('value' in voltmeterEl && voltmeterEl.tagName === 'INPUT') voltmeterEl.value = formattedEmf;
    voltmeterEl.textContent = formattedEmf;
  }

  const voltmeterHUD = $('.voltmeter-hud') || $('.voltmeter-readout');
  if (voltmeterHUD) voltmeterHUD.textContent = formattedEmf;

  // 1. Angle
  const angleEl = elements.angle || $('#angleValue') || $('#angle') || $('#angleDegrees');
  if (angleEl) {
    angleEl.textContent = mode === 'freefall' ? '—' : `${(state.angleDegrees ?? 0).toFixed(1)}°`;
  }

  // 2. Velocity / Speed Label
  const velValEl = elements.velocity || $('#velocityValue') || $('#velocity') || $('#angularVelocityValue');
  const velLabelEl = elements.velocityLabel || $('#velocityLabel') || $('#angularVelocityLabel');

  if (velLabelEl) {
    const labelText = mode === 'freefall' ? 'Fall speed ' : 'Velocity ';
    if (velValEl && velLabelEl.contains(velValEl)) {
      if (velLabelEl.childNodes.length > 0 && velLabelEl.childNodes[0].nodeType === Node.TEXT_NODE) {
        velLabelEl.childNodes[0].nodeValue = labelText;
      }
    } else if (!velValEl) {
      velLabelEl.textContent = labelText.trim();
    }
  }

  // 3. Velocity Value
  const activeVelVal = elements.velocity || $('#velocityValue') || $('#velocity') || $('#angularVelocityValue');
  if (activeVelVal) {
    const rawVel = state.velocity ?? state.omega ?? 0;
    activeVelVal.textContent = mode === 'freefall' 
      ? `${Math.abs(rawVel).toFixed(3)} m/s` 
      : `${rawVel.toFixed(3)} rad/s`;
  }

  // 4. Flux
  const fluxEl = elements.flux || $('#fluxValue') || $('#flux');
  if (fluxEl) {
    fluxEl.textContent = `${(state.fluxMilliWebers ?? 0).toFixed(3)} mWb`;
  }

  // 5. EMF
  const emfEl = elements.emf || $('#emfValue') || $('#emf');
  if (emfEl) {
    if ('value' in emfEl && emfEl.tagName === 'INPUT') emfEl.value = formattedEmf;
    emfEl.textContent = formattedEmf;
  }

  // 6. Magnetic Field
  const fieldEl = elements.field || $('#fieldValue') || $('#field');
  if (fieldEl) {
    fieldEl.textContent = `${(state.fieldMilliTesla ?? 0).toFixed(1)} mT`;
  }

  // 7. Induced Current
  const currentEl = elements.current || $('#currentValue') || $('#current');
  if (currentEl) {
    const currVal = state.currentMilliAmps ?? 0;
    currentEl.textContent = `${currVal >= 0 ? '+' : ''}${currVal.toFixed(4)} mA`;
  }

  // 8. Oscillations Count
  const countEl = elements.count || $('#countValue') || $('#count') || $('#oscillations');
  if (countEl) {
    countEl.textContent = mode === 'freefall' ? '—' : (state.oscillations ?? 0);
  }

  // 9. Motion Direction
  const motionEl = elements.motion || $('#motionValue') || $('#motion');
  if (motionEl) {
    const rawVel = state.velocity ?? state.omega ?? 0;
    motionEl.textContent = !state.running && mode !== 'manual' 
      ? 'Stationary' 
      : mode === 'freefall' 
      ? 'Falling' 
      : rawVel > 0 
      ? 'Toward +x' 
      : rawVel < 0 
      ? 'Toward −x' 
      : 'Stationary';
  }

  // 10. Status & Heat
  const statusEl = elements.status || $('#experimentStatus') || $('#status');
  if (statusEl) {
    statusEl.textContent = state.complete 
      ? 'Experiment complete' 
      : state.running 
      ? mode === 'freefall' ? 'Freefall in progress' : 'Oscillating' 
      : mode === 'manual' ? 'Manual positioning' : 'Ready to release';
  }

  const dotEl = elements.dot || $('#statusDot');
  if (dotEl) {
    dotEl.className = `status-dot ${state.running ? 'running' : state.time > 0 ? 'paused' : ''}`;
  }

  const pauseBtn = elements.pause || $('#pauseButton');
  if (pauseBtn) pauseBtn.textContent = state.running ? 'Pause' : 'Resume';

  const heatEl = elements.heat || $('#heatValue') || $('#heat') || $('#electricalEnergy');
  if (heatEl) {
    heatEl.textContent = `${((state.electricalEnergy || 0) * 1000).toFixed(4)} mJ`;
  }

  const heatFillEl = elements.heatFill || $('#heatFill');
  if (heatFillEl) {
    heatFillEl.style.width = `${Math.min((state.electricalEnergy || 0) * 700000, 100)}%`;
  }

  // Observation Text
  const obsTextEl = elements.observation || $('#observationText');
  if (obsTextEl) {
    obsTextEl.textContent = observation(state);
  }

  // EMF Table Readings
  const readingsTableTarget = elements.readings || $('#emfReadings') || $('#readingsTable');
  if (readingsTableTarget) {
    const readings = state.readings || [];
    const fallbackMessage = mode === 'manual'
      ? 'Drag magnet back and forth in manual mode to record EMF peaks.'
      : 'Release the frame to record readings.';

    if (readings.length === 0) {
      readingsTableTarget.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #777; padding: 12px;">${fallbackMessage}</td></tr>`;
    } else {
      let maxEmf = -Infinity;
      let minEmf = Infinity;
      readings.forEach((r) => {
        if (r.emf > maxEmf) maxEmf = r.emf;
        if (r.emf < minEmf) minEmf = r.emf;
      });

      readingsTableTarget.innerHTML = readings.map((reading, index) => {
        let badge = '';
        if (readings.length > 1) {
          if (reading.emf === maxEmf) badge = ' <b style="color: #0d9488;">[MAX]</b>';
          else if (reading.emf === minEmf) badge = ' <b style="color: #e11d48;">[MIN]</b>';
        }

        const formattedPos = reading.position || getFormattedPosition(state);
        const formattedSpeed = reading.speed || getFormattedSpeed(state);

        return `<tr>
          <td>${index + 1}</td>
          <td>${reading.time.toFixed(2)} s</td>
          <td>${formattedPos}</td>
          <td>${formattedSpeed}</td>
          <td class="${reading.emf > 0 ? 'positive-reading' : 'negative-reading'}">
            ${reading.emf >= 0 ? '+' : ''}${reading.emf.toFixed(3)} V${badge}
          </td>
        </tr>`;
      }).join('');
    }
  }

  scene.update(state);

  if (!state.history) state.history = [];

  drawGraph(emfGraph, '#168983', state.history, (point) => point?.emf ?? 0, -0.8, 0.8);
  drawGraph(angleGraph, '#b36d24', state.history, (point) => point?.angle ?? 0, -25, 25);

  if (workspaceContext && typeof updateContextualSidebar === 'function') {
    updateContextualSidebar(workspaceContext.getWorkspaceMode(), model);
  }
}

// ---- Control Actions ----
function release() { model.release(); sync(model.state); }
function toggle() { model.running ? model.pause() : model.release(); sync(model.state); }
function reset() {
  model.reset();
  manualPeakEmf = 0;
  physicsAccumulator = 0;
  if (model.state) {
    model.state.history = [];
    model.state.readings = [];
  }
  sync(model.state);
}

const releaseBtn = elements.release || $('#releaseButton');
const pauseBtn = elements.pause || $('#pauseButton');
const resetBtn = elements.reset || $('#resetButton');

if (releaseBtn) releaseBtn.addEventListener('click', release);
if (pauseBtn) pauseBtn.addEventListener('click', toggle);
if (resetBtn) resetBtn.addEventListener('click', reset);

// ---- Module Initialization ----
workspaceContext = initWorkspace(model, scene, sync, emfGraph, angleGraph);
initFullscreen();
initDragDrop();
initHelp();
initFormulaModule();
initGraphsModule(emfGraph, angleGraph);

if (typeof window.ResizeObserver !== 'undefined') {
  const resizeObserver = new ResizeObserver(() => {
    if (model && model.state) {
      sync(model.state);
    }
  });
  if (emfGraph) resizeObserver.observe(emfGraph.parentElement || emfGraph);
  if (angleGraph) resizeObserver.observe(angleGraph.parentElement || angleGraph);
}

// ---- Main Loop ----
window.addEventListener('resize', () => { scene.resize(); sync(model.state); });
let last = performance.now();

function animate(now) {
  let dt = Math.min((now - last) / 1000, 0.1);
  last = now;

  const mode = model.parameters?.mode || model.state?.parameters?.mode;

  if (mode === 'manual') {
    // Increment model time during manual dragging so recorded peaks have accurate timestamps
    model.time = (model.time || 0) + dt;
    if (model.state) model.state.time = model.time;

    const isUserDragging = (now - lastAngleTime <= 150);
    if (!isUserDragging) {
      model.setManualAngle(model.state.theta, 0);
      recalculateEMF(dt);
    }
    processManualPeakDetection(dt);
  } else if (model.running) {
    physicsAccumulator += dt;
    while (physicsAccumulator >= FIXED_DT) {
      for (let s = 0; s < PHYSICS_SUB_STEPS; s++) {
        model.update(SUB_DT);
      }
      physicsAccumulator -= FIXED_DT;
    }
  }

  sync(model.state);
  if (workspaceContext) workspaceContext.refreshControlState();
  requestAnimationFrame(animate);
}

// ---- Boot up ----
setMode('oscillate');
if (workspaceContext) {
  workspaceContext.updateWorkspaceVisibility('simulation');
  workspaceContext.refreshControlState();
}
sync(model.state);
requestAnimationFrame(animate);