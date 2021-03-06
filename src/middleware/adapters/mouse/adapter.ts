import Pointer from "../../pointer";
import { PointerState, RichEventState, RichMiddleware } from "../../types";
import { preventDefaultHelper } from "../../utils";

export const pointerId = "mouse";

const buildPointerDetail = (event: MouseEvent) => ({
  buttons: event.buttons,
  clientX: event.clientX,
  clientY: event.clientY,
  event,
  identifier: pointerId,
  pressure: event.buttons ? 1 : 0,
});

const buildPointer = <ID = string>(id: ID, event: MouseEvent) =>
  new Pointer<ID>(id, buildPointerDetail(event), {
    device: "mouse",
    startTime: event.timeStamp,

    altKey: event.altKey,
    button: event.button,
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
    shiftKey: event.shiftKey,
  });

/**
 * Mouse adapter, generates & tracks pointer data for mouse events.
 *
 * @param handleUnidentified If set, events not associated to an entity are
 * still recorded in `data.unidentifiedPointers`.
 */
const mouseAdapter = <
  ID = string,
  T extends RichEventState & PointerState<ID> = RichEventState &
    PointerState<ID>
>(
  handleUnidentified = false,
): RichMiddleware<T, ID> => (data, processor) => {
  if (data.device !== "mouse") return;

  const type = data.eventType;
  let pointers = processor.get("pointers");

  if (type === "start") {
    // Get id from caller arguments
    const id = data.args[0];

    if (id !== undefined) {
      preventDefaultHelper(data.event, processor);

      // Create pointer
      const pointer = buildPointer(id, data.event as MouseEvent);

      // Write id & pointer to context
      data.ids = [id];
      data.pointers = [pointer];

      // Write pointer to state
      if (!pointers) pointers = {};
      (pointers as PointerState<ID>["pointers"])![pointerId] = pointer;
      processor.set("pointers", pointers);
    }
  } else if (pointers) {
    // Get registered pointer (if any)
    const pointer = pointers[pointerId];

    if (pointer) {
      preventDefaultHelper(data.event, processor);

      // Update pointer
      pointer.detail = buildPointerDetail(data.event as MouseEvent);

      // Write id & pointer to context
      data.ids = [pointer.id];
      data.pointers = [pointer];

      if (type === "end") {
        delete pointers[pointerId];
      }
    }
  }

  if (handleUnidentified && !data.ids) {
    preventDefaultHelper(data.event, processor);
    data.unidentifiedPointers = [
      buildPointer(undefined, data.event as MouseEvent),
    ];
  }
};

export default mouseAdapter;
