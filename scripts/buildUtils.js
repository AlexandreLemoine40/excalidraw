const fs = require("fs");
const path = require("path");
const { build } = require("esbuild");
const fetch = require("node-fetch");
const { sassPlugin } = require("esbuild-sass-plugin");

const wawoff = require("wawoff2");
const { Font } = require("fonteditor-core");

/**
 * Custom esbuild plugin to:
 * 1. inline the woff2 as base64 for server-side use cases (no need for additional font fetch; works in both esm and commonjs)
 * 2. convert all the imported fonts (including those from cdn) at build time into .ttf (in Resvg woff2 is not supported, neither is inlined dataurl - https://github.com/RazrFalcon/resvg/issues/541)
 *    - merging multiple woff2 into one ttf (for same families with different unicode ranges)
 *    - deduplicating glyphs due to the merge process
 *    - merging emoji font for each
 *    - printing out font metrics
 */
function woff2plugin(options = {}) {
  return {
    name: "woff2plugin",
    setup(build) {
      const { outdir, generateTtf } = options;
      const outputDir = path.resolve(outdir);
      const fonts = new Map();

      build.onResolve({ filter: /\.woff2$/ }, (args) => {
        const resolvedPath = args.path.startsWith("http")
          ? args.path // url
          : path.resolve(args.resolveDir, args.path); // absolute path

        return {
          path: resolvedPath,
          namespace: "woff2plugin",
        };
      });

      build.onLoad({ filter: /.*/, namespace: "woff2plugin" }, async (args) => {
        let woff2Buffer;

        if (path.isAbsolute(args.path)) {
          // read local woff2 as a buffer (WARN: readFileSync does not work!)
          woff2Buffer = await fs.promises.readFile(args.path);
        } else {
          // fetch remote woff2 as a buffer (i.e. from a cdn)
          const response = await fetch(args.path);
          woff2Buffer = await response.buffer();
        }

        // google's brotli decompression into ttf
        const snftBuffer = new Uint8Array(await wawoff.decompress(woff2Buffer))
          .buffer;

        // load font and store per fontfamily & subfamily cache
        let font;

        try {
          font = Font.create(snftBuffer, { type: "ttf" });
        } catch {
          // if loading as ttf fails, try to load as otf
          font = Font.create(snftBuffer, { type: "otf" });
        }

        const fontFamily = font.data.name.fontFamily;
        const subFamily = font.data.name.fontSubFamily;

        if (!fonts.get(fontFamily)) {
          fonts.set(fontFamily, {});
        }

        if (!fonts.get(fontFamily)[subFamily]) {
          fonts.get(fontFamily)[subFamily] = [];
        }

        // store the snftbuffer per subfamily
        fonts.get(fontFamily)[subFamily].push(font);

        return {
          // inline the woff2 as base64 for server-side use cases
          // ("file" loader is broken in commonjs, dataurl does not produce correct data url)
          contents: `data:font/woff2;base64,${woff2Buffer.toString("base64")}`,
          loader: "text",
        };
      });

      build.onEnd(() => {
        if (!generateTtf) {
          return;
        }

        const sortedFonts =  Array.from(fonts.entries()).sort(([family1], [family2]) => family1 > family2 ? 1 : -1);

        // for now we are interested in the regular families only
        for (const [family, { Regular }] of sortedFonts) {
          // merge same previous woff2 subfamilies into one font
          const [head, ...tail] = Regular;
          const font = tail
            .reduce((acc, curr) => {
              return acc.merge(curr);
            }, head)
            .sort();

          // FIXME_FONTS: merge with emoji font

          // deduplicate glyphs by name+unicode due to merge
          // TODO: think about stripping away some unnecessary glyphs
          const uniqueGlyphs = new Set();
          const glyphs = [...font.data.glyf].filter((x) => {
            if (!x.unicode) {
              return true;
            }

            if (!uniqueGlyphs.has(x.name + x.unicode.toString())) {
              uniqueGlyphs.add(x.name + x.unicode.toString());
              return true;
            }

            return false;
          });

          const duplicateGlyphssLength = font.data.glyf.length - glyphs.length;

          font.set({
            ...font.data,
            glyf: glyphs,
          });

          const extension = "ttf";
          const fileName = `${family}.${extension}`;
          const { ascent, descent } = font.data.hhea;

          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }

          // write down the buffer
          fs.writeFileSync(
            path.resolve(outputDir, fileName),
            font.write({ type: extension }),
          );

          console.info(`Generated "${fileName}"`);
          if (Regular.length > 1) {
            console.info(`- by merging ${Regular.length} woff2 files`);
          }
          if (duplicateGlyphssLength) {
            console.info(`- deduplicated ${duplicateGlyphssLength} glyphs`);
          }
          console.info(
            `- with metrics ${font.data.head.unitsPerEm}, ${ascent}, ${descent}`,
          );
          console.info(``);
        }
      });
    },
  };
}

