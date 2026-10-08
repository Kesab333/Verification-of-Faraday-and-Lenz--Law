import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const PX_PROV_F13 = "98bd";

// ---- Helper: add screw ----
export function addScrew(group, x, y, z, rotX = 0, rotY = 0, rotZ = 0) {
  const screwMat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.3, metalness: 0.9 });
  const recessMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
  const screwGroup = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 12), screwMat);
  shaft.position.y = -0.01;
  screwGroup.add(shaft);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.02, 12), screwMat);
  head.position.y = 0.01;
  screwGroup.add(head);
  const recess = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.022, 6), recessMat);
  recess.position.y = 0.01;
  screwGroup.add(recess);
  screwGroup.position.set(x, y, z);
  screwGroup.rotation.set(rotX, rotY, rotZ);
  group.add(screwGroup);
}

// ---- Build the entire apparatus ----
export function buildApparatus(scene) {
  const standGroup = new THREE.Group();
  scene.add(standGroup);

  const gunmetalMat = new THREE.MeshStandardMaterial({ color: 0x2a2d30, roughness: 0.5, metalness: 0.8 });
  const gunmetalLightMat = new THREE.MeshStandardMaterial({ color: 0x3a3f45, roughness: 0.5, metalness: 0.8 });
  const colMat = new THREE.MeshStandardMaterial({ color: 0x32363b, roughness: 0.4, metalness: 0.7 });
  const base = new THREE.Mesh(new RoundedBoxGeometry(3.2, 0.3, 2.0, 4, 0.05), gunmetalMat);
  base.position.set(0, 0.15, 0);
  base.castShadow = true; base.receiveShadow = true;
  standGroup.add(base);
  const lip = new THREE.Mesh(new RoundedBoxGeometry(3.0, 0.08, 1.8, 4, 0.03), gunmetalLightMat);
  lip.position.set(0, 0.34, 0);
  standGroup.add(lip);
  addScrew(standGroup, -1.3, 0.31, 0.7);
  addScrew(standGroup, 1.3, 0.31, 0.7);
  addScrew(standGroup, -1.3, 0.31, -0.7);
  addScrew(standGroup, 1.3, 0.31, -0.7);

  const column = new THREE.Mesh(new RoundedBoxGeometry(0.25, 4.2, 0.25, 2, 0.03), colMat);
  column.position.set(0, 2.25, 0);
  column.castShadow = true; column.receiveShadow = true;
  standGroup.add(column);
  addScrew(standGroup, 0, 0.36, 0.14, Math.PI/2, 0, 0);
  addScrew(standGroup, 0, 0.36, -0.14, Math.PI/2, 0, 0);

  const accentMat = new THREE.MeshStandardMaterial({ color: 0x1a1c1f, roughness: 0.5, metalness: 0.5 });
  for (let i = 0; i < 3; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.02, 0.27), accentMat);
    line.position.set(0, 0.6 + i * 1.2, 0);
    standGroup.add(line);
  }

  const beamMat = new THREE.MeshStandardMaterial({ color: 0x2a2d30, roughness: 0.5, metalness: 0.8 });
  const beam = new THREE.Mesh(new RoundedBoxGeometry(3.0, 0.28, 0.4, 4, 0.05), beamMat);
  beam.position.set(0, 4.4, 0);
  beam.castShadow = true; beam.receiveShadow = true;
  standGroup.add(beam);
  addScrew(standGroup, 0, 4.4, 0.22, Math.PI/2, 0, 0);
  addScrew(standGroup, 0, 4.4, -0.22, Math.PI/2, 0, 0);
  addScrew(standGroup, 0.14, 4.4, 0, 0, 0, -Math.PI/2);
  addScrew(standGroup, -0.14, 4.4, 0, 0, 0, Math.PI/2);

  const capMat = new THREE.MeshStandardMaterial({ color: 0x3a3f45, roughness: 0.5, metalness: 0.8 });
  for (let x of [-1.5, 1.5]) {
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.35), capMat);
    cap.position.set(x, 4.4, 0);
    standGroup.add(cap);
  }

  const coilGroup = new THREE.Group();
  coilGroup.position.set(0, 1.6, 0.7);
  standGroup.add(coilGroup);

  const solenoidMountMat = new THREE.MeshStandardMaterial({ color: 0x2a2d30, roughness: 0.5, metalness: 0.8 });
  const columnFrontFaceZ = 0.125;
  const forwardOffset = 0.25;
  const armLength = 0.65;
  const mountArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, armLength), solenoidMountMat);
  coilGroup.position.set(0, 1.6, columnFrontFaceZ + forwardOffset + (armLength / 2));
  mountArm.position.set(0, 0, -0.6);
  mountArm.castShadow = true;
  coilGroup.add(mountArm);
  addScrew(coilGroup, 0, 0.11, -0.89 * armLength / 2);

  const acrylicMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, transparent: true, opacity: 0.22,
    roughness: 0.1, metalness: 0.1, transmission: 0.92,
    thickness: 0.5, side: THREE.DoubleSide
  });
  const solenoidLength = 0.55;
  const spoolShellGeo = new THREE.CylinderGeometry(0.28, 0.28, solenoidLength, 32, 1, true);
  spoolShellGeo.rotateZ(Math.PI / 2);
  coilGroup.add(new THREE.Mesh(spoolShellGeo, acrylicMat));
  const innerCoreGeo = new THREE.CylinderGeometry(0.265, 0.265, solenoidLength, 32, 1, true);
  innerCoreGeo.rotateZ(Math.PI / 2);
  coilGroup.add(new THREE.Mesh(innerCoreGeo, acrylicMat));

  const flangeMat = new THREE.MeshStandardMaterial({ color: 0x1a1c1f, roughness: 0.4, metalness: 0.2 });
  for (let xPos of [-solenoidLength/2, solenoidLength/2]) {
    const ringShape = new THREE.Shape();
    ringShape.absarc(0, 0, 0.36, 0, Math.PI * 2, false);
    const holePath = new THREE.Path();
    holePath.absarc(0, 0, 0.27, 0, Math.PI * 2, true);
    ringShape.holes.push(holePath);
    const extrudeSettings = { depth: 0.04, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.005, bevelThickness: 0.005 };
    const flangeGeo = new THREE.ExtrudeGeometry(ringShape, extrudeSettings);
    flangeGeo.rotateY(Math.PI / 2);
    const flange = new THREE.Mesh(flangeGeo, flangeMat);
    flange.position.x = xPos - (xPos > 0 ? 0 : 0.04);
    flange.castShadow = true;
    coilGroup.add(flange);
  }

  const terminalMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.2, metalness: 0.9 });
  const plasticCapRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
  const plasticCapBlack = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });
  const coilHalfLength = (solenoidLength - 0.08) / 2;
  const terminalConfigs = [
    { x: -coilHalfLength, capMat: plasticCapRed },
    { x: coilHalfLength, capMat: plasticCapBlack }
  ];
  terminalConfigs.forEach(cfg => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 12), terminalMat);
    post.position.set(cfg.x, 0.36, 0);
    coilGroup.add(post);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.05, 12), cfg.capMat);
    cap.position.set(cfg.x, 0.43, 0);
    coilGroup.add(cap);
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.06, 8), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
    wire.position.set(cfg.x, 0.3, 0);
    coilGroup.add(wire);
  });

  // Create 3D Instanced Current Arrows along the coil helix with dynamic coloring
  const currentArrowsGroup = createCurrentArrows();
  coilGroup.add(currentArrowsGroup);

  // ---- Pivot and frame ----
  const PIVOT_Z = 0.7;
  const strutLength = PIVOT_Z - 0.15;
  const strut = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.25, strutLength, 2, 0.02), gunmetalMat);
  strut.position.set(0, 4.4, strutLength / 2);
  strut.castShadow = true;
  standGroup.add(strut);
  addScrew(standGroup, 0, 4.54, strutLength / 2, 0, 0, 0);

  const pivotGroup = new THREE.Group();
  pivotGroup.position.set(0, 4.4, PIVOT_Z);
  standGroup.add(pivotGroup);
  const hingeMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.9 });
  const hingeMatDark = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4, metalness: 0.8 });
  const backPlate = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.3, 0.05, 2, 0.01), hingeMat);
  backPlate.position.set(0, -0.05, -0.15);
  backPlate.castShadow = true;
  pivotGroup.add(backPlate);
  const frontPlate = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.3, 0.05, 2, 0.01), hingeMat);
  frontPlate.position.set(0, -0.05, 0.15);
  frontPlate.castShadow = true;
  pivotGroup.add(frontPlate);
  const bracketBase = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.05, 0.35, 2, 0.01), hingeMat);
  bracketBase.position.set(0, -0.175, 0);
  bracketBase.castShadow = true;
  pivotGroup.add(bracketBase);
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 12), hingeMatDark);
  axle.rotation.x = Math.PI / 2;
  pivotGroup.add(axle);
  const boltHeadFront = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 6), hingeMatDark);
  boltHeadFront.rotation.x = Math.PI / 2;
  boltHeadFront.position.set(0, 0, 0.22);
  pivotGroup.add(boltHeadFront);
  const boltHeadBack = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 6), hingeMatDark);
  boltHeadBack.rotation.x = Math.PI / 2;
  boltHeadBack.position.set(0, 0, -0.22);
  pivotGroup.add(boltHeadBack);

  const frameGroup = new THREE.Group();
  frameGroup.position.set(0, 4.4, columnFrontFaceZ + forwardOffset + (armLength / 2));
  scene.add(frameGroup);

  const collarMat = new THREE.MeshStandardMaterial({ color: 0x8a7a6a, roughness: 0.4, metalness: 0.6 });
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.26, 16), collarMat);
  collar.rotation.x = Math.PI / 2;
  frameGroup.add(collar);
  const crossbar = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.08, 0.1, 2, 0.02), collarMat);
  frameGroup.add(crossbar);
  addScrew(frameGroup, 0, 0.05, 0.06);

  const supportMatDark = new THREE.MeshStandardMaterial({ color: 0x8a7a6a, roughness: 0.4, metalness: 0.5 });
  const supports = [
    { start: new THREE.Vector3(-0.35, 0, 0), end: new THREE.Vector3(-1.7, -1.33, 0) },
    { start: new THREE.Vector3(0.35, 0, 0),  end: new THREE.Vector3(1.7, -1.33, 0) }
  ];
  supports.forEach(s => {
    const direction = new THREE.Vector3().subVectors(s.end, s.start);
    const length = direction.length();
    const cylinderGeo = new THREE.CylinderGeometry(0.06, 0.06, length, 8);
    const rod = new THREE.Mesh(cylinderGeo, supportMatDark);
    rod.castShadow = true;
    rod.position.copy(s.start).add(s.end).multiplyScalar(0.5);
    const orientation = new THREE.Matrix4();
    orientation.lookAt(s.start, s.end, new THREE.Vector3(0, 0, 1));
    rod.quaternion.setFromRotationMatrix(orientation);
    rod.rotateX(Math.PI / 2);
    frameGroup.add(rod);
  });

  const nodeMat = new THREE.MeshStandardMaterial({ color: 0xaa8b73, roughness: 0.3, metalness: 0.7 });
  for (let x of [-0.35, 0.35]) {
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), nodeMat);
    node.position.set(x, 0, 0);
    frameGroup.add(node);
  }

  const arcMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.35, metalness: 0.7, emissive: 0x221100, emissiveIntensity: 0.02 });
  const createArc = (points) => {
    const w = 0.08, h = 0.14, r = 0.02;
    const shape = new THREE.Shape();
    shape.moveTo(-w/2 + r, -h/2); shape.lineTo(w/2 - r, -h/2); shape.quadraticCurveTo(w/2, -h/2, w/2, -h/2 + r);
    shape.lineTo(w/2, h/2 - r); shape.quadraticCurveTo(w/2, h/2, w/2 - r, h/2); shape.lineTo(-w/2 + r, h/2);
    shape.quadraticCurveTo(-w/2, h/2, -w/2, h/2 - r); shape.lineTo(-w/2, -h/2 + r); shape.quadraticCurveTo(-w/2, -h/2, -w/2 + r, -h/2);
    const path = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0], p[1], 0)));
    const extrudeSettings = { steps: 64, extrudePath: path, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 4 };
    const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, extrudeSettings), arcMat);
    mesh.castShadow = true; mesh.receiveShadow = true;
    return mesh;
  };
  const leftArc = createArc(new THREE.EllipseCurve(-0.5, -1.4, 1.2, 1.4, -Math.PI, -Math.PI/2, false, 0).getPoints(32).map(p => [p.x, p.y]));
  frameGroup.add(leftArc);
  const rightArc = createArc(new THREE.EllipseCurve(0.5, -1.4, 1.2, 1.4, 0, -Math.PI/2, true, 0).getPoints(32).map(p => [p.x, p.y]));
  frameGroup.add(rightArc);

  const jointMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.3, metalness: 0.8 });
  [-1.7, 1.7].forEach(x => {
    const jointCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.04, 16), jointMat);
    jointCollar.position.set(x, -1.35, 0);
    jointCollar.rotation.z = Math.PI / 2;
    frameGroup.add(jointCollar);
  });
  const boltMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.4, metalness: 0.9 });
  [[-1.7, -1.374, 0], [1.7, -1.374, 0]].forEach(pos => {
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 6), boltMat);
    bolt.position.set(pos[0], pos[1], pos[2]);
    bolt.rotation.x = Math.PI / 2;
    frameGroup.add(bolt);
    const boltHead1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 6), boltMat);
    boltHead1.position.set(pos[0], pos[1], pos[2] + 0.035);
    frameGroup.add(boltHead1);
    const boltHead2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 6), boltMat);
    boltHead2.position.set(pos[0], pos[1], pos[2] - 0.035);
    frameGroup.add(boltHead2);
  });

  const pendulumMagnet = createMagnet();
  pendulumMagnet.position.set(0, -2.8, 0);
  frameGroup.add(pendulumMagnet);
  const dropMagnet = createMagnet();
  dropMagnet.visible = false;
  scene.add(dropMagnet);

  buildConnectionWires(scene);

  return {
    standGroup,
    coilGroup,
    frameGroup,
    pendulumMagnet,
    dropMagnet,
    currentArrowsGroup
  };
}

