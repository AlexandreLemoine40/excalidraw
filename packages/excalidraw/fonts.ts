import type Scene from "./scene/Scene";
import { ShapeCache } from "./scene/ShapeCache";
import { isTextElement } from "./element";
import { newElementWith } from "./element/mutateElement";
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
}

export const FONT_METRICS: Record<number, FontMetrics> = {
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
  },
  [FONT_FAMILY.Helvetica]: {
    unitsPerEm: 2048,
    ascender: 1577,
    descender: -471,
    lineHeight: 1.15,
  },
  [FONT_FAMILY.TeXGyreHeros]: {
    unitsPerEm: 1000,
    ascender: 1148,
    descender: -284,
    lineHeight: 1.15,
  },
  [FONT_FAMILY.Cascadia]: {
    unitsPerEm: 2048,
    ascender: 1900,
    descender: -480,
    lineHeight: 1.2,
  },
  [FONT_FAMILY.ComicShanns]: {
    unitsPerEm: 1000,
    ascender: 750,
    descender: -250,
    lineHeight: 1.2,
  },
  [FONT_FAMILY.Assistant]: {
    unitsPerEm: 1000,
    ascender: 1021,
    descender: -287,
    lineHeight: 1.25,
  },
  [FONT_FAMILY.Nunito]: {
    unitsPerEm: 1000,
    ascender: 1011,
    descender: -353,
    lineHeight: 1.25,
  },
  [FONT_FAMILY.Bangers]: {
    unitsPerEm: 1000,
    ascender: 883,
    descender: -181,
    lineHeight: 1.25,
  },
  [FONT_FAMILY.PermanentMarker]: {
    unitsPerEm: 1024,
    ascender: 1136,
    descender: -325,
    lineHeight: 1.25,
  },
  [FONT_FAMILY.Pacifico]: {
    unitsPerEm: 1000,
    ascender: 1303,
    descender: -453,
    lineHeight: 1.75,
  },
};

export class ExcalidrawFont {
  public readonly uri: string;
  public readonly url: URL;
  public readonly fontFace: FontFace;

  constructor(family: string, uri: string, descriptors?: FontFaceDescriptors) {
    this.uri = uri;
    
    // base urls will be applied for relative `uri`'s only
    this.url = new URL(uri, window.EXCALIDRAW_ASSET_PATH ?? `https://unpkg.com/${import.meta.env.VITE_PKG_NAME}@${
        import.meta.env.PKG_VERSION
      }/dist/browser/prod/excalidraw-assets`);

    this.fontFace = new FontFace(family, `url(${this.url.href})`, {
      display: "swap",
      style: "normal",
      weight: "400",
      ...descriptors,
    });
  }