const browserConfig = {
  entryPoints: ["index.ts"],
  bundle: true,
  format: "esm",
  plugins: [sassPlugin()],
  assetNames: "assets/[name]",
  loader: {
    ".woff2": "copy",
  },
};

// Will be used later for treeshaking

// function getFiles(dir, files = []) {
//   const fileList = fs.readdirSync(dir);
//   for (const file of fileList) {
//     const name = `${dir}/${file}`;
//     if (
//       name.includes("node_modules") ||
//       name.includes("config") ||
//       name.includes("package.json") ||
//       name.includes("main.js") ||
//       name.includes("index-node.ts") ||
//       name.endsWith(".d.ts") ||
//       name.endsWith(".md")
//     ) {
//       continue;
//     }

//     if (fs.statSync(name).isDirectory()) {
//       getFiles(name, files);
//     } else if (
//       name.match(/\.(sa|sc|c)ss$/) ||
//       name.match(/\.(woff|woff2|eot|ttf|otf)$/) ||
//       name.match(/locales\/[^/]+\.json$/)
//     ) {
//       continue;
//     } else {
//       files.push(name);
//     }
//   }
//   return files;
// }
const createESMBrowserBuild = async () => {
  // Development unminified build with source maps
  const browserDev = await build({
    ...browserConfig,
    outdir: "dist/browser/dev",
    sourcemap: true,
    metafile: true,
    define: {
      "import.meta.env": JSON.stringify({ DEV: true }),
    },
  });
  fs.writeFileSync(
    "meta-browser-dev.json",
    JSON.stringify(browserDev.metafile),
  );

  // production minified build without sourcemaps
  const browserProd = await build({
    ...browserConfig,
    outdir: "dist/browser/prod",
    minify: true,
    metafile: true,
    define: {
      "import.meta.env": JSON.stringify({ PROD: true }),
    },
  });
  fs.writeFileSync(
    "meta-browser-prod.json",
    JSON.stringify(browserProd.metafile),
  );
};

const rawConfig = {
  entryPoints: ["index.ts"],
  bundle: true,
  format: "esm",
  packages: "external",
};

// const BASE_PATH = `${path.resolve(`${__dirname}/..`)}`;
// const filesinExcalidrawPackage = getFiles(`${BASE_PATH}/packages/utils`);

// const filesToTransform = filesinExcalidrawPackage.filter((file) => {
//   return !(
//     file.includes("/__tests__/") ||
//     file.includes(".test.") ||
//     file.includes("/tests/") ||
//     file.includes("example")
//   );
// });
const createESMRawBuild = async () => {
  // Development unminified build with source maps
  const rawDev = await build({
    ...rawConfig,
    outdir: "dist/dev",
    sourcemap: true,
    metafile: true,
    plugins: [sassPlugin(), woff2plugin({ outdir: "dist/dev/assets" })],
    define: {
      "import.meta.env": JSON.stringify({ DEV: true }),
    },
  });
  fs.writeFileSync("meta-raw-dev.json", JSON.stringify(rawDev.metafile));

  // production minified build without sourcemaps
  const rawProd = await build({
    ...rawConfig,
    outdir: "dist/prod",
    minify: true,
    metafile: true,
    plugins: [
      sassPlugin(),
      woff2plugin({ outdir: "dist/prod/assets", generateTtf: true }),
    ],
    define: {
      "import.meta.env": JSON.stringify({ PROD: true }),
    },
  });
  fs.writeFileSync("meta-raw-prod.json", JSON.stringify(rawProd.metafile));
};

createESMRawBuild();
createESMBrowserBuild();
