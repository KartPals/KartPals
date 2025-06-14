import domainRegexBuilder from "../../utils/domainRegexBuilder.js";
import { htmlEscape as hEsc } from "esc";
import { minify as hMinify } from "hminify";
import { SmartBuffer as sBuffer } from "sbuffer";
import { XMLHttpRequest } from "dxhr";

const tDecoder = new TextDecoder();
const tEncoder = new TextEncoder();

const [currentTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
});
const { id: tabId, url: currentTabUrl } = currentTab;

chrome.tabs.query({ currentWindow: true }, (tabs) => {
    const smashKartsDomains = [
        "smashkarts.io",
        "skunblocked.com",
        "ghp1tallteam.github.io",
        "geometrykarts.com",
        // TODO: Add more official proxies that embed Smash Karts such as schoolkarts.com
    ];

    const smashkartsRegexes = smashKartsDomains.values().map((domain) =>
        domainRegexBuilder(domain)
    );

    const smashKartsTabs = tabs.filter((tab) => {
        return smashkartsRegexes.some((regex) => regex.test(tab.url));
    });

    const smashKartsCount = smashKartsTabs.length - 1;

    if (smashKartsCount > 0 && smashKartsDomains.includes(currentTabUrl)) {
        chrome.scripting.executeScript({
            code: `document.documentElement.innerHTML = ${
                hEsc((function () {
                    const xhr = new XMLHttpRequest();

                    xhr.open(
                        "GET",
                        `./itsAlreadyOpened/index.html`,
                        false,
                    );
                    xhr.send();

                    return tDecoder.decode(hMinify(
                        tEncoder.encode(
                            sBuffer.fromBuffer(
                                // deno-lint-ignore no-node-globals
                                Buffer.from(xhr.responseText),
                                "utf8",
                            ).toString("utf8"),
                        ),
                    ));
                })())
            }`,
            target: { tabId },
            world: "MAIN",
            runAt: "document_start",
        });
    }
});
