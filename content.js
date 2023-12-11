const cursorPetImage = new Image();
let imgScaleX = -1;
cursorPetImage.src = chrome.runtime.getURL('chibi_paimon_cautious.png');
cursorPetImage.style.all = 'initial'; // remove all styles
cursorPetImage.style.maxWidth = '100px';
cursorPetImage.style.position = 'fixed';
cursorPetImage.style.pointerEvents = 'none';
cursorPetImage.style.zIndex = 9999;
cursorPetImage.style.transform = `scaleX(${imgScaleX})`;
cursorPetImage.style.transition = 'opacity 2.5s ease-in-out';

const PAGE_CENTER_X = window.innerWidth / 2;
const PAGE_CENTER_Y = window.innerHeight / 2;

const PADDING = -50;

const MOUSE_IDLE_TIME = 8000; // 8 seconds of idle time before starting circular motion
const CIRCLING_TIME = MOUSE_IDLE_TIME + 6000; // 5 seconds of idle time before fading away

let targetX = PAGE_CENTER_X; // Target X position of image
let targetY = PAGE_CENTER_Y; // Target Y position of image

let mousePosX = 0; // Mouse X position
let mousePosY = 0; // Mouse Y position

let isCircling = false;
let circlingIdleTimeout = null;

let fadeAwayIdleTimeout = null;

// fetch image url from local storage
function fetchImageUrl() {
    chrome.storage.local.get("customPetImageUrl", function (data) {
        if (data.customPetImageUrl) {
            console.log(data.customPetImageUrl);
            cursorPetImage.src = data.customPetImageUrl;
            console.log('image url set successfully in content.js');
        } else {
            cursorPetImage.src = chrome.runtime.getURL('chibi_paimon_cautious.png');
            console.log('INVALID data.customPetImageUrl');
        }
    });
}
fetchImageUrl();

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.imageDataUrl) {
        cursorPetImage.src = request.imageDataUrl;
        sendResponse({ message: 'Image set successfully in content.js' });
    } else if (request.orientation) {
        imgScaleX *= -1;
        cursorPetImage.style.transform = `scaleX(${imgScaleX})`;
        sendResponse({ message: 'Orientation set successfully in content.js' });
    } else {
        sendResponse({ message: 'Message FAILED in content.js' });
    }
});

document.addEventListener('mousemove', (e) => {

    mousePosX = e.clientX;
    mousePosY = e.clientY;

    targetX = mousePosX - cursorPetImage.width / 2 + PADDING;
    targetY = mousePosY - cursorPetImage.height / 2 - PADDING;

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
    let scale = imgScaleX;
    if (imageCenterX < mousePosX) {
        scale = imgScaleX * -1;
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