  public async getContent(): Promise<string> {
    if (this.url.protocol === "data:") {
      // it's dataurl uri, the font is inlined as base64, no need to fetch
      return this.uri;
    }

    const response = await fetch(this.uri, {
      headers: {
        Accept: "font/woff2",
      },
    });

    if (!response.ok) {
      console.error(
        `Couldn't fetch font-family "${this.fontFace.family}" from url ${this.uri}`,
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

export class Fonts {
  // it's ok to track fonts across multiple instances only once, so let's use
  // a static member to reduce memory footprint
  private static readonly loadedFontsCache = new Set<string>();
  public static readonly registered = Fonts.init();

  private readonly scene: Scene;

  public get metrics() {
    return Array.from(Fonts.registered.values()).map((x) => x.metrics);
  }

  public get fontFaces() {
    return Array.from(Fonts.registered.values()).map((x) => x.fontFaces);
  }

  public get sceneFamilies() {
    return this.scene.getNonDeletedElements().reduce((families, element) => {
      if (isTextElement(element)) {
        families.add(element.fontFamily);
      }
      return families;
    }, new Set<number>());
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
      return element;``
    });

    if (didUpdate) {
      this.scene.triggerUpdate();
    }
  };

  /**
   * Best UX comes from preloading all regular fonts on scene init (asynchronously) as it avoids:
   * - rendering fallback font, new font download & swap (flick) on font selection
   * - rendering wrong text bb on font selection due to fallback
   * - avoids detecting and dynamically loading fonts on remote client changes
   * - avoids hardcoding SVG for preview / icons in font list
   *
   * In the future, for bigger fonts (i.e. CJK), custom fonts or rich text (bold/italic), we might prefer to swap (fallback to regular first) and dynamically load the specific font based on the family & glyhps used.
   **/
  public load = async () => {
    for (const { fontFaces } of Fonts.registered.values()) {
      for (const { fontFace} of fontFaces) {
        if (!window.document.fonts.has(fontFace)) {
          window.document.fonts.add(fontFace);
        }
      }
    }

    // FIXME_FONTS: don't let it all fail if just one font fails to load
    const loaded = await Promise.all(
      // TODO: loading all fonts to mitigate initial edge cases, slowly we could transition into loading just scene fonts and on change loading & redrawing
      Array.from(Fonts.registered.keys()).map((fontFamily) => {
        const fontString = getFontString({
          fontFamily,
          fontSize: 16,
        });

        if (!window.document.fonts.check(fontString)) {
          return window.document.fonts.load(fontString);
        }

        return undefined;
      }),
    );

    this.onLoaded(loaded.flat().filter(Boolean) as FontFace[]);
  };

  public static register(
    family: ValueOf<typeof FONT_FAMILY>,
    metrics: FontMetrics,
    ...fontFaces: ExcalidrawFont[]
  ) {
    const registeredFamily = this.registered.get(family);

    if (!registeredFamily) {
      this.registered.set(family, {
        metrics,
        fontFaces,
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

    register(
      FONT_FAMILY.Virgil,
      FONT_METRICS[FONT_FAMILY.Virgil],
      new ExcalidrawFont("Virgil", Virgil),
    );
    register(
      FONT_FAMILY.Excalifont,
      FONT_METRICS[FONT_FAMILY.Excalifont],
      new ExcalidrawFont("Excalifont", Excalifont),
    );
    register(
      FONT_FAMILY.TeXGyreHeros,
      FONT_METRICS[FONT_FAMILY.TeXGyreHeros],
      new ExcalidrawFont("TeXGyreHeros", TeXGyreHeros),
    );
    // keeping for backwards compatibility reasons, using system font
    register(FONT_FAMILY.Helvetica, FONT_METRICS[FONT_FAMILY.Helvetica]);
    register(
      FONT_FAMILY.Cascadia,
      FONT_METRICS[FONT_FAMILY.Cascadia],
      new ExcalidrawFont("Cascadia", Cascadia),
    );
    register(
      FONT_FAMILY.ComicShanns,
      FONT_METRICS[FONT_FAMILY.ComicShanns],
      new ExcalidrawFont("ComicShanns", ComicShanns),
    );

    /** Assistant */
    register(
      FONT_FAMILY.Assistant,
      FONT_METRICS[FONT_FAMILY.Assistant],
      new ExcalidrawFont("Assistant", AssistantRegular),
      new ExcalidrawFont("Assistant", AssistantMedium, { weight: "500" }),
      new ExcalidrawFont("Assistant", AssistantSemiBold, { weight: "600" }),
      new ExcalidrawFont("Assistant", AssistantBold, { weight: "700" }),
    );

    /** Bangers */
    register(
      FONT_FAMILY.Bangers,
      FONT_METRICS[FONT_FAMILY.Bangers],
      new ExcalidrawFont("Bangers", BangersVietnamese, {
        unicodeRange: VIETNAMESE_RANGE,
      }),
      new ExcalidrawFont("Bangers", BangersLatinExt, {
        unicodeRange: LATIN_EXT_RANGE,
      }),
      new ExcalidrawFont("Bangers", BangersLatin, {
        unicodeRange: LATIN_RANGE,
      }),
    );

    /** Nunito */
    register(
      FONT_FAMILY.Nunito,
      FONT_METRICS[FONT_FAMILY.Nunito],
      new ExcalidrawFont("Nunito", NunitoCyrilicExt, {
        unicodeRange: CYRILIC_EXT_RANGE,
      }),
      new ExcalidrawFont("Nunito", NunitoCyrilic, {
        unicodeRange: CYRILIC_RANGE,
      }),
      new ExcalidrawFont("Nunito", NunitoVietnamese, {
        unicodeRange: VIETNAMESE_RANGE,
      }),
      new ExcalidrawFont("Nunito", NunitoLatinExt, {
        unicodeRange: LATIN_EXT_RANGE,
      }),
      new ExcalidrawFont("Nunito", NunitoLatin, {
        unicodeRange: LATIN_RANGE,
      }),
    );

    /** Pacifico */
    register(
      FONT_FAMILY.Pacifico,
      FONT_METRICS[FONT_FAMILY.Pacifico],
      new ExcalidrawFont("Pacifico", PacificoCyrlicExt, {
        unicodeRange: CYRILIC_EXT_RANGE,
      }),
      new ExcalidrawFont("Pacifico", PacificoVietnamese, {
        unicodeRange: VIETNAMESE_RANGE,
      }),
      new ExcalidrawFont("Pacifico", PacificoLatinExt, {
        unicodeRange: LATIN_EXT_RANGE,
      }),
      new ExcalidrawFont("Pacifico", PacificoLatin, {
        unicodeRange: LATIN_RANGE,
      }),
    );

    /** Permanent marker */
    register(
      FONT_FAMILY.PermanentMarker,
      FONT_METRICS[FONT_FAMILY.PermanentMarker],
      new ExcalidrawFont("PermanentMarker", PermanentMarker, {
        unicodeRange: LATIN_RANGE,
      }),
    );

    return fonts.registered;
  }
}
