import type Scene from "./Scene";
import { ShapeCache } from "./ShapeCache";
import { isTextElement } from "../element";
import { newElementWith } from "../element/mutateElement";
import { getFontString } from "../utils";

import Virgil from "../fonts/Virgil.woff2";
import Excalifont from "../fonts/Excalifont.woff2";
import AssistantMedium from "../fonts/Assistant-Medium.woff2";
import AssistantRegular from "../fonts/Assistant-Regular.woff2";
import AssistantSemiBold from "../fonts/Assistant-SemiBold.woff2";
import AssistantBold from "../fonts/Assistant-Bold.woff2";
import Cascadia from "../fonts/Cascadia.woff2";
import ComicShanns from "../fonts/ComicShanns2.woff2";
import TeXGyreHeros from "../fonts/TeXGyreHeros.woff2";
import { FONT_FAMILY } from "../constants";
import type { ValueOf } from "../utility-types";
import { stringToBase64, toByteString } from "../data/encode";

export class ExcalidrawFontFace extends FontFace {
  public readonly uri: string;

  constructor(family: string, uri: string, descriptors?: FontFaceDescriptors) {
    super(family, `url("${uri}")`, {
      display: "swap",
      style: "normal",
      weight: "400",
      ...descriptors,
    });

    this.uri = uri;
  }

  public async getContent(): Promise<string> {
    const response = await fetch(this.uri, {
      headers: {
        Accept: "font/woff2",
      },
    });

    if (!response.ok) {
      console.error(
        `Couldn't fetch font-family "${this.family}" from url ${this.uri}`,
        await response.json(),
      );
    }

    const buffer = await response.arrayBuffer();
    return stringToBase64(await toByteString(buffer), true);
  }
}

export class Fonts {
  /** Unicode ranges */
  private static readonly LATIN_RANGE =
    "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";
  private static readonly LATIN_EXT_RANGE =
    "U+0100-02AF, U+0304, U+0308, U+0329, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF";
  private static readonly CYRILIC_EXT_RANGE =
    "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F";
  private static readonly CYRILIC_RANGE =
    "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116";
  private static readonly VIETNAMESE_RANGE =
    "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB";

  // it's ok to track fonts across multiple instances only once, so let's use
  // a static member to reduce memory footprint
  private static loadedFontsCache = new Set<string>();
  public static readonly registered: Map<
    ValueOf<typeof FONT_FAMILY>,
    Array<ExcalidrawFontFace>
  > = new Map();

  private scene: Scene;

  public get sceneFamilies() {
    return this.scene.getNonDeletedElements().reduce((families, element) => {
      if (isTextElement(element)) {
        families.add(element.fontFamily);
      }
      return families;
    }, new Set<number>());
  }

  public get registeredFontFaces() {
    return Fonts.registered;
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
    Fonts.registerAll();

    for (const faces of Fonts.registered.values()) {
      for (const font of faces) {
        if (!document.fonts.has(font)) {
          document.fonts.add(font);
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

        if (!document.fonts?.check?.(fontString)) {
          return document.fonts?.load?.(fontString);
        }

        return undefined;
      }),
    );

    this.onLoaded(loaded.flat().filter(Boolean) as FontFace[]);
  };

  public static register(
    family: ValueOf<typeof FONT_FAMILY>,
    fontFace: ExcalidrawFontFace,
  ) {
    const registeredFamily = Fonts.registered.get(family);

    if (!registeredFamily) {
      Fonts.registered.set(family, [fontFace]);
    } else if (!registeredFamily.find((x) => x.uri === fontFace.uri)) {
      registeredFamily.push(fontFace);
    }
  }

