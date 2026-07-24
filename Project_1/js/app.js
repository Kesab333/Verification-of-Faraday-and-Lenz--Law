import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { InductionModel } from './physics.js'; //[cite: 10]

const $ = (selector) => document.querySelector(selector);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const SAFE_ANGLE = 25 * Math.PI / 180; //[cite: 10]

class InductionScene {
  constructor(host, onManualAngle) {
    this.host = host; //[cite: 10]
    this.onManualAngle = onManualAngle; //[cite: 10]
    this.displayMode = 'ANALOG'; //[cite: 11]
    this.meterOn = true; //[cite: 11]
    this.clickables = []; //[cite: 10]
    this.raycaster = new THREE.Raycaster(); //[cite: 10]
    this.pointer = new THREE.Vector2(); //[cite: 10]
    this.drag = null; //[cite: 10]

    this.scene = new THREE.Scene(); //[cite: 10, 11]
    this.scene.background = new THREE.Color(0xf4f4f0); //[cite: 10, 11]
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100); //[cite: 10, 11]
    this.camera.position.set(0, 2.2, 18.0); //[cite: 11]
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); //[cite: 10]
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); //[cite: 10, 11]
    this.renderer.shadowMap.enabled = true; //[cite: 10, 11]
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; //[cite: 10, 11]
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; //[cite: 10, 11]
    this.renderer.toneMappingExposure = 1.0; //[cite: 11]
    host.append(this.renderer.domElement); //[cite: 10]

    const pmrem = new THREE.PMREMGenerator(this.renderer); //[cite: 10, 11]
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; //[cite: 10, 11]
    pmrem.dispose(); //[cite: 10, 11]
    
    this.addLights(); //[cite: 10]
    this.buildApparatus(); //[cite: 10]
    this.buildVoltmeter(); //[cite: 10]

    this.controls = new OrbitControls(this.camera, this.renderer.domElement); //[cite: 10, 11]
    this.controls.target.set(0, 2.2, 0); //[cite: 11]
    this.controls.enableDamping = true; //[cite: 10, 11]
    this.controls.dampingFactor = 0.05; //[cite: 11]
    this.controls.minDistance = 4; //[cite: 11]
    this.controls.maxDistance = 18; //[cite: 11]
    this.controls.maxPolarAngle = Math.PI * 0.78; //[cite: 10]
    this.controls.update(); //[cite: 10, 11]

    this.resizeObserver = new ResizeObserver(() => this.resize()); //[cite: 10]
    this.resizeObserver.observe(host); //[cite: 10]
    this.addInteraction(); //[cite: 10]
    this.resize(); //[cite: 10]
  }

  addLights() {
    const light1 = new THREE.DirectionalLight(0xffffff, 0.8); //[cite: 10, 11]
    light1.position.set(1, 4, 6); //[cite: 10, 11]
    this.scene.add(light1); //[cite: 10, 11]
    const light2 = new THREE.DirectionalLight(0xffeedd, 0.5); //[cite: 10, 11]
    light2.position.set(-2, 3, 5); //[cite: 10, 11]
    this.scene.add(light2); //[cite: 10, 11]
    const light3 = new THREE.DirectionalLight(0xccddff, 0.4); //[cite: 10, 11]
    light3.position.set(-1, 1, -4); //[cite: 10, 11]
    this.scene.add(light3); //[cite: 10, 11]
  }

  addScrew(group, x, y, z, rotX = 0, rotY = 0, rotZ = 0) {
    const screwMat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.3, metalness: 0.9 }); //[cite: 11]
    const recessMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 }); //[cite: 11]
    const screwGroup = new THREE.Group(); //[cite: 11]
    
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 12), screwMat); //[cite: 11]
    shaft.position.y = -0.01; //[cite: 11]
    screwGroup.add(shaft); //[cite: 11]
    
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.02, 12), screwMat); //[cite: 11]
    head.position.y = 0.01; //[cite: 11]
    screwGroup.add(head); //[cite: 11]
    
    const recess = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.022, 6), recessMat); //[cite: 11]
    recess.position.y = 0.01; //[cite: 11]
    screwGroup.add(recess); //[cite: 11]

    screwGroup.position.set(x, y, z); //[cite: 11]
    screwGroup.rotation.set(rotX, rotY, rotZ); //[cite: 11]
    group.add(screwGroup); //[cite: 11]
  }

  buildApparatus() {
    const standGroup = new THREE.Group(); //[cite: 11]
    this.scene.add(standGroup); //[cite: 11]

    const gunmetalMat = new THREE.MeshStandardMaterial({ color: 0x2a2d30, roughness: 0.5, metalness: 0.8 }); //[cite: 11]
    const gunmetalLightMat = new THREE.MeshStandardMaterial({ color: 0x3a3f45, roughness: 0.5, metalness: 0.8 }); //[cite: 11]
    const colMat = new THREE.MeshStandardMaterial({ color: 0x32363b, roughness: 0.4, metalness: 0.7 }); //[cite: 11]

    const base = new THREE.Mesh(new RoundedBoxGeometry(3.2, 0.3, 2.0, 4, 0.05), gunmetalMat); //[cite: 11]
    base.position.set(0, 0.15, 0); //[cite: 11]
    base.castShadow = true; base.receiveShadow = true; //[cite: 11]
    standGroup.add(base); //[cite: 11]

    const lip = new THREE.Mesh(new RoundedBoxGeometry(3.0, 0.08, 1.8, 4, 0.03), gunmetalLightMat); //[cite: 11]
    lip.position.set(0, 0.34, 0); //[cite: 11]
    standGroup.add(lip); //[cite: 11]

    this.addScrew(standGroup, -1.3, 0.31, 0.7); //[cite: 11]
    this.addScrew(standGroup, 1.3, 0.31, 0.7); //[cite: 11]
    this.addScrew(standGroup, -1.3, 0.31, -0.7); //[cite: 11]
    this.addScrew(standGroup, 1.3, 0.31, -0.7); //[cite: 11]

    const column = new THREE.Mesh(new RoundedBoxGeometry(0.25, 4.2, 0.25, 2, 0.03), colMat); //[cite: 11]
    column.position.set(0, 2.25, 0); //[cite: 11]
    column.castShadow = true; column.receiveShadow = true; //[cite: 11]
    standGroup.add(column); //[cite: 11]

    this.addScrew(standGroup, 0, 0.36, 0.14, Math.PI/2, 0, 0); //[cite: 11]
    this.addScrew(standGroup, 0, 0.36, -0.14, Math.PI/2, 0, 0); //[cite: 11]

    const accentMat = new THREE.MeshStandardMaterial({ color: 0x1a1c1f, roughness: 0.5, metalness: 0.5 }); //[cite: 11]
    for (let i = 0; i < 3; i++) { //[cite: 11]
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.02, 0.27), accentMat); //[cite: 11]
      line.position.set(0, 0.6 + i * 1.2, 0); //[cite: 11]
      standGroup.add(line); //[cite: 11]
    }

    const beamMat = new THREE.MeshStandardMaterial({ color: 0x2a2d30, roughness: 0.5, metalness: 0.8 }); //[cite: 11]
    const beam = new THREE.Mesh(new RoundedBoxGeometry(3.0, 0.28, 0.4, 4, 0.05), beamMat); //[cite: 11]
    beam.position.set(0, 4.4, 0); //[cite: 11]
    beam.castShadow = true; beam.receiveShadow = true; //[cite: 11]
    standGroup.add(beam); //[cite: 11]

    this.addScrew(standGroup, 0, 4.4, 0.22, Math.PI/2, 0, 0); //[cite: 11]
    this.addScrew(standGroup, 0, 4.4, -0.22, Math.PI/2, 0, 0); //[cite: 11]
    this.addScrew(standGroup, 0.14, 4.4, 0, 0, 0, -Math.PI/2); //[cite: 11]
    this.addScrew(standGroup, -0.14, 4.4, 0, 0, 0, Math.PI/2); //[cite: 11]

    const capMat = new THREE.MeshStandardMaterial({ color: 0x3a3f45, roughness: 0.5, metalness: 0.8 }); //[cite: 11]
    for (let x of [-1.5, 1.5]) { //[cite: 11]
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.35), capMat); //[cite: 11]
      cap.position.set(x, 4.4, 0); //[cite: 11]
      standGroup.add(cap); //[cite: 11]
    }

    this.coilGroup = new THREE.Group(); //[cite: 10, 11]
    this.coilGroup.position.set(0, 1.6, 0.7); //[cite: 11]
    standGroup.add(this.coilGroup); //[cite: 10, 11]

    const solenoidMountMat = new THREE.MeshStandardMaterial({ color: 0x2a2d30, roughness: 0.5, metalness: 0.8 }); //[cite: 11]
    const solenoidRadiusOuter = 0.28; //[cite: 11]
    const columnFrontFaceZ = 0.125; //[cite: 11]
    const solenoidBackEdgeZ = 0.7 - solenoidRadiusOuter; //[cite: 11]
    const armLength = solenoidBackEdgeZ - columnFrontFaceZ; //[cite: 11]
    
    const mountArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, armLength), solenoidMountMat); //[cite: 11]
    mountArm.position.set(0, 0, -solenoidRadiusOuter - (armLength / 2)); //[cite: 11]
    mountArm.castShadow = true; //[cite: 11]
    this.coilGroup.add(mountArm); //[cite: 11]

    this.addScrew(this.coilGroup, 0, 0.11, -solenoidRadiusOuter - (armLength / 2)); //[cite: 11]

    const acrylicMat = new THREE.MeshPhysicalMaterial({ //[cite: 11]
      color: 0xffffff, transparent: true, opacity: 0.22, //[cite: 11]
      roughness: 0.1, metalness: 0.1, transmission: 0.92, //[cite: 11]
      thickness: 0.5, side: THREE.DoubleSide //[cite: 11]
    });
    
    const solenoidLength = 0.55; //[cite: 11]
    const spoolShellGeo = new THREE.CylinderGeometry(0.28, 0.28, solenoidLength, 32, 1, true); //[cite: 11]
    spoolShellGeo.rotateZ(Math.PI / 2); //[cite: 11]
    this.coilGroup.add(new THREE.Mesh(spoolShellGeo, acrylicMat)); //[cite: 11]

    const innerCoreGeo = new THREE.CylinderGeometry(0.265, 0.265, solenoidLength, 32, 1, true); //[cite: 11]
    innerCoreGeo.rotateZ(Math.PI / 2); //[cite: 11]
    this.coilGroup.add(new THREE.Mesh(innerCoreGeo, acrylicMat)); //[cite: 11]

    const flangeMat = new THREE.MeshStandardMaterial({ color: 0x1a1c1f, roughness: 0.4, metalness: 0.2 }); //[cite: 11]
    for (let xPos of [-solenoidLength/2, solenoidLength/2]) { //[cite: 11]
      const ringShape = new THREE.Shape(); //[cite: 11]
      ringShape.absarc(0, 0, 0.36, 0, Math.PI * 2, false); //[cite: 11]
      const holePath = new THREE.Path(); //[cite: 11]
      holePath.absarc(0, 0, 0.27, 0, Math.PI * 2, true); //[cite: 11]
      ringShape.holes.push(holePath); //[cite: 11]

      const extrudeSettings = { depth: 0.04, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.005, bevelThickness: 0.005 }; //[cite: 11]
      const flangeGeo = new THREE.ExtrudeGeometry(ringShape, extrudeSettings); //[cite: 11]
      flangeGeo.rotateY(Math.PI / 2); //[cite: 11]
      const flange = new THREE.Mesh(flangeGeo, flangeMat); //[cite: 11]
      flange.position.x = xPos - (xPos > 0 ? 0 : 0.04); //[cite: 11]
      flange.castShadow = true; //[cite: 11]
      this.coilGroup.add(flange); //[cite: 11]
    }

    this.setCoilTurns(250); //[cite: 10]

    const terminalMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.2, metalness: 0.9 }); //[cite: 11]
    const plasticCapRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 }); //[cite: 11]
    const plasticCapBlack = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 }); //[cite: 11]
    const coilHalfLength = (solenoidLength - 0.08) / 2; //[cite: 11]

    const terminalConfigs = [ //[cite: 11]
      { x: -coilHalfLength, capMat: plasticCapRed }, //[cite: 11]
      { x: coilHalfLength, capMat: plasticCapBlack } //[cite: 11]
    ];

    terminalConfigs.forEach(cfg => { //[cite: 11]
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 12), terminalMat); //[cite: 11]
      post.position.set(cfg.x, 0.36, 0); //[cite: 11]
      this.coilGroup.add(post); //[cite: 11]

      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.05, 12), cfg.capMat); //[cite: 11]
      cap.position.set(cfg.x, 0.43, 0); //[cite: 11]
      this.coilGroup.add(cap); //[cite: 11]

      const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.06, 8), new THREE.MeshStandardMaterial({ color: 0xd97706 })); //[cite: 11]
      wire.position.set(cfg.x, 0.3, 0); //[cite: 11]
      this.coilGroup.add(wire); //[cite: 11]
    });

    this.createCurrentArrows(); //[cite: 10]

    const PIVOT_Z = 0.7; //[cite: 11]
    const strutLength = PIVOT_Z - 0.15; //[cite: 11]
    const strut = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.25, strutLength, 2, 0.02), gunmetalMat); //[cite: 11]
    strut.position.set(0, 4.4, strutLength / 2); //[cite: 11]
    strut.castShadow = true; //[cite: 11]
    standGroup.add(strut); //[cite: 11]
    this.addScrew(standGroup, 0, 4.54, strutLength / 2, 0, 0, 0); //[cite: 11]

    const pivotGroup = new THREE.Group(); //[cite: 11]
    pivotGroup.position.set(0, 4.4, PIVOT_Z); //[cite: 11]
    standGroup.add(pivotGroup); //[cite: 11]

    const hingeMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.9 }); //[cite: 11]
    const hingeMatDark = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4, metalness: 0.8 }); //[cite: 11]

    const backPlate = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.3, 0.05, 2, 0.01), hingeMat); //[cite: 11]
    backPlate.position.set(0, -0.05, -0.15); //[cite: 11]
    backPlate.castShadow = true; //[cite: 11]
    pivotGroup.add(backPlate); //[cite: 11]
    
    const frontPlate = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.3, 0.05, 2, 0.01), hingeMat); //[cite: 11]
    frontPlate.position.set(0, -0.05, 0.15); //[cite: 11]
    frontPlate.castShadow = true; //[cite: 11]
    pivotGroup.add(frontPlate); //[cite: 11]

    const bracketBase = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.05, 0.35, 2, 0.01), hingeMat); //[cite: 11]
    bracketBase.position.set(0, -0.175, 0); //[cite: 11]
    bracketBase.castShadow = true; //[cite: 11]
    pivotGroup.add(bracketBase); //[cite: 11]

    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 12), hingeMatDark); //[cite: 11]
    axle.rotation.x = Math.PI / 2; //[cite: 11]
    pivotGroup.add(axle); //[cite: 11]

    const boltHeadFront = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 6), hingeMatDark); //[cite: 11]
    boltHeadFront.rotation.x = Math.PI / 2; //[cite: 11]
    boltHeadFront.position.set(0, 0, 0.22); //[cite: 11]
    pivotGroup.add(boltHeadFront); //[cite: 11]

    const boltHeadBack = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 6), hingeMatDark); //[cite: 11]
    boltHeadBack.rotation.x = Math.PI / 2; //[cite: 11]
    boltHeadBack.position.set(0, 0, -0.22); //[cite: 11]
    pivotGroup.add(boltHeadBack); //[cite: 11]

    this.frameGroup = new THREE.Group(); //[cite: 10, 11]
    this.frameGroup.position.set(0, 4.4, PIVOT_Z); //[cite: 11]
    this.scene.add(this.frameGroup); //[cite: 10, 11]

    const collarMat = new THREE.MeshStandardMaterial({ color: 0x8a7a6a, roughness: 0.4, metalness: 0.6 }); //[cite: 11]
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.26, 16), collarMat); //[cite: 11]
    collar.rotation.x = Math.PI / 2; //[cite: 11]
    this.frameGroup.add(collar); //[cite: 11]

    const crossbar = new THREE.Mesh(new RoundedBoxGeometry(0.6, 0.08, 0.1, 2, 0.02), collarMat); //[cite: 11]
    this.frameGroup.add(crossbar); //[cite: 11]
    this.addScrew(this.frameGroup, 0, 0.05, 0.06); //[cite: 11]

    const supportMatDark = new THREE.MeshStandardMaterial({ color: 0x8a7a6a, roughness: 0.4, metalness: 0.5 }); //[cite: 11]
    const leftSupport = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.861, 8), supportMatDark); //[cite: 11]
    leftSupport.position.set(-0.725, -0.8, 0); //[cite: 11]
    leftSupport.rotation.z = -0.536; //[cite: 11]
    leftSupport.castShadow = true; //[cite: 11]
    this.frameGroup.add(leftSupport); //[cite: 11]

    const rightSupport = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.861, 8), supportMatDark); //[cite: 11]
    rightSupport.position.set(0.725, -0.8, 0); //[cite: 11]
    rightSupport.rotation.z = 0.536; //[cite: 11]
    rightSupport.castShadow = true; //[cite: 11]
    this.frameGroup.add(rightSupport); //[cite: 11]

    const nodeMat = new THREE.MeshStandardMaterial({ color: 0xaa8b73, roughness: 0.3, metalness: 0.7 }); //[cite: 11]
    for (let x of [-0.25, 0.25]) { //[cite: 11]
      const node = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), nodeMat); //[cite: 11]
      node.position.set(x, 0, 0); //[cite: 11]
      this.frameGroup.add(node); //[cite: 11]
    }

    const arcMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.35, metalness: 0.7, emissive: 0x221100, emissiveIntensity: 0.02 }); //[cite: 11]
    const createArc = (points) => { //[cite: 11]
      const w = 0.08, h = 0.14, r = 0.02; //[cite: 11]
      const shape = new THREE.Shape(); //[cite: 11]
      shape.moveTo(-w/2 + r, -h/2); shape.lineTo(w/2 - r, -h/2); shape.quadraticCurveTo(w/2, -h/2, w/2, -h/2 + r); //[cite: 11]
      shape.lineTo(w/2, h/2 - r); shape.quadraticCurveTo(w/2, h/2, w/2 - r, h/2); shape.lineTo(-w/2 + r, h/2); //[cite: 11]
      shape.quadraticCurveTo(-w/2, h/2, -w/2, h/2 - r); shape.lineTo(-w/2, -h/2 + r); shape.quadraticCurveTo(-w/2, -h/2, -w/2 + r, -h/2); //[cite: 11]
      const path = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0], p[1], 0))); //[cite: 11]
      const extrudeSettings = { steps: 64, extrudePath: path, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 4 }; //[cite: 11]
      const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, extrudeSettings), arcMat); //[cite: 11]
      mesh.castShadow = true; mesh.receiveShadow = true; //[cite: 11]
      return mesh; //[cite: 11]
    };

    const leftArc = createArc(new THREE.EllipseCurve(-0.4, -1.6, 0.8, 1.2, -Math.PI, -Math.PI/2, false, 0).getPoints(32).map(p => [p.x, p.y])); //[cite: 11]
    this.frameGroup.add(leftArc); //[cite: 11]
    const rightArc = createArc(new THREE.EllipseCurve(0.4, -1.6, 0.8, 1.2, 0, -Math.PI/2, true, 0).getPoints(32).map(p => [p.x, p.y])); //[cite: 11]
    this.frameGroup.add(rightArc); //[cite: 11]

    const boltMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.4, metalness: 0.9 }); //[cite: 11]
    [[-1.2, -1.6, 0], [1.2, -1.6, 0]].forEach(pos => { //[cite: 11]
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 6), boltMat); //[cite: 11]
      bolt.position.set(pos[0], pos[1], pos[2]); //[cite: 11]
      bolt.rotation.x = Math.PI / 2; //[cite: 11]
      this.frameGroup.add(bolt); //[cite: 11]

      const boltHead1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 6), boltMat); //[cite: 11]
      boltHead1.position.set(pos[0], pos[1], pos[2] + 0.035); //[cite: 11]
      this.frameGroup.add(boltHead1); //[cite: 11]

      const boltHead2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 6), boltMat); //[cite: 11]
      boltHead2.position.set(pos[0], pos[1], pos[2] - 0.035); //[cite: 11]
      this.frameGroup.add(boltHead2); //[cite: 11]
    });

    this.pendulumMagnet = this.createMagnet(); //[cite: 10]
    this.pendulumMagnet.position.set(0, -2.8, 0); //[cite: 10, 11]
    this.frameGroup.add(this.pendulumMagnet); //[cite: 10, 11]
    
    this.dropMagnet = this.createMagnet(); //[cite: 10]
    this.dropMagnet.visible = false; //[cite: 10]
    this.scene.add(this.dropMagnet); //[cite: 10]

    this.createFieldLines(this.pendulumMagnet); //[cite: 10]
    this.createFieldLines(this.dropMagnet); //[cite: 10]
    this.updatePoles(1); //[cite: 10]
    this.buildConnectionWires(); //[cite: 10]
  }

  buildConnectionWires() {
    const createRoutedWire = (startPoint, endPoint, colorHex) => { //[cite: 11]
      const midPoint1 = new THREE.Vector3(startPoint.x, startPoint.y - 0.05, startPoint.z - 0.45); //[cite: 11]
      const midPoint2 = new THREE.Vector3(-0.4, 3.8, -0.4); //[cite: 11]
      const midPoint3 = new THREE.Vector3(endPoint.x, 2.2, -0.2); //[cite: 11]
      const curve = new THREE.CatmullRomCurve3([startPoint, midPoint1, midPoint2, midPoint3, endPoint]); //[cite: 11]
      const wireMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.5 }); //[cite: 11]
      return new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.012, 8, false), wireMat); //[cite: 11]
    };
    const redWire = createRoutedWire(new THREE.Vector3(-0.61, 4.93, 0.0), new THREE.Vector3(-0.235, 1.96, 0.7), 0xdc2626); //[cite: 11]
    this.scene.add(redWire); //[cite: 11]
    const blackWire = createRoutedWire(new THREE.Vector3(-0.61, 4.77, 0.0), new THREE.Vector3(0.235, 1.96, 0.7), 0x111111); //[cite: 11]
    this.scene.add(blackWire); //[cite: 11]
  }

  setCoilTurns(turns, material = null) {
    if (!material) material = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.85, emissive: 0x331a00, emissiveIntensity: 0.1 }); //[cite: 11]
    this.coilMaterial = material; //[cite: 10, 11]
    if (this.winding) { //[cite: 10]
      this.coilGroup.remove(this.winding); //[cite: 10]
      this.winding.geometry.dispose(); //[cite: 10]
    }
    const visualTurns = clamp(Math.round(turns / 12), 8, 42); //[cite: 10]
    const pointsPerTurn = 16; //[cite: 11]
    const totalPoints = visualTurns * pointsPerTurn; //[cite: 11]
    const coilLength = 0.55 - 0.08; //[cite: 11]
    const coilRadius = 0.27; //[cite: 11]
    const points = []; //[cite: 11]

    for (let i = 0; i <= totalPoints; i++) { //[cite: 11]
      const t = i / totalPoints; //[cite: 11]
      const x = (t - 0.5) * coilLength; //[cite: 11]
      const theta = t * visualTurns * Math.PI * 2; //[cite: 11]
      points.push(new THREE.Vector3(x, Math.cos(theta) * coilRadius, Math.sin(theta) * coilRadius)); //[cite: 11]
    }
    const curve = new THREE.CatmullRomCurve3(points); //[cite: 11]
    this.winding = new THREE.Mesh(new THREE.TubeGeometry(curve, totalPoints, 0.011, 8, false), material); //[cite: 11]
    this.winding.castShadow = true; //[cite: 11]
    this.coilGroup.add(this.winding); //[cite: 11]
  }

  createMagnet() {
    const group = new THREE.Group(); //[cite: 10, 11]
    const red = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3, metalness: 0.1, emissive: 0x330000, emissiveIntensity: 0.1 }); //[cite: 11]
    const blue = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3, metalness: 0.1, emissive: 0x000033, emissiveIntensity: 0.1 }); //[cite: 11]
    const endMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.7 }); //[cite: 11]
    
    const magGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.4, 16); //[cite: 11]
    magGeo.rotateZ(Math.PI / 2); //[cite: 11]

    const leftHalf = new THREE.Mesh(magGeo, red); //[cite: 11]
    leftHalf.position.x = -0.2; //[cite: 11]
    group.add(leftHalf); //[cite: 11]

    const rightHalf = new THREE.Mesh(magGeo, blue); //[cite: 11]
    rightHalf.position.x = 0.2; //[cite: 11]
    group.add(rightHalf); //[cite: 11]

    const divRing = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 8, 16), new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.5 })); //[cite: 11]
    divRing.rotation.y = Math.PI / 2; //[cite: 11]
    group.add(divRing); //[cite: 11]

    for (let x of [-0.4, 0.4]) { //[cite: 11]
      const cap = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), endMat); //[cite: 11]
      cap.position.set(x, 0, 0); //[cite: 11]
      cap.rotation.y = Math.PI / 2; //[cite: 11]
      group.add(cap); //[cite: 11]
    }

    group.userData = { red, blue, left: leftHalf, right: rightHalf }; //[cite: 10]
    return group; //[cite: 10, 11]
  }

  createFieldLines(magnet) {
    const group = new THREE.Group(); //[cite: 10]
    const material = new THREE.LineBasicMaterial({ color: 0x1a9cd7, transparent: true, opacity: 0.58 }); //[cite: 10]
    for (const radius of [0.22, 0.31, 0.40]) { //[cite: 10]
      const points = []; //[cite: 10]
      for (let i = 0; i <= 64; i += 1) { //[cite: 10]
        const t = i / 64 * Math.PI * 2; //[cite: 10]
        points.push(new THREE.Vector3(0.52 * Math.sin(t), radius * Math.cos(t), 0)); //[cite: 10]
      }
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material)); //[cite: 10]
    }
    group.position.z = -0.02; //[cite: 10]
    magnet.add(group); //[cite: 10]
    magnet.userData.fieldLines = group; //[cite: 10]
  }

  createCurrentArrows() {
    this.currentArrows = new THREE.Group(); //[cite: 10]
    const arrowMat = 0x0c9e87; //[cite: 10]
    const positions = [new THREE.Vector3(-0.2, 0.3, 0), new THREE.Vector3(0, 0, 0.3), new THREE.Vector3(0.2, -0.3, 0)]; //[cite: 10, 11]
    const directions = [new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, -1)]; //[cite: 10]
    this.arrowHelpers = positions.map((position, index) => { //[cite: 10]
      const arrow = new THREE.ArrowHelper(directions[index], position, 0.18, arrowMat, 0.065, 0.04); //[cite: 10]
      this.currentArrows.add(arrow); //[cite: 10]
      return arrow; //[cite: 10]
    });
    this.coilGroup.add(this.currentArrows); //[cite: 10]
  }

  buildVoltmeter() {
    this.meterGroup = new THREE.Group(); //[cite: 10, 11]
    this.meterGroup.position.set(0, 4.85, 0); //[cite: 11]
    this.scene.add(this.meterGroup); //[cite: 10, 11]

    const meterCaseMat = new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.4, metalness: 0.1 }); //[cite: 11]
    const meterCase = new THREE.Mesh(new RoundedBoxGeometry(1.1, 0.6, 0.7, 4, 0.04), meterCaseMat); //[cite: 11]
    meterCase.castShadow = true; meterCase.receiveShadow = true; //[cite: 11]
    this.meterGroup.add(meterCase); //[cite: 11]

    this.addScrew(this.meterGroup, -0.4, -0.31, -0.2); //[cite: 11]
    this.addScrew(this.meterGroup, 0.4, -0.31, -0.2); //[cite: 11]

    const panelMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6, metalness: 0.2 }); //[cite: 11]
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.52, 0.02), panelMat); //[cite: 11]
    panel.position.set(0, 0, 0.35); //[cite: 11]
    this.meterGroup.add(panel); //[cite: 11]

    this.addScrew(this.meterGroup, -0.47, 0.22, 0.362, Math.PI/2, 0, 0); //[cite: 11]
    this.addScrew(this.meterGroup, 0.47, 0.22, 0.362, Math.PI/2, 0, 0); //[cite: 11]
    this.addScrew(this.meterGroup, -0.47, -0.22, 0.362, Math.PI/2, 0, 0); //[cite: 11]
    this.addScrew(this.meterGroup, 0.47, -0.22, 0.362, Math.PI/2, 0, 0); //[cite: 11]

    const topHousingMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.5, metalness: 0.5 }); //[cite: 11]
    const topHousing = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.22), topHousingMat); //[cite: 11]
    topHousing.position.set(0, 0.315, 0); //[cite: 11]
    this.meterGroup.add(topHousing); //[cite: 11]

    this.analogActiveMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3, metalness: 0.2, emissive: 0x1d4ed8, emissiveIntensity: 0.3 }); //[cite: 11]
    this.analogInactiveMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.4, metalness: 0.1 }); //[cite: 11]
    this.digitalActiveMat = this.analogActiveMat; //[cite: 10, 11]
    this.digitalInactiveMat = this.analogInactiveMat; //[cite: 10, 11]

    this.analogButton = new THREE.Mesh(new RoundedBoxGeometry(0.18, 0.06, 0.15, 2, 0.01), this.analogActiveMat); //[cite: 11]
    this.analogButton.position.set(-0.11, 0.32, 0); //[cite: 11]
    this.analogButton.userData = { action: 'ANALOG', activeMat: this.analogActiveMat, inactiveMat: this.analogInactiveMat }; //[cite: 10, 11]
    this.meterGroup.add(this.analogButton); //[cite: 11]

    this.digitalButton = new THREE.Mesh(new RoundedBoxGeometry(0.18, 0.06, 0.15, 2, 0.01), this.digitalInactiveMat); //[cite: 11]
    this.digitalButton.position.set(0.11, 0.345, 0); //[cite: 11]
    this.digitalButton.userData = { action: 'DIGITAL', activeMat: this.digitalActiveMat, inactiveMat: this.digitalInactiveMat }; //[cite: 10, 11]
    this.meterGroup.add(this.digitalButton); //[cite: 11]

    this.addScrew(this.meterGroup, -0.32, 0.31, 0); //[cite: 11]
    this.addScrew(this.meterGroup, 0.32, 0.31, 0); //[cite: 11]

    this.meterCanvas = document.createElement('canvas'); //[cite: 10, 11]
    this.meterCanvas.width = 1024; //[cite: 11]
    this.meterCanvas.height = 512; //[cite: 11]
    this.meterContext = this.meterCanvas.getContext('2d'); //[cite: 10, 11]
    this.meterTexture = new THREE.CanvasTexture(this.meterCanvas); //[cite: 10, 11]
    this.meterTexture.minFilter = THREE.LinearFilter; //[cite: 10, 11]
    this.meterTexture.magFilter = THREE.LinearFilter; //[cite: 11]

    this.screen = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.44), new THREE.MeshBasicMaterial({ map: this.meterTexture })); //[cite: 11]
    this.screen.position.set(0, 0.03, 0.362); //[cite: 11]
    this.meterGroup.add(this.screen); //[cite: 10, 11]

    const terminalMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.2, metalness: 0.9 }); //[cite: 11]
    
    const vmPostRed = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.08, 12), terminalMat); //[cite: 11]
    vmPostRed.rotation.z = Math.PI / 2; vmPostRed.position.set(-0.57, 0.08, 0.0); this.meterGroup.add(vmPostRed); //[cite: 11]
    const vmCapRed = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.04, 12), new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 })); //[cite: 11]
    vmCapRed.rotation.z = Math.PI / 2; vmCapRed.position.set(-0.61, 0.08, 0.0); this.meterGroup.add(vmCapRed); //[cite: 11]
    
    const vmPostBlack = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.08, 12), terminalMat); //[cite: 11]
    vmPostBlack.rotation.z = Math.PI / 2; vmPostBlack.position.set(-0.57, -0.08, 0.0); this.meterGroup.add(vmPostBlack); //[cite: 11]
    const vmCapBlack = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.04, 12), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 })); //[cite: 11]
    vmCapBlack.rotation.z = Math.PI / 2; vmCapBlack.position.set(-0.61, -0.08, 0.0); this.meterGroup.add(vmCapBlack); //[cite: 11]

    const buttonHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 16), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.8 })); //[cite: 11]
    buttonHousing.rotation.z = Math.PI / 2; buttonHousing.position.set(0.57, 0, 0.0); this.meterGroup.add(buttonHousing); //[cite: 11]

    this.powerBtnMat = new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.2, metalness: 0.1, emissive: 0xff0000, emissiveIntensity: 0.9 }); //[cite: 11]
    this.powerButton = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.035, 16), this.powerBtnMat); //[cite: 11]
    this.powerButton.rotation.z = Math.PI / 2; this.powerButton.position.set(0.59, 0, 0.0); //[cite: 11]
    this.powerButton.userData = { action: 'POWER' }; //[cite: 10]
    this.meterGroup.add(this.powerButton); //[cite: 10, 11]

    this.clickables.push(this.analogButton, this.digitalButton, this.powerButton); //[cite: 10]
    this.drawMeter(0); //[cite: 10]
  }

  drawMeter(voltage) {
    const lcdCtx = this.meterContext; //[cite: 10]
    const width = this.meterCanvas.width; //[cite: 10]
    const height = this.meterCanvas.height; //[cite: 10]
    lcdCtx.fillStyle = '#050505'; //[cite: 11]
    lcdCtx.fillRect(0, 0, width, height); //[cite: 11]

    if (!this.meterOn) { //[cite: 10, 11]
      lcdCtx.strokeStyle = '#222222'; //[cite: 11]
      lcdCtx.lineWidth = 12; //[cite: 11]
      lcdCtx.strokeRect(6, 6, width - 12, height - 12); //[cite: 11]

      lcdCtx.fillStyle = '#444444'; //[cite: 11]
      lcdCtx.textAlign = 'center'; //[cite: 11]
      lcdCtx.textBaseline = 'middle'; //[cite: 11]
      lcdCtx.font = 'bold 180px Arial'; //[cite: 11]
      lcdCtx.fillText('OFF', width / 2, height / 2); //[cite: 11]
    } else if (this.displayMode === 'ANALOG') { //[cite: 10, 11]
      lcdCtx.fillStyle = '#f8fafc'; //[cite: 11]
      lcdCtx.fillRect(16, 16, width - 32, height - 32); //[cite: 11]

      lcdCtx.strokeStyle = '#0f172a'; //[cite: 11]
      lcdCtx.lineWidth = 8; //[cite: 11]
      lcdCtx.strokeRect(16, 16, width - 32, height - 32); //[cite: 11]

      const centerX = width / 2; //[cite: 11]
      const centerY = height + 120; //[cite: 11]
      const radius = 420; //[cite: 11]

      lcdCtx.beginPath(); //[cite: 11]
      lcdCtx.arc(centerX, centerY, radius, Math.PI * 1.22, Math.PI * 1.78); //[cite: 11]
      lcdCtx.strokeStyle = '#334155'; //[cite: 11]
      lcdCtx.lineWidth = 10; //[cite: 11]
      lcdCtx.stroke(); //[cite: 11]

      const totalTicks = 10; //[cite: 11]
      for (let i = 0; i <= totalTicks; i++) { //[cite: 11]
        const tickPct = i / totalTicks; //[cite: 11]
        const angle = Math.PI * 1.22 + tickPct * (Math.PI * 0.56); //[cite: 11]
        const isMajor = i % 2 === 0; //[cite: 11]

        const innerR = isMajor ? radius - 45 : radius - 25; //[cite: 11]
        const outerR = radius - 5; //[cite: 11]

        const x1 = centerX + Math.cos(angle) * innerR; //[cite: 11]
        const y1 = centerY + Math.sin(angle) * innerR; //[cite: 11]
        const x2 = centerX + Math.cos(angle) * outerR; //[cite: 11]
        const y2 = centerY + Math.sin(angle) * outerR; //[cite: 11]

        lcdCtx.beginPath(); //[cite: 11]
        lcdCtx.moveTo(x1, y1); //[cite: 11]
        lcdCtx.lineTo(x2, y2); //[cite: 11]
        lcdCtx.strokeStyle = '#0f172a'; //[cite: 11]
        lcdCtx.lineWidth = isMajor ? 6 : 3; //[cite: 11]
        lcdCtx.stroke(); //[cite: 11]

        if (isMajor) { //[cite: 11]
          const val = Math.round(-15 + tickPct * 30); //[cite: 11]
          const textR = radius - 80; //[cite: 11]
          lcdCtx.fillStyle = '#0f172a'; //[cite: 11]
          lcdCtx.font = 'bold 36px Arial'; //[cite: 11]
          lcdCtx.textAlign = 'center'; //[cite: 11]
          lcdCtx.textBaseline = 'middle'; //[cite: 11]
          lcdCtx.fillText(val.toString(), centerX + Math.cos(angle) * textR, centerY + Math.sin(angle) * textR); //[cite: 11]
        }
      }

      lcdCtx.fillStyle = '#2563eb'; //[cite: 11]
      lcdCtx.font = 'bold 42px Arial'; //[cite: 11]
      lcdCtx.textAlign = 'center'; //[cite: 11]
      lcdCtx.fillText('ANALOG VOLTS', centerX, 110); //[cite: 11]

      const clampedV = Math.max(-15, Math.min(15, voltage)); //[cite: 11]
      const normalizedV = (clampedV + 15) / 30; //[cite: 11]
      const needleAngle = Math.PI * 1.22 + normalizedV * (Math.PI * 0.56); //[cite: 11]

      const needleR = radius - 20; //[cite: 11]
      const nx = centerX + Math.cos(needleAngle) * needleR; //[cite: 11]
      const ny = centerY + Math.sin(needleAngle) * needleR; //[cite: 11]

      lcdCtx.beginPath(); //[cite: 11]
      lcdCtx.moveTo(centerX, centerY); //[cite: 11]
      lcdCtx.lineTo(nx, ny); //[cite: 11]
      lcdCtx.strokeStyle = '#dc2626'; //[cite: 11]
      lcdCtx.lineWidth = 8; //[cite: 11]
      lcdCtx.lineCap = 'round'; //[cite: 11]
      lcdCtx.stroke(); //[cite: 11]

      lcdCtx.beginPath(); //[cite: 11]
      lcdCtx.arc(centerX, centerY, 35, 0, Math.PI * 2); //[cite: 11]
      lcdCtx.fillStyle = '#1e293b'; //[cite: 11]
      lcdCtx.fill(); //[cite: 11]

    } else { //[cite: 10, 11]
      lcdCtx.strokeStyle = '#a3e635'; //[cite: 11]
      lcdCtx.lineWidth = 12; //[cite: 11]
      lcdCtx.strokeRect(6, 6, width - 12, height - 12); //[cite: 11]

      lcdCtx.fillStyle = '#1e293b'; //[cite: 11]
      lcdCtx.fillRect(18, 18, width - 36, 70); //[cite: 11]

      lcdCtx.fillStyle = '#a3e635'; //[cite: 11]
      lcdCtx.font = 'bold 36px monospace'; //[cite: 11]
      lcdCtx.textAlign = 'left'; //[cite: 11]
      lcdCtx.textBaseline = 'middle'; //[cite: 11]
      lcdCtx.fillText('DC VOLTAGE', 40, 52); //[cite: 11]

      lcdCtx.fillStyle = '#ccff00'; //[cite: 11]
      lcdCtx.textAlign = 'center'; //[cite: 11]
      lcdCtx.textBaseline = 'middle'; //[cite: 11]
      lcdCtx.font = 'bold 230px Arial'; //[cite: 11]
      lcdCtx.fillText(`${voltage >= 0 ? '+' : ''}${voltage.toFixed(3)} V`, width / 2, height / 2 + 35); //[cite: 10, 11]
    }
    this.meterTexture.needsUpdate = true; //[cite: 10, 11]
  }

  addInteraction() {
    const getPointer = (event) => { //[cite: 10]
      const rect = this.renderer.domElement.getBoundingClientRect(); //[cite: 10]
      this.pointer.x = (event.clientX - rect.left) / rect.width * 2 - 1; //[cite: 10]
      this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1; //[cite: 10]
      return rect; //[cite: 10]
    };
    this.renderer.domElement.addEventListener('pointerdown', (event) => { //[cite: 10]
      getPointer(event); //[cite: 10]
      this.raycaster.setFromCamera(this.pointer, this.camera); //[cite: 10]
      const hit = this.raycaster.intersectObjects([this.pendulumMagnet, this.frameGroup], true)[0]; //[cite: 10]
      if (this.manualMode && hit) { //[cite: 10]
        this.drag = { startX: event.clientX, theta: this.currentTheta, lastTheta: this.currentTheta, lastTime: performance.now() }; //[cite: 10]
        this.controls.enabled = false; //[cite: 10]
        this.renderer.domElement.setPointerCapture(event.pointerId); //[cite: 10]
      } else {
        this.clickStart = { x: event.clientX, y: event.clientY }; //[cite: 10]
      }
    });
    this.renderer.domElement.addEventListener('pointermove', (event) => { //[cite: 10]
      if (!this.drag) return; //[cite: 10]
      const rect = this.renderer.domElement.getBoundingClientRect(); //[cite: 10]
      const theta = clamp(this.drag.theta + (event.clientX - this.drag.startX) / rect.width * 0.9, -SAFE_ANGLE, SAFE_ANGLE); //[cite: 10]
      const now = performance.now(); //[cite: 10]
      const omega = (theta - this.drag.lastTheta) / Math.max((now - this.drag.lastTime) / 1000, 0.016); //[cite: 10]
      this.drag.lastTheta = theta; //[cite: 10]
      this.drag.lastTime = now; //[cite: 10]
      this.onManualAngle(theta, omega); //[cite: 10]
    });
    const finish = (event) => { //[cite: 10]
      if (this.drag) { //[cite: 10]
        this.onManualAngle(this.drag.lastTheta, 0); //[cite: 10]
        this.drag = null; //[cite: 10]
        this.controls.enabled = true; //[cite: 10]
        return; //[cite: 10]
      }
      if (!this.clickStart || Math.hypot(event.clientX - this.clickStart.x, event.clientY - this.clickStart.y) > 6) return; //[cite: 10]
      getPointer(event); //[cite: 10]
      this.raycaster.setFromCamera(this.pointer, this.camera); //[cite: 10]
      const hit = this.raycaster.intersectObjects(this.clickables, false)[0]; //[cite: 10]
      if (!hit) return; //[cite: 10]
      const action = hit.object.userData.action; //[cite: 10]
      
      if (action === 'POWER') { //[cite: 10]
        this.meterOn = !this.meterOn; //[cite: 10]
        this.powerBtnMat.color.setHex(this.meterOn ? 0xff0000 : 0x550000); //[cite: 11]
        this.powerBtnMat.emissive.setHex(this.meterOn ? 0xff0000 : 0x000000); //[cite: 11]
        this.powerBtnMat.emissiveIntensity = this.meterOn ? 0.9 : 0.0; //[cite: 11]
        this.powerButton.position.x = this.meterOn ? 0.59 : 0.575; //[cite: 11]
      } else { //[cite: 10]
        this.displayMode = action; //[cite: 10]
        this.analogButton.position.y = action === 'ANALOG' ? 0.32 : 0.345; //[cite: 11]
        this.digitalButton.position.y = action === 'DIGITAL' ? 0.32 : 0.345; //[cite: 11]
        this.analogButton.material = action === 'ANALOG' ? this.analogButton.userData.activeMat : this.analogButton.userData.inactiveMat; //[cite: 10, 11]
        this.digitalButton.material = action === 'DIGITAL' ? this.digitalButton.userData.activeMat : this.digitalButton.userData.inactiveMat; //[cite: 10, 11]
      }
    };
    this.renderer.domElement.addEventListener('pointerup', finish); //[cite: 10]
    this.renderer.domElement.addEventListener('pointercancel', finish); //[cite: 10]
  }

  update(state) {
    const isFreefall = state.parameters.mode === 'freefall'; //[cite: 10]
    this.manualMode = state.parameters.mode === 'manual'; //[cite: 10]
    this.currentTheta = state.theta; //[cite: 10]
    
    this.frameGroup.visible = !isFreefall; //[cite: 10]
    this.pendulumMagnet.visible = !isFreefall; //[cite: 10]
    this.dropMagnet.visible = isFreefall; //[cite: 10]
    this.coilGroup.rotation.z = isFreefall ? Math.PI / 2 : 0; //[cite: 10]
    this.frameGroup.rotation.z = clamp(state.theta, -SAFE_ANGLE, SAFE_ANGLE); //[cite: 10]
    
    if (isFreefall) { //[cite: 10]
      const visualMetre = 7.18; //[cite: 10]
      this.dropMagnet.position.set(0, 1.60 - state.axialPosition * visualMetre, 0.7); //[cite: 10, 11]
      this.dropMagnet.rotation.z = Math.PI / 2; //[cite: 10]
    }
    
    this.updatePoles(state.parameters.polarity); //[cite: 10]
    this.pendulumMagnet.userData.fieldLines.visible = state.showFields; //[cite: 10]
    this.dropMagnet.userData.fieldLines.visible = state.showFields; //[cite: 10]
    this.currentArrows.visible = state.showCurrent && Math.abs(state.current) > 0.00000005; //[cite: 10]
    
    const sign = Math.sign(state.current || state.emf) || 1; //[cite: 10]
    this.arrowHelpers.forEach((arrow, index) => { //[cite: 10]
      const vectors = [new THREE.Vector3(0, 0, sign), new THREE.Vector3(0, -sign, 0), new THREE.Vector3(0, 0, -sign)]; //[cite: 10]
      arrow.setDirection(vectors[index]); //[cite: 10]
      arrow.setColor(sign > 0 ? 0x0c9e87 : 0xdc2626); //[cite: 10]
    });
    
    this.drawMeter(this.meterOn ? state.emf : 0); //[cite: 10]
    this.controls.update(); //[cite: 10]
    this.renderer.render(this.scene, this.camera); //[cite: 10]
  }

  updatePoles(polarity) {
    [this.pendulumMagnet, this.dropMagnet].forEach((magnet) => { //[cite: 10]
      if (!magnet) return; //[cite: 10]
      magnet.userData.left.material = polarity > 0 ? magnet.userData.red : magnet.userData.blue; //[cite: 10]
      magnet.userData.right.material = polarity > 0 ? magnet.userData.blue : magnet.userData.red; //[cite: 10]
      magnet.userData.fieldLines.children.forEach((line) => line.material.color.setHex(polarity > 0 ? 0x1a9cd7 : 0xe6612e)); //[cite: 10]
    });
  }

  resize() {
    const { width, height } = this.host.getBoundingClientRect(); //[cite: 10]
    if (!width || !height) return; //[cite: 10]
    this.camera.aspect = width / height; //[cite: 10]
    this.camera.updateProjectionMatrix(); //[cite: 10]
    this.renderer.setSize(width, height, false); //[cite: 10]
  }
}

