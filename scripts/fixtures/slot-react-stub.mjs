// Minimal hook stub: lets useSlotMachine() run outside a React renderer in tests.
export const useCallback = (f) => f;
export const useRef = (v) => ({ current: v });
export default { useCallback, useRef };
