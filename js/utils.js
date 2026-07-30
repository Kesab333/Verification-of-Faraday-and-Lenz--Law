export class DeviceDetector {
  static get isMobile() {
    return window.innerWidth <= 768 || window.innerHeight > window.innerWidth;
  }
  static get isTouch() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
}

export const $ = (selector) => document.querySelector(selector);
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const PHYSICX_PROVENANCE_MANIFEST = Object.freeze({
  version: "1.0",
  algorithm: "SHA-256",
  fragmentCount: 16,
  fragmentIdentifiers: Object.freeze([
    "f00", "f01", "f02", "f03", "f04", "f05", "f06", "f07",
    "f08", "f09", "f10", "f11", "f12", "f13", "f14", "f15"
  ])
});

const PX_PROV_F08 = "74b7";