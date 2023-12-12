const IMG_BASE_WIDTH = 100; //px
const PAGE_CENTER_X = window.innerWidth / 2;
const PAGE_CENTER_Y = window.innerHeight / 2;
const MOUSE_IDLE_TIME = 8000; // 8 seconds of idle time before starting circular motion
const CIRCLING_TIME = MOUSE_IDLE_TIME + 6000; // 5 seconds of idle time before fading away

let imgScaleFactor = 1;
let imgOrientationX = -1;

let defaultPadding = IMG_BASE_WIDTH * imgScaleFactor / 2;
let userSpecifiedPadding = 0;
let totalPadding = defaultPadding + userSpecifiedPadding; //TO FIX: need to make this a state dependent on the other 2 vars

let targetX = PAGE_CENTER_X; // Target X position of image
let targetY = PAGE_CENTER_Y; // Target Y position of image
let mousePosX = 0; // Mouse X position
let mousePosY = 0; // Mouse Y position
let isCircling = false;
let circlingIdleTimeout = null;
let fadeAwayIdleTimeout = null;

const cursorPetImage = new Image();
cursorPetImage.src = chrome.runtime.getURL('chibi_paimon_cautious.png');
cursorPetImage.style.all = 'initial'; // remove all styles
cursorPetImage.style.width = `${IMG_BASE_WIDTH}px`;
cursorPetImage.style.position = 'fixed';
cursorPetImage.style.pointerEvents = 'none';
cursorPetImage.style.zIndex = 99999;
cursorPetImage.style.transform = `scaleX(${imgOrientationX})`;
cursorPetImage.style.transition = 'opacity 2.5s ease-in-out';

// fetch image url from local storage
function fetchImageUrl() {
    chrome.storage.local.get("customPetImageUrl", (data) => {
        if (data.customPetImageUrl) {
            cursorPetImage.src = data.customPetImageUrl;
        } else {
            cursorPetImage.src = chrome.runtime.getURL('chibi_paimon_cautious.png');
            console.error('Invalid customPetImageUrl');
        }
    });
}
fetchImageUrl();

function fetchUserPreferences() {
    chrome.storage.local.get("customPetImageOrientation", (data) => {
        if (data.customPetImageOrientation) {
            imgOrientationX = data.customPetImageOrientation;
            cursorPetImage.style.transform = `scaleX(${imgOrientationX * imgScaleFactor})`;
        }
    });
    chrome.storage.local.get("customPetImageScale", (data) => {
        if (data.customPetImageScale) {
            cursorPetImage.style.width = `${IMG_BASE_WIDTH * data.customPetImageScale}px`;
            imgScaleFactor = data.customPetImageScale;
            defaultPadding = IMG_BASE_WIDTH * imgScaleFactor / 2;
            totalPadding = defaultPadding + userSpecifiedPadding; //TO FIX: make stateful here
        }
    });
    chrome.storage.local.get("customPetImagePadding", (data) => {
        if (data.userPreferences) {
            userSpecifiedPadding = parseInt(data.customPetImagePadding);
            totalPadding = defaultPadding + userSpecifiedPadding; //TO FIX: make stateful here
        }
    });
}
fetchUserPreferences();

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.imageDataUrl) {
        cursorPetImage.src = request.imageDataUrl;
        sendResponse({ message: 'Image set successfully in content.js' });
    } else if (request.orientation) {
        imgOrientationX *= -1;
        cursorPetImage.style.transform = `scaleX(${imgOrientationX * imgScaleFactor})`;
        sendResponse({ message: 'Orientation set successfully in content.js' });
    } else if (request.scaleFactor) {
        cursorPetImage.style.width = `${IMG_BASE_WIDTH * request.scaleFactor}px`;
        defaultPadding = IMG_BASE_WIDTH * request.scaleFactor / 2;
        totalPadding = defaultPadding + userSpecifiedPadding; //TO FIX: make stateful here
        sendResponse({ message: 'Scale set successfully in content.js' });
    } else if (request.padValue) {
        userSpecifiedPadding = request.padValue;
        totalPadding = defaultPadding + userSpecifiedPadding; //TO FIX: make stateful here
        sendResponse({ message: 'Padding set successfully in content.js' });
    } else {
        sendResponse({ message: 'Message FAILED in content.js' });
    }
});

