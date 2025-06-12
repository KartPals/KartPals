export default await import("obsw.js").then(({ OBSWebSocket }) => {
    return new OBSWebSocket();
});
