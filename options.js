// Einstellungen laden und speichern
document.addEventListener('DOMContentLoaded', () => {
    // UI-Elemente
    const darkModeToggle = document.getElementById('darkMode');
    const notificationsToggle = document.getElementById('notifications');
    const notificationPosition = document.getElementById('notificationPosition');
    const notificationSound = document.getElementById('notificationSound');
    const quickMenuShortcut = document.getElementById('quickMenuShortcut');
    const resetBtn = document.getElementById('resetBtn');
    const saveBtn = document.getElementById('saveBtn');
    const settingsNotification = document.getElementById('settingsNotification');

    // Standardeinstellungen
    const defaultSettings = {
        darkMode: true,
        notifications: true,
        notificationPosition: 'top-right',
        notificationSound: true,
        quickMenuShortcut: 'Ctrl+Shift+T'
    };

    // Einstellungen laden
    function loadSettings() {
        chrome.storage.sync.get(defaultSettings, (settings) => {
            darkModeToggle.checked = settings.darkMode;
            notificationsToggle.checked = settings.notifications;
            notificationPosition.value = settings.notificationPosition;
            notificationSound.checked = settings.notificationSound;
            quickMenuShortcut.value = settings.quickMenuShortcut;
            
            // Dark Mode anwenden
            document.body.classList.toggle('dark-mode', settings.darkMode);
        });
    }

    // Einstellungen speichern
    function saveSettings() {
        const settings = {
            darkMode: darkModeToggle.checked,
            notifications: notificationsToggle.checked,
            notificationPosition: notificationPosition.value,
            notificationSound: notificationSound.checked,
            quickMenuShortcut: quickMenuShortcut.value
        };

        chrome.storage.sync.set(settings, () => {
            showNotification('Einstellungen gespeichert');
            
            // Dark Mode sofort anwenden
            document.body.classList.toggle('dark-mode', settings.darkMode);
            
            // Benachrichtigungen aktualisieren
            updateNotificationSettings();
        });
    }

    // Einstellungen zurücksetzen
    function resetSettings() {
        if (confirm('Möchten Sie wirklich alle Einstellungen zurücksetzen?')) {
            chrome.storage.sync.set(defaultSettings, () => {
                loadSettings();
                showNotification('Einstellungen zurückgesetzt');
            });
        }
    }

    // Benachrichtigung anzeigen
    function showNotification(message) {
        const notification = settingsNotification;
        const messageElement = notification.querySelector('span');
        
        messageElement.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Benachrichtigungseinstellungen aktualisieren
    function updateNotificationSettings() {
        chrome.runtime.sendMessage({
            action: 'updateNotificationSettings',
            settings: {
                enabled: notificationsToggle.checked,
                position: notificationPosition.value,
                sound: notificationSound.checked
            }
        });
    }

    // Event Listener
    darkModeToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode', darkModeToggle.checked);
    });

    notificationsToggle.addEventListener('change', () => {
        notificationPosition.disabled = !notificationsToggle.checked;
        notificationSound.disabled = !notificationsToggle.checked;
    });

    saveBtn.addEventListener('click', saveSettings);
    resetBtn.addEventListener('click', resetSettings);

    // Tastenkombination ändern
    quickMenuShortcut.addEventListener('click', () => {
        const newShortcut = prompt('Geben Sie die neue Tastenkombination ein (z.B. Ctrl+Shift+T):', quickMenuShortcut.value);
        if (newShortcut) {
            quickMenuShortcut.value = newShortcut;
            saveSettings();
        }
    });

    // Initial laden
    loadSettings();
});

// Theme anwenden
function applyTheme(isDarkMode) {
    document.documentElement.style.setProperty('--surface-color', isDarkMode ? '#202124' : '#ffffff');
    document.documentElement.style.setProperty('--surface-variant', isDarkMode ? '#2d2e31' : '#f8f9fa');
    document.documentElement.style.setProperty('--text-primary', isDarkMode ? '#ffffff' : '#202124');
    document.documentElement.style.setProperty('--text-secondary', isDarkMode ? '#9aa0a6' : '#5f6368');
    document.documentElement.style.setProperty('--border-color', isDarkMode ? '#3c4043' : '#dadce0');
}

// Status anzeigen
function showStatus(type, message) {
    const statusIndicator = document.createElement('div');
    statusIndicator.className = `status-indicator ${type}`;
    statusIndicator.textContent = message;
    
    const container = document.querySelector('.settings-container');
    container.appendChild(statusIndicator);
    
    setTimeout(() => {
        statusIndicator.remove();
    }, 3000);
} 