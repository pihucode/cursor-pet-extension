// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//     if (changeInfo.status === 'complete') {
//         chrome.scripting.executeScript({
//             target: { tabId: tabId },
//             files: ["content.js"]
//         });
//     }
// });


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        chrome.scripting.insertCSS({
            target: { tabId: tabId },
            files: ["cursorPet.css"]
        }, () => {
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ["content.js"]
            });
        });
    }
});
