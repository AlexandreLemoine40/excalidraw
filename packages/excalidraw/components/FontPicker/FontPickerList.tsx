import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEventHandler,
} from "react";
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
import { Fonts } from "../../fonts";
import type { ValueOf } from "../../utility-types";

export interface FontDescriptor {
  value: number;
  text: string;
  badge?: {
    type: ValueOf<typeof DropDownMenuItemBadgeType>;
    placeholder: string;
  };
}

interface FontPickerListProps {
  selectedFontFamily: FontFamilyValues | null;
  onPick: (value: number) => void;
  onClose: () => void;
}

export const FontPickerList = React.memo(
  ({ selectedFontFamily, onPick, onClose }: FontPickerListProps) => {
    const { container } = useExcalidrawContainer();
    const [searchTerm, setSearchTerm] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const allFonts = useMemo(
      () =>
        Array.from(Fonts.registered.entries())
          .filter(([_, { metrics }]) => !metrics.hidden)
          .map(([familyId, { metrics, fontFaces }]) => {
            const font = {
              value: familyId,
              text: fontFaces[0].fontFace.family,
            };

            if (metrics.badge === "new") {
              Object.assign(font, {
                badge: {
                  type: DropDownMenuItemBadgeType.GREEN,
                  placeholder: t("fontList.badge.new"),
                },
              });
            }

            return font as FontDescriptor;
          })
          .sort((a, b) => (a.text > b.text ? 1 : -1)),
      [],
    );

    const filteredFonts = useMemo(
      () =>
        arrayToList(
          allFonts.filter((font) =>
            font.text?.toLowerCase().includes(searchTerm),
          ),
        ),
      [allFonts, searchTerm],
    );

    const getSelectedFont = useMemo(
      () => filteredFonts.find((font) => font.value === selectedFontFamily),
      [filteredFonts, selectedFontFamily],
    );

    const [currentFont, setCurrentFont] = useState<
      Node<FontDescriptor> | undefined
    >(getSelectedFont);

    useEffect(
      () => setCurrentFont(getSelectedFont ?? filteredFonts[0]),
      [filteredFonts, getSelectedFont],
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
              textStyle={{
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
