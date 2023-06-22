const injectedTabs = [];

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && !injectedTabs.includes(tabId)) {
        chrome.tabs.executeScript(tabId, {
            file: "content.js",
            allFrames: false  // Inject only into the top-level frame
        }, () => {
            injectedTabs.push(tabId);
        });
    }
});
