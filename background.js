// Background Script für Text Templates Pro
const premiumFeatures = {
    maxTemplates: {
        free: 5,
        premium: Infinity
    },
    categories: {
        free: ['email', 'support'],
        premium: ['email', 'support', 'dev', 'ai']
    }
};

chrome.runtime.onInstalled.addListener(() => {
    // Entwicklermodus-Check
    const isDevMode = chrome.runtime.getManifest().key !== undefined;
    
    // Initialisiere Standard-Templates
    chrome.storage.local.get(['templates'], (result) => {
        if (!result.templates) {
            const defaultTemplates = [
                {
                    id: 'email-meeting',
                    title: 'Meeting Einladung',
                    category: 'email',
                    content: 'Betreff: Meeting Einladung - [Thema]\n\nHallo [Name],\n\nich möchte Sie zu einem Meeting einladen:\n\n📅 Datum: [Datum]\n🕐 Zeit: [Zeit]\n📍 Ort: [Ort/Link]\n📋 Agenda: [Agenda]\n\nBitte bestätigen Sie Ihre Teilnahme.\n\nBeste Grüße,\n[Ihr Name]',
                    isPremium: false
                },
                {
                    id: 'support-ticket',
                    title: 'Support Ticket Antwort',
                    category: 'support',
                    content: 'Hallo [Kundenname],\n\nvielen Dank für Ihre Anfrage (Ticket #[Nummer]).\n\nIch habe Ihr Problem analysiert und folgende Lösung gefunden:\n\n1. [Schritt 1]\n2. [Schritt 2]\n3. [Schritt 3]\n\nSollten Sie weitere Fragen haben, zögern Sie nicht, sich zu melden.\n\nFreundliche Grüße,\n[Support Team]',
                    isPremium: false
                },
                {
                    id: 'dev-git-commit',
                    title: 'Git Commit Message',
                    category: 'dev',
                    content: 'feat: add new feature\n\n- Implement user authentication\n- Add validation logic\n- Update documentation\n\nCloses #123',
                    isPremium: true
                },
                {
                    id: 'ai-code-generation',
                    title: 'AI Code Generation',
                    category: 'ai',
                    content: 'Generate a [language] function that [description].\n\nRequirements:\n- Use modern best practices\n- Include error handling\n- Write clean, commented code\n- Create unit tests\n\nCode style: [style preferences]',
                    isPremium: true
                }
            ];
            chrome.storage.local.set({ templates: defaultTemplates });
        }
    });

    // Setze Premium-Status basierend auf Entwicklermodus
    chrome.storage.local.set({ isPremium: isDevMode });
});

// Kontextmenü erstellen
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'insertTemplate',
        title: 'Text Template einfügen',
        contexts: ['editable']
    });
});

// Kontextmenü-Handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'insertTemplate') {
        chrome.tabs.sendMessage(tab.id, { action: 'showTemplateMenu' });
    }
});

// Tastenkürzel-Handler
chrome.commands.onCommand.addListener((command) => {
    if (command === 'open-templates') {
        chrome.action.openPopup();
    }
});

// Nachrichten-Handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkPremiumStatus') {
        chrome.storage.local.get(['isPremium'], (result) => {
            sendResponse({ isPremium: result.isPremium || false });
        });
        return true;
    }
});

// Tab-Aktualisierung-Handler
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url.startsWith('http')) {
        chrome.tabs.sendMessage(tabId, { action: 'pageLoaded' });
    }
});

// Nachrichten von Content Script verarbeiten
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getTemplates') {
        chrome.storage.local.get(['templates'])
            .then((result) => {
                sendResponse({ templates: result.templates || [] });
            })
            .catch(error => {
                console.error('Fehler beim Abrufen der Templates:', error);
                sendResponse({ error: 'Fehler beim Abrufen der Templates' });
            });
        return true; // Asynchrone Antwort
    }
});

// Keyboard Shortcuts
chrome.commands.onCommand.addListener((command) => {
    if (command === 'open-templates') {
        chrome.action.openPopup().catch(error => {
            console.error('Fehler beim Öffnen des Popups:', error);
        });
    }
});

// Premium-Status prüfen
async function checkPremiumStatus() {
    try {
        // Für Entwicklermodus-Tests
        if (chrome.runtime.getManifest().key) {
            return true; // Im Entwicklermodus immer Premium
        }

        // Prüfe zuerst den lokalen Status
        const localStatus = await chrome.storage.local.get(['isPremium']);
        if (localStatus.isPremium) {
            return true;
        }

        // Wenn kein lokaler Status, prüfe den Store-Status
        const token = await new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ interactive: false }, (token) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(token);
                }
            });
        });

        if (!token) {
            return false;
        }

        const response = await fetch(
            `https://www.googleapis.com/chromewebstore/v1.1/items/${chrome.runtime.id}/entitlements`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error('API-Antwort nicht erfolgreich');
        }

        const data = await response.json();
        const isPremium = data.entitlements && data.entitlements.length > 0;

        // Speichere den Status lokal
        await chrome.storage.local.set({ 'isPremium': isPremium });

        return isPremium;
    } catch (error) {
        console.error('Fehler bei der Premium-Status-Prüfung:', error);
        // Bei Fehlern den lokalen Status zurücksetzen
        await chrome.storage.local.set({ 'isPremium': false });
        return false;
    }
}

// Feature-Zugriff prüfen
function hasFeatureAccess(feature) {
    // Für Entwicklermodus-Tests
    if (chrome.runtime.getManifest().key) {
        return true; // Im Entwicklermodus alle Features freischalten
    }
    return premiumFeatures.features.premium.includes(feature);
}

// Template-Limit prüfen
async function checkTemplateLimit() {
    // Für Entwicklermodus-Tests
    if (chrome.runtime.getManifest().key) {
        return true; // Im Entwicklermodus kein Limit
    }

    const isPremium = await checkPremiumStatus();
    const maxTemplates = isPremium ? premiumFeatures.maxTemplates.premium : premiumFeatures.maxTemplates.free;
    
    const templates = await chrome.storage.sync.get('templates');
    return (templates.templates || []).length < maxTemplates;
}

// Kategorie-Zugriff prüfen
function hasCategoryAccess(category) {
    // Für Entwicklermodus-Tests
    if (chrome.runtime.getManifest().key) {
        return true; // Im Entwicklermodus alle Kategorien freischalten
    }
    return premiumFeatures.categories.premium.includes(category);
}

// Nachrichten-Handler für Feature-Zugriff
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkFeatureAccess') {
        const hasAccess = hasFeatureAccess(request.feature);
        sendResponse({ hasAccess });
        return true;
    }
    
    if (request.action === 'checkCategoryAccess') {
        const hasAccess = hasCategoryAccess(request.category);
        sendResponse({ hasAccess });
        return true;
    }
    
    if (request.action === 'checkTemplateLimit') {
        checkTemplateLimit()
            .then(hasSpace => sendResponse({ hasSpace }))
            .catch(error => {
                console.error('Fehler bei der Template-Limit-Prüfung:', error);
                sendResponse({ hasSpace: false });
            });
        return true;
    }
});

