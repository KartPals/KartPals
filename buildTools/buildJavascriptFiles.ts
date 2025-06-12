import { build } from "esbuild";
import fGlob from "fglob";
import { denoPlugins } from "esbuildpd";
import dJson from "../deno.json" with { type: "json" };
import { nodeModulesPolyfillPlugin } from "esbuildpn";
import path from "node:path";

function getParentDirectory(filePath: string) {
    const parts = filePath.split(/[\\/]/);
    if (parts.length < 2) {
        return "";
    }
    return parts.slice(0, -1).join("/");
}

(async function () {
    const files = fGlob.globSync("src/**", { absolute: true });
    const jsFiles = files.filter(
        (file) =>
            (file.endsWith(".js") || file.endsWith(".ts")) &&
            !file.endsWith(".user.js"),
    );

    // Find all script.js files
    const scriptJsFiles = jsFiles.filter((f) =>
        path.basename(f) === "script.js"
    );
    if (scriptJsFiles.length === 2) {
        console.log(
            "Found two script.js files. No script.js files will be output.",
        );
    }

    try {
        for (const file of jsFiles) {
            const fileName = path.basename(file);
            const parentDir = path.basename(getParentDirectory(file));
            let entryNames = "[name]";

            // If the file is script.js, use parent directory name as output file name
            if (fileName === "script.js") {
                entryNames = parentDir;
            }

            console.log(`Building JavaScript file ${file}...`);

            await build({
                entryPoints: [file],
                outdir: "dist",
                bundle: true,
                minify: true,
                sourcemap: "linked",
                format: "esm",
                globalName: "globalThis",
                target: "esnext",
                platform: "browser",
                logLevel: "info",
                keepNames: false,
                assetNames: `[name]-${parentDir}`,
                entryNames,
                define: {
                    "globalThis.smashKartsCount": "0",
                },
                allowOverwrite: true,
                plugins: [
                    ...denoPlugins({
                        autoInstall: true,
                        nodeModulesDirs: ["node_modules"],
                        globalImportMap: dJson.imports,
                    }),
                    nodeModulesPolyfillPlugin({
                        globals: {
                            Buffer: true,
                        },
                        modules: ["buffer", "crypto"],
                    }),
                ],
            });
        }
        Deno.exit(0);
    } catch (err) {
        if (err instanceof Error) {
            console.error("Build failed:", err.message);
        }
        Deno.exit(1);
    }
})();
