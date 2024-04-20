// ==UserScript==
// @name         EAN to QR Code Injector Within Specific Container
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Extract EAN from URL, generate and display QR code within a specific container on the page.
// @author       You
// @match        https://dc.kfplc.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

// Extract EAN from URL
function extractEANFromURL() {
    try {
        const url = window.location.href;
        const matches = url.match(/(\d{13})/);
        if (matches) {
            console.log(`EAN extracted: ${matches[0]}`);
            return matches[0];
        } else {
            console.log('No EAN found in URL');
            return null;
        }
    } catch (error) {
        console.error('Error extracting EAN from URL:', error);
        return null;
    }
}

// Construct QR Code URL
function constructQRCodeURL(ean) {
    if (!ean) {
        console.log('No EAN provided to construct QR Code URL');
        return null;
    }
    const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=${ean}`;
    console.log(`QR Code URL constructed: ${qrCodeURL}`);
    return qrCodeURL;
}

function insertQRCodeWithLoadCheck(ean) {
    const qrCodeURL = constructQRCodeURL(ean);
    if (!qrCodeURL) {
        console.log('No QR Code URL provided to insert into the page');
        return;
    }

    // Create an img element for the QR code
    const qrImg = document.createElement('img');
    qrImg.src = qrCodeURL;
    qrImg.style.display = 'inline-block';
    qrImg.style.margin = '10px 50px'; // Adjustments for positioning

    // Target the specific element where the QR code should be inserted
    const targetElementSelector = 'li.prod-group__details';
    const targetElement = document.querySelector(targetElementSelector);

    if (targetElement) {
        // Listen for the 'load' event to ensure the QR code image is ready before appending
        qrImg.onload = function() {
            targetElement.appendChild(qrImg);
            console.log('QR Code image successfully loaded and inserted.');
        };

        qrImg.onerror = function() {
            console.log('Failed to load QR Code image.');
        };
    } else {
        console.log('Target element not found on the page.');
    }
}



// Function to observe DOM changes and execute code when target element is available
function waitForElementAndInsertQRCode(ean) {
    const observer = new MutationObserver(function(mutations, me) {
        const targetElement = document.querySelector('li.prod-group__details');
        if (targetElement) {
            const qrCodeURL = constructQRCodeURL(ean);
            insertQRCodeWithLoadCheck(ean);
            me.disconnect(); // Stop observing once the element has been found and processed
        }
    });

    observer.observe(document, {
        childList: true,
        subtree: true
    });
}

// Main Logic
(function main() {
    console.log('Tampermonkey script initiated');
    try {
        const ean = extractEANFromURL();
        if (ean) {
            waitForElementAndInsertQRCode(ean);
        } else {
            console.log('No EAN available to process');
        }
    } catch (error) {
        console.error('Error in main function:', error);
    }
})();
