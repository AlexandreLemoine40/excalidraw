import { FONT_FAMILY } from "../constants";
import { isTextElement } from "../element";
import { newElementWith } from "../element/mutateElement";
import { getFontString } from "../utils";
import type Scene from "./Scene";
import { ShapeCache } from "./ShapeCache";

export class Fonts {
  private scene: Scene;

  constructor({ scene }: { scene: Scene }) {
    this.scene = scene;
  }

  // it's ok to track fonts across multiple instances only once, so let's use
  // a static member to reduce memory footprint
  private static loadedFontFaces = new Set<string>();

  /**
   * if we load a (new) font, it's likely that text elements using it have
   * already been rendered using a fallback font. Thus, we want invalidate
   * their shapes and rerender. See #637.
   *
   * Invalidates text elements and rerenders scene, provided that at least one
   * of the supplied fontFaces has not already been processed.
   */
  public onFontsLoaded = (fontFaces: readonly FontFace[]) => {
    if (
      // bail if all fonts with have been processed. We're checking just a
      // subset of the font properties (though it should be enough), so it
      // can technically bail on a false positive.
      fontFaces.every((fontFace) => {
        const sig = `${fontFace.family}-${fontFace.style}-${fontFace.weight}`;
        if (Fonts.loadedFontFaces.has(sig)) {
          return true;
        }
        Fonts.loadedFontFaces.add(sig);
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
  public loadRegularFonts = async () => {
    const fontFaces = await Promise.all(
      Object.values(FONT_FAMILY).map((fontFamily) => {
        // load only regular FontFaces `normal` font-weight
        const fontString = `normal ${getFontString({
          fontFamily,
          fontSize: 16,
        })}`;

        if (!document.fonts?.check?.(fontString)) {
          return document.fonts?.load?.(fontString);
        }

        return undefined;
      }),
    );

    this.onFontsLoaded(fontFaces.flat().filter(Boolean) as FontFace[]);
  };
}
