import { $, clamp } from './utils.js';

export function initHelp() {
  const helpOverlay = $('#helpOverlay');
  const helpPopover = $('#helpPopover');
  const helpText = $('#helpText');
  const helpStep = $('#helpStep');
  const nextHelpButton = $('#nextHelpButton');

  const helpItems = [
    { target: '#releaseButton', title: 'Start the experiment', text: 'Release starts the oscillating or freefall motion. Manual mode is controlled directly by dragging the frame or slider.' },
    { target: '.preset-grid', title: 'Try a preset', text: 'Presets set a physically meaningful starting condition or change one controlled variable, ready for comparison.' },
    { target: '.mode-button-group', title: 'Select a mode', text: 'Oscillate is a gravity-driven pendulum; Freefall drops the magnet vertically through the coil; Manual follows your drag/slider.' },
    { target: '#magneticFieldToggle', title: 'Show the field', text: 'Toggle the magnetic field loops. Reverse magnet poles flips their direction and the meter polarity.' },
    { target: '#turnsControl', title: 'Change coil turns', text: 'More turns produce a proportionally larger induced EMF for the same changing flux.' },
    { target: '#strengthControl', title: 'Change field strength', text: 'The finite bar-magnet field model uses this remanent field strength in tesla.' }
  ];

  let helpIndex = 0;

  function placeHelp() {
    const target = $(helpItems[helpIndex].target);
    if (!target || !helpPopover) return;
    const rect = target.getBoundingClientRect();
    helpPopover.style.left = `${clamp(rect.left, 18, window.innerWidth - helpPopover.offsetWidth - 18)}px`;
    helpPopover.style.top = `${clamp(rect.bottom + 16, 18, window.innerHeight - helpPopover.offsetHeight - 18)}px`;
  }

  function showHelp() {
    const item = helpItems[helpIndex];
    const helpTitle = $('#helpTitle');
    if (helpTitle) helpTitle.textContent = item.title;
    if (helpText) helpText.textContent = item.text;
    if (helpStep) helpStep.textContent = `Guide ${helpIndex + 1} of ${helpItems.length}`;
    if (nextHelpButton) nextHelpButton.textContent = helpIndex === helpItems.length - 1 ? 'Finish' : 'Next';
    requestAnimationFrame(placeHelp);
  }

  function closeHelp() {
    if (!helpOverlay) return;
    helpOverlay.hidden = true;
    helpOverlay.setAttribute('aria-hidden', 'true');
  }

  if ($('#helpButton')) {
    $('#helpButton').addEventListener('click', () => {
      helpIndex = 0;
      if (helpOverlay) {
        helpOverlay.hidden = false;
        helpOverlay.setAttribute('aria-hidden', 'false');
      }
      showHelp();
    });
  }

  if (nextHelpButton) {
    nextHelpButton.addEventListener('click', () => {
      if (helpIndex === helpItems.length - 1) closeHelp();
      else { helpIndex += 1; showHelp(); }
    });
  }

  if ($('#closeHelpButton')) $('#closeHelpButton').addEventListener('click', closeHelp);
  if (helpOverlay) {
    helpOverlay.addEventListener('click', (event) => { if (event.target === helpOverlay) closeHelp(); });
  }
}