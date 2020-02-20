import { EventData, EventMiddleware } from "../types";
import Pointer from "./pointer";

/** Devices that can dispatch events to the middleware chain. */
export type DeviceType = "key" | "mouse" | "touch" | "wheel";

/**
 * An abstraction of event-types to provide a uniform
 * interface for different devices, e.g. mouse/touch.
 */
export type EventType = "up" | "down" | "start" | "move" | "end" | "wheel";

export interface Action {
  type: string;
  [key: string]: any;
}

/**
 * An extended EventData interface.
 * Most of the pre-built middleware assumes an opinionated middleware
 * chain using this EventData.
 */
export interface RichEventData<ID = string> extends EventData {
  /**
   * The user-defined actions this event is going to trigger.
   * This field should be filled by an event mapper or custom middleware.
   * It provides a semantical context to the event/gesture.
   */
  actions?: Action[];

  /**
   * The name of the device that issued the currently processed event.
   * This field should be generated by the `classify` middleware.
   */
  device?: DeviceType;

  /**
   * The (abstract) type of the currently processed event.
   * This field should be generated by the `classify` middleware.
   */
  eventType?: EventType;

  /**
   * The ids of (model) objects this event targets.
   * This field should be generated by the respective device's adapter.
   */
  ids?: ID[];

  /**
   * The pointers derived from this event.
   * This field should be generated by the respective device's adapter.
   */
  pointers?: Pointer<ID>[];
}

/** Middleware using the opinionated RichEventData. */
export type RichMiddleware<
  T = { [key: string]: any },
  ID = string
> = EventMiddleware<RichEventData<ID>, T>;

/** Event processor state extension to capture the current pointers. */
export interface PointerState<ID = string> {
  pointers: { [pointerId: string]: Pointer<ID> };
}

/** Event processor state extension to capture the last-recorded mouse position. */
export interface MousePositionState {
  mousePosition?: { clientX: number; clientY: number };
}

export type InteractionMap<
  T extends string | number | symbol = string
> = Partial<Record<T, (data: RichEventData) => Action | void | undefined>>;
