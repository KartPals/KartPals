// deno-lint-ignore-file
import ws from "./websocket.ts";
import { Result, ResultAsync } from "neverthrow";

declare global {
    var __lastLoggedKills: number | undefined;
}

const obs = ws;

function connectOBS() {
    return ResultAsync.fromPromise(
        obs.connect("ws://localhost:4455"),
        (error) => {
            if (error instanceof Error) return error;
            return new Error(String(error));
        },
    )
        .map((result) => {
            console.log("[OBS] Connection attempt finished");
            console.log("[OBS] Connected to OBS!");
            return result;
        })
        .mapErr((err) => {
            console.error("[OBS] Connection failed:", err);
            return err instanceof Error ? err : new Error(String(err));
        });
}

function updateKillsText(kills: number): ResultAsync<unknown, Error> {
    return ResultAsync.fromPromise(
        obs.call("SetInputSettings", {
            inputName: "KillsText",
            inputSettings: { text: `Kills: ${kills}` },
        }),
        (e) => e instanceof Error ? e : new Error(String(e)),
    )
        .map(() => console.log("[OBS] Updated kills text to:", kills))
        .mapErr((error) => {
            console.error("[OBS] Failed to update kills text:", error);
            return error instanceof Error ? error : new Error(String(error));
        });
}

connectOBS()
    .then((result) => {
        result.match(
            () => nListenForKills(),
            (err) => console.error("OBS not detected:", err),
        );
    });

// deno-lint-ignore no-explicit-any
const payloads: Record<string, any> = {};

function startInterceptingFetches() {
    chrome.runtime.sendMessage({ type: "INJECT_BFETCH_OVERRIDE" });

    function handler(event: MessageEvent) {
        if (event.data && event.data.type === "BYTEBREW_LOG_PAYLOAD") {
            console.log("[Debug] Received payload:", event.data.payload);
            const id = `${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
            payloads[id] = event.data.payload;
        }
    }
    window.addEventListener("message", handler);
}

startInterceptingFetches();

function getKillsFromGame(): Result<number, Error> {
    return Result.fromThrowable(
        (): number => {
            let kills = 0;
            const payloadArray = Object.values(payloads);
            payloadArray.forEach((iFetch) => {
                if (
                    iFetch &&
                    typeof iFetch === "object" &&
                    iFetch.externalData &&
                    typeof iFetch.externalData === "object"
                ) {
                    const eventType = iFetch.externalData.eventType;
                    const value = iFetch.externalData.value;
                    if (typeof value === "string" && value.includes("=")) {
                        const [key, weaponVal] = value.split("=");
                        if (
                            eventType === "destroyed_human" &&
                            key === "weapon" &&
                            weaponVal
                        ) {
                            kills++;
                        }
                    }
                }
            });
            return kills;
        },
        (e) => e instanceof Error ? e : new Error(String(e)),
    )()
        .map((kills) => {
            if (globalThis.__lastLoggedKills !== kills) {
                console.log("[Game] Current kills:", kills);
                globalThis.__lastLoggedKills = kills;
            }
            return kills;
        })
        .mapErr((err) => {
            return err instanceof Error ? err : new Error(String(err));
        });
}

// Listener to check for kill increases and update OBS
function nListenForKills() {
    let lastKills = 0;
    setInterval(() => {
        getKillsFromGame()
            .map((newKills) => {
                if (newKills > lastKills) {
                    console.log(
                        `[Listener] Kill count increased: ${lastKills} -> ${newKills}`,
                    );
                    lastKills = newKills;
                    updateKillsText(newKills)
                        .mapErr((err) => {
                            console.error(
                                "[Listener] Failed to update kills text:",
                                err,
                            );
                        });
                }
            })
            .mapErr((err) => {
                console.error("[Listener] Failed to get kills from game:", err);
            });
    }, 1000);
}
