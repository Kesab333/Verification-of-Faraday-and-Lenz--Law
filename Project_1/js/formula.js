import { $ } from './utils.js';

const PX_PROV_F11 = "e9ad";

// ------------------------------------------------------------------
// 1. Formula Data Repository
// ------------------------------------------------------------------
const formulaData = {
  faraday: {
    usage: "Used to calculate the electromotive force (EMF) induced in a circuit due to a time-varying magnetic flux passing through a coil with $N$ turns.",
    latex: "\\mathcal{E} = -N \\frac{d\\Phi_B}{dt}",
    variables: [
      { symbol: "\\mathcal{E}", desc: "Induced Electromotive Force (Volts, V)" },
      { symbol: "N", desc: "Number of turns in the coil" },
      { symbol: "d\\Phi_B/dt", desc: "Rate of change of magnetic flux (Wb/s)" },
      { symbol: "-", desc: "Negative sign denotes Lenz's Law direction" }
    ]
  },
  lenz: {
    usage: "Formulates energy conservation in induction. The negative sign indicates that the induced current always flows in a direction that opposes the magnetic flux change that created it.",
    latex: "\\mathcal{E}_{opposing} = -\\frac{\\Delta \\Phi}{\\Delta t}",
    variables: [
      { symbol: "\\mathcal{E}_{opposing}", desc: "Opposing EMF (Volts, V)" },
      { symbol: "\\Delta \\Phi", desc: "Change in Magnetic Flux (Webers, Wb)" },
      { symbol: "\\Delta t", desc: "Time interval (Seconds, s)" }
    ]
  },
  flux: {
    usage: "Calculates the total magnetic field lines passing through a given surface area $A$ at an angle $\\theta$ relative to the normal vector.",
    latex: "\\Phi_B = \\vec{B} \\cdot \\vec{A} = B A \\cos(\\theta)",
    variables: [
      { symbol: "\\Phi_B", desc: "Magnetic Flux (Webers, Wb)" },
      { symbol: "B", desc: "Magnetic Field Strength (Tesla, T)" },
      { symbol: "A", desc: "Surface Area of coil ($m^2$)" },
      { symbol: "\\theta", desc: "Angle between B-field and normal line" }
    ]
  },
  motional: {
    usage: "Determines the induced EMF across a straight conducting rod of length $L$ moving at constant velocity $v$ perpendicular to a uniform magnetic field $B$.",
    latex: "\\mathcal{E} = B \\cdot L \\cdot v",
    variables: [
      { symbol: "\\mathcal{E}", desc: "Motional EMF (Volts, V)" },
      { symbol: "B", desc: "Uniform Magnetic Field (Tesla, T)" },
      { symbol: "L", desc: "Length of the conductor (Meters, m)" },
      { symbol: "v", desc: "Velocity of conductor (m/s)" }
    ]
  },
  rotating: {
    usage: "Used in AC generators to calculate time-dependent sinusoidal EMF produced when a coil rotates at constant angular speed $\\omega$ in a magnetic field.",
    latex: "\\mathcal{E}(t) = N B A \\omega \\sin(\\omega t)",
    variables: [
      { symbol: "\\mathcal{E}_0 = NBA\\omega", desc: "Peak Induced Voltage (Volts, V)" },
      { symbol: "\\omega", desc: "Angular frequency (rad/s)" },
      { symbol: "t", desc: "Time elapsed (Seconds, s)" }
    ]
  },
  current: {
    usage: "Calculates the magnitude of induced current flowing through a closed circuit with internal resistance $R$ produced by Faraday's EMF.",
    latex: "I = \\frac{\\mathcal{E}}{R} = -\\frac{N}{R} \\frac{d\\Phi_B}{dt}",
    variables: [
      { symbol: "I", desc: "Induced Current (Amperes, A)" },
      { symbol: "R", desc: "Total Circuit Resistance (Ohms, \\Omega)" },
      { symbol: "\\mathcal{E}", desc: "Induced EMF (Volts, V)" }
    ]
  },
  inductance: {
    usage: "Calculates self-induced EMF in an inductor or coil caused by a changing electric current through the coil itself.",
    latex: "\\mathcal{E} = -L \\frac{dI}{dt}",
    variables: [
      { symbol: "L", desc: "Self-Inductance (Henries, H)" },
      { symbol: "dI/dt", desc: "Rate of change of current (A/s)" }
    ]
  }
};

