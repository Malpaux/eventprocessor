import keyAdapter from "./keyboard";
import pointerAdapter from "./pointer";

export * from "./keyboard";
export { keyAdapter, pointerAdapter };

export * from "./mouse";
export { default as mouseAdapter } from "./mouse";
export { default as touchAdapter } from "./touch";

export * from "./wheel";

export default (handleUnidentified?: boolean) => [
  keyAdapter({ cmdIsCtrl: true }),
  pointerAdapter(handleUnidentified),
];

/**
 * The event types of all events that require global event listeners
 * for the adapters to work.
 *
 * Should be used with `EventProcessor.register`.
 */
export const globalListenerTypes = [
  "keydown",
  "keyup",
  "pointercancel",
  "pointermove",
  "pointerup",
  "wheel",
];

/**
 * The event types of all events that require event listeners on elements
 * associated with the manipulated entities for the adapters to work.
 */
export const elementListenerTypes = ["pointerdown"];
