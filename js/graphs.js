import { clamp } from './utils.js';

const PX_PROV_F12 = "4d38";

export function resizeCanvas(canvas, context) {
  if (!canvas || !context) return { width: 0, height: 0, ratio: 1 };
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.round(rect.width * ratio);
  const height = Math.round(rect.height * ratio);

  if (width > 0 && height > 0 && (canvas.width !== width || canvas.height !== height)) {
    canvas.width = width;
    canvas.height = height;
  }
  return { width: rect.width, height: rect.height, ratio };
}

export function drawGraph(canvas, color, data, accessor, min = -1, max = 1) {
  if (!canvas) return;
  const context = canvas.getContext('2d');
  if (!context) return;

  const { width, height, ratio } = resizeCanvas(canvas, context);
  if (width <= 0 || height <= 0) return;

  // Clear canvas buffer before applying scale transform
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);

  const pad = { left: 55, right: 15, top: 18, bottom: 25 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;

  // Horizontal Grid Lines
  context.strokeStyle = '#dce7e6';
  context.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) {
    const y = pad.top + (i * plotHeight) / 4;
    context.beginPath();
    context.moveTo(pad.left, y);
    context.lineTo(width - pad.right, y);
    context.stroke();
  }

  // Axes
  context.strokeStyle = '#607170';
  context.beginPath();
  context.moveTo(pad.left, pad.top);
  context.lineTo(pad.left, height - pad.bottom);
  context.lineTo(width - pad.right, height - pad.bottom);
  context.stroke();

  // Filter and sort data
  let validData = [];
  if (Array.isArray(data) && data.length > 0) {
    validData = data
      .filter((p) => p && typeof p.time === 'number' && !isNaN(p.time))
      .sort((a, b) => a.time - b.time);
  }

  // Consistent 5.0s trailing window anchored to latest timestamp
  const WINDOW_SPAN = 5.0;
  const lastTime = validData.length > 0 ? validData[validData.length - 1].time : 0;
  const startTime = Math.max(0, lastTime - WINDOW_SPAN);
  const windowSpan = Math.max(lastTime - startTime, WINDOW_SPAN);

  // Dynamic Y-axis auto-scaling with baseline bounds
  let dataMin = Infinity;
  let dataMax = -Infinity;

  validData.forEach((point) => {
    if (point.time >= startTime) {
      const val = typeof accessor === 'function' ? accessor(point) : undefined;
      if (typeof val === 'number' && !isNaN(val)) {
        if (val < dataMin) dataMin = val;
        if (val > dataMax) dataMax = val;
      }
    }
  });

  let effectiveMin = min;
  let effectiveMax = max;

  if (dataMin !== Infinity && dataMax !== -Infinity) {
    effectiveMin = Math.min(effectiveMin, dataMin);
    effectiveMax = Math.max(effectiveMax, dataMax);
  }

  // Safety vertical padding to prevent peak clipping
  const rangeRaw = effectiveMax - effectiveMin;
  const paddingY = rangeRaw === 0 ? 0.5 : rangeRaw * 0.1;
  effectiveMin -= paddingY;
  effectiveMax += paddingY;

  const rangeY = Math.max(effectiveMax - effectiveMin, 0.0001);

  // Y-axis labels
  context.fillStyle = '#627070';
  context.font = '11px Nunito, sans-serif';
  context.textAlign = 'right';
  context.textBaseline = 'middle';
  context.fillText(effectiveMax.toFixed(2), pad.left - 6, pad.top);
  context.fillText(effectiveMin.toFixed(2), pad.left - 6, height - pad.bottom);

  // X-axis labels
  context.textBaseline = 'top';
  context.textAlign = 'left';
  context.fillText(`${startTime.toFixed(1)}s`, pad.left, height - pad.bottom + 6);

  context.textAlign = 'right';
  context.fillText(`${(startTime + windowSpan).toFixed(1)}s`, width - pad.right, height - pad.bottom + 6);

  context.textAlign = 'center';
  context.fillText('time (s) →', pad.left + plotWidth / 2, height - pad.bottom + 6);

  if (validData.length < 2) return;

  // Plot path
  context.beginPath();
  let hasStarted = false;
  let lastPointTime = null;

  validData.forEach((point) => {
    if (point.time < startTime) return;

    const val = typeof accessor === 'function' ? accessor(point) : undefined;
    if (typeof val !== 'number' || isNaN(val)) return;

    const x = pad.left + ((point.time - startTime) / windowSpan) * plotWidth;
    const clampedVal = clamp(val, effectiveMin, effectiveMax);
    const y = pad.top + ((effectiveMax - clampedVal) / rangeY) * plotHeight;

    // Disconnect path only on explicit recording gaps (> 0.5s)
    const isTimeGap = lastPointTime !== null && (point.time - lastPointTime > 0.5);

    if (!hasStarted || isTimeGap) {
      context.moveTo(x, y);
      hasStarted = true;
    } else {
      context.lineTo(x, y);
    }

    lastPointTime = point.time;
  });

  if (hasStarted) {
    context.strokeStyle = color || '#000000';
    context.lineWidth = 2;
    context.stroke();
  }
}

export function initGraphsModule(emfGraph, angleGraph) {
  const graphsSection = document.querySelector('#graphs');
  if (!graphsSection) return;

  Object.assign(graphsSection.style, {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    height: '100%',
    maxHeight: '100%',
    width: '100%',
    boxSizing: 'border-box',
    padding: '8px',
    overflow: 'hidden'
  });

  const cards = graphsSection.querySelectorAll('.reference-card, .graphs-card, .graph-card, .card');
  cards.forEach((card) => {
    Object.assign(card.style, {
      flex: '1',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '50%',
      minHeight: '0',
      margin: '0',
      boxSizing: 'border-box',
      overflow: 'hidden'
    });
  });

  [emfGraph, angleGraph].forEach((canvas) => {
    if (canvas) {
      Object.assign(canvas.style, {
        width: '100%',
        height: '100%',
        flex: '1',
        minHeight: '0',
        display: 'block'
      });
    }
  });
}