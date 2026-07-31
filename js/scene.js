import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { DeviceDetector } from './utils.js';
import { buildApparatus, setCoilTurns } from './apparatus.js';
import { createFieldLines, updateFieldLines, setFieldVisibility, updatePoles } from './fieldLines.js';
import { buildVoltmeter, drawMeter } from './voltmeter.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const SAFE_ANGLE = 25 * Math.PI / 180; // 0.4363 radians

export class InductionScene {
  constructor(host, onManualAngle) {
    this.host = host;
    this.onManualAngle = onManualAngle;
    this.clickables = [];
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.drag = null;
    this.isPointerDown = false;
    this.longPressTimer = null;
    this.isLongPress = false;
    this.currentTheta = 0;
    this.manualMode = false;

    // Ensure host element supports absolute positioning for info overlay
    if (getComputedStyle(this.host).position === 'static') {
      this.host.style.position = 'relative';
    }

    this.scene = new THREE.Scene();
    // Set background color to pure white
    this.scene.background = new THREE.Color(0xffffff);
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    this.camera.position.set(0, 2.5, 8.0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.domElement.style.touchAction = 'none';
    host.append(this.renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.addLights();

    const apparatus = buildApparatus(this.scene);
    this.coilGroup = apparatus.coilGroup;
    this.frameGroup = apparatus.frameGroup;
    this.pendulumMagnet = apparatus.pendulumMagnet;
    this.dropMagnet = apparatus.dropMagnet;
    this.currentArrows = apparatus.currentArrowsGroup;

    const voltmeter = buildVoltmeter(this.scene);
    this.meterGroup = voltmeter.meterGroup;
    this.meterContext = voltmeter.meterContext;
    this.meterTexture = voltmeter.meterTexture;
    this.screen = voltmeter.screen;
    this.analogButton = voltmeter.analogButton;
    this.digitalButton = voltmeter.digitalButton;
    this.powerButton = voltmeter.powerButton;
    this.powerBtnMat = voltmeter.powerBtnMat;
    this.analogActiveMat = voltmeter.analogActiveMat;
    this.analogInactiveMat = voltmeter.analogInactiveMat;
    this.digitalActiveMat = voltmeter.digitalActiveMat;
    this.digitalInactiveMat = voltmeter.digitalInactiveMat;
    this.clickables.push(...voltmeter.clickables);
    
    // Set initial mode explicitly to DIGITAL and sync button visuals
    this.displayMode = 'DIGITAL';
    this.meterOn = voltmeter.meterOn;

    if (this.analogButton && this.digitalButton) {
      this.analogButton.position.y = 0.345; // Unpressed
      this.digitalButton.position.y = 0.32;  // Pressed
      this.analogButton.material = this.analogButton.userData?.inactiveMat || this.analogInactiveMat;
      this.digitalButton.material = this.digitalButton.userData?.activeMat || this.digitalActiveMat;
    }

    // Set initial Power switch visual (Red when ON, Green when OFF)
    this.updatePowerButtonVisuals();

    // Add overlay info text with matching button colors
    this.addInfoOverlay();

    createFieldLines(this.pendulumMagnet);
    createFieldLines(this.dropMagnet);
    updatePoles(this.pendulumMagnet, this.dropMagnet, 1);

    setCoilTurns(this.coilGroup, 250);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 2.5, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 15;
    this.controls.maxPolarAngle = Math.PI * 0.78;
    this.controls.rotateSpeed = 0.4;
    this.controls.update();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.addInteraction();
    this.resize();
  }

  addLights() {
    const light1 = new THREE.DirectionalLight(0xffffff, 0.8);
    light1.position.set(1, 4, 6);
    this.scene.add(light1);
    const light2 = new THREE.DirectionalLight(0xffeedd, 0.5);
    light2.position.set(-2, 3, 5);
    this.scene.add(light2);
    const light3 = new THREE.DirectionalLight(0xccddff, 0.4);
    light3.position.set(-1, 1, -4);
    this.scene.add(light3);
  }

  // Helper method to create 3D text sprites
  createButtonLabel(text, colorStr = '#3b82f6') {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = 'rgba(20, 20, 20, 0.85)';
    if (ctx.roundRect) {
      ctx.roundRect(0, 0, 128, 48, 8);
    } else {
      ctx.fillRect(0, 0, 128, 48);
    }
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = colorStr;
    if (ctx.roundRect) {
      ctx.roundRect(1, 1, 126, 46, 8);
    } else {
      ctx.strokeRect(1, 1, 126, 46);
    }
    ctx.stroke();

    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = colorStr;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 24);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.22, 0.08, 1);
    return sprite;
  }