  public static registerAll() {
    Fonts.register(
      FONT_FAMILY.Virgil,
      new ExcalidrawFontFace("Virgil", Virgil),
    );
    Fonts.register(
      FONT_FAMILY.Excalifont,
      new ExcalidrawFontFace("Excalifont", Excalifont),
    );
    Fonts.register(
      FONT_FAMILY.TeXGyreHeros,
      new ExcalidrawFontFace("TeXGyreHeros", TeXGyreHeros),
    );
    Fonts.register(
      FONT_FAMILY.Cascadia,
      new ExcalidrawFontFace("Cascadia", Cascadia),
    );
    Fonts.register(
      FONT_FAMILY.ComicShanns,
      new ExcalidrawFontFace("ComicShanns", ComicShanns),
    );

    /** Assistant */
    Fonts.register(
      FONT_FAMILY.Assistant,
      new ExcalidrawFontFace("Assistant", AssistantRegular),
    );
    Fonts.register(
      FONT_FAMILY.Assistant,
      new ExcalidrawFontFace("Assistant", AssistantMedium, { weight: "500" }),
    );
    Fonts.register(
      FONT_FAMILY.Assistant,
      new ExcalidrawFontFace("Assistant", AssistantSemiBold, { weight: "600" }),
    );
    Fonts.register(
      FONT_FAMILY.Assistant,
      new ExcalidrawFontFace("Assistant", AssistantBold, { weight: "700" }),
    );

    /** Bangers */
    Fonts.register(
      FONT_FAMILY.Bangers,
      new ExcalidrawFontFace(
        "Bangers",
        "https://fonts.gstatic.com/s/bangers/v24/FeVQS0BTqb0h60ACH5FQ2J5hm25mww.woff2",
        { unicodeRange: Fonts.VIETNAMESE_RANGE },
      ),
    );
    Fonts.register(
      FONT_FAMILY.Bangers,
      new ExcalidrawFontFace(
        "Bangers",
        "https://fonts.gstatic.com/s/bangers/v24/FeVQS0BTqb0h60ACH5BQ2J5hm25mww.woff2",
        { unicodeRange: Fonts.LATIN_EXT_RANGE },
      ),
    );
    Fonts.register(
      FONT_FAMILY.Bangers,
      new ExcalidrawFontFace(
        "Bangers",
        "https://fonts.gstatic.com/s/bangers/v24/FeVQS0BTqb0h60ACH55Q2J5hm24.woff2",
        { unicodeRange: Fonts.LATIN_RANGE },
      ),
    );

    /** Nunito */
    Fonts.register(
      FONT_FAMILY.Nunito,
      new ExcalidrawFontFace(
        "Nunito",
        "https://fonts.gstatic.com/s/nunito/v26/XRXI3I6Li01BKofiOc5wtlZ2di8HDLshdTk3j6zbXWjgevT5.woff2",
        { unicodeRange: Fonts.CYRILIC_EXT_RANGE },
      ),
    );
    Fonts.register(
      FONT_FAMILY.Nunito,
      new ExcalidrawFontFace(
        "Nunito",
        "https://fonts.gstatic.com/s/nunito/v26/XRXI3I6Li01BKofiOc5wtlZ2di8HDLshdTA3j6zbXWjgevT5.woff2",
        { unicodeRange: Fonts.CYRILIC_RANGE },
      ),
    );
    Fonts.register(
      FONT_FAMILY.Nunito,
      new ExcalidrawFontFace(
        "Nunito",
        "https://fonts.gstatic.com/s/nunito/v26/XRXI3I6Li01BKofiOc5wtlZ2di8HDLshdTs3j6zbXWjgevT5.woff2",
        { unicodeRange: Fonts.VIETNAMESE_RANGE },
      ),
    );
    Fonts.register(
      FONT_FAMILY.Nunito,
      new ExcalidrawFontFace(
        "Nunito",
        "https://fonts.gstatic.com/s/nunito/v26/XRXI3I6Li01BKofiOc5wtlZ2di8HDLshdTo3j6zbXWjgevT5.woff2",
        { unicodeRange: Fonts.LATIN_EXT_RANGE },
      ),
    );
    Fonts.register(
      FONT_FAMILY.Nunito,
      new ExcalidrawFontFace(
        "Nunito",
        "https://fonts.gstatic.com/s/nunito/v26/XRXI3I6Li01BKofiOc5wtlZ2di8HDLshdTQ3j6zbXWjgeg.woff2",
        { unicodeRange: Fonts.LATIN_RANGE },
      ),
    );

    /** Pacifico */
    Fonts.register(
      FONT_FAMILY.Pacifico,
      new ExcalidrawFontFace(
        "Pacifico",
        "https://fonts.gstatic.com/s/pacifico/v22/FwZY7-Qmy14u9lezJ-6K6MmBp0u-zK4.woff2",
        { unicodeRange: Fonts.CYRILIC_EXT_RANGE },
      ),
    );
    Fonts.register(
      FONT_FAMILY.Pacifico,
      new ExcalidrawFontFace(
        "Pacifico",
        "https://fonts.gstatic.com/s/pacifico/v22/FwZY7-Qmy14u9lezJ-6I6MmBp0u-zK4.woff2",
        { unicodeRange: Fonts.VIETNAMESE_RANGE },
      ),
    );
    Fonts.register(
      FONT_FAMILY.Pacifico,
      new ExcalidrawFontFace(
        "Pacifico",
        "https://fonts.gstatic.com/s/pacifico/v22/FwZY7-Qmy14u9lezJ-6J6MmBp0u-zK4.woff2",
        { unicodeRange: Fonts.LATIN_EXT_RANGE },
      ),
    );
    Fonts.register(
      FONT_FAMILY.Pacifico,
      new ExcalidrawFontFace(
        "Pacifico",
        "https://fonts.gstatic.com/s/pacifico/v22/FwZY7-Qmy14u9lezJ-6H6MmBp0u-.woff2",
        { unicodeRange: Fonts.LATIN_RANGE },
      ),
    );

    /** Permanent marker */
    Fonts.register(
      FONT_FAMILY.PermanentMarker,
      new ExcalidrawFontFace(
        "PermanentMarker",
        "https://fonts.gstatic.com/s/permanentmarker/v16/Fh4uPib9Iyv2ucM6pGQMWimMp004La2Cf5b6jlg.woff2",
        { unicodeRange: Fonts.LATIN_RANGE },
      ),
    );
  }

  public static unregisterAll() {
    for (const family of Fonts.registered.keys()) {
      Fonts.registered.delete(family);
    }
  }
}
