function debugLog(message) {
    console.log(`[KUL Lecture Downloader] ${message}`);
}

debugLog('Content script loaded in frame:', window.location.href);

function extractDownloadUrl(scriptContent) {
    try {
        // Look for the downloadUrl in the script content using RegEx
        const match = scriptContent.match(/"downloadUrl"\s*:\s*"([^"]+)"/);
        if (match && match[1]) {
            // Unescape any escaped characters in the URL
            return match[1].replace(/\\+/g, '\\');
        }
        return null;
    } catch (e) {
        debugLog('Error extracting URL:', e);
        return null;
    }
}

function findDownloadLinks() {
    debugLog('Attempting to find download link in frame:', window.location.href);

    const kplayerIfp = document.getElementById('kplayer_ifp');

    if (!kplayerIfp) {
        debugLog('kplayer_ifp not found');
        return;
    }

    debugLog('Found kplayer_ifp:', kplayerIfp);

    const kplayerIfpDocument = kplayerIfp.contentWindow.document;
    const scriptContent = kplayerIfpDocument.querySelector('body > script:nth-child(2)').text;

    const url = extractDownloadUrl(scriptContent);

    if (!url) {
        debugLog('Download URL not found');
        return;
    }

    debugLog('Found download URL:', url);

    // Create the download button
    const downloadButton = document.createElement('button');
    downloadButton.title = 'Download';
    downloadButton.className = 'btn icon-download comp pull-right display-high';
    downloadButton.dataset.showTooltip = 'true';
    downloadButton.tabIndex = 3;
    downloadButton.onclick = () => window.location.href = url;

    // Append the download button to the control bar
    const controlBar = kplayerIfpDocument.querySelector('body > div.playlistInterface > div > div.controlBarContainer.hover.open > div.controlsContainer');

    if (!controlBar) {
        debugLog('Control bar not found');
        return;
    }

    controlBar.appendChild(downloadButton);
    debugLog('Added additional download button:', downloadButton);
}

window.addEventListener('load', findDownloadLinks);
debugLog('Listener set up successfully');
