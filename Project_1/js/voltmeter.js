import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { addScrew } from './apparatus.js';

// Helper function to create text decal flat on top of button surface (for top buttons)
function createButtonTextLabel(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 256, 128);
  ctx.font = '900 42px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 6;
  ctx.fillText(text, 128, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const labelGeo = new THREE.PlaneGeometry(0.16, 0.08);
  const labelMat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false
  });

  const labelMesh = new THREE.Mesh(labelGeo, labelMat);
  labelMesh.rotation.x = -Math.PI / 2;
  labelMesh.position.set(0, 0.031, 0);
  return labelMesh;
}

// Helper function to create label on the front face of the power switch
function createPowerButtonLabel(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 256, 128);
  ctx.font = '900 40px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 6;
  ctx.fillText(text, 128, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const labelGeo = new THREE.PlaneGeometry(0.12, 0.06);
  const labelMat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false
  });

  const labelMesh = new THREE.Mesh(labelGeo, labelMat);
  labelMesh.position.set(0, 0, 0.013);
  return labelMesh;
}

// Helper function to create side panel label text ("POWER SWITCH")
function createSideTextLabel(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 256, 64);
  ctx.font = '900 26px sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillText(text, 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const labelGeo = new THREE.PlaneGeometry(0.18, 0.045);
  const labelMat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false
  });

  const labelMesh = new THREE.Mesh(labelGeo, labelMat);
  return labelMesh;
}

// ---- Position Constants for ON / OFF state depth ----
const POWER_ON_X = 0.568;  // Button pops OUT past the bezel face when ON
const POWER_OFF_X = 0.545; // Button sinks INSIDE the bezel socket when OFF

// ---- Build the voltmeter ----
export function buildVoltmeter(scene) {
  const meterGroup = new THREE.Group();
  meterGroup.position.set(0, 4.85, 0);
  scene.add(meterGroup);

  const meterCaseMat = new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.4, metalness: 0.1 });
  const meterCase = new THREE.Mesh(new RoundedBoxGeometry(1.1, 0.6, 0.7, 4, 0.04), meterCaseMat);
  meterCase.castShadow = true; 
  meterCase.receiveShadow = true;
  meterGroup.add(meterCase);
  addScrew(meterGroup, -0.4, -0.31, -0.2);
  addScrew(meterGroup, 0.4, -0.31, -0.2);

  const panelMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6, metalness: 0.2 });
  const panel = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.52, 0.02), panelMat);
  panel.position.set(0, 0, 0.35);
  meterGroup.add(panel);
  addScrew(meterGroup, -0.47, 0.22, 0.362, Math.PI/2, 0, 0);
  addScrew(meterGroup, 0.47, 0.22, 0.362, Math.PI/2, 0, 0);
  addScrew(meterGroup, -0.47, -0.22, 0.362, Math.PI/2, 0, 0);
  addScrew(meterGroup, 0.47, -0.22, 0.362, Math.PI/2, 0, 0);

  const topHousingMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.5, metalness: 0.5 });
  const topHousing = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.22), topHousingMat);
  topHousing.position.set(0, 0.315, 0);
  meterGroup.add(topHousing);

  // Materials for active / inactive modes
  const analogActiveMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3, metalness: 0.2, emissive: 0x1d4ed8, emissiveIntensity: 0.3 });
  const analogInactiveMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.4, metalness: 0.1 });
  const digitalActiveMat = analogActiveMat.clone();
  const digitalInactiveMat = analogInactiveMat.clone();

  // Initial display is DIGITAL
  const analogButton = new THREE.Mesh(new RoundedBoxGeometry(0.18, 0.06, 0.15, 2, 0.01), analogInactiveMat);
  analogButton.position.set(-0.11, 0.345, 0);
  analogButton.userData = { action: 'ANALOG', activeMat: analogActiveMat, inactiveMat: analogInactiveMat };
  analogButton.add(createButtonTextLabel('ANALOG'));
  meterGroup.add(analogButton);

  const digitalButton = new THREE.Mesh(new RoundedBoxGeometry(0.18, 0.06, 0.15, 2, 0.01), digitalActiveMat);
  digitalButton.position.set(0.11, 0.32, 0);
  digitalButton.userData = { action: 'DIGITAL', activeMat: digitalActiveMat, inactiveMat: digitalInactiveMat };
  digitalButton.add(createButtonTextLabel('DIGITAL'));
  meterGroup.add(digitalButton);

  addScrew(meterGroup, -0.32, 0.31, 0);
  addScrew(meterGroup, 0.32, 0.31, 0);

  // Canvas and texture for meter display
  const meterCanvas = document.createElement('canvas');
  meterCanvas.width = 1024;
  meterCanvas.height = 512;
  const meterContext = meterCanvas.getContext('2d');
  const meterTexture = new THREE.CanvasTexture(meterCanvas);
  meterTexture.minFilter = THREE.LinearFilter;
  meterTexture.magFilter = THREE.LinearFilter;

  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.44), new THREE.MeshBasicMaterial({ map: meterTexture }));
  screen.position.set(0, 0.03, 0.362);
  meterGroup.add(screen);

  // Terminals
  const terminalMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.2, metalness: 0.9 });
  const vmPostRed = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.08, 12), terminalMat);
  vmPostRed.rotation.z = Math.PI / 2; vmPostRed.position.set(-0.57, 0.08, 0.0); meterGroup.add(vmPostRed);
  const vmCapRed = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.04, 12), new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 }));
  vmCapRed.rotation.z = Math.PI / 2; vmCapRed.position.set(-0.61, 0.08, 0.0); meterGroup.add(vmCapRed);
  const vmPostBlack = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.08, 12), terminalMat);
  vmPostBlack.rotation.z = Math.PI / 2; vmPostBlack.position.set(-0.57, -0.08, 0.0); meterGroup.add(vmPostBlack);
  const vmCapBlack = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.04, 12), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 }));
  vmCapBlack.rotation.z = Math.PI / 2; vmCapBlack.position.set(-0.61, -0.08, 0.0); meterGroup.add(vmCapBlack);

  // ---- Power Switch Assembly ----
  
  // 1. Solid bezel frame that penetrates into the casing to eliminate ALL gaps completely
  const bezelMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6, metalness: 0.2 });
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.03), bezelMat);
  bezel.position.set(0.545, 0, 0.0);
  bezel.rotation.y = Math.PI / 2;
  meterGroup.add(bezel);

  // 2. Interactive Power Push Button
  const initialMeterOn = true;
  
  const powerBtnMat = new THREE.MeshStandardMaterial({ 
    color: initialMeterOn ? 0x16a34a : 0xdc2626, 
    roughness: 0.3, 
    metalness: 0.1 
  });

  const powerButton = new THREE.Mesh(new RoundedBoxGeometry(0.15, 0.09, 0.025, 2, 0.004), powerBtnMat);
  powerButton.userData = { action: 'POWER' };
  
  // Initial position: extended OUT when ON, pushed IN when OFF
  powerButton.position.set(initialMeterOn ? POWER_ON_X : POWER_OFF_X, 0.0, 0.0);
  powerButton.rotation.y = Math.PI / 2;

  // Front label on power button ("POWER")
  powerButton.add(createPowerButtonLabel('POWER'));
  meterGroup.add(powerButton);

  // "POWER SWITCH" text label on side casing above switch
  const powerLabel = createSideTextLabel('POWER SWITCH');
  powerLabel.position.set(0.552, 0.09, 0.0);
  powerLabel.rotation.y = Math.PI / 2;
  meterGroup.add(powerLabel);

  const clickables = [analogButton, digitalButton, powerButton];

  // Initial draw - DIGITAL display
  drawMeter(meterContext, meterTexture, 'DIGITAL', initialMeterOn, 0);

  return {
    meterGroup,
    meterContext,
    meterTexture,
    screen,
    analogButton,
    digitalButton,
    powerButton,
    powerBtnMat,
    analogActiveMat,
    analogInactiveMat,
    digitalActiveMat,
    digitalInactiveMat,
    clickables,
    displayMode: 'DIGITAL',
    meterOn: initialMeterOn
  };
}

