// ==UserScript==
// @name         KU Leuven Lecture Downloader
// @namespace    https://github.com/breitburg/toledo-download-extension
// @version      1.0.0
// @description  Adds download button to KU Leuven video players
// @author       breitburg
// @match        https://*.edu.kuleuven.cloud/*
// @run-at       document-end
// @grant        none
// @updateURL    https://github.com/breitburg/toledo-download-extension/raw/main/ku-leuven-lecture-downloader.user.js
// @downloadURL  https://github.com/breitburg/toledo-download-extension/raw/main/ku-leuven-lecture-downloader.user.js
// @supportURL   https://github.com/breitburg/toledo-download-extension/issues
// ==/UserScript==

(function() {
    'use strict';

    function debugLog(message) {
        console.log(`[KUL Lecture Downloader] ${message}`);
    }

    debugLog('Userscript loaded in frame:', window.location.href);

    function extractKalturaInfo() {
        // Extract entryId
        let entryId = null;
        const entryIdPatterns = [
            /entry_id[\s]*:[\s]*['"]([^'"]+)['"]/i,
            /entryId[\s]*:[\s]*['"]([^'"]+)['"]/i,
            /entryId[\/=]([^&\/"']+)/i,
            /1_[a-z0-9]{8}/i
        ];

        for (const pattern of entryIdPatterns) {
            const match = document.documentElement.outerHTML.match(pattern);
            if (match && match[1]) {
                entryId = match[1];
                break;
            } else if (match && pattern.toString().includes('1_')) {
                // For the fallback pattern which doesn't have a capture group
                entryId = match[0];
                break;
            }
        }

        // Extract partnerId
        let partnerId = null;
        const partnerIdPatterns = [
            /wid[\s]*:[\s]*['"]_(\d+)['"]/i,
            /partnerId[\s]*:[\s]*['"]?(\d+)['"]?/i,
            /p\/(\d+)\//i,
            /_(\d+)['"]/i
        ];

        for (const pattern of partnerIdPatterns) {
            const match = document.documentElement.outerHTML.match(pattern);
            if (match && match[1]) {
                partnerId = match[1];
                break;
            }
        }

        return { entryId, partnerId };
    }

    function injectDownloadButton() {
        // Check if button already exists
        if (document.querySelector('.kul-download-button')) {
            debugLog('Download button already exists');
            return;
        }

        const { entryId, partnerId } = extractKalturaInfo();
        
        if (!entryId || !partnerId) {
            debugLog('Could not extract Kaltura info');
            return;
        }

        let url = `https://cdnapisec.kaltura.com/p/${partnerId}/sp/${partnerId}00/playManifest/entryId/${entryId}/format/download/protocol/https/flavorParamIds/0`;

        debugLog('Found download URL:' + url);

        // Create the download button
        const button = document.createElement('button');
        button.textContent = 'Download';
        button.className = 'kul-download-button';
        button.style.cssText = `
            margin-right: 8px;
            padding: 4px 8px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        `;
        button.onclick = () => window.open(url, '_blank');

        // Append the download button to the control bar
        const controlBar = document.querySelector('#player-gui > div.playkit-gui-area > div.playkit-bottom-bar > div.playkit-controls-container > div.playkit-right-controls');

        if (!controlBar) {
            debugLog('Control bar not found');
            return;
        }

        controlBar.prepend(button);
        debugLog('Download button added successfully');
    }

    // Enhanced injection with retries for dynamic content
    function tryInjectWithRetry(maxRetries = 5, delay = 1000) {
        let attempts = 0;
        
        function attemptInject() {
            attempts++;
            injectDownloadButton();
            
            // Check if button was successfully added
            if (!document.querySelector('.kul-download-button') && attempts < maxRetries) {
                debugLog(`Injection attempt ${attempts} failed, retrying in ${delay}ms...`);
                setTimeout(attemptInject, delay);
            } else if (attempts >= maxRetries) {
                debugLog('Max injection attempts reached');
            }
        }
        
        attemptInject();
    }

    // Wait for the page to load and try to inject the button
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => tryInjectWithRetry());
    } else {
        tryInjectWithRetry();
    }

    // Also listen for window load as fallback
    window.addEventListener('load', () => tryInjectWithRetry());
    
    // Watch for dynamic content changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Check if player controls were added
                const hasPlayerControls = Array.from(mutation.addedNodes).some(node => 
                    node.nodeType === Node.ELEMENT_NODE && 
                    (node.matches && node.matches('#player-gui') || 
                     node.querySelector && node.querySelector('#player-gui'))
                );
                
                if (hasPlayerControls && !document.querySelector('.kul-download-button')) {
                    debugLog('Player controls detected, attempting button injection...');
                    setTimeout(() => injectDownloadButton(), 500);
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    
    debugLog('Userscript setup complete');
})();