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
import { t } from "../../i18n";
import { fontPickerKeyHandler } from "./keyboardNavHandlers";

export interface FontDescriptor {
  value: number;
  text?: string;
  badge?: {
    type: string;
    placeholder: string;
  };
}

export const ALL_FONTS = [
  {
    value: FONT_FAMILY.Assistant,
    text: "Assistant",
    badge: {
      type: DropDownMenuItemBadgeType.GREEN,
      placeholder: t("fontList.badge.new"),
    },
  },
  {
    value: FONT_FAMILY.Bangers,
    text: "Bangers",
    badge: {
      type: DropDownMenuItemBadgeType.GREEN,
      placeholder: t("fontList.badge.new"),
    },
  },
  {
    value: FONT_FAMILY.Cascadia,
    text: "Cascadia",
  },
  {
    value: FONT_FAMILY.ComicShanns,
    text: "Comic Shanns",
    badge: {
      type: DropDownMenuItemBadgeType.GREEN,
      placeholder: t("fontList.badge.new"),
    },
  },
  {
    value: FONT_FAMILY.Helvetica,
    text: "Helvetica",
  },
  {
    value: FONT_FAMILY.Nunito,
    text: "Nunito",
    badge: {
      type: DropDownMenuItemBadgeType.GREEN,
      placeholder: t("fontList.badge.new"),
    },
  },
  {
    value: FONT_FAMILY.Pacifico,
    text: "Pacifico",
    badge: {
      type: DropDownMenuItemBadgeType.GREEN,
      placeholder: t("fontList.badge.new"),
    },
  },
  {
    value: FONT_FAMILY.PermanentMarker,
    text: "Permanent Marker",
    badge: {
      type: DropDownMenuItemBadgeType.GREEN,
      placeholder: t("fontList.badge.new"),
    },
  },
  {
    value: FONT_FAMILY.TeXGyreHeros,
    text: "TeX Gyre Heros",
    badge: {
      type: DropDownMenuItemBadgeType.GREEN,
      placeholder: t("fontList.badge.new"),
    },
  },
  {
    value: FONT_FAMILY.Virgil2,
    text: "Virgil",
    badge: {
      type: DropDownMenuItemBadgeType.GREEN,
      placeholder: t("fontList.badge.new"),
    },
  },
  {
    value: FONT_FAMILY.Virgil,
    text: "Virgil Classic",
  },
];

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

    const filteredFonts = useMemo(
      () =>
        arrayToList(
          ALL_FONTS.filter((font) =>
            font.text?.toLowerCase().includes(searchTerm),
          ),
        ),
      [searchTerm],
    );

    const getFontByValue = useMemo(
      () => filteredFonts.find((font) => font.value === selectedFontFamily),
      [filteredFonts, selectedFontFamily],
    );

    const [currentFont, setCurrentFont] = useState<
      Node<FontDescriptor> | undefined
    >(getFontByValue);
    useEffect(
      () => setCurrentFont(getFontByValue ?? filteredFonts[0]),
      [filteredFonts, getFontByValue],
    );

    const handleKeyDown = useCallback<KeyboardEventHandler<HTMLDivElement>>(
      (event) => {
        const handled = fontPickerKeyHandler({
          event,
          inputRef,
          currentFont,
          setCurrentFont,
          onClose,
          onPick,
        });

        if (handled) {
          event.preventDefault();
          event.stopPropagation();
        }
      },
      [currentFont, onClose, onPick],
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
          className="dropdown-menu max-items-8 manual-hover"
          placeholder={t("fontList.empty")}
        >
          {filteredFonts.map((font) => (
            <DropdownMenuItem
              key={font.value}
              value={font.value}
              style={{
                fontFamily: getFontFamilyString({ fontFamily: font.value }),
              }}
              hovered={font.value === currentFont?.value}
              selected={font.value === selectedFontFamily}
              // allow to tab between search and selected font
              tabIndex={font.value === selectedFontFamily ? 0 : -1}
              onClick={(e) => {
                onPick(Number(e.currentTarget.value));
                // bring focus back to the input
                inputRef.current?.focus();
              }}
              onMouseMove={() => {
                if (currentFont?.value !== font.value) {
                  setCurrentFont(font);
                }
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
