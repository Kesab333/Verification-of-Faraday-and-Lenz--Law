import * as THREE from 'three';

// ---- Create field lines for a magnet (attached as child) ----
export function createFieldLines(magnet) {
  if (magnet.userData.fieldLines) {
    magnet.remove(magnet.userData.fieldLines);
  }
  const group = new THREE.Group();
  const fieldData = {
    lines: [],
    arrows: [],
    materials: []
  };

  const lineConfigs = [
    { radius: 0.35, count: 8,  baseStrength: 0.05 },
    { radius: 0.55, count: 12, baseStrength: 0.25 },
    { radius: 0.80, count: 12, baseStrength: 0.50 },
    { radius: 1.05, count: 16, baseStrength: 0.75 }
  ];

  lineConfigs.forEach((config) => {
    for (let j = 0; j < config.count; j++) {
      const angle = (j / config.count) * Math.PI * 2;
      const points = [];
      const numPoints = 40;
      const lineMinStrength = config.baseStrength;
      for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const theta = t * Math.PI;
        const x = Math.cos(theta) * (0.25 + config.radius * 0.5);
        const h = Math.sin(theta) * config.radius;
        const y = h * Math.cos(angle);
        const z = h * Math.sin(angle);
        points.push(new THREE.Vector3(x, y, z));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x1a9cd7,
        transparent: true,
        opacity: 0.55
      });
      const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(numPoints));
      const line = new THREE.Line(geometry, lineMaterial);
      group.add(line);
      fieldData.materials.push(lineMaterial);
      fieldData.lines.push({ curve, line, minStrength: lineMinStrength });

      // arrows
      const arrowCount = 2;
      for (let a = 0; a < arrowCount; a++) {
        const progress = (a + 0.5) / arrowCount;
        const arrowGeo = new THREE.ConeGeometry(0.032, 0.08, 8);
        const arrowMat = new THREE.MeshBasicMaterial({
          color: 0x1a9cd7,
          transparent: true,
          opacity: 0.9
        });
        const arrow = new THREE.Mesh(arrowGeo, arrowMat);
        group.add(arrow);
        fieldData.arrows.push({
          mesh: arrow,
          curve,
          progress,
          speed: 0.2,
          minStrength: lineMinStrength
        });
      }
    }
  });

  magnet.userData.fieldLines = group;
  magnet.userData.fieldData = fieldData;
  magnet.add(group);
}

// ---- Update field lines based on strength and polarity ----
export function updateFieldLines(magnet, strength, polarity) {
  if (!magnet || !magnet.userData.fieldLines) return;
  const group = magnet.userData.fieldLines;
  const fieldData = magnet.userData.fieldData;
  if (!fieldData) return;

  let normStrength = Math.abs(strength);
  if (normStrength > 1.0) {
    normStrength = Math.min(Math.max((normStrength - 0.5) / (5.0 - 0.5), 0), 1) * 0.9 + 0.1;
  }
  const opacity = Math.min(normStrength * 0.6 + 0.4, 1.0);
  const color = polarity > 0 ? 0x1a9cd7 : 0xe6612e;
  const defaultConeDir = new THREE.Vector3(0, 1, 0);

  // lines
  if (fieldData.lines) {
    fieldData.lines.forEach((item) => {
      if (item.line) {
        const isVisible = normStrength >= item.minStrength;
        item.line.visible = isVisible;
        if (isVisible && item.line.material) {
          item.line.material.opacity = Math.min(opacity * 0.85, 1.0);
          item.line.material.color.setHex(color);
        }
      }
    });
  }

  // arrows
  if (fieldData.arrows && fieldData.arrows.length > 0) {
    const flowDirection = polarity > 0 ? 1 : -1;
    const baseSpeed = 0.4;
    const deltaT = 0.016;
    fieldData.arrows.forEach((item) => {
      if (!item || !item.curve) return;
      const isVisible = normStrength >= item.minStrength && normStrength > 0.02;
      item.mesh.visible = isVisible;
      if (!isVisible) return;
      item.progress = (item.progress + flowDirection * baseSpeed * item.speed * deltaT) % 1;
      if (item.progress < 0) item.progress += 1;
      try {
        const currentPoint = item.curve.getPointAt(item.progress);
        const tangent = item.curve.getTangentAt(item.progress);
        if (currentPoint && tangent) {
          item.mesh.position.copy(currentPoint);
          const lookDir = flowDirection > 0 ? tangent : tangent.clone().negate();
          if (lookDir.lengthSq() > 0.0001) {
            lookDir.normalize();
            item.mesh.quaternion.setFromUnitVectors(defaultConeDir, lookDir);
          }
          item.mesh.material.color.setHex(color);
          item.mesh.material.opacity = Math.min(opacity * 0.9, 1.0);
        }
      } catch (e) { /* ignore */ }
    });
  }
  group.visible = normStrength > 0.01;
}

// ---- Set field visibility for both magnets ----
export function setFieldVisibility(pendulumMagnet, dropMagnet, visible) {
  if (pendulumMagnet && pendulumMagnet.userData.fieldLines) {
    pendulumMagnet.userData.fieldLines.visible = visible;
  }
  if (dropMagnet && dropMagnet.userData.fieldLines) {
    dropMagnet.userData.fieldLines.visible = visible;
  }
}

// ---- Update magnet pole colors and field line colors (polarity) ----
export function updatePoles(pendulumMagnet, dropMagnet, polarity) {
  [pendulumMagnet, dropMagnet].forEach((magnet) => {
    if (!magnet) return;
    magnet.userData.left.material = polarity > 0 ? magnet.userData.red : magnet.userData.blue;
    magnet.userData.right.material = polarity > 0 ? magnet.userData.blue : magnet.userData.red;
    if (magnet.userData.fieldData) {
      const color = polarity > 0 ? 0x1a9cd7 : 0xe6612e;
      magnet.userData.fieldData.materials.forEach((mat) => {
        if (mat) {
          mat.color.setHex(color);
          mat.needsUpdate = true;
        }
      });
      magnet.userData.fieldData.arrows.forEach((item) => {
        if (item && item.mesh) {
          item.mesh.material.color.setHex(color);
        }
      });
    }
  });
}