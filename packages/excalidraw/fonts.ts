import type Scene from "./scene/Scene";
import { ShapeCache } from "./scene/ShapeCache";
import { isTextElement } from "./element";
import { newElementWith } from "./element/mutateElement";
import type { ExcalidrawTextElement, FontFamilyValues } from "./element/types";
import { getFontString } from "./utils";
import { FONT_FAMILY } from "./constants";

import type { ValueOf } from "./utility-types";
import { stringToBase64, toByteString } from "./data/encode";

import Virgil from "./fonts/Virgil.woff2";
import Excalifont from "./fonts/Excalifont.woff2";
import AssistantRegular from "./fonts/Assistant-Regular.woff2";
import AssistantMedium from "./fonts/Assistant-Medium.woff2";
import AssistantSemiBold from "./fonts/Assistant-SemiBold.woff2";
import AssistantBold from "./fonts/Assistant-Bold.woff2";
import Cascadia from "./fonts/CascadiaMono-Regular.woff2";
import ComicShanns from "./fonts/ComicShanns2.woff2";
import TeXGyreHeros from "./fonts/TeXGyreHeros.woff2";

import BangersVietnamese from "https://fonts.gstatic.com/s/bangers/v24/FeVQS0BTqb0h60ACH5FQ2J5hm25mww.woff2";
import BangersLatinExt from "https://fonts.gstatic.com/s/bangers/v24/FeVQS0BTqb0h60ACH5BQ2J5hm25mww.woff2";
import BangersLatin from "https://fonts.gstatic.com/s/bangers/v24/FeVQS0BTqb0h60ACH55Q2J5hm24.woff2";

import NunitoCyrilicExt from "https://fonts.gstatic.com/s/nunito/v26/XRXI3I6Li01BKofiOc5wtlZ2di8HDLshdTk3j6zbXWjgevT5.woff2";
import NunitoCyrilic from "https://fonts.gstatic.com/s/nunito/v26/XRXI3I6Li01BKofiOc5wtlZ2di8HDLshdTA3j6zbXWjgevT5.woff2";
import NunitoVietnamese from "https://fonts.gstatic.com/s/nunito/v26/XRXI3I6Li01BKofiOc5wtlZ2di8HDLshdTs3j6zbXWjgevT5.woff2";
import NunitoLatinExt from "https://fonts.gstatic.com/s/nunito/v26/XRXI3I6Li01BKofiOc5wtlZ2di8HDLshdTo3j6zbXWjgevT5.woff2";
import NunitoLatin from "https://fonts.gstatic.com/s/nunito/v26/XRXI3I6Li01BKofiOc5wtlZ2di8HDLshdTQ3j6zbXWjgeg.woff2";

import PacificoCyrlicExt from "https://fonts.gstatic.com/s/pacifico/v22/FwZY7-Qmy14u9lezJ-6K6MmBp0u-zK4.woff2";
import PacificoVietnamese from "https://fonts.gstatic.com/s/pacifico/v22/FwZY7-Qmy14u9lezJ-6I6MmBp0u-zK4.woff2";
import PacificoLatinExt from "https://fonts.gstatic.com/s/pacifico/v22/FwZY7-Qmy14u9lezJ-6J6MmBp0u-zK4.woff2";
import PacificoLatin from "https://fonts.gstatic.com/s/pacifico/v22/FwZY7-Qmy14u9lezJ-6H6MmBp0u-.woff2";

import PermanentMarker from "https://fonts.gstatic.com/s/permanentmarker/v16/Fh4uPib9Iyv2ucM6pGQMWimMp004La2Cf5b6jlg.woff2";

/** For head & hhea metrics read the woff2 with https://fontdrop.info/  */
interface FontMetrics {
  /** head.unitsPerEm */
  unitsPerEm: 1000 | 1024 | 2048;
  /** hhea.ascender */
  ascender: number;
  /** hhea.descender */
  descender: number;
  /** harcoded unitless line-height, https://github.com/excalidraw/excalidraw/pull/6360#issuecomment-1477635971 */
  lineHeight: number;
  /**  */
  badge?: "new";
}

