import { build } from "esbuild";
import fGlob from "fglob";
import fs from "node:fs";

const gFiles = fGlob.globSync("./src/**/*.user.js");

(async () => {
    for (const gFile of gFiles) {
        const fileContent = fs.readFileSync(gFile).toString();
        const usHeaderMatch = fileContent.match(
            /\/\/\s*==UserScript==[\s\S]*?\/\/\s*==\/UserScript==/g,
        );
        const usHeader = usHeaderMatch ? usHeaderMatch[0] + "\n" : "";

        console.log("Userscript header:\n\n", usHeader);

        await build({
            entryPoints: [gFile],
            minify: true,
            treeShaking: true,
            outdir: "./dist/userscripts",
            banner: { js: usHeader },
            legalComments: "none",
        });

        Deno.exit(0);
    }
})();