// Helper function to update power state and push/pull button position
export function setPowerState(voltmeterState, isOn, voltage = 0) {
  voltmeterState.meterOn = isOn;
  
  // Move button: OUT over bezel when ON, IN inside bezel frame when OFF
  voltmeterState.powerButton.position.x = isOn ? POWER_ON_X : POWER_OFF_X;

  // Set material color: Green for ON, Red for OFF
  voltmeterState.powerBtnMat.color.setHex(isOn ? 0x16a34a : 0xdc2626);

  // Redraw meter display canvas
  drawMeter(
    voltmeterState.meterContext,
    voltmeterState.meterTexture,
    voltmeterState.displayMode,
    voltmeterState.meterOn,
    voltage
  );
}

// ---- Draw meter on canvas ----
export function drawMeter(ctx, texture, displayMode = 'DIGITAL', meterOn = true, voltage = 0) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, width, height);

  if (!meterOn) {
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, width - 12, height - 12);
    ctx.fillStyle = '#444444';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 180px Arial';
    ctx.fillText('OFF', width / 2, height / 2);
  } else if (displayMode === 'ANALOG') {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(16, 16, width - 32, height - 32);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 8;
    ctx.strokeRect(16, 16, width - 32, height - 32);
    const centerX = width / 2;
    const centerY = height + 120;
    const radius = 420;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI * 1.22, Math.PI * 1.78);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 10;
    ctx.stroke();
    const totalTicks = 10;
    for (let i = 0; i <= totalTicks; i++) {
      const tickPct = i / totalTicks;
      const angle = Math.PI * 1.22 + tickPct * (Math.PI * 0.56);
      const isMajor = i % 2 === 0;
      const innerR = isMajor ? radius - 45 : radius - 25;
      const outerR = radius - 5;
      const x1 = centerX + Math.cos(angle) * innerR;
      const y1 = centerY + Math.sin(angle) * innerR;
      const x2 = centerX + Math.cos(angle) * outerR;
      const y2 = centerY + Math.sin(angle) * outerR;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = isMajor ? 6 : 3;
      ctx.stroke();
      if (isMajor) {
        const val = Math.round(-15 + tickPct * 30);
        const textR = radius - 80;
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(val.toString(), centerX + Math.cos(angle) * textR, centerY + Math.sin(angle) * textR);
      }
    }
    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ANALOG VOLTS', centerX, 110);
    const clampedV = Math.max(-15, Math.min(15, voltage));
    const normalizedV = (clampedV + 15) / 30;
    const needleAngle = Math.PI * 1.22 + normalizedV * (Math.PI * 0.56);
    const needleR = radius - 20;
    const nx = centerX + Math.cos(needleAngle) * needleR;
    const ny = centerY + Math.sin(needleAngle) * needleR;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(nx, ny);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 35, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
  } else { // DIGITAL
    ctx.strokeStyle = '#a3e635';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, width - 12, height - 12);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(18, 18, width - 36, 70);
    ctx.fillStyle = '#a3e635';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('DC VOLTAGE', 40, 52);
    ctx.fillStyle = '#ccff00';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 230px Arial';
    ctx.fillText(`${voltage >= 0 ? '+' : ''}${voltage.toFixed(3)} V`, width / 2, height / 2 + 35);
  }
  texture.needsUpdate = true;
}