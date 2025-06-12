import fGlob from "fglob";
import vento from "vento";
import { join } from "node:path";
import { minify as hMinify } from "hminify";

const tEncoder = new TextEncoder();
const tDecoder = new TextDecoder();

const templates = vento();

const templateFolders = fGlob.globSync("./src/ui/**", {
    onlyDirectories: true,
});

for (const folder of templateFolders) {
    const templatePath = join(folder, "index.vento");
    try {
        const templateContent = await Deno.readTextFile(templatePath);
        const template = templates.compile(templateContent, "index.vento");
        const rendered = tDecoder.decode(
            hMinify(
                tEncoder.encode(await template().then((val) => val.content)),
                {},
            ),
        );
        const outputFileName = join(
            "dist",
            folder.replace("./src/ui/", ""),
            "index.html",
        );
        const outputDir = join(
            "dist",
            folder.replace("./src/ui/", ""),
        );
        await Deno.mkdir(outputDir, { recursive: true });
        await Deno.writeTextFile(outputFileName, rendered);
    } catch (err) {
        console.error(`Failed to process ${templatePath}:`, err);
    }
}