const DEFAULT_FONT_METRICS: Record<number, FontMetrics> = {
  [FONT_FAMILY.Virgil]: {
    unitsPerEm: 1000,
    ascender: 886,
    descender: -374,
    lineHeight: 1.25,
  },
  [FONT_FAMILY.Excalifont]: {
    unitsPerEm: 1000,
    ascender: 886,
    descender: -374,
    lineHeight: 1.25,
    badge: "new",
  },
  [FONT_FAMILY.Helvetica]: {
    unitsPerEm: 2048,
    ascender: 1577,
    descender: -471,
    lineHeight: 1.15,
  },
  [FONT_FAMILY.Cascadia]: {
    unitsPerEm: 2048,
    ascender: 1900,
    descender: -480,
    lineHeight: 1.2,
  },
  [FONT_FAMILY.Assistant]: {
    unitsPerEm: 1000,
    ascender: 1021,
    descender: -287,
    lineHeight: 1.25,
    badge: "new",
  },
  [FONT_FAMILY.Nunito]: {
    unitsPerEm: 1000,
    ascender: 1011,
    descender: -353,
    lineHeight: 1.25,
    badge: "new",
  },
  [FONT_FAMILY.Bangers]: {
    unitsPerEm: 1000,
    ascender: 883,
    descender: -181,
    lineHeight: 1.25,
    badge: "new",
  },
  [FONT_FAMILY.Pacifico]: {
    unitsPerEm: 1000,
    ascender: 1303,
    descender: -453,
    lineHeight: 1.75,
    badge: "new",
  },
  [FONT_FAMILY["Comic Shanns"]]: {
    unitsPerEm: 1000,
    ascender: 750,
    descender: -250,
    lineHeight: 1.2,
    badge: "new",
  },
  [FONT_FAMILY["Permanent Marker"]]: {
    unitsPerEm: 1024,
    ascender: 1136,
    descender: -325,
    lineHeight: 1.25,
    badge: "new",
  },
  [FONT_FAMILY["TeX Gyre Heros"]]: {
    unitsPerEm: 1000,
    ascender: 1148,
    descender: -284,
    lineHeight: 1.15,
    badge: "new",
  },
};

/** Unicode ranges */
const LATIN_RANGE =
  "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";
const LATIN_EXT_RANGE =
  "U+0100-02AF, U+0304, U+0308, U+0329, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF";
const CYRILIC_EXT_RANGE =
  "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F";
const CYRILIC_RANGE = "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116";
const VIETNAMESE_RANGE =
  "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB";

/**
 * Calculates vertical offset for a text with alphabetic baseline.
 */
export const getVerticalOffset = (
  fontFamily: ExcalidrawTextElement["fontFamily"],
  fontSize: ExcalidrawTextElement["fontSize"],
  lineHeightPx: number,
) => {
  const { unitsPerEm, ascender, descender } =
    Fonts.registered.get(fontFamily)?.metrics ||
    DEFAULT_FONT_METRICS[FONT_FAMILY.Virgil];

  const fontSizeEm = fontSize / unitsPerEm;
  const lineGap =
    (lineHeightPx - fontSizeEm * ascender + fontSizeEm * descender) / 2;

  const verticalOffset = fontSizeEm * ascender + lineGap;
  return verticalOffset;
};

/**
 * Gets line height forr a selected family.
 */
export const getLineHeight = (fontFamily: FontFamilyValues) => {
  const { lineHeight } =
    Fonts.registered.get(fontFamily)?.metrics ||
    DEFAULT_FONT_METRICS[FONT_FAMILY.Excalifont];

  return lineHeight as ExcalidrawTextElement["lineHeight"];
};

class ExcalidrawFont {
  public readonly url: URL;
  public readonly fontFace: FontFace;

  constructor(family: string, uri: string, descriptors?: FontFaceDescriptors) {
    // base urls will be applied for relative `uri`'s only
    this.url = new URL(
      uri,
      window.EXCALIDRAW_ASSET_PATH ??
        `https://unpkg.com/${import.meta.env.VITE_PKG_NAME}@${
          import.meta.env.PKG_VERSION
        }/dist/prod/`,
    );

    this.fontFace = new FontFace(family, `url(${this.url})`, {
      display: "swap",
      style: "normal",
      weight: "400",
      ...descriptors,
    });
  }