// -------------------------------------------------------------
//[cite: 10] The remainder of the application hooks remains identical
// -------------------------------------------------------------

const model = new InductionModel(); //[cite: 10]
const scene = new InductionScene($('#threeViewport'), (theta, omega) => { //[cite: 10]
  model.setManualAngle(theta, omega); //[cite: 10]
  controlsByName.angle.input.value = Math.round(Math.abs(theta) * 180 / Math.PI); //[cite: 10]
  controlsByName.angle.output.textContent = `${Math.round(Math.abs(theta) * 180 / Math.PI)}°`; //[cite: 10]
});

const elements = { //[cite: 10]
  status: $('#experimentStatus'), dot: $('#statusDot'), angle: $('#angleValue'), velocity: $('#velocityValue'), velocityLabel: $('#velocityLabel'), //[cite: 10]
  flux: $('#fluxValue'), emf: $('#emfValue'), field: $('#fieldValue'), current: $('#currentValue'), count: $('#countValue'), motion: $('#motionValue'), //[cite: 10]
  observation: $('#observationText'), release: $('#releaseButton'), pause: $('#pauseButton'), reset: $('#resetButton'), heat: $('#heatValue'), //[cite: 10]
  heatFill: $('#heatFill'), readings: $('#emfReadings'), dragHint: $('#dragHint') //[cite: 10]
};
const emfGraph = $('#emfGraph'); //[cite: 10]
const angleGraph = $('#angleGraph'); //[cite: 10]

