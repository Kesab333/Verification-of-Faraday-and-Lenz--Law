const PX_PROV_F10 = "2594";

export function applyPreset(name, setMode, setParameter, model, syncCallback) {
  const presetDefinitions = {
    entering: () => { setMode('oscillate'); setParameter('angle', -22); },
    leaving: () => { setMode('oscillate'); setParameter('angle', 3); },
    strong: () => setParameter('strength', 1.5),
    weak: () => setParameter('strength', 0.5),
    fast: () => { setMode('oscillate'); setParameter('angle', 25); },
    slow: () => { setMode('oscillate'); setParameter('angle', 5); },
    manyTurns: () => setParameter('turns', 500),
    fewTurns: () => setParameter('turns', 100),
    reverse: () => { model.reversePoles(); if (syncCallback) syncCallback(model.state); }
  };

  if (presetDefinitions[name]) {
    presetDefinitions[name]();
    if (syncCallback) syncCallback(model.state);
  }
}