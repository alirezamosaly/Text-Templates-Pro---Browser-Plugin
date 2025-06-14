// Content Script für Text Templates Pro
let isInitialized = false;

// Initialisierung
function initialize() {
    if (isInitialized) return;
    
    // Event Listener für Nachrichten vom Popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'insertText') {
            insertText(request.text);
            sendResponse({ success: true });
        }
        return true;
    });

    isInitialized = true;
}

// Text in aktives Element einfügen
function insertText(text) {
    const activeElement = document.activeElement;
    
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        
        // Text einfügen
        activeElement.value = activeElement.value.substring(0, start) + 
                            text + 
                            activeElement.value.substring(end);
        
        // Cursor-Position aktualisieren
        activeElement.selectionStart = activeElement.selectionEnd = start + text.length;
        
        // Event auslösen
        activeElement.dispatchEvent(new Event('input', { bubbles: true }));
    }
}

// Initialisierung beim Laden
initialize();

// Re-Initialisierung bei DOM-Änderungen
const observer = new MutationObserver(() => {
    if (!isInitialized) {
        initialize();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