const controls = [ //[cite: 10]
  { name: 'angle', input: $('#angleControl'), output: $('#angleOutput'), format: (value) => `${value}°` }, //[cite: 10]
  { name: 'turns', input: $('#turnsControl'), output: $('#turnsOutput'), format: (value) => value }, //[cite: 10]
  { name: 'strength', input: $('#strengthControl'), output: $('#strengthOutput'), format: (value) => `${Number(value).toFixed(1)} T` }, //[cite: 10]
  { name: 'damping', input: $('#dampingControl'), output: $('#dampingOutput'), format: (value) => Number(value).toFixed(2) }, //[cite: 10]
  { name: 'speed', input: $('#speedControl'), output: $('#speedOutput'), format: (value) => `${Number(value).toFixed(1)}×` } //[cite: 10]
];
const controlsByName = Object.fromEntries(controls.map((control) => [control.name, control])); //[cite: 10]
controlsByName.angle.input.min = '5'; //[cite: 10]
controlsByName.angle.input.max = '25'; //[cite: 10]
controlsByName.angle.input.value = '22'; //[cite: 10]
controlsByName.angle.output.textContent = '22°'; //[cite: 10]

function setParameter(name, value) { //[cite: 10]
  const safeValue = name === 'angle' ? clamp(value, 5, 25) : value; //[cite: 10]
  model.setParameter(name, safeValue); //[cite: 10]
  if (name === 'turns') scene.setCoilTurns(safeValue); //[cite: 10]
  controlsByName[name].input.value = safeValue; //[cite: 10]
  controlsByName[name].output.textContent = controlsByName[name].format(safeValue); //[cite: 10]
}

