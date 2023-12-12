document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('fileInput');
    const flipImageCheckbox = document.getElementById('flipImageCheckbox');
    const scaleImage = document.getElementById('scaleImage');
    const adjustPadding = document.getElementById('adjustPadding');

    fileInput.addEventListener('change', function () {
        const selectedFile = fileInput.files[0];
        if (selectedFile) {
            const reader = new FileReader();

            reader.onload = function (event) {
                const imageDataUrl = event.target.result;

                chrome.storage.local.set({ "customPetImageUrl": imageDataUrl }, function () { });

                // Get the active tab and send a message to content.js
                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    if (tabs.length > 0) {
                        chrome.tabs.sendMessage(tabs[0].id, { imageDataUrl }, function (response) {
                            console.log(response); // Handle any response from content.js
                        });
                    } else {
                        console.error("No active tab found.");
                    }
                });
            };
            reader.readAsDataURL(selectedFile);
        }
    });

    flipImageCheckbox.addEventListener('change', (event) => {
        const orientation = event.target.checked ? 1 : -1;
        chrome.storage.local.set({"customPetImageOrientation": orientation}, () => {});
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, { orientation }, (response) => {
                    console.log(response);
                });
            } else {
                console.error("No active tab found.");
            }
        });
    });

    scaleImage.addEventListener('change', (event) => {
        const scaleFactor = parseFloat(event.target.value);
        chrome.storage.local.set({ "customPetImageScale": scaleFactor }, () => {});
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, { scaleFactor }, (response) => {
                    console.log(response);
                });
            } else {
                console.error("No active tab found.");
            }
        });
    });
    adjustPadding.addEventListener('change', (event) => {
        const padValue = parseInt(event.target.value);
        chrome.storage.local.set({ "customPetImagePadding": padValue }, () => {});
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, { padValue }, (response) => {
                    console.log(response);
                });
            } else {
                console.error("No active tab found.");
            }
        });
    });
});