// ------------------------------------------------------------------
// 2. KaTeX Helper Functions
// ------------------------------------------------------------------
function renderMathText(text) {
  if (!window.katex) return text;
  return text.replace(/\$([^$]+)\$/g, (_, expr) => {
    try {
      return katex.renderToString(expr, { displayMode: false, throwOnError: false });
    } catch (e) {
      return expr;
    }
  });
}

function renderSymbol(sym) {
  if (window.katex) {
    try {
      return katex.renderToString(sym, { displayMode: false, throwOnError: false });
    } catch (e) {
      return sym;
    }
  }
  return sym;
}

// Helper to safely get named input values with target fallbacks
function getNumValue(id, labelQuery, fallbackVal) {
  const el = $('#' + id) 
          || document.querySelector(`input[name="${id}"]`)
          || document.querySelector(`input[label*="${labelQuery}"]`);
  
  if (!el) return fallbackVal;
  const parsed = parseFloat(el.value);
  return isNaN(parsed) ? fallbackVal : parsed;
}

// ------------------------------------------------------------------
// 3. Step-by-Step Faraday Calculation Panel
// ------------------------------------------------------------------
export function updateStepByStepCalculation() {
  // Target inputs by primary ID/Name with fallbacks to avoid positional array index issues
  const N  = getNumValue('calcTurns', 'Turns', 251);
  const B  = getNumValue('calcField', 'Field', 1.0);
  const A  = getNumValue('calcArea', 'Area', 0.005);
  const dt = getNumValue('calcTime', 'Time', 0.05);
  const R  = getNumValue('calcRes', 'Resistance', 10.0);

  // Perform Physics Calculations
  const flux = B * A;                             // Φ = B * A (Webers)
  const dFlux = flux;                             // ΔΦ assuming full coupling
  const safeDt = dt <= 0 ? 0.001 : dt;            // Prevent divide-by-zero
  const emf = N * (dFlux / safeDt);               // ε = N * (ΔΦ / Δt) (Volts)
  const safeR = R <= 0 ? 1.0 : R;                 // Prevent divide-by-zero
  const current = emf / safeR;                    // I = ε / R (Amperes)
  const power = current * current * safeR;        // P = I² * R (Watts)

  // Target the container
  const stepContainer = $('.step-by-step-content') 
                     || $('#stepByStepContent') 
                     || $('.step-by-step-container');

  if (!stepContainer) return;

  // Render Step-by-Step Breakdown
  stepContainer.innerHTML = `
    <div style="font-size: 0.88rem; color: #1e293b; line-height: 1.6; padding: 4px;">
      
      <!-- Step 1: Magnetic Flux -->
      <div style="margin-bottom: 14px; background: #f8fafc; padding: 10px; border-radius: 6px; border-left: 3px solid #168983;">
        <div style="font-weight: 700; color: #168983; margin-bottom: 4px;">Step 1: Calculate Magnetic Flux (\\Phi)</div>
        <div>$$\\Phi = B \\cdot A$$</div>
        <div style="color: #475569; margin-top: 4px;">
          $$\\Phi = ${B}\\text{ T} \\times ${A}\\text{ m}^2 = \\mathbf{${flux.toFixed(5)}\\text{ Wb}}$$
        </div>
      </div>

      <!-- Step 2: Faraday's Law (Induced EMF) -->
      <div style="margin-bottom: 14px; background: #f8fafc; padding: 10px; border-radius: 6px; border-left: 3px solid #168983;">
        <div style="font-weight: 700; color: #168983; margin-bottom: 4px;">Step 2: Induced EMF (Faraday's Law)</div>
        <div>$$\\mathcal{E} = N \\cdot \\frac{\\Delta \\Phi}{\\Delta t}$$</div>
        <div style="color: #475569; margin-top: 4px;">
          $$\\mathcal{E} = ${N} \\times \\frac{${flux.toFixed(5)}}{${safeDt}} = \\mathbf{${emf.toFixed(2)}\\text{ V}}$$
        </div>
      </div>

      <!-- Step 3: Induced Current (Ohm's Law) -->
      <div style="margin-bottom: 14px; background: #f8fafc; padding: 10px; border-radius: 6px; border-left: 3px solid #168983;">
        <div style="font-weight: 700; color: #168983; margin-bottom: 4px;">Step 3: Induced Current (I)</div>
        <div>$$I = \\frac{\\mathcal{E}}{R}$$</div>
        <div style="color: #475569; margin-top: 4px;">
          $$I = \\frac{${emf.toFixed(2)}}{${safeR}} = \\mathbf{${current.toFixed(3)}\\text{ A}}$$
        </div>
      </div>

      <!-- Step 4: Thermal Power Dissipation -->
      <div style="background: #f8fafc; padding: 10px; border-radius: 6px; border-left: 3px solid #b36d24;">
        <div style="font-weight: 700; color: #b36d24; margin-bottom: 4px;">Step 4: Power Dissipated (P)</div>
        <div>$$P = I^2 \\cdot R$$</div>
        <div style="color: #475569; margin-top: 4px;">
          $$P = (${current.toFixed(3)})^2 \\times ${safeR} = \\mathbf{${power.toFixed(2)}\\text{ W}}$$
        </div>
      </div>

    </div>
  `;

  // Render LaTeX math using available library (KaTeX or MathJax)
  if (window.renderMathInElement) {
    window.renderMathInElement(stepContainer, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false
    });
  } else if (window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise([stepContainer]);
  } else if (window.katex) {
    stepContainer.innerHTML = renderMathText(stepContainer.innerHTML);
  }
}

