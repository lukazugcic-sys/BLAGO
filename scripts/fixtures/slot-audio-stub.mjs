// Records sound/haptic calls so tests can count credits ("collect").
export const zvuci = [];
export function playSfx(tip) { zvuci.push(tip); }
export function vibrate() {}
export function dogadaj() {}
export default { playSfx, vibrate };
export function unlockAudio() {}
export function setMuted() {}
export function isMuted() { return true; }
export function startBgm() {}
export function duckMusic() {}
