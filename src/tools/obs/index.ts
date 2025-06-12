import ws from "./websocket.ts";
import { Result, ResultAsync } from "neverthrow";
import wm from "../../utils/weaponMap.ts";

const obs = ws;

function connectOBS(): ResultAsync<void, Error> {
    return ResultAsync.fromPromise(
        obs.connect("ws://localhost:4455"),
        (error) => error instanceof Error ? error : new Error(String(error)),
    ).map(() => {
        console.log("Connected to OBS!");
    });
}

function updateKillsText(kills: number): ResultAsync<void, Error> {
    return ResultAsync.fromPromise(
        obs.call("SetInputSettings", {
            inputName: "KillsText",
            inputSettings: { text: `Kills: ${kills}` },
        }),
        (e) => e instanceof Error ? e : new Error(String(e)),
    );
}

connectOBS().match(
    () => nListenForKills(),
    (err) => console.error("OBS not detected:", err),
);

// TODO: Add deaths to ByteBrew intercepting
const kPrefix = "destroyed_";

const iFetches = await bInterceptFetches();

function getKillsFromGame(): Result<number, Error> {
    return Result.fromThrowable(
        () => {
            const jsonRegex = /^\s*{[\s\S]*}\s*$/;

            const interceptedFetches = iFetches instanceof Array
                ? iFetches
                    .filter((val) =>
                        typeof val === "string" && jsonRegex.test(val)
                    )
                    .map((val) => JSON.parse(val))
                : (typeof iFetches === "string" && jsonRegex.test(iFetches)
                    ? [JSON.parse(iFetches)]
                    : []);

            let kills = 0;

            if (interceptedFetches instanceof Array) {
                interceptedFetches.forEach((iFetch) => {
                    const eventType = iFetch.externalData.eventType;
                    const weaponVal = iFetch.externalData.value.split("=")[1];

                    // The developers did NOT design a destroyed_bot event
                    const weapon = eventType === kPrefix + "human"
                        ? wm.values().find((value) => value === weaponVal)
                        : "";

                    if (eventType === kPrefix + "human" && weapon) {
                        kills += 1;
                    }
                });
            }

            return kills;
        },
        (e) => e instanceof Error ? e : new Error(String(e)),
    )();
}

// Listener to check for kill increases and update OBS
function nListenForKills() {
    let lastKills = 0;
    setInterval(() => {
        getKillsFromGame().map((newKills) => {
            if (newKills > lastKills) {
                lastKills = newKills;
                updateKillsText(newKills).mapErr((err) => {
                    console.error("Failed to update kills text:", err);
                });
            }
        }).mapErr((err) => {
            console.error("Failed to get kills from game:", err);
        });
    }, 1000);
}

const tabId = [
        "smashkarts.io",
        "skunblocked.com",
        "ghp1tallteam.github.io",
        "geometrykarts.com",
        // TODO: Add more official proxies that embed Smash Karts such as schoolkarts.com
    ].includes(
        Number(await chrome.tabs.getCurrent().then((tab) => tab?.id))
            .toString(),
    )
    ? await chrome.tabs.getCurrent().then((tab) => tab?.id)
    : 1;

async function bInterceptFetches() {
    // deno-lint-ignore no-explicit-any
    const payloads: Record<string, any> = {};
    let firstPayloadReturned = false;

    const resp = await fetch("./bFetchOverride.js");
    const data = await resp.text();
    chrome.scripting.executeScript({
        target: {
            tabId: typeof tabId !== "undefined" ? tabId : 1,
        },
        func: new Function(data) as () => void,
    });
    return await new Promise((resolve) => {
        function handler(event: MessageEvent) {
            if (event.data && event.data.type === "BYTEBREW_LOG_PAYLOAD") {
                const id = `${
                    Math.random().toString(36).substring(2, 9)
                }_${Date.now()}`;
                payloads[id] = event.data.payload;

                if (!firstPayloadReturned) {
                    firstPayloadReturned = true;
                    resolve(event.data.payload);
                } else {
                    resolve({ ...payloads });
                }
            }
        }
        addEventListener("message", handler);
    });
}
