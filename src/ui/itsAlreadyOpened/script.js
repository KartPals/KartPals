// This file reuses some code from "../howManyTabs/script.js," but it's ok.

import domainRegexBuilder from "../../utils/domainRegexBuilder.js";

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

    globalThis.smashKartsCount = smashKartsCount;

    const countSpan = document.querySelector(
        'span[style*="font-size: 2.8rem"]',
    );
    if (countSpan) {
        countSpan.textContent = smashKartsCount;
    }
});
