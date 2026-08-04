import { $ } from './utils.js';

export function initHelp() {
  const helpOverlay = $('#helpOverlay');
  const helpPopover = $('#helpPopover');
  const helpButton = $('#helpButton');
  const closeHelpButton = $('#closeHelpButton');
  const questionList = $('#faqQuestionList');
  const procedureContent = $('#faqProcedureContent');

  const procedureData = {
    voltmeter: {
      title: "How to Use the Voltmeter & Controls",
      subtitle: "Measuring induced Electromotive Force (EMF) and reading signal polarity",
      steps: [
        { 
          title: "Purpose of the Voltmeter", 
          desc: "The voltmeter measures the instantaneous <strong>induced Electromotive Force (EMF, $\\varepsilon$)</strong> generated across the coil when magnetic flux changes over time according to Faraday's Law." 
        },
        { 
          title: "Power Switch (Right Side)", 
          desc: "Click the toggle switch on the <strong>right side panel</strong> of the 3D Voltmeter to turn the device ON or OFF. Red indicates the meter is active; Green indicates it is powered off." 
        },
        { 
          title: "Display Mode Switch (Top Panel)", 
          desc: "Click the mode buttons located on the <strong>top panel</strong> of the voltmeter to toggle between <strong>Digital</strong> numeric readout and <strong>Analog</strong> needle deflection mode." 
        },
        { 
          title: "Understanding Signal Polarity (+ / −)", 
          desc: "<strong>Positive EMF (+)</strong> indicates current flowing in one direction as magnetic flux increases (e.g., magnet entering coil). <strong>Negative EMF (−)</strong> indicates current flowing in the opposite direction as flux decreases (e.g., magnet exiting coil), illustrating <strong>Lenz's Law</strong>." 
        }
      ],
      tip: "A stationary magnet produces 0 V regardless of field strength because induced voltage strictly requires a changing magnetic flux ($\\frac{d\\Phi}{dt} \\neq 0$)."
    },
    simulation: {
      title: "How the Simulation Section Works",
      subtitle: "Operating Modes and Step-by-Step Experimental Procedure",
      steps: [
        { 
          title: "Operating Modes", 
          desc: "• <strong>Oscillate Mode (Pendulum):</strong> Simulates a bar magnet swinging on a rigid pendulum frame through the coil under gravity and electromagnetic resistance.<br>• <strong>Manual Drag Mode:</strong> Enables interactive manual positioning of the magnet frame to observe real-time rate of magnetic flux change ($\\frac{d\\Phi}{dt}$) and instantaneous EMF ($\\varepsilon$)." 
        },
        { 
          title: "Phase A: Investigating Faraday's Law", 
          desc: "• <strong>Initial Setup:</strong> Set mode to Oscillate Mode.<br>• <strong>Coil Turns ($N$):</strong> Set initial angle $\\theta = 22^\\circ$. Compare peak voltage for $N = 100, 250,$ and $500$ to verify $\\varepsilon \\propto N$.<br>• <strong>Entrance Velocity ($\\frac{d\\Phi}{dt}$):</strong> With $N = 250$, test release angles $10^\\circ$, $20^\\circ$, and $30^\\circ$ to observe how higher velocity increases peak voltage." 
        },
        { 
          title: "Phase B: Verifying Lenz's Law & Direction", 
          desc: "• <strong>Polarity Inversion:</strong> Run oscillation with default polarity ($+1$) and observe $+/-$ deflection sequence. Click <strong>Reverse Poles</strong> ($-1$) to confirm the signal direction flips.<br>• <strong>Electromagnetic Damping:</strong> Adjust damping coefficient to observe mechanical energy converting into electrical heat dissipated across circuit resistance." 
        },
        { 
          title: "Phase C: Manual Rate-of-Flux Exploration", 
          desc: "• Switch to <strong>Manual Drag Mode</strong>. Drag the magnet through the coil slowly, then quickly; note how faster speed yields higher peak EMF.<br>• Hold the magnet stationary inside the coil to verify that $\\varepsilon = 0$ when there is no relative motion ($\\frac{d\\Phi}{dt} = 0$)." 
        }
      ],
      tip: "Maximum induced EMF occurs when the magnet passes directly through the coil center where velocity and rate of magnetic flux change are highest."
    },
    graph: {
      title: "How the Graph Section Works",
      subtitle: "Analyzing live Oscillograms and real-time parameter variations",
      steps: [
        { 
          title: "Real-Time 5.0s Trailing Window", 
          desc: "The graph renders continuous live oscillograms using a 5-second sliding time window, plotting instantaneous <strong>Induced EMF ($\\varepsilon$)</strong> and <strong>Displacement ($\\theta$)</strong> as the experiment runs." 
        },
        { 
          title: "Dynamic Control Tweaking (Oscillate Mode)", 
          desc: "You can adjust controls like <strong>Coil Turns ($N$)</strong>, <strong>Magnet Strength ($B$)</strong>, or <strong>Damping</strong> on the fly while the magnet is in motion. The graph instantly reflects these changes—increasing turns or field strength will immediately boost waveform amplitude, while raising damping accelerates peak decay." 
        },
        { 
          title: "Manual Drag Mode Graphing", 
          desc: "In Manual Drag Mode, the live graph responds directly to interactive hand dragging. Rapid drag movements generate steep voltage spikes ($\\pm \\varepsilon$), slow drags create low-amplitude waves, and holding the magnet stationary produces a flat line at zero voltage ($\\varepsilon = 0\\text{ V}$)." 
        },
        { 
          title: "Dual Oscillogram Tracking", 
          desc: "• <strong>Induced EMF vs Time ($\\varepsilon(t)$):</strong> Displays alternating voltage peaks and signal direction (+ / −) demonstrating Lenz's Law.<br>• <strong>Displacement vs Time ($\\theta(t)$):</strong> Tracks angular position in degrees over time." 
        }
      ],
      tip: "Peak EMF occurs when angular displacement crosses zero ($\\theta = 0^\\circ$), which corresponds to maximum velocity and maximum rate of magnetic flux change ($\\frac{d\\Phi}{dt}$)."
    },
    observation: {
      title: "How Observation Data is Collected & Logged",
      subtitle: "Automatic peak detection, data logging, and real-time graph plotting",
      steps: [
        { 
          title: "8 Primary Physical Parameters Tracked", 
          desc: "The simulation continuously updates these parameters during motion:<br>• <strong>Time ($t$):</strong> Simulation elapsed time in seconds.<br>• <strong>Displacement ($\\theta$ or $y$):</strong> Angular position in degrees ($^\\circ$) for pendulum oscillation, or meters ($\\text{m}$) for freefall.<br>• <strong>Speed ($\\omega$ or $v$):</strong> Angular velocity ($\\text{rad/s}$) or drop speed ($\\text{m/s}$).<br>• <strong>Induced EMF ($\\mathcal{E}$):</strong> Instantaneous voltage generated across the coil.<br>• <strong>Magnetic Flux ($\\Phi$):</strong> Instantaneous rate of magnetic flux through the coil ($\\text{mWb}$).<br>• <strong>Field Intensity ($B$):</strong> Surface magnetic field strength ($\\text{mT}$).<br>• <strong>Induced Current ($I$):</strong> Generated current ($\\text{mA}$) based on circuit resistance $R$.<br>• <strong>Heat Energy ($E$):</strong> Dissipated energy ($E = \\int I^2 R \\, dt$)." 
        },
        { 
          title: "Automatic Peak Detection & Data Logging", 
          desc: "Peak voltage events are automatically logged into the Observation Data Table:<br><br><strong>Oscillate Mode:</strong> Peaks are captured each time the magnet passes through the coil center where velocity and $\\frac{d\\Phi}{dt}$ reach maximum.<br><br><strong>Manual Drag Mode (processManualPeakDetection):</strong> Peak readings are recorded dynamically when:<br>• Instantaneous EMF magnitude reaches $\\ge 0.005\\text{ V}$.<br>• EMF drops below $40\\%$ of the active peak magnitude or drag direction reverses.<br>• A minimum time interval of $0.2\\text{ s}$ or polarity sign flip occurs to avoid noise." 
        },
        { 
          title: "Data Table Structure & Peak Badges", 
          desc: "The table logs 5 distinct columns per row:<br><br><strong>Peak | Time (t) | Position (θ) | Speed (ω) | Induced EMF (E)</strong><br><br>• <strong>[MAX]</strong> badge (#0d9488) tags the global maximum peak.<br>• <strong>[MIN]</strong> badge (#e11d48) tags the lowest/negative peak.<br><br>Example:<br>1 | 1.42 s | 0.0° | 2.45 rad/s | +0.412 V [MAX]<br>2 | 2.85 s | 0.0° | 2.10 rad/s | -0.380 V [MIN]" 
        },
        { 
          title: "Real-Time Oscillogram Graph Plotting", 
          desc: "The live graph uses a 5.0-second trailing window to render dual oscillograms:<br><br>• <strong>EMF vs. Time Curve ($\\mathcal{E}(t)$):</strong> Rendered in Teal (#168983), tracking voltage swings, direction (+ / −), and Lenz's Law polarity shifts.<br><br>• <strong>Displacement vs. Time Curve ($\\theta(t)$):</strong> Rendered in Orange (#b36d24), tracking angular position from $-25^\\circ$ to $+25^\\circ$.<br><br><strong>Live Adjustments (Oscillate Mode):</strong> Changing Coil Turns ($N$), Magnet Strength ($B$), or Damping immediately alters graph amplitude and decay rates.<br><br><strong>Interactive Drag (Manual Mode):</strong> Rapid drags generate steep voltage spikes; slow drags produce low-amplitude waves; holding magnet stationary produces flat $0\\text{ V}$ line." 
        }
      ],
      tip: "The [MAX] and [MIN] badges help identify the highest positive and negative EMF peaks, demonstrating the symmetrical nature of Lenz's Law—equal magnitude peaks occur in opposite directions."
    },
    results: {
      title: "How Results are Calculated",
      subtitle: "Real-time physics calculations and energy summary dashboard",
      steps: [
        { 
          title: "Instantaneous Readouts Display", 
          desc: "The Results panel displays 8 real-time parameters updated continuously during simulation:<br><br>• <strong>Angle ($\\theta$):</strong> Current angular position in degrees.<br>• <strong>Velocity ($\\omega$):</strong> Angular velocity in rad/s.<br>• <strong>Flux ($\\Phi$):</strong> Magnetic flux through the coil in mWb.<br>• <strong>EMF ($\\mathcal{E}$):</strong> Instantaneous induced voltage in volts.<br>• <strong>Field at coil ($B$):</strong> Magnetic field strength at coil position in mT.<br>• <strong>Induced current ($I$):</strong> Generated current in mA.<br>• <strong>Oscillations:</strong> Count of complete oscillations completed.<br>• <strong>Motion:</strong> Current state (Stationary, Moving, Turning Point)." 
        },
        { 
          title: "Energy Dissipation Tracking", 
          desc: "The heat readout shows <strong>Electrical energy dissipated</strong> in millijoules (mJ):<br><br>• Calculated using $E = \\int I^2 R \\, dt$ where $R$ is circuit resistance.<br>• The heat bar visually represents cumulative energy converted from mechanical to thermal.<br>• As energy dissipates, the mechanical amplitude decays over time (electromagnetic damping)." 
        },
        { 
          title: "Right Side Panel: Recorded Peaks", 
          desc: "The right side panel in the Results section displays:<br><br>• <strong>Recorded Peaks:</strong> Number of voltage peaks captured during the experiment.<br>• <strong>Total Energy Dissipated:</strong> Cumulative heat energy in mJ.<br>• <strong>Max Field:</strong> Peak magnetic field strength recorded at coil position ($B_{max}$ in mT).<br><br>These values update in real-time as the experiment runs." 
        },
        { 
          title: "Real-Time Updates & Conservation of Energy", 
          desc: "All Results panel values update continuously during simulation:<br><br>• As the magnet oscillates, mechanical energy is converted to electrical energy.<br>• Electrical energy is dissipated as heat through circuit resistance.<br>• The heat bar shows energy conversion in real-time.<br>• Damping causes amplitude to decay, demonstrating <strong>conservation of energy</strong>—mechanical energy decreases as heat energy increases." 
        }
      ],
      tip: "The energy dissipation bar demonstrates the principle of energy conservation—mechanical energy from the swinging magnet is converted to electrical energy and finally dissipated as heat in the circuit resistance."
    },
    calculation: {
      title: "How the Calculation Section Works",
      subtitle: "Interactive step-by-step verification of Faraday's Law with adjustable parameters",
      steps: [
        { 
          title: "Interactive Parameter Controls", 
          desc: "The Calculation section provides 5 adjustable input parameters that drive all physics calculations:<br><br>• <strong>Coil Turns ($N$):</strong> Number of turns in the coil (10-1000).<br>• <strong>Magnet Strength ($B$):</strong> Magnetic field strength in Tesla (0.1-2.0 T).<br>• <strong>Coil Area ($A$):</strong> Cross-sectional area of the coil in m² (adjustable via slider).<br>• <strong>Time Interval ($\\Delta t$):</strong> Time step for flux change calculation in seconds.<br>• <strong>Circuit Resistance ($R$):</strong> Total resistance of the circuit in ohms (Ω)." 
        },
        { 
          title: "Step-by-Step Calculation Process", 
          desc: "The system performs sequential calculations in this order:<br><br><strong>Step 1 - Magnetic Flux ($\\Phi$):</strong><br>$\\Phi = B \\times A \\times \\cos(\\theta)$<br>Where $\\theta$ is the angle between field and coil normal.<br><br><strong>Step 2 - Change in Flux ($\\Delta\\Phi$):</strong><br>$\\Delta\\Phi = \\Phi_{final} - \\Phi_{initial}$<br><br><strong>Step 3 - Induced EMF ($\\mathcal{E}$):</strong><br>$\\mathcal{E} = -N \\times \\frac{\\Delta\\Phi}{\\Delta t}$<br>(Faraday's Law of Electromagnetic Induction)<br><br><strong>Step 4 - Induced Current ($I$):</strong><br>$I = \\frac{\\mathcal{E}}{R}$<br>(Ohm's Law)<br><br><strong>Step 5 - Dissipated Energy ($E$):</strong><br>$E = I^2 \\times R \\times \\Delta t$<br>(Joule heating / $I^2R$ losses)" 
        },
        { 
          title: "Right Side Panel - Calculated Results Display", 
          desc: "The right side panel shows the computed results for the current parameter values:<br><br>• <strong>Magnetic Flux ($\\Phi$):</strong> Current flux value in milliWebers (mWb).<br>• <strong>Induced EMF ($\\mathcal{E}$):</strong> Calculated voltage in volts (V).<br>• <strong>Induced Current ($I$):</strong> Calculated current in milliamps (mA).<br>• <strong>Dissipated Energy ($E$):</strong> Energy dissipated as heat in millijoules (mJ).<br><br>Each value updates in real-time as you adjust any input parameter." 
        },
        { 
          title: "Visualizing the Relationships", 
          desc: "The Calculation section helps visualize key physics relationships:<br><br>• <strong>EMF ∝ N:</strong> Increasing turns linearly increases induced EMF.<br>• <strong>EMF ∝ B:</strong> Stronger magnets produce higher EMF.<br>• <strong>EMF ∝ A:</strong> Larger coil area captures more flux, increasing EMF.<br>• <strong>EMF ∝ 1/Δt:</strong> Faster flux change produces higher EMF.<br>• <strong>I ∝ 1/R:</strong> Lower resistance yields higher current.<br>• <strong>E ∝ I²R:</strong> Energy dissipation scales with current squared." 
        }
      ],
      tip: "Try varying one parameter at a time while keeping others constant to verify each relationship. For example, double the coil turns ($N$) and observe the EMF double—directly demonstrating Faraday's Law ($\\mathcal{E} \\propto N$)."
    }
  };

  function renderProcedure(key) {
    const data = procedureData[key];
    if (!data || !procedureContent) return;

    let stepsHtml = data.steps.map((step, idx) => `
      <div class="faq-step-card">
        <div class="step-badge">${idx + 1}</div>
        <div class="step-body">
          <h4 class="step-title">${step.title}</h4>
          <p class="step-desc">${step.desc}</p>
        </div>
      </div>
    `).join('');

    procedureContent.innerHTML = `
      <div class="faq-content-header">
        <h3>${data.title}</h3>
        <p class="faq-content-subtitle">${data.subtitle}</p>
      </div>
      <div class="faq-steps-list">
        ${stepsHtml}
      </div>
      <div class="faq-callout-tip">
        <strong>Pro Tip:</strong> ${data.tip}
      </div>
    `;

    if (window.katex) {
      procedureContent.querySelectorAll('.step-desc, .faq-callout-tip').forEach(el => {
        el.innerHTML = el.innerHTML.replace(/\$([^$]+)\$/g, (match, tex) => {
          try { return window.katex.renderToString(tex, { throwOnError: false }); } 
          catch (e) { return match; }
        });
      });
    }
  }

  if (questionList) {
    questionList.addEventListener('click', (e) => {
      const item = e.target.closest('.faq-q-item');
      if (!item) return;

      document.querySelectorAll('.faq-q-item').forEach(el => el.classList.remove('is-active'));
      item.classList.add('is-active');

      renderProcedure(item.getAttribute('data-question'));
    });
  }

  function openHelpModal() {
    if (!helpOverlay) return;

    if (helpPopover) {
      helpPopover.style.top = '';
      helpPopover.style.left = '';
      helpPopover.style.position = '';
    }

    helpOverlay.hidden = false;
    helpOverlay.setAttribute('aria-hidden', 'false');

    const activeItem = document.querySelector('.faq-q-item.is-active') || document.querySelector('.faq-q-item');
    if (activeItem) {
      activeItem.classList.add('is-active');
      renderProcedure(activeItem.getAttribute('data-question'));
    }
  }

  function closeHelpModal() {
    if (!helpOverlay) return;
    helpOverlay.hidden = true;
    helpOverlay.setAttribute('aria-hidden', 'true');
  }

  if (helpButton) helpButton.addEventListener('click', openHelpModal);
  if (closeHelpButton) closeHelpButton.addEventListener('click', closeHelpModal);
  if (helpOverlay) {
    helpOverlay.addEventListener('click', (event) => {
      if (event.target === helpOverlay) closeHelpModal();
    });
  }

  // Handle keyboard escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !helpOverlay.hidden) {
      closeHelpModal();
    }
  });
}