  public async getContent(): Promise<string> {
    if (this.url.protocol === "data:") {
      // it's dataurl uri, the font is inlined as base64, no need to fetch
      return this.url.toString();
    }

    const response = await fetch(this.url, {
      headers: {
        Accept: "font/woff2",
      },
    });

    if (!response.ok) {
      console.error(
        `Couldn't fetch font-family "${this.fontFace.family}" from url "${this.url}"`,
        await response.json(),
      );
    }

    const mimeType = await response.headers.get("Content-Type");
    const buffer = await response.arrayBuffer();

    return `data:${mimeType};base64,${await stringToBase64(
      await toByteString(buffer),
      true,
    )}`;
  }
}

export class Fonts {
  // it's ok to track fonts across multiple instances only once, so let's use
  // a static member to reduce memory footprint
  private static readonly loadedFontsCache = new Set<string>();
  public static readonly registered = Fonts.init();

  private readonly scene: Scene;

  public get registered() {
    return Fonts.registered;
  }

  public get sceneFamilies() {
    return Array.from(
      this.scene.getNonDeletedElements().reduce((families, element) => {
        if (isTextElement(element)) {
          families.add(element.fontFamily);
        }
        return families;
      }, new Set<number>()),
    );
  }

  constructor({ scene }: { scene: Scene }) {
    this.scene = scene;
  }

  /**
   * if we load a (new) font, it's likely that text elements using it have
   * already been rendered using a fallback font. Thus, we want invalidate
   * their shapes and rerender. See #637.
   *
   * Invalidates text elements and rerenders scene, provided that at least one
   * of the supplied fontFaces has not already been processed.
   */
  public onLoaded = (fontFaces: readonly FontFace[]) => {
    if (
      // bail if all fonts with have been processed. We're checking just a
      // subset of the font properties (though it should be enough), so it
      // can technically bail on a false positive.
      fontFaces.every((fontFace) => {
        const sig = `${fontFace.family}-${fontFace.style}-${fontFace.weight}`;
        if (Fonts.loadedFontsCache.has(sig)) {
          return true;
        }
        Fonts.loadedFontsCache.add(sig);
        return false;
      })
    ) {
      return false;
    }

    let didUpdate = false;

    this.scene.mapElements((element) => {
      if (isTextElement(element)) {
        didUpdate = true;
        ShapeCache.delete(element);
        return newElementWith(element, {}, true);
      }
      return element;
    });

    if (didUpdate) {
      this.scene.triggerUpdate();
    }
  };

  public load = async () => {
    // Add all registered font faces into the `document.fonts` (if not added already)
    for (const { fontFaces } of Fonts.registered.values()) {
      for (const { fontFace } of fontFaces) {
        if (!window.document.fonts.has(fontFace)) {
          window.document.fonts.add(fontFace);
        }
      }
    }

    const loaded = await Promise.all(
      this.sceneFamilies.map(async (fontFamily) => {
        const fontString = getFontString({
          fontFamily,
          fontSize: 16,
        });

        // WARN: without "text" param it does not have to mean that all font faces are loaded, instead it could be just one!
        if (!window.document.fonts.check(fontString)) {
          try {
            // WARN: browser prioritizes loading only font faces with unicode ranges for characters which are present in the document (html & canvas), other font faces could stay unloaded
            // we might want to retry here, i.e.  in case CDN is down, but so far I didn't experience any issues - maybe it handles retry-like logic under the hood
            return await window.document.fonts.load(fontString);
          } catch (e) {
            // don't let it all fail if just one font fails to load
            console.error(
              `Failed to load font: "${fontString}" with error "${e}", given the following registered fonts:`,
              JSON.stringify(Fonts.registered.get(fontFamily), undefined, 2),
            );
          }
        }

        return Promise.resolve();
      }),
    );

    this.onLoaded(loaded.flat().filter(Boolean) as FontFace[]);
  };

  /**
   * Register a new font.
   *
   * @param family font family
   * @param metrics font metrics
   * @param params array of the rest of the FontFace parameters [uri: string, descriptors: FontFaceDescriptors?] ,
   */
  public static register(
    family: string,
    metrics: FontMetrics,
    ...params: Array<{ uri: string; descriptors?: FontFaceDescriptors }>
  ) {
    // TODO: likely we will need to abandon number "id" in order to support custom fonts
    const familyId = FONT_FAMILY[family as keyof typeof FONT_FAMILY];
    const registeredFamily = this.registered.get(familyId);

    if (!registeredFamily) {
      this.registered.set(familyId, {
        metrics,
        fontFaces: params.map(
          ({ uri, descriptors }) =>
            new ExcalidrawFont(family, uri, descriptors),
        ),
      });
    }

    return this.registered;
  }

