import type { Node } from "../../utils";
import { KEYS } from "../../keys";
import { type FontDescriptor } from "./FontPickerList";

interface FontPickerKeyNavHandlerProps {
  event: React.KeyboardEvent<HTMLDivElement>;
  inputRef: React.RefObject<HTMLInputElement>;
  currentFont: Node<FontDescriptor> | undefined;
  setCurrentFont: React.Dispatch<
    React.SetStateAction<Node<FontDescriptor> | undefined>
  >;
  onClose: () => void;
  onPick: (value: number) => void;
}

export const fontPickerKeyHandler = ({
  event,
  inputRef,
  currentFont,
  setCurrentFont,
  onClose,
  onPick,
}: FontPickerKeyNavHandlerProps) => {
  if (
    !event[KEYS.CTRL_OR_CMD] &&
    event.shiftKey &&
    event.key.toLowerCase() === KEYS.F
  ) {
    // refocus input on the popup trigger shortcut
    inputRef.current?.focus();
    return true;
  }

  if (event.key === KEYS.ESCAPE) {
    onClose();
    return true;
  }

  if (event.key === KEYS.ENTER) {
    if (currentFont?.value) {
      onPick(currentFont.value);
    }

    return true;
  }

  if (event.key === KEYS.ARROW_DOWN) {
    if (currentFont?.next) {
      setCurrentFont(currentFont.next);
    }
    return true;
  }

  if (event.key === KEYS.ARROW_UP) {
    if (currentFont?.prev) {
      setCurrentFont(currentFont.prev);
    }
    return true;
  }
};