document.addEventListener('mousemove', (e) => {

    mousePosX = e.clientX;
    mousePosY = e.clientY;

    targetX = mousePosX - cursorPetImage.width / 2 + totalPadding;
    targetY = mousePosY - cursorPetImage.height / 2 - totalPadding;

    handleImageOrientation(); // flips the image horizontally depending on mouse position

    stopCircularMotion();

    // if mouse is idle for some time, start circling
    clearTimeout(circlingIdleTimeout);
    circlingIdleTimeout = setTimeout(() => {
        startCircularMotion(e.clientX, e.clientY);
        // startSimpleFloatingMotion();
    }, MOUSE_IDLE_TIME);

    // if mouse is idle for some time, fade away
    if (cursorPetImage.style.opacity !== 1) {
        cursorPetImage.style.opacity = 1;
    }
    clearTimeout(fadeAwayIdleTimeout);
    fadeAwayIdleTimeout = setTimeout(() => {
        cursorPetImage.style.opacity = 0;
    }, CIRCLING_TIME);

    // if (!isCircling && Math.random() < 0.01) {
    // startCircularMotion(e.clientX, e.clientY);
    // }
});

//helper method to flip image horizontally depending on mouse position
function handleImageOrientation() {
    const imgLeft = parseFloat(cursorPetImage.style.left) || 0;
    let imageCenterX = imgLeft + cursorPetImage.width / 2;
    let scale = imgOrientationX;
    if (imageCenterX < mousePosX) {
        scale = imgOrientationX * -1;
    }
    cursorPetImage.style.transform = `scaleX(${scale})`;
}

// ================== ANIMATE =========================

function animate() {
    const EASING_FACTOR = 0.02;

    const currentX = parseFloat(cursorPetImage.style.left) || 0;
    const currentY = parseFloat(cursorPetImage.style.top) || 0;

    const dx = targetX - currentX;
    const dy = targetY - currentY;

    const vx = dx * EASING_FACTOR;
    const vy = dy * EASING_FACTOR;

    cursorPetImage.style.left = currentX + vx + 'px';
    cursorPetImage.style.top = currentY + vy + 'px';

    requestAnimationFrame(animate);
}

animate();

// ================== CIRCULAR MOTION =========================

const randRange = (min, max) => Math.random() * (max - min) + min;

function startCircularMotion(mouseX, mouseY) {
    isCircling = true;

    const centerX = mouseX;
    const centerY = mouseY;
    const radius = randRange(100, 200); // Random radius between 50 and 150
    const speed = randRange(0.02, 0.05) * 0.025; // Random speed between 0.02 and 0.07
    const angleOffset = Math.random() * Math.PI * 2; // Random angle offset

    const startTime = performance.now();

    function animateCircularMotion(timestamp) {
        const elapsedTime = timestamp - startTime;

        const angle = angleOffset + speed * elapsedTime;
        const x = centerX + Math.cos(angle) * radius; // the x coordinate of the circle
        const y = centerY + Math.sin(angle) * radius * 0.6; // Multiply by 0.6 for elliptical motion

        cursorPetImage.style.left = x - cursorPetImage.width / 2 + 'px';
        cursorPetImage.style.top = y - cursorPetImage.height / 2 + 'px';

        handleImageOrientation();

        if (isCircling) {
            requestAnimationFrame(animateCircularMotion);
        }
    }

    animateCircularMotion(performance.now());
}

function stopCircularMotion() {
    isCircling = false;
}

// ================== FLOATING MOTION =========================
const FLOAT_AMPLITUDE = 10; // Amplitude of the float motion
const FLOAT_PERIOD = 2000; // Period of the float motion in milliseconds
const FLOAT_FREQUENCY = 1 / 400;
const FLOAT_DELTA_TIME = 32;

let isFloating = false;
// let floatTimeoutId;

// TODO: this is broken, need to fix
function startFloatMotion() {
    if (!isFloating) {
        isFloating = true;

        const initialY = parseFloat(cursorPetImage.style.top) || 0;
        const startTime = performance.now();

        function animateFloatMotion(timestamp) {
            const elapsedTime = timestamp - startTime;
            const yOffset = Math.sin(elapsedTime / FLOAT_PERIOD) * FLOAT_AMPLITUDE;

            cursorPetImage.style.top = initialY + yOffset + 'px';

            if (isFloating) {
                requestAnimationFrame(animateFloatMotion);
            }
        }

        animateFloatMotion(performance.now());
    }
}

function stopFloatMotion() {
    isFloating = false;
}

// Start the float motion initially
// floatTimeoutId = setTimeout(startFloatMotion, MOUSE_IDLE_TIME);

// ================== SIMPLE FLOATING ANIMATION =========================
function startSimpleFloatingMotion() {
    // Calculate the vertical offset using the sine function
    const offsetY = FLOAT_AMPLITUDE * Math.sin(FLOAT_FREQUENCY * Date.now());
    // object.posY += offsetY;    
    let currPosY = parseFloat(cursorPetImage.style.top) || 0;
    let newPosY = currPosY += offsetY;
    cursorPetImage.style.top = newPosY + 'px';
    // Schedule the next update using the deltaTime
    setTimeout(() => startSimpleFloatingMotion(), FLOAT_DELTA_TIME);
}
// startSimpleFloatingMotion();

// ================== CLICK =========================

// ================== OTHER =========================

document.documentElement.appendChild(cursorPetImage);
