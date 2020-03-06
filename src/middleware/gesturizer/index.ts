import Pointer from "../pointer";
import {
  GestureState,
  PointerState,
  RichMiddleware,
  RichEventData,
} from "../types";
import TransformData from "./transformData";
import TransformGesture from "./transformGesture";

export { TransformData, TransformGesture };
export { default as mapGestures } from "./mapper";

export type GestureEvent<ID = string> = CustomEvent<{
  context: { [key: string]: any };
  id: ID;
  origin: TransformData;
  target: TransformData;
  transform: TransformData;
}>;

/** Returns a new gesture event. */
export const createGestureEvent = <ID = string>(
  type: string,
  gesture: TransformGesture,
  id: ID,
): GestureEvent<ID> =>
  new CustomEvent(type, {
    detail: {
      context: gesture.context,
      id,
      origin: gesture.getOrigin(),
      target: gesture.getTarget(),
      transform: gesture.getTransform(),
    },
  });

/**
 * Returns an array of only those pointers that belong to the
 * given entity id and pass the predicate.
 *
 * @param pointers The initial array of pointers
 * @param id The entity id
 * @param predicate An optional predicate
 */
export const filterPointers = <ID>(
  pointers: Pointer<ID>[],
  id: ID,
  predicate?: (pointer: Pointer<ID>) => boolean,
) =>
  Object.values(pointers).filter(
    (pointer) => pointer.id === id && (!predicate || predicate(pointer)),
  );

/**
 * Gesturizer, manages transform gestures and dispatches gesture events.
 *
 * @param splitRebaseEvents If set, ends the current gesture and starts a new one
 * if its pointers change. This is usually needed if the UI that applies resulting
 * transformation data needs to support zooming to a vanishing point.
 * @param pointerPredicate Used to filter the processed pointers.
 */
const gesturize = <
  ID extends number | string | symbol = string,
  T extends GestureState<ID> & PointerState<ID> = GestureState<ID> &
    PointerState<ID>
>(
  splitRebaseEvents = true,
  pointerPredicate?: (pointer: Pointer<ID>, data: RichEventData<ID>) => boolean,
): RichMiddleware<T, ID> => (data, processor) => {
  const boundPointerPredicate = pointerPredicate
    ? (pointer: Pointer<ID>) => pointerPredicate(pointer, data)
    : () => true;

  const { ids } = data;
  if (!ids || !data.pointers) return;

  const pointerMap = processor.get("pointers");
  if (!pointerMap) return;
  const pointers = Object.values(
    pointerMap as NonNullable<PointerState<ID>["pointers"]>,
  );

  let gestures = processor.get("gestures") as NonNullable<
    GestureState<ID>["gestures"]
  >;

  switch (data.eventType) {
    case "start":
      ids.forEach((id) => {
        let gesture: TransformGesture | undefined = gestures
          ? gestures[id]
          : undefined;

        const filteredPointers = filterPointers(
          pointers,
          id,
          boundPointerPredicate,
        );
        if (!filteredPointers.length) return;

        if (gesture) {
          if (splitRebaseEvents) {
            processor.dispatch(createGestureEvent("gestureend", gesture, id));

            gesture = new TransformGesture(
              TransformData.fromPointers(filteredPointers),
              { id },
            );

            gestures[id] = gesture;
            processor.dispatch(createGestureEvent("gesturestart", gesture, id));
          } else {
            gesture.rebase(TransformData.fromPointers(filteredPointers));
          }
        } else {
          gesture = new TransformGesture(
            TransformData.fromPointers(filteredPointers),
            { id },
          );

          // Write new gesture to state
          if (!gestures) gestures = {};
          gestures[id] = gesture;
          processor.set("gestures", gestures);

          // Dispatch start event
          processor.dispatch(createGestureEvent("gesturestart", gesture, id));
        }
      });
      break;
    case "move":
      if (!gestures) return;
      ids.forEach((id) => {
        const gesture: TransformGesture | undefined = gestures[id];
        if (!gesture) return;

        const filteredPointers = filterPointers(
          pointers,
          id,
          boundPointerPredicate,
        );
        if (!filteredPointers.length) return;

        gesture.setTarget(TransformData.fromPointers(filteredPointers));

        // Dispatch move event
        processor.dispatch(createGestureEvent("gesturemove", gesture, id));
      });
      break;
    case "end":
      if (!gestures) return;
      ids.forEach((id) => {
        let gesture: TransformGesture | undefined = gestures[id];
        if (!gesture) return;

        const currentPointers = filterPointers(
          data.pointers!,
          id,
          boundPointerPredicate,
        );
        const filteredPointers = filterPointers(
          pointers,
          id,
          boundPointerPredicate,
        );
        const filteredPointersCount = filteredPointers.length;
        if (!(filteredPointersCount || currentPointers.length)) return;

        gesture.setTarget(
          TransformData.fromPointers([...currentPointers, ...filteredPointers]),
        );

        // Check if more pointers are involved in this gesture
        if (filteredPointersCount) {
          if (splitRebaseEvents) {
            processor.dispatch(createGestureEvent("gestureend", gesture, id));

            gesture = new TransformGesture(
              TransformData.fromPointers(filteredPointers),
              { id },
            );

            gestures[id] = gesture;
            processor.dispatch(createGestureEvent("gesturestart", gesture, id));
          } else {
            gesture.rebase(TransformData.fromPointers(filteredPointers));
          }
        } else {
          delete gestures[id];
        }

        // Dispatch end event
        processor.dispatch(createGestureEvent("gestureend", gesture, id));
      });
      break;
    default:
      break;
  }
};

export default gesturize;
