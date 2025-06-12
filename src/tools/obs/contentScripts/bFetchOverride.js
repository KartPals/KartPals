// deno-lint-ignore-file
(function () {
    const originalFetch = window.fetch;
    window.fetch = async function (input, init) {
        if (
            typeof input === "string" &&
            new URL(input).hostname === "web-platform.bytebrew.io"
        ) {
            if (init && init.body) {
                try {
                    let payload = init.body;
                    if (typeof payload === "string") {
                        try {
                            payload = JSON.parse(payload);
                        } catch {}
                    }
                    window.postMessage({
                        type: "BYTEBREW_LOG_PAYLOAD",
                        payload,
                    }, "*");
                } catch {}
            }
        }
        return originalFetch.apply(this, arguments);
    };
})();
