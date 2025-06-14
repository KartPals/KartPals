// @ts-nocheck I don't consider this file worthy of type checking
// TODO: Use ESNext innovations in this file...
import type Manifest from "wemanifest";
import jParse from "fjparse";
import dJson from "../deno.json" with { type: "json" };

type Hostname = `${string}.${string}`;

const smashKartsDomains: Array<Hostname> = [
    "smashkarts.io",
    "skunblocked.com",
    "ghp1tallteam.github.io",
    "geometrykarts.com",
    // TODO: Add more official proxies that embed Smash Karts such as schoolkarts.com
];

const parsed = jParse(Deno.readTextFileSync("./src/manifest.json"));

const manifest: Manifest = parsed.value ?? parsed;

// Ensure host_permissions exists and is an array
if (!Array.isArray(manifest.host_permissions)) {
    manifest.host_permissions = [];
}

const addHostPermissions = (host: string) => {
    if (!manifest.host_permissions.includes(host)) {
        manifest.host_permissions.push(host);
    }
};

smashKartsDomains.forEach((domain) =>
    addHostPermissions(`https://${domain}/*`)
);

Deno.writeTextFileSync(
    "./dist/manifest.json",
    JSON.stringify(manifest, null, dJson.fmt.indentWidth),
);