controls.forEach((control) => control.input.addEventListener('input', () => setParameter(control.name, Number(control.input.value)))); //[cite: 10]

function setMode(mode) { //[cite: 10]
  model.setMode(mode); //[cite: 10]
  document.querySelectorAll('.mode-button').forEach((button) => button.classList.toggle('is-active', button.dataset.mode === mode)); //[cite: 10]
  controlsByName.angle.input.disabled = mode === 'freefall'; //[cite: 10]
  elements.release.disabled = mode === 'manual'; //[cite: 10]
  elements.pause.disabled = mode === 'manual'; //[cite: 10]
  elements.dragHint.hidden = mode !== 'manual'; //[cite: 10]
}

const presetDefinitions = { //[cite: 10]
  entering: () => { setMode('oscillate'); model.setInitialState({ theta: -22 * Math.PI / 180, omega: 1.2 }); }, //[cite: 10]
  leaving: () => { setMode('oscillate'); model.setInitialState({ theta: 3 * Math.PI / 180, omega: 2.1 }); }, //[cite: 10]
  strong: () => setParameter('strength', 1.5), //[cite: 10]
  weak: () => setParameter('strength', 0.5), //[cite: 10]
  fast: () => { setMode('oscillate'); model.setInitialState({ theta: 23 * Math.PI / 180, omega: 1.6 }); }, //[cite: 10]
  slow: () => { setMode('oscillate'); model.setInitialState({ theta: 7 * Math.PI / 180, omega: 0 }); }, //[cite: 10]
  manyTurns: () => setParameter('turns', 500), //[cite: 10]
  fewTurns: () => setParameter('turns', 100), //[cite: 10]
  reverse: () => model.reversePoles() //[cite: 10]
};

