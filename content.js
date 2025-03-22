function debugLog(message) {
    console.log(`[KUL Lecture Downloader] ${message}`);
}

debugLog('Content script loaded in frame:', window.location.href);

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
    const { entryId, partnerId } = extractKalturaInfo();
    let url = `https://cdnapisec.kaltura.com/p/${partnerId}/sp/${partnerId}00/playManifest/entryId/${entryId}/format/download/protocol/https/flavorParamIds/0`;

    debugLog('Found download URL:' + url);

    // Create the download button
    const button = document.createElement('button');
    button.textContent = 'Download';
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

window.addEventListener('load', injectDownloadButton);
debugLog('Listener set up successfully');