// ---- Set coil turns ----
export function setCoilTurns(coilGroup, turns, material = null) {
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  if (!material) material = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.85, emissive: 0x331a00, emissiveIntensity: 0.1 });
  
  if (coilGroup.userData.winding) {
    coilGroup.remove(coilGroup.userData.winding);
    coilGroup.userData.winding.geometry.dispose();
  }

  const visualTurns = clamp(Math.round(turns / 12), 8, 42);
  const pointsPerTurn = 16;
  const totalPoints = visualTurns * pointsPerTurn;
  const coilLength = 0.55 - 0.08;
  const coilRadius = 0.27;
  const points = [];
  
  for (let i = 0; i <= totalPoints; i++) {
    const t = i / totalPoints;
    const x = (t - 0.5) * coilLength;
    const theta = t * visualTurns * Math.PI * 2;
    points.push(new THREE.Vector3(x, Math.cos(theta) * coilRadius, Math.sin(theta) * coilRadius));
  }
  
  const curve = new THREE.CatmullRomCurve3(points);
  const winding = new THREE.Mesh(new THREE.TubeGeometry(curve, totalPoints, 0.011, 8, false), material);
  winding.castShadow = true;
  coilGroup.add(winding);
  
  coilGroup.userData.winding = winding;
  coilGroup.userData.coilMaterial = material;
  coilGroup.userData.curve = curve;
}

