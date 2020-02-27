import {
  InteractionMap,
  RichMiddleware,
  EventType,
  RichEventData,
} from "../../types";
import { doesMatchFilter } from "../../../utils";

export enum MouseInteractionType {
  "LMB" = 0,
  "MMB" = 1,
  "RMB" = 2,
  "back" = 3,
  "forward" = 4,
}

/** Mouse mapper, generates actions from mouse events. */
const mapMouse = <T = { [key: string]: any }, ID = string>(
  map: InteractionMap<MouseInteractionType, ID, MouseEvent>,
  filter?: EventType | EventType[],
): RichMiddleware<T, ID> => (data) => {
  if (
    data.device !== "mouse" ||
    !doesMatchFilter(data.eventType, filter) ||
    data.eventType === "move"
  ) {
    return;
  }

  const mappingFunction =
    map[(data.event as MouseEvent).button as MouseInteractionType];

  if (!mappingFunction) return;

  const action = mappingFunction(data as RichEventData<ID, MouseEvent>);
  if (!action) return;

  if (data.actions) {
    data.actions.push(action);
  } else {
    data.actions = [action];
  }
};

export default mapMouse;