document.querySelectorAll('.preset-button').forEach((button) => button.addEventListener('click', () => { //[cite: 10]
  presetDefinitions[button.dataset.preset](); //[cite: 10]
  const angle = Math.round(Math.abs(model.initialState.theta) * 180 / Math.PI); //[cite: 10]
  controlsByName.angle.input.value = clamp(angle, 5, 25); //[cite: 10]
  controlsByName.angle.output.textContent = `${clamp(angle, 5, 25)}°`; //[cite: 10]
  sync(model.state); //[cite: 10]
}));

document.querySelectorAll('.mode-button').forEach((button) => button.addEventListener('click', () => { setMode(button.dataset.mode); sync(model.state); })); //[cite: 10]
$('#magneticFieldToggle').addEventListener('change', (event) => model.setDisplay('fields', event.target.checked)); //[cite: 10]
$('#inducedCurrentToggle').addEventListener('change', (event) => model.setDisplay('current', event.target.checked)); //[cite: 10]

function resizeCanvas(canvas, context) { //[cite: 10]
  const rect = canvas.getBoundingClientRect(); //[cite: 10]
  const ratio = window.devicePixelRatio || 1; //[cite: 10]
  const width = Math.round(rect.width * ratio), height = Math.round(rect.height * ratio); //[cite: 10]
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; context.setTransform(ratio, 0, 0, ratio, 0, 0); } //[cite: 10]
  return { width: rect.width, height: rect.height }; //[cite: 10]
}

