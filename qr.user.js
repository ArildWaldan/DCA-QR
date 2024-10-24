// ==UserScript==
// @name         DCA-QR-codes
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Extract EAN from URL, generate and display QR code within a specific container on the page.
// @author       You
// @match        https://dc.kfplc.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

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
            // Check if the QR code has already been inserted to avoid duplicates
            if (!targetElement.querySelector('img[src^="https://api.qrserver.com"]')) {
                // Listen for the 'load' event to ensure the QR code image is ready before appending
                qrImg.onload = function() {
                    targetElement.appendChild(qrImg);
                    console.log('QR Code image successfully loaded and inserted.');
                };

                qrImg.onerror = function() {
                    console.log('Failed to load QR Code image.');
                };
            } else {
                console.log('QR Code already inserted.');
            }
        } else {
            console.log('Target element not found on the page.');
        }
    }

    // Function to observe DOM changes and execute code when target element is available
    function waitForElementAndInsertQRCode(ean) {
        const targetElementSelector = 'li.prod-group__details';
        let targetElement = document.querySelector(targetElementSelector);

        if (targetElement) {
            console.log('Target element found immediately.');
            insertQRCodeWithLoadCheck(ean);
        } else {
            console.log('Target element not found, setting up MutationObserver.');
            const observer = new MutationObserver(function(mutations, me) {
                targetElement = document.querySelector(targetElementSelector);
                if (targetElement) {
                    console.log('Target element found via MutationObserver.');
                    insertQRCodeWithLoadCheck(ean);
                    me.disconnect(); // Stop observing once the element has been found and processed
                }
            });
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }

    // Function to re-run main logic when URL changes
    function onUrlChange() {
        console.log('URL changed to:', window.location.href);
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
    }

    // Function to inject code for detecting URL changes
    function injectUrlChangeHandler() {
        // Keep track of the previous URL
        let previousUrl = window.location.href;

        // Override history.pushState
        const originalPushState = history.pushState;
        history.pushState = function(...args) {
            originalPushState.apply(this, args);
            const url = args[2];
            if (url !== previousUrl) {
                previousUrl = url;
                onUrlChange();
            }
        };

        // Override history.replaceState
        const originalReplaceState = history.replaceState;
        history.replaceState = function(...args) {
            originalReplaceState.apply(this, args);
            const url = args[2];
            if (url !== previousUrl) {
                previousUrl = url;
                onUrlChange();
            }
        };

        // Listen to the popstate event (back/forward navigation)
        window.addEventListener('popstate', function() {
            if (window.location.href !== previousUrl) {
                previousUrl = window.location.href;
                onUrlChange();
            }
        });
    }

    // Main Logic
    (function main() {
        console.log('Tampermonkey script initiated');
        injectUrlChangeHandler();
        onUrlChange(); // Run on initial load
    })();
})();
