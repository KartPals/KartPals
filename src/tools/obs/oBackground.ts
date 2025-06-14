chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === "INJECT_BFETCH_OVERRIDE" && sender.tab?.id) {
        chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            files: ["bFetchOverride.js"],
            world: "MAIN",
        }).catch((error) => console.error(error));
    }
});
