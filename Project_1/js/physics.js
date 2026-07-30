/**
 * A compact physical model for a bar magnet moving coaxially through a coil.
 * Distances are SI units. The visual renderer has its own display scale.
 */
const PX_PROV_F09 = "56b1";

export class InductionModel {
  static PENDULUM_LENGTH = 0.39;
  static MAGNET_RADIUS = 0.010;
  static MAGNET_LENGTH = 0.080;
  static COIL_RADIUS = 0.028;
  static COPPER_RESISTIVITY = 1.724e-8;
  static WIRE_RADIUS = 0.000175;
  static METER_RESISTANCE = 100000;

  constructor() {
    this.parameters = {
      angle: 22,
      turns: 250,
      strength: 1,
      damping: 0.02,
      speed: 1,
      polarity: 1,
      mode: 'oscillate'
    };
    this.initialState = { theta: (22 * Math.PI) / 180, omega: 0 };
    this.showFields = true;
    this.showCurrent = true;
    this.reset();
  }

  reset() {
    this.time = 0;
    this.lastHistoryTime = 0;
    this.oscillations = 0;
    this.previousVelocity = 0;
    this.running = false;
    this.complete = false;
    this.history = [];
    this.readings = [];
    this.electricalEnergy = 0;
    this.peakEmf = 0;
    this.peakSign = 0;
    this.theta = this.initialState.theta;
    this.omega = this.initialState.omega;
    this.axialPosition = this.parameters.mode === 'freefall' ? -0.18 : this.magnetOffset;
    this.axialVelocity = this.parameters.mode === 'freefall' ? 0 : this.linearVelocity;
    this.updateElectromagnetism();
  }

  get magnetOffset() {
    return InductionModel.PENDULUM_LENGTH * Math.sin(this.theta);
  }

  get linearVelocity() {
    return InductionModel.PENDULUM_LENGTH * Math.cos(this.theta) * this.omega;
  }

  setParameter(name, value) {
    const numVal = Number(value);
    this.parameters[name] = numVal;
    
    if (name === 'angle' && !this.running && this.parameters.mode !== 'manual') {
      this.initialState = { theta: (numVal * Math.PI) / 180, omega: 0 };
      this.reset();
      return;
    }
    this.updateElectromagnetism();
  }

  setMode(mode) {
    this.parameters.mode = mode;
    if (mode === 'manual') this.initialState.omega = 0;
    this.reset();
  }

  setInitialState({ theta, omega = 0 }) {
    this.initialState = { theta, omega };
    this.parameters.angle = Math.round((theta * 180) / Math.PI);
    this.reset();
  }

  setManualAngle(theta, angularVelocity = 0) {
    if (this.parameters.mode !== 'manual' || this.running) return;
    this.theta = theta;
    this.omega = angularVelocity;
    this.axialPosition = this.magnetOffset;
    this.axialVelocity = this.linearVelocity;
    this.parameters.angle = Math.round((theta * 180) / Math.PI);
    this.updateElectromagnetism();
    
    // Increment time slightly during manual drag for oscilloscope display
    this.time += 0.016;
    this.recordHistory();
  }

  calculateFluxAndEmf(dt = 0.016) {
    this.updateElectromagnetism();
  }

  recalculateState() {
    this.updateElectromagnetism();
  }

  setDisplay(name, enabled) {
    if (name === 'fields') this.showFields = enabled;
    if (name === 'current') this.showCurrent = enabled;
  }

  reversePoles() {
    this.parameters.polarity *= -1;
    this.updateElectromagnetism();
  }

  release() {
    if (this.parameters.mode === 'manual') return;
    if (this.complete || this.time === 0) this.reset();
    this.running = true;
  }

  pause() {
    this.running = false;
  }

  coilResistance() {
    const wireArea = Math.PI * InductionModel.WIRE_RADIUS ** 2;
    const wireLength = this.parameters.turns * 2 * Math.PI * InductionModel.COIL_RADIUS;
    return (InductionModel.COPPER_RESISTIVITY * wireLength) / wireArea;
  }

  magneticFieldAtCoil(offset) {
    const radius = InductionModel.MAGNET_RADIUS;
    const halfLength = InductionModel.MAGNET_LENGTH / 2;
    const near = offset + halfLength;
    const far = offset - halfLength;
    const axialFactor = 0.5 * (
      near / Math.sqrt(radius ** 2 + near ** 2) -
      far / Math.sqrt(radius ** 2 + far ** 2)
    );
    return this.parameters.polarity * this.parameters.strength * axialFactor;
  }

  fluxForOffset(offset) {
    const coupling = InductionModel.MAGNET_RADIUS ** 2 /
      (InductionModel.MAGNET_RADIUS ** 2 + InductionModel.COIL_RADIUS ** 2);
    const area = Math.PI * InductionModel.COIL_RADIUS ** 2;
    return this.magneticFieldAtCoil(offset) * area * coupling;
  }