  // Info text box showing button locations with matching button colors
  addInfoOverlay() {
    const infoDiv = document.createElement('div');
    infoDiv.style.position = 'absolute';
    infoDiv.style.bottom = '12px';
    infoDiv.style.left = '12px';
    infoDiv.style.background = 'rgba(255, 255, 255, 0.02)';
    infoDiv.style.backdropFilter = 'blur(4px)';
    infoDiv.style.padding = '8px 12px';
    infoDiv.style.borderRadius = '8px';
    infoDiv.style.border = '1px solid #e2e8f0';
    infoDiv.style.boxShadow = '0 2px 8px rgba(249, 250, 250, 0.01)';
    infoDiv.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    infoDiv.style.fontSize = '9px';
    infoDiv.style.lineHeight = '1.5';
    infoDiv.style.pointerEvents = 'none';
    infoDiv.style.zIndex = '10';

    this.infoOverlay = infoDiv;
    this.updateInfoOverlayText();
    this.host.appendChild(infoDiv);
  }

  updateInfoOverlayText() {
    if (!this.infoOverlay) return;
    const powerColor = this.meterOn ? '#dc2626' : '#16a34a'; // Red when ON, Green when OFF
    const powerStateText = this.meterOn ? 'ON (Red)' : 'OFF (Green)';
    const modeColor = '#2563eb'; // Blue for mode buttons

    this.infoOverlay.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px; color: #1e293b;">Voltmeter Controls Guide</div>
      <div style="display: flex; align-items: center; margin-bottom: 3px;">
        <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color:${powerColor}; margin-right:6px;"></span>
        <span><strong style="color: ${powerColor};">Power Switch:</strong> Right side of voltmeter [${powerStateText}]</span>
      </div>
      <div style="display: flex; align-items: center;">
        <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color:${modeColor}; margin-right:6px;"></span>
        <span><strong style="color: ${modeColor};">Digital / Analog Buttons:</strong> Top panel of voltmeter</span>
      </div>
    `;
  }

  // Power Switch visuals (Red when ON, Green when OFF)
  updatePowerButtonVisuals() {
    if (!this.powerBtnMat) return;
    if (this.meterOn) {
      this.powerBtnMat.color.setHex(0xff0000); // RED when ON
      this.powerBtnMat.emissive.setHex(0xff0000);
      this.powerBtnMat.emissiveIntensity = 0.8;
      if (this.powerButton) this.powerButton.position.x = 0.59;
    } else {
      this.powerBtnMat.color.setHex(0x00cc00); // GREEN when OFF
      this.powerBtnMat.emissive.setHex(0x003300);
      this.powerBtnMat.emissiveIntensity = 0.3;
      if (this.powerButton) this.powerButton.position.x = 0.575;
    }
  }

  // ---- Drag cleanup helper ----
  resetDragState() {
    this.drag = null;
    this.isPointerDown = false;
    this.isLongPress = false;
    if (this.controls) this.controls.enabled = true;
  }

  // ---- Set angle programmatically (clamped) ----
  setAngle(rad) {
    this.currentTheta = clamp(rad, -SAFE_ANGLE, SAFE_ANGLE);
    if (this.frameGroup) {
      this.frameGroup.rotation.z = this.currentTheta;
    }
  }

  addInteraction() {
    const getPointer = (event) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      const clientX = event.touches ? event.touches[0].clientX : event.clientX;
      const clientY = event.touches ? event.touches[0].clientY : event.clientY;
      this.pointer.x = (clientX - rect.left) / rect.width * 2 - 1;
      this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      return rect;
    };

    const handlePointerDown = (event) => {
      const rect = getPointer(event);
      const clientX = event.touches ? event.touches[0].clientX : event.clientX;
      const clientY = event.touches ? event.touches[0].clientY : event.clientY;
      this.isPointerDown = true;
      this.isLongPress = false;
      if (this.longPressTimer) clearTimeout(this.longPressTimer);
      
      if (this.manualMode) {
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const hit = this.raycaster.intersectObjects([this.pendulumMagnet, this.frameGroup], true)[0];
        if (hit) {
          this.isLongPress = true;
          this.drag = { startX: clientX, theta: this.currentTheta, lastTheta: this.currentTheta, lastTime: performance.now() };
          this.controls.enabled = false;
        }
      }

      this.clickStart = { x: clientX, y: clientY };
      if (event.pointerId && this.renderer.domElement.setPointerCapture) {
        this.renderer.domElement.setPointerCapture(event.pointerId);
      }
    };

    const handlePointerMove = (event) => {
      if (!this.drag) return;
      const rect = this.renderer.domElement.getBoundingClientRect();
      const clientX = event.touches ? event.touches[0].clientX : event.clientX;
      const theta = clamp(this.drag.theta + (clientX - this.drag.startX) / rect.width * 0.9, -SAFE_ANGLE, SAFE_ANGLE);
      const now = performance.now();
      const omega = (theta - this.drag.lastTheta) / Math.max((now - this.drag.lastTime) / 1000, 0.016);
      this.drag.lastTheta = theta;
      this.drag.lastTime = now;
      this.currentTheta = theta;
      this.onManualAngle(theta, omega);
    };

    const handlePointerUp = (event) => {
      this.isPointerDown = false;
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
      if (this.drag) {
        this.onManualAngle(this.drag.lastTheta, 0);
        this.drag = null;
        if (this.controls) this.controls.enabled = true;
        this.isLongPress = false;
        return;
      }
      if (!this.clickStart) {
        this.resetDragState();
        return;
      }
      const clientX = event.changedTouches ? event.changedTouches[0].clientX : event.clientX;
      const clientY = event.changedTouches ? event.changedTouches[0].clientY : event.clientY;
      if (!this.isLongPress && Math.hypot(clientX - this.clickStart.x, clientY - this.clickStart.y) < 6) {
        getPointer(event);
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const hit = this.raycaster.intersectObjects(this.clickables, false)[0];
        if (!hit) {
          if (this.manualMode) {
            const hit2 = this.raycaster.intersectObjects([this.pendulumMagnet, this.frameGroup], true)[0];
            if (hit2) {
              this.drag = { startX: clientX, theta: this.currentTheta, lastTheta: this.currentTheta, lastTime: performance.now() };
              this.controls.enabled = false;
            }
          }
          this.clickStart = null;
          this.isLongPress = false;
          return;
        }
        const action = hit.object.userData.action;
        if (action === 'POWER') {
          this.meterOn = !this.meterOn;
          this.updatePowerButtonVisuals();
          this.updateInfoOverlayText();
        } else {
          this.displayMode = action;
          this.analogButton.position.y = action === 'ANALOG' ? 0.32 : 0.345;
          this.digitalButton.position.y = action === 'DIGITAL' ? 0.32 : 0.345;
          this.analogButton.material = action === 'ANALOG' ? this.analogButton.userData.activeMat : this.analogButton.userData.inactiveMat;
          this.digitalButton.material = action === 'DIGITAL' ? this.digitalButton.userData.activeMat : this.digitalButton.userData.inactiveMat;
        }
      }
      this.clickStart = null;
      this.isLongPress = false;
    };

    const domElement = this.renderer.domElement;
    domElement.addEventListener('pointerdown', handlePointerDown);
    domElement.addEventListener('pointermove', handlePointerMove);
    domElement.addEventListener('pointerup', handlePointerUp);
    domElement.addEventListener('pointercancel', handlePointerUp);
    domElement.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) e.preventDefault();
    }, { passive: false });
    domElement.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) e.preventDefault();
    }, { passive: false });
  }

  setCoilTurns(turns) {
    setCoilTurns(this.coilGroup, turns);
  }

  update(state) {
    const isFreefall = state.parameters.mode === 'freefall';
    this.manualMode = state.parameters.mode === 'manual';
    
    if (!this.drag && state.theta !== undefined) {
      let thetaRad = state.theta;
      if (Math.abs(thetaRad) > Math.PI) {
        thetaRad = thetaRad * Math.PI / 180;
      }
      this.currentTheta = thetaRad;
    }

    this.frameGroup.visible = !isFreefall;
    this.pendulumMagnet.visible = !isFreefall;
    this.dropMagnet.visible = isFreefall;
    this.coilGroup.rotation.z = isFreefall ? Math.PI / 2 : 0;
    
    this.frameGroup.rotation.z = clamp(this.currentTheta, -SAFE_ANGLE, SAFE_ANGLE);

    if (isFreefall) {
      const visualMetre = 7.18;
      this.dropMagnet.position.set(0, 1.60 - state.axialPosition * visualMetre, 0.7);
      this.dropMagnet.rotation.z = Math.PI / 2;
    }

    const polarity = state.parameters.polarity || 1;
    updatePoles(this.pendulumMagnet, this.dropMagnet, polarity);

    const rawStrength = state.parameters.strength !== undefined ? state.parameters.strength : 1.0;
    const normalizedStrength = clamp((rawStrength - 0.5) / (1.5 - 0.5), 0, 1) * 0.85 + 0.15;

    updateFieldLines(this.pendulumMagnet, normalizedStrength, polarity);
    updateFieldLines(this.dropMagnet, normalizedStrength, polarity);

    const showFields = state.showFields !== undefined ? state.showFields : true;
    setFieldVisibility(this.pendulumMagnet, this.dropMagnet, showFields);

    const currentVal = state.current !== undefined ? state.current : (state.emf || 0);
    const absCurrent = Math.abs(currentVal);
    const showCurrentUI = state.showCurrent !== undefined ? state.showCurrent : true;

    this.currentArrows.visible = showCurrentUI;
    const curve = this.coilGroup.userData.curve;

    if (showCurrentUI && curve) {
      const data = this.currentArrows.userData;
      const mesh = data.instancedMesh;
      const particleCount = data.particleCount;
      const progressArray = data.particleProgress;

      const sign = Math.sign(currentVal) || 1;
      mesh.material = sign >= 0 ? data.matForward : data.matReverse;

      const speed = absCurrent > 0.0001 ? Math.min(absCurrent * 750 + 0.12, 1.8) : 0;
      const delta = 0.016;

      const dummy = new THREE.Object3D();
      const wireSurfaceOffset = 0.013;

      for (let i = 0; i < particleCount; i++) {
        if (speed > 0) {
          progressArray[i] += sign * speed * delta;
          if (progressArray[i] > 1) progressArray[i] -= 1;
          if (progressArray[i] < 0) progressArray[i] += 1;
        }

        const progress = Math.max(0, Math.min(1, progressArray[i]));
        const pt = curve.getPointAt(progress);
        const tangent = curve.getTangentAt(progress);

        const rad = Math.hypot(pt.y, pt.z) || 1;
        dummy.position.set(
          pt.x,
          pt.y + (pt.y / rad) * wireSurfaceOffset,
          pt.z + (pt.z / rad) * wireSurfaceOffset
        );

        const lookTarget = dummy.position.clone().add(tangent);
        dummy.lookAt(lookTarget);
        
        if (sign < 0) {
          dummy.rotateY(Math.PI);
        }

        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }

      mesh.instanceMatrix.needsUpdate = true;
    }

    drawMeter(this.meterContext, this.meterTexture, this.displayMode, this.meterOn, this.meterOn ? state.emf : 0);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const width = this.host.clientWidth;
    const height = this.host.clientHeight;
    if (width === 0 || height === 0) return;
    const aspect = width / height;
    this.camera.aspect = aspect;
    const isMobile = DeviceDetector.isMobile;
    const baseFov = 30;
    if (aspect < 1) {
      this.camera.fov = Math.min(55, baseFov / aspect);
      this.camera.position.z = isMobile ? 12.0 : 10.0;
    } else {
      this.camera.fov = baseFov;
      this.camera.position.z = 10.0;
    }
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  setFieldVisibility(visible) {
    setFieldVisibility(this.pendulumMagnet, this.dropMagnet, visible);
  }
}