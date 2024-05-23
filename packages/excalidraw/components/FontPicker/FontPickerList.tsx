import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEventHandler,
} from "react";
import { FONT_FAMILY } from "../../constants";
import { useExcalidrawContainer } from "../App";
import { PropertiesPopover } from "../PropertiesPopover";
import { QuickSearch } from "../QuickSearch";
import { ScrollableList } from "../ScrollableList";
import DropdownMenuItem, {
  DropDownMenuItemBadgeType,
  DropDownMenuItemBadge,
} from "../dropdownMenu/DropdownMenuItem";
import { type FontFamilyValues } from "../../element/types";
import { type Node, arrayToList, getFontFamilyString } from "../../utils";
import {
  FreedrawIcon,
  FontFamilyNormalIcon,
  FontFamilyCodeIcon,
} from "../icons";
import { t } from "../../i18n";
import { fontPickerKeyHandler } from "./keyboardNavHandlers";

export interface FontDescriptor {
  value: number;
  icon?: JSX.Element;
  text?: string;
  badge?: {
    type: string;
    placeholder: string;
  };
}

export const getAllFonts = () => [
  {
    value: FONT_FAMILY.Assistant,
    icon: FontFamilyNormalIcon,
    text: "Assistant",
    badge: {
      type: DropDownMenuItemBadgeType.GREEN,
      placeholder: t("fontList.badge.new"),
    },
  },
  {
    value: FONT_FAMILY.Bangers,
    icon: FontFamilyNormalIcon,
    text: "Bangers",
    badge: {
      type: DropDownMenuItemBadgeType.GREEN,
      placeholder: t("fontList.badge.new"),
    },
  },
  {
    value: FONT_FAMILY.Cascadia,
    icon: FontFamilyCodeIcon,
    text: "Cascadia",
  },
  {
    value: FONT_FAMILY.ComicShanns,
    icon: FontFamilyCodeIcon,
    text: "Comic Shanns",
    badge: {
      type: DropDownMenuItemBadgeType.GREEN,
      placeholder: t("fontList.badge.new"),
    },
  },
  {
    value: FONT_FAMILY.Helvetica,
    icon: FontFamilyNormalIcon,
    text: "Helvetica",
  },
  {
    value: FONT_FAMILY.Nunito,
    icon: FontFamilyNormalIcon,
    text: "Nunito",
    badge: {
      type: DropDownMenuItemBadgeType.GREEN,
      placeholder: t("fontList.badge.new"),
    },
  },
  {
    value: FONT_FAMILY.Pacifico,
    icon: FontFamilyNormalIcon,
    text: "Pacifico",
    badge: {
      type: DropDownMenuItemBadgeType.GREEN,
      placeholder: t("fontList.badge.new"),
    },
  },
  {
    value: FONT_FAMILY.PermanentMarker,
    icon: FontFamilyNormalIcon,
    text: "PermanentMarker",
    badge: {
      type: DropDownMenuItemBadgeType.GREEN,
      placeholder: t("fontList.badge.new"),
    },
  },
  {
    value: FONT_FAMILY.TeXGyreHeros,
    icon: FontFamilyNormalIcon,
    text: "TeX Gyre Heros",
    badge: {
      type: DropDownMenuItemBadgeType.GREEN,
      placeholder: t("fontList.badge.new"),
    },
  },
  {
    value: FONT_FAMILY.Virgil2,
    icon: FreedrawIcon,
    text: "Virgil",
    badge: {
      type: DropDownMenuItemBadgeType.GREEN,
      placeholder: t("fontList.badge.new"),
    },
  },
  {
    value: FONT_FAMILY.Virgil,
    icon: FreedrawIcon,
    text: "Virgil Classic",
  },
];

// FIXME_FONTS: dumb for now, might work just on filter fonts & on top of map
export const getFontByValue = (fontFamilyValue: number) => {
  return getAllFonts().find((font) => font.value === fontFamilyValue);
};

export const getUnfocusedFont = (filteredFonts: FontDescriptor[]) =>
  ({
    value: -1,
    prev: filteredFonts[filteredFonts.length - 1],
    next: filteredFonts[0],
  } as Node<FontDescriptor>);

interface FontPickerListProps {
  selectedFontFamily: FontFamilyValues;
  onPick: (value: number) => void;
  onClose: () => void;
}

export const FontPickerList = React.memo(
  ({ selectedFontFamily, onPick, onClose }: FontPickerListProps) => {
    const { container } = useExcalidrawContainer();
    const [searchTerm, setSearchTerm] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // FIXME_FONTS: could be more optimized
    const filteredFonts = useMemo(
      () =>
        arrayToList(
          getAllFonts().filter((font) =>
            font.text?.toLowerCase().includes(searchTerm),
          ),
        ),
      [searchTerm],
    );

    const [focusedFont, setFocusedFont] = useState(
      getUnfocusedFont(filteredFonts),
    );

    useEffect(
      () => setFocusedFont(getUnfocusedFont(filteredFonts)),
      [filteredFonts],
    );

    const handleKeyDown = useCallback<KeyboardEventHandler<HTMLDivElement>>(
      (event) => {
        const handled = fontPickerKeyHandler({
          event,
          inputRef,
          focusedFont,
          filteredFonts,
          setFocusedFont,
          onClose,
          onPick,
        });

        if (handled) {
          event.preventDefault();
          event.stopPropagation();
        }
      },
      [focusedFont, filteredFonts, onClose, onPick],
    );

    return (
      <PropertiesPopover
        className="properties-content"
        container={container}
        style={{ width: "15rem" }}
        onClose={onClose}
        onKeyDown={handleKeyDown}
      >
        <QuickSearch
          ref={inputRef}
          placeholder={t("quickSearch.placeholder")}
          onChange={setSearchTerm}
        />
        <ScrollableList
          className="FontPicker__list dropdown-menu"
          placeholder={t("fontList.empty")}
        >
          {filteredFonts.map((font, index) => (
            <DropdownMenuItem
              key={index}
              value={font.value}
              style={{
                fontFamily: getFontFamilyString({ fontFamily: font.value }),
              }}
              selected={font.value === selectedFontFamily}
              focus={font.value === focusedFont?.value}
              onClick={(e) => onPick(Number(e.currentTarget.value))}
              // onFocus is interrupted by something & we read the currentTarget anyway, so we could detect already in a capture phase
              onFocusCapture={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setFocusedFont(font);
              }}
            >
              {font.text}
              {font.badge && (
                <DropDownMenuItemBadge type={font.badge.type}>
                  {font.badge.placeholder}
                </DropDownMenuItemBadge>
              )}
            </DropdownMenuItem>
          ))}
        </ScrollableList>
      </PropertiesPopover>
    );
  },
  (prev, next) => prev.selectedFontFamily === next.selectedFontFamily,
);