function drawGraph(canvas, color, data, accessor, min, max) { //[cite: 10]
  const context = canvas.getContext('2d'); //[cite: 10]
  const { width, height } = resizeCanvas(canvas, context); //[cite: 10]
  const pad = { left: 40, right: 10, top: 12, bottom: 27 }, plotWidth = width - pad.left - pad.right, plotHeight = height - pad.top - pad.bottom; //[cite: 10]
  context.clearRect(0, 0, width, height); //[cite: 10]
  context.strokeStyle = '#dce7e6'; context.lineWidth = 1; //[cite: 10]
  for (let i = 0; i < 5; i += 1) { const y = pad.top + i * plotHeight / 4; context.beginPath(); context.moveTo(pad.left, y); context.lineTo(width - pad.right, y); context.stroke(); } //[cite: 10]
  context.strokeStyle = '#607170'; context.beginPath(); context.moveTo(pad.left, pad.top); context.lineTo(pad.left, height - pad.bottom); context.lineTo(width - pad.right, height - pad.bottom); context.stroke(); //[cite: 10]
  context.fillStyle = '#627070'; context.font = '11px Nunito'; context.fillText(max.toFixed(2), 2, pad.top + 4); context.fillText(min.toFixed(2), 2, height - pad.bottom + 4); context.fillText('time →', width / 2 - 17, height - 7); //[cite: 10]
  if (data.length < 2) return; //[cite: 10]
  const first = data[0].time, last = data[data.length - 1].time; //[cite: 10]
  context.beginPath(); //[cite: 10]
  data.forEach((point, index) => { //[cite: 10]
    const x = pad.left + (point.time - first) / Math.max(last - first, 0.001) * plotWidth; //[cite: 10]
    const y = pad.top + (max - clamp(accessor(point), min, max)) / (max - min) * plotHeight; //[cite: 10]
    if (index) context.lineTo(x, y); else context.moveTo(x, y); //[cite: 10]
  });
  context.strokeStyle = color; context.lineWidth = 2; context.stroke(); //[cite: 10]
}

function observation(state) { //[cite: 10]
  if (state.parameters.mode === 'manual') return 'Manual mode: move the magnet frame and observe how a changing flux produces an EMF. Hold still and the EMF returns to zero.'; //[cite: 10]
  if (state.parameters.mode === 'freefall') return state.running ? 'The magnet is falling through the vertical coil guide under gravity. Its speed and induced EMF change continuously.' : 'Freefall mode: select Release to drop the magnet through the coil.'; //[cite: 10]
  if (state.complete) return 'Experiment complete. The decreasing mechanical energy has been dissipated through the resistance of the measurement circuit and pivot losses.'; //[cite: 10]
  if (!state.running) return 'Ready. Select Release to start the gravity-driven oscillation.'; //[cite: 10]
  if (Math.abs(state.emf) < 0.0005) return 'Near a turning point the magnet is momentarily slow, so the rate of change of flux and the induced EMF are nearly zero.'; //[cite: 10]
  return state.emf > 0 ? 'The coil polarity is positive for this direction of changing flux; reversing the motion or the magnet poles reverses the reading.' : 'The changing flux now induces the opposite polarity, as required by Faraday’s and Lenz’s laws.'; //[cite: 10]
}

function sync(state) { //[cite: 10]
  const emfSign = state.emf >= 0 ? '+' : ''; //[cite: 10]
  elements.angle.textContent = state.parameters.mode === 'freefall' ? '—' : `${state.angleDegrees.toFixed(1)}°`; //[cite: 10]
  elements.velocityLabel.firstChild.textContent = state.parameters.mode === 'freefall' ? 'Fall speed ' : 'Angular velocity '; //[cite: 10]
  elements.velocity.textContent = state.parameters.mode === 'freefall' ? `${state.velocity.toFixed(3)} m/s` : `${state.velocity.toFixed(3)} rad/s`; //[cite: 10]
  elements.flux.textContent = `${state.fluxMilliWebers.toFixed(3)} mWb`; //[cite: 10]
  elements.emf.textContent = `${emfSign}${state.emf.toFixed(3)} V`; //[cite: 10]
  elements.field.textContent = `${state.fieldMilliTesla.toFixed(1)} mT`; //[cite: 10]
  elements.current.textContent = `${state.currentMilliAmps >= 0 ? '+' : ''}${state.currentMilliAmps.toFixed(4)} mA`; //[cite: 10]
  elements.count.textContent = state.parameters.mode === 'freefall' ? '—' : state.oscillations; //[cite: 10]
  elements.motion.textContent = !state.running ? 'Stationary' : state.parameters.mode === 'freefall' ? 'Falling' : state.velocity > 0 ? 'Toward +x' : 'Toward −x'; //[cite: 10]
  elements.observation.textContent = observation(state); //[cite: 10]
  elements.status.textContent = state.complete ? 'Experiment complete' : state.running ? state.parameters.mode === 'freefall' ? 'Freefall in progress' : 'Oscillating' : state.parameters.mode === 'manual' ? 'Manual positioning' : 'Ready to release'; //[cite: 10]
  elements.dot.className = `status-dot ${state.running ? 'running' : state.time > 0 ? 'paused' : ''}`; //[cite: 10]
  elements.pause.textContent = state.running ? 'Pause' : 'Resume'; //[cite: 10]
  elements.heat.textContent = `${(state.electricalEnergy * 1000).toFixed(4)} mJ`; //[cite: 10]
  elements.heatFill.style.width = `${Math.min(state.electricalEnergy * 700000, 100)}%`; //[cite: 10]
  elements.readings.innerHTML = state.readings.length ? state.readings.map((reading, index) => `<tr><td>${index + 1}</td><td>${reading.time.toFixed(2)} s</td><td class="${reading.emf > 0 ? 'positive-reading' : 'negative-reading'}">${reading.emf >= 0 ? '+' : ''}${reading.emf.toFixed(3)} V</td></tr>`).join('') : '<tr><td colspan="3">Release the magnet to record peak readings.</td></tr>'; //[cite: 10]
  scene.update(state); //[cite: 10]
  drawGraph(emfGraph, '#168983', state.history, (point) => point.emf, -0.8, 0.8); //[cite: 10]
  drawGraph(angleGraph, '#b36d24', state.history, (point) => point.angle, -25, 25); //[cite: 10]
}

