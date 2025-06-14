import fGlob from "fglob";
import { spawnSync } from "node:child_process";

const files = fGlob.globSync("./buildTools/*.ts", { absolute: true });

for (const file of files) {
    const result = spawnSync("deno", ["run", "--allow-all", file], {
        stdio: "inherit",
    });
    if (result.error) {
        console.error(`Error running ${file}:`, result.error);
    }
}