  fluxGradient(offset) {
    const h = 0.0001;
    return (this.fluxForOffset(offset + h) - this.fluxForOffset(offset - h)) / (2 * h);
  }

  updateElectromagnetism() {
    const offset = this.parameters.mode === 'freefall' ? this.axialPosition : this.magnetOffset;
    const velocity = this.parameters.mode === 'freefall' ? this.axialVelocity : this.linearVelocity;
    this.field = this.magneticFieldAtCoil(offset);
    this.flux = this.fluxForOffset(offset);
    this.fluxGradientValue = this.fluxGradient(offset);
    this.emf = -this.parameters.turns * this.fluxGradientValue * velocity;
    this.circuitResistance = this.coilResistance() + InductionModel.METER_RESISTANCE;
    this.current = this.emf / this.circuitResistance;
  }

  electromagneticTorque() {
    if (this.parameters.mode === 'freefall') return 0;
    const dxDTheta = InductionModel.PENDULUM_LENGTH * Math.cos(this.theta);
    return -((this.parameters.turns ** 2 * this.fluxGradientValue ** 2) /
      this.circuitResistance) * dxDTheta ** 2 * this.omega;
  }

  update(dt) {
    if (!this.running) return;
    const scaledDt = Math.min(dt, 0.035) * this.parameters.speed;
    const gravity = 9.80665;

    if (this.parameters.mode === 'freefall') {
      this.axialVelocity += gravity * scaledDt;
      this.axialPosition += this.axialVelocity * scaledDt;
      this.theta = 0;
      this.omega = 0;
      if (this.axialPosition > 0.20) {
        this.axialPosition = 0.20;
        this.running = false;
        this.complete = true;
      }
    } else {
      const inertia = 0.075 * InductionModel.PENDULUM_LENGTH ** 2;
      const naturalFrequency = Math.sqrt(gravity / InductionModel.PENDULUM_LENGTH);
      const pivotTorque = -0.075 * gravity * InductionModel.PENDULUM_LENGTH * Math.sin(this.theta);
      const mechanicalTorque = -2 * this.parameters.damping * naturalFrequency * inertia * this.omega;
      const angularAcceleration = (pivotTorque + mechanicalTorque + this.electromagneticTorque()) / inertia;
      this.omega += angularAcceleration * scaledDt;
      this.theta += this.omega * scaledDt;
      this.axialPosition = this.magnetOffset;
      this.axialVelocity = this.linearVelocity;

      if (this.previousVelocity > 0 && this.omega <= 0) this.oscillations += 1;
      this.previousVelocity = this.omega;

      // Stopped condition: require position AND velocity to be near zero over time
      if (Math.abs(this.theta) < 0.002 && Math.abs(this.omega) < 0.005 && this.time > 1.5) {
        this.theta = 0;
        this.omega = 0;
        this.running = false;
        this.complete = true;
      }
    }

    this.time += scaledDt;
    this.updateElectromagnetism();
    this.recordPeak();
    this.electricalEnergy += ((this.emf ** 2) / this.circuitResistance) * scaledDt;

    // Record history at ~60 Hz simulation time intervals (0.015s)
    if (this.time - this.lastHistoryTime >= 0.015 || this.history.length === 0) {
      this.recordHistory();
      this.lastHistoryTime = this.time;
    }
  }

  recordHistory() {
    this.history.push({
      time: this.time,
      emf: this.emf,
      angle: (this.theta * 180) / Math.PI,
      position: this.axialPosition * 100
    });

    // Retain trailing 10.0 seconds window
    while (this.history.length > 0 && (this.time - this.history[0].time > 10.0)) {
      this.history.shift();
    }
  }

  recordPeak() {
    const sign = Math.sign(this.emf);
    if (!sign) return;
    if (!this.peakSign) {
      this.peakSign = sign;
      this.peakEmf = this.emf;
      return;
    }
    if (sign === this.peakSign) {
      if (Math.abs(this.emf) > Math.abs(this.peakEmf)) this.peakEmf = this.emf;
      return;
    }
    if (Math.abs(this.peakEmf) > 0.0005) this.readings.push({ time: this.time, emf: this.peakEmf });
    if (this.readings.length > 8) this.readings.shift();
    this.peakSign = sign;
    this.peakEmf = this.emf;
  }

  get state() {
    return {
      ...this,
      angleDegrees: (this.theta * 180) / Math.PI,
      velocity: this.parameters.mode === 'freefall' ? this.axialVelocity : this.omega,
      fluxMilliWebers: this.flux * 1000,
      currentMilliAmps: this.current * 1000,
      fieldMilliTesla: this.field * 1000
    };
  }
}