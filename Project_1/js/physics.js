class InductionModel {
  constructor() { this.parameters = { angle: 35, turns: 250, strength: 1, damping: .08, speed: 1 }; this.reset(); }
  reset() { this.theta = this.parameters.angle * Math.PI / 180; this.omega = 0; this.time = 0; this.oscillations = 0; this.previousVelocity = 0; this.running = false; this.complete = false; this.history = []; this.updateElectromagnetism(); }
  setParameter(name, value) { this.parameters[name] = value; if (name === 'angle' && !this.running) this.reset(); else this.updateElectromagnetism(); }
  release() { if (this.complete) this.reset(); this.running = true; }
  pause() { this.running = false; }
  update(dt) { if (!this.running) return; const scaledDt = Math.min(dt, .035) * this.parameters.speed; const gravityFrequency = 3.1; const eddyDamping = this.parameters.damping + this.parameters.turns / 10000 * this.parameters.strength; const acceleration = -(gravityFrequency ** 2) * Math.sin(this.theta) - 2 * eddyDamping * this.omega; this.omega += acceleration * scaledDt; this.theta += this.omega * scaledDt; this.time += scaledDt; if (this.previousVelocity > 0 && this.omega <= 0) this.oscillations++; this.previousVelocity = this.omega; this.updateElectromagnetism(); this.history.push({ time:this.time, emf:this.emf, angle:this.theta * 180 / Math.PI }); if (this.history.length > 360) this.history.shift(); if (Math.abs(this.theta) < .003 && Math.abs(this.omega) < .006 && this.time > 2) { this.theta = 0; this.omega = 0; this.running = false; this.complete = true; this.updateElectromagnetism(); } }
  updateElectromagnetism() { const distance = .075 + .11 * (1 - Math.cos(this.theta)); const geometry = 1 / (distance * distance); this.flux = .000010 * this.parameters.strength * geometry * Math.cos(this.theta); const dDistance = .11 * Math.sin(this.theta) * this.omega; const dGeometry = -2 * dDistance / (distance ** 3); const dFlux = .000010 * this.parameters.strength * (dGeometry * Math.cos(this.theta) - geometry * Math.sin(this.theta) * this.omega); this.emf = this.parameters.turns * dFlux * 2.2; }
  get state() { return { ...this, angleDegrees:this.theta * 180 / Math.PI, velocity:this.omega, fluxMilliWebers:this.flux * 1000 }; }
}

window.InductionModel = InductionModel;