function release() { model.release(); sync(model.state); } //[cite: 10]
function toggle() { model.running ? model.pause() : model.release(); sync(model.state); } //[cite: 10]
function reset() { model.reset(); sync(model.state); } //[cite: 10]
elements.release.addEventListener('click', release); //[cite: 10]
elements.pause.addEventListener('click', toggle); //[cite: 10]
elements.reset.addEventListener('click', reset); //[cite: 10]

const workspaceViewport = $('#workspaceViewport'), workspaceTitle = $('#workspaceTitle'), simulationCard = $('#simulation'), controlsLockButton = $('#controlsLockButton'); //[cite: 10]
const sectionList = document.createElement('div'); //[cite: 10]
sectionList.id = 'sectionList'; sectionList.className = 'section-list'; //[cite: 10]
const mainSection = document.querySelector('.main-section'); //[cite: 10]
mainSection.insertBefore(sectionList, mainSection.querySelector('.footer')); //[cite: 10]
const simulationWindow = $('#simulationWindow'); //[cite: 10]
const sectionNames = { simulation: 'Simulation', diagram: 'Diagram', formula: 'Formula', calculation: 'Calculation', graphs: 'Live Graphs', results: 'Results', observation: 'Observation', experiments: 'Experiments' }; //[cite: 10]
const workspaceSections = { simulation: simulationWindow, diagram: $('#diagram'), formula: $('#formula'), calculation: $('#calculation'), graphs: $('#graphs'), results: $('#observations'), observation: $('#observation'), experiments: $('#experiments') }; //[cite: 10]
Object.entries(workspaceSections).forEach(([name, section]) => { if (name !== 'simulation' && section) sectionList.append(section); }); //[cite: 10]
simulationWindow.classList.add('workspace-section', 'simulation-window', 'is-active-workspace'); //[cite: 10]

let workspaceMode = 'simulation', controlsLocked = false; //[cite: 10]
function refreshControlState() { //[cite: 10]
  controls.forEach((control) => { control.input.disabled = (controlsLocked && model.running) || (control.name === 'angle' && model.parameters.mode === 'freefall'); }); //[cite: 10]
  controlsLockButton.textContent = controlsLocked ? '🔒 Locked' : '🔓 Lock'; //[cite: 10]
  controlsLockButton.classList.toggle('is-locked', controlsLocked); //[cite: 10]
  elements.release.disabled = model.running || model.parameters.mode === 'manual'; //[cite: 10]
  elements.pause.disabled = model.parameters.mode === 'manual'; //[cite: 10]
}
controlsLockButton.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); controlsLocked = !controlsLocked; controlsLockButton.setAttribute('aria-pressed', String(controlsLocked)); refreshControlState(); }); //[cite: 10]

function selectWorkspace(name) { //[cite: 10]
  const next = workspaceSections[name]; //[cite: 10]
  if (!next || name === workspaceMode) return; //[cite: 10]
  workspaceSections[workspaceMode].classList.remove('is-active-workspace'); //[cite: 10]
  sectionList.append(workspaceSections[workspaceMode]); //[cite: 10]
  if (next.tagName === 'DETAILS') next.open = true; //[cite: 10]
  workspaceViewport.append(next); next.classList.add('is-active-workspace'); //[cite: 10]
  workspaceMode = name; //[cite: 10]
  document.querySelectorAll('.workspace-link').forEach((link) => link.classList.toggle('is-active', link.dataset.workspace === name)); //[cite: 10]
  workspaceTitle.textContent = sectionNames[name]; //[cite: 10]
  simulationCard.classList.toggle('is-reference-mode', name !== 'simulation'); //[cite: 10]
  simulationCard.classList.toggle('is-graph-mode', name === 'graphs'); //[cite: 10]
  requestAnimationFrame(() => { scene.resize(); sync(model.state); }); //[cite: 10]
}
document.querySelectorAll('.workspace-link').forEach((link) => link.addEventListener('click', () => selectWorkspace(link.dataset.workspace))); //[cite: 10]

const fullscreenButton = $('#fullscreenButton'); //[cite: 10]
fullscreenButton.addEventListener('click', async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch (_) {} }); //[cite: 10]
document.addEventListener('fullscreenchange', () => { fullscreenButton.textContent = document.fullscreenElement ? '⊡' : '⛶'; }); //[cite: 10]

const helpOverlay = $('#helpOverlay'), helpPopover = $('#helpPopover'), helpText = $('#helpText'), helpStep = $('#helpStep'), nextHelpButton = $('#nextHelpButton'); //[cite: 10]
const helpItems = [ //[cite: 10]
  { target: '#releaseButton', title: 'Start the experiment', text: 'Release starts the oscillating or freefall motion. Manual mode is controlled directly by dragging the frame.' }, //[cite: 10]
  { target: '.preset-grid', title: 'Try a preset', text: 'Presets set a physically meaningful starting condition or change one controlled variable, ready for comparison.' }, //[cite: 10]
  { target: '.mode-button-group', title: 'Select a mode', text: 'Oscillate is a gravity-driven pendulum; Freefall drops the magnet vertically through the coil; Manual follows your drag.' }, //[cite: 10]
  { target: '#magneticFieldToggle', title: 'Show the field', text: 'Toggle the magnetic field loops. Reverse magnet poles flips their direction and the meter polarity.' }, //[cite: 10]
  { target: '#turnsControl', title: 'Change coil turns', text: 'More turns produce a proportionally larger induced EMF for the same changing flux.' }, //[cite: 10]
  { target: '#strengthControl', title: 'Change field strength', text: 'The finite bar-magnet field model uses this remanent field strength in tesla.' } //[cite: 10]
];
let helpIndex = 0; //[cite: 10]
function placeHelp() { const target = $(helpItems[helpIndex].target); const rect = target.getBoundingClientRect(); helpPopover.style.left = `${clamp(rect.left, 18, window.innerWidth - helpPopover.offsetWidth - 18)}px`; helpPopover.style.top = `${clamp(rect.bottom + 16, 18, window.innerHeight - helpPopover.offsetHeight - 18)}px`; } //[cite: 10]
function showHelp() { const item = helpItems[helpIndex]; $('#helpTitle').textContent = item.title; helpText.textContent = item.text; helpStep.textContent = `Guide ${helpIndex + 1} of ${helpItems.length}`; nextHelpButton.textContent = helpIndex === helpItems.length - 1 ? 'Finish' : 'Next'; requestAnimationFrame(placeHelp); } //[cite: 10]
function closeHelp() { helpOverlay.hidden = true; helpOverlay.setAttribute('aria-hidden', 'true'); } //[cite: 10]
$('#helpButton').addEventListener('click', () => { helpIndex = 0; helpOverlay.hidden = false; helpOverlay.setAttribute('aria-hidden', 'false'); showHelp(); }); //[cite: 10]
nextHelpButton.addEventListener('click', () => { if (helpIndex === helpItems.length - 1) closeHelp(); else { helpIndex += 1; showHelp(); } }); //[cite: 10]
$('#closeHelpButton').addEventListener('click', closeHelp); //[cite: 10]
helpOverlay.addEventListener('click', (event) => { if (event.target === helpOverlay) closeHelp(); }); //[cite: 10]

let draggedCard = null; //[cite: 10]
document.querySelectorAll('.reference-card, .graphs-card').forEach((card) => { //[cite: 10]
  card.setAttribute('draggable', 'true'); //[cite: 10]
  card.addEventListener('dragstart', (event) => { draggedCard = card; card.classList.add('is-dragging'); event.dataTransfer.effectAllowed = 'move'; }); //[cite: 10]
  card.addEventListener('dragend', () => { card.classList.remove('is-dragging'); document.querySelectorAll('.drag-over').forEach((item) => item.classList.remove('drag-over')); draggedCard = null; }); //[cite: 10]
  card.addEventListener('dragover', (event) => { if (!draggedCard || draggedCard === card) return; event.preventDefault(); card.classList.add('drag-over'); }); //[cite: 10]
  card.addEventListener('dragleave', () => card.classList.remove('drag-over')); //[cite: 10]
  card.addEventListener('drop', (event) => { event.preventDefault(); if (draggedCard && draggedCard !== card) card.parentNode.insertBefore(draggedCard, card); }); //[cite: 10]
});

window.addEventListener('resize', () => { scene.resize(); sync(model.state); }); //[cite: 10]
let last = performance.now(); //[cite: 10]
function animate(now) { //[cite: 10]
  model.update((now - last) / 1000); //[cite: 10]
  last = now; //[cite: 10]
  sync(model.state); //[cite: 10]
  refreshControlState(); //[cite: 10]
  requestAnimationFrame(animate); //[cite: 10]
}
setMode('oscillate'); //[cite: 10]
sync(model.state); //[cite: 10]
refreshControlState(); //[cite: 10]
requestAnimationFrame(animate); //[cite: 10]