// ---- Create a magnet ----
export function createMagnet() {
  const group = new THREE.Group();
  const red = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3, metalness: 0.1, emissive: 0x330000, emissiveIntensity: 0.1 });
  const blue = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3, metalness: 0.1, emissive: 0x000033, emissiveIntensity: 0.1 });
  const endMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.7 });
  const magGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.5, 16);
  magGeo.rotateZ(Math.PI / 2);
  const leftHalf = new THREE.Mesh(magGeo, red);
  leftHalf.position.x = -0.25;
  group.add(leftHalf);
  const rightHalf = new THREE.Mesh(magGeo, blue);
  rightHalf.position.x = 0.25;
  group.add(rightHalf);
  for (let x of [-0.5, 0.5]) {
    const cap = new THREE.Mesh(new THREE.CircleGeometry(0.12, 16), endMat);
    cap.position.set(x, 0, 0);
    cap.rotation.y = Math.PI / 2;
    group.add(cap);
  }
  group.userData = { red, blue, left: leftHalf, right: rightHalf };
  return group;
}

// ---- Create 3D Instanced Current Arrows with color coding matching magnet poles (Red vs Blue) ----
// ---- Create 3D Instanced Current Arrows with color coding: Yellow for forward, Silver for backward ----
export function createCurrentArrows() {
  const group = new THREE.Group();
  const particleCount = 36;

  const arrowGeo = new THREE.ConeGeometry(0.012, 0.035, 6);
  arrowGeo.rotateX(Math.PI / 2);

  // Yellow for forward flow
  const matForward = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.2,
    metalness: 0.3,
    emissive: 0xca8a04,
    emissiveIntensity: 0.5
  });

  // Silver for backward flow
  const matReverse = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    roughness: 0.1,
    metalness: 0.9,
    emissive: 0x4b5563,
    emissiveIntensity: 0.3
  });

  const instancedMesh = new THREE.InstancedMesh(arrowGeo, matForward, particleCount);
  instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  instancedMesh.renderOrder = 999;
  group.add(instancedMesh);

  group.userData = {
    instancedMesh,
    matForward,
    matReverse,
    particleCount,
    particleProgress: Array.from({ length: particleCount }, (_, i) => i / particleCount)
  };

  return group;
}

// ---- Build connection wires ----
export function buildConnectionWires(scene) {
  const createRoutedWire = (startPoint, endPoint, colorHex) => {
    const midPoint1 = new THREE.Vector3(startPoint.x, startPoint.y - 0.05, startPoint.z - 0.45);
    const midPoint2 = new THREE.Vector3(-0.4, 3.8, -0.4);
    const midPoint3 = new THREE.Vector3(endPoint.x, 2.2, -0.2);
    const curve = new THREE.CatmullRomCurve3([startPoint, midPoint1, midPoint2, midPoint3, endPoint]);
    const wireMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.5 });
    return new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.012, 8, false), wireMat);
  };
  const redWire = createRoutedWire(new THREE.Vector3(-0.61, 4.93, 0.0), new THREE.Vector3(-0.235, 1.96, 0.7), 0xdc2626);
  scene.add(redWire);
  const blackWire = createRoutedWire(new THREE.Vector3(-0.61, 4.77, 0.0), new THREE.Vector3(0.235, 1.96, 0.7), 0x111111);
  scene.add(blackWire);
}
// Digital voltmeter

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