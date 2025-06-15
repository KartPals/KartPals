chrome.runtime.onMessage.addListener((t,e)=>{t.type==="INJECT_BFETCH_OVERRIDE"&&e.tab?.id&&chrome.scripting.executeScript({target:{tabId:e.tab.id},files:["bFetchOverride.js"],world:"MAIN"}).catch(r=>console.error(r))});
//# sourceMappingURL=oBackground.js.map