  /**
   * WARN: should be called just once on init, even across multiple instances.
   */
  private static init() {
    const fonts = {
      registered: new Map<
        ValueOf<typeof FONT_FAMILY>,
        { metrics: FontMetrics; fontFaces: ExcalidrawFont[] }
      >(),
    };

    const register = Fonts.register.bind(fonts);

    register("Virgil", DEFAULT_FONT_METRICS[FONT_FAMILY.Virgil], {
      uri: Virgil,
    });
    register("Excalifont", DEFAULT_FONT_METRICS[FONT_FAMILY.Excalifont], {
      uri: Excalifont,
    });
    register(
      "TeX Gyre Heros",
      DEFAULT_FONT_METRICS[FONT_FAMILY["TeX Gyre Heros"]],
      { uri: TeXGyreHeros },
    );

    // keeping for backwards compatibility reasons, using system font
    register("Helvetica", DEFAULT_FONT_METRICS[FONT_FAMILY.Helvetica], {
      uri: "",
    });
    register("Cascadia", DEFAULT_FONT_METRICS[FONT_FAMILY.Cascadia], {
      uri: Cascadia,
    });

    register(
      "Comic Shanns",
      DEFAULT_FONT_METRICS[FONT_FAMILY["Comic Shanns"]],
      { uri: ComicShanns },
    );

    /** Assistant */
    register(
      "Assistant",
      DEFAULT_FONT_METRICS[FONT_FAMILY.Assistant],
      { uri: AssistantRegular },
      { uri: AssistantMedium, descriptors: { weight: "500" } },
      { uri: AssistantSemiBold, descriptors: { weight: "600" } },
      { uri: AssistantBold, descriptors: { weight: "700" } },
    );

    /** Bangers */
    register(
      "Bangers",
      DEFAULT_FONT_METRICS[FONT_FAMILY.Bangers],
      {
        uri: BangersVietnamese,
        descriptors: { unicodeRange: VIETNAMESE_RANGE },
      },
      { uri: BangersLatinExt, descriptors: { unicodeRange: LATIN_EXT_RANGE } },
      { uri: BangersLatin, descriptors: { unicodeRange: LATIN_RANGE } },
    );

    /** Nunito */
    register(
      "Nunito",
      DEFAULT_FONT_METRICS[FONT_FAMILY.Nunito],
      {
        uri: NunitoCyrilicExt,
        descriptors: { unicodeRange: CYRILIC_EXT_RANGE },
      },
      { uri: NunitoCyrilic, descriptors: { unicodeRange: CYRILIC_RANGE } },
      {
        uri: NunitoVietnamese,
        descriptors: { unicodeRange: VIETNAMESE_RANGE },
      },
      { uri: NunitoLatinExt, descriptors: { unicodeRange: LATIN_EXT_RANGE } },
      { uri: NunitoLatin, descriptors: { unicodeRange: LATIN_RANGE } },
    );

    /** Pacifico */
    register(
      "Pacifico",
      DEFAULT_FONT_METRICS[FONT_FAMILY.Pacifico],
      {
        uri: PacificoCyrlicExt,
        descriptors: { unicodeRange: CYRILIC_EXT_RANGE },
      },
      {
        uri: PacificoVietnamese,
        descriptors: { unicodeRange: VIETNAMESE_RANGE },
      },
      { uri: PacificoLatinExt, descriptors: { unicodeRange: LATIN_EXT_RANGE } },
      { uri: PacificoLatin, descriptors: { unicodeRange: LATIN_RANGE } },
    );

    /** Permanent marker */
    register(
      "Permanent Marker",
      DEFAULT_FONT_METRICS[FONT_FAMILY["Permanent Marker"]],
      { uri: PermanentMarker, descriptors: { unicodeRange: LATIN_RANGE } },
    );

    return fonts.registered;
  }
}
