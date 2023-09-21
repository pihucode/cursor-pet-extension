document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('fileInput');
    // const uploadButton = document.getElementById('uploadButton');

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

    // uploadButton.addEventListener('click', function () {
    //     fileInput.click();
    // });
});