// ------------------------------------------------------------------
// 4. Main Module Initializer
// ------------------------------------------------------------------
export function initFormulaModule() {
  // A. Initialize Formula Dropdown Viewer
  const select = document.getElementById('formulaSelect');
  const usageEl = document.getElementById('formulaUsage');
  const latexEl = document.getElementById('formulaLatex');
  const varsEl = document.getElementById('formulaVariables');

  if (select && usageEl && latexEl && varsEl) {
    function updateFormulaView(key) {
      const item = formulaData[key];
      if (!item) return;

      usageEl.innerHTML = renderMathText(item.usage);

      if (window.katex) {
        try {
          katex.render(item.latex, latexEl, { displayMode: true, throwOnError: false });
        } catch (err) {
          latexEl.textContent = item.latex;
        }
      } else {
        latexEl.textContent = item.latex;
      }

      varsEl.innerHTML = item.variables.map(v => `
        <li>
          <span class="var-symbol">${renderSymbol(v.symbol)}</span>
          <span class="var-desc">${renderMathText(v.desc)}</span>
        </li>
      `).join('');
    }

    select.addEventListener('change', (e) => updateFormulaView(e.target.value));
    updateFormulaView(select.value);
  }

  // B. Initialize Calculation Input Event Listeners
  const calcWorkspace = $('#calculationWorkspace') || $('.calculation-panel') || document;
  const inputs = calcWorkspace.querySelectorAll('input');

  inputs.forEach((input) => {
    input.addEventListener('input', updateStepByStepCalculation);
    input.addEventListener('change', updateStepByStepCalculation);
  });

  // Initial calculation render
  updateStepByStepCalculation();
}