// ==UserScript==
// @name         SmashKarts Auto Daily Gems
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Automatically collects daily gems every 4 hours, max 2 times per day on Smash Karts.
// @author       KartPals Team / Quartinal
// @match        https://smashkarts.io/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    "use strict";

    // Helper to get today's date string (YYYY-MM-DD)
    function getTodayString() {
        const now = new Date();
        return now.toISOString().slice(0, 10);
    }

    // Storage keys
    const STORAGE_KEY = "autoGemSpin";
    function getSpinData() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        } catch {
            return {};
        }
    }
    function setSpinData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    // Wait until Firebase is available
    const waitForFirebase = setInterval(() => {
        if (typeof firebase !== "undefined" && firebase.auth().currentUser) {
            clearInterval(waitForFirebase);
            startDailyGemsScheduler(1);
        }
    }, 1000);

    function getSeasonNumber(clientVersion = 330) {
        const user = firebase.auth().currentUser;
        if (!user) {
            console.error("No user is signed in.");
            return null;
        }
        return user.getIdTokenResult().then((tokenResult) => {
            const xhr = new XMLHttpRequest();
            xhr.open(
                "GET",
                "https://us-central1-webgltest-17af1.cloudfunctions.net/getGameDataMulti",
                false,
            );
            xhr.setRequestHeader(
                "Authorization",
                `Bearer ${tokenResult.token}`,
            );
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(JSON.stringify({
                data: {
                    clientVersion,
                    dayId: null,
                    isNewUser: false,
                    platformId: "webgl",
                    region: document.querySelector('meta[name="region"]')
                        ?.textContent || "usw",
                    seasonId: null,
                },
            }));
            if (xhr.status !== 200) {
                console.error(
                    "Failed to fetch game data:",
                    xhr.status,
                    xhr.statusText,
                );
                return null;
            }
            const responseData = JSON.parse(xhr.responseText).data;
            if (!responseData || !responseData.seasonId) {
                console.error("Invalid response data:", responseData);
                return null;
            }
            globalThis.seasonId = responseData.seasonId;
            return globalThis.seasonId;
        });
    }

    async function doDailyGems(spinType) {
        const user = firebase.auth().currentUser;
        if (!user) {
            console.error("No user is signed in.");
            alert("You need to sign in first!");
            return false;
        }
        try {
            const idToken = await user.getIdToken(true);
            const res = await fetch(
                "https://us-central1-webgltest-17af1.cloudfunctions.net/doDailyGemsMulti",
                {
                    method: "POST",
                    headers: {
                        authorization: `Bearer ${idToken}`,
                        "content-type": "application/json",
                    },
                    body: JSON.stringify({
                        data: {
                            seasonId: await getSeasonNumber(),
                            spinType: spinType,
                            clientVersion: 330,
                        },
                    }),
                    mode: "cors",
                },
            );
            const responseData = await res.json();
            if (res.ok) {
                console.log("Daily gems awarded successfully:", responseData);
                alert(`Success: ${JSON.stringify(responseData)}`);
                return true;
            } else {
                console.error("Error claiming daily gems:", responseData.error);
                alert(`Error: ${responseData.error || "Unknown error"}`);
                return false;
            }
        } catch (error) {
            console.error("Request failed:", error);
            alert(`Request failed: ${error.message}`);
            return false;
        }
    }

    function startDailyGemsScheduler(spinType) {
        // Check and update spins per day
        async function trySpin() {
            const today = getTodayString();
            const data = getSpinData();
            if (!data[today]) data[today] = [];
            if (data[today].length >= 2) {
                console.log("Max daily gems spins reached for today.");
                return;
            }
            const now = Date.now();
            // Check if last spin was at least 4 hours ago
            if (
                data[today].length > 0 &&
                now - data[today][data[today].length - 1] < 4 * 60 * 60 * 1000
            ) {
                console.log("4 hours have not passed since last spin.");
                return;
            }
            const success = await doDailyGems(spinType);
            if (success) {
                data[today].push(now);
                setSpinData(data);
            }
        }
        // Run immediately on load
        trySpin();
        // Check every 10 minutes
        setInterval(trySpin, 10 * 60 * 1000);
    }
})();
