document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('templateForm');
    const saveButton = document.getElementById('saveButton');
    const cancelButton = document.getElementById('cancelButton');
    const textarea = document.getElementById('templateContent');
    const charCount = document.getElementById('charCount');
    const titleInput = document.getElementById('templateTitle');
    const categorySelect = document.getElementById('templateCategory');

    // Formular-Validierung
    function validateForm() {
        const title = titleInput.value.trim();
        const category = categorySelect.value;
        const content = textarea.value.trim();

        let isValid = true;
        let errorMessage = '';

        if (!title) {
            errorMessage = 'Bitte geben Sie einen Titel ein';
            isValid = false;
        } else if (title.length > 100) {
            errorMessage = 'Der Titel darf maximal 100 Zeichen lang sein';
            isValid = false;
        } else if (!category) {
            errorMessage = 'Bitte wählen Sie eine Kategorie aus';
            isValid = false;
        } else if (!content) {
            errorMessage = 'Bitte geben Sie einen Inhalt ein';
            isValid = false;
        }

        if (!isValid) {
            showNotification('error', errorMessage);
        }

        return isValid;
    }

    // Formular-Submit-Handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (validateForm()) {
            await saveTemplate();
        }
    });

    // Save-Button-Handler
    saveButton.addEventListener('click', async () => {
        if (validateForm()) {
            await saveTemplate();
        }
    });

    // Cancel-Button-Handler
    cancelButton.addEventListener('click', () => {
        if (hasUnsavedChanges()) {
            if (confirm('Möchten Sie die Änderungen wirklich verwerfen?')) {
                window.close();
            }
        } else {
            window.close();
        }
    });

    // Zeichenzähler für Textarea
    function updateCharCount() {
        const count = textarea.value.length;
        charCount.textContent = count;
    }

    textarea.addEventListener('input', updateCharCount);

    // Automatische Größenanpassung für Textarea
    function adjustTextareaHeight() {
        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, 300);
        textarea.style.height = newHeight + 'px';
    }

    // Initiale Höhenanpassung
    adjustTextareaHeight();
    updateCharCount();

    // Event-Listener für Textarea-Änderungen
    textarea.addEventListener('input', () => {
        adjustTextareaHeight();
        updateCharCount();
    });

    // Scroll-Handler für Textarea
    textarea.addEventListener('scroll', () => {
        if (textarea.scrollTop + textarea.clientHeight >= textarea.scrollHeight - 20) {
            textarea.style.height = (textarea.scrollHeight + 20) + 'px';
        }
    });

    // Prüfen auf ungespeicherte Änderungen
    function hasUnsavedChanges() {
        return titleInput.value.trim() !== '' || 
               categorySelect.value !== '' || 
               textarea.value.trim() !== '';
    }

    // Template speichern
    async function saveTemplate() {
        try {
            saveButton.disabled = true;
            saveButton.textContent = 'Wird gespeichert...';

            const template = {
                id: generateId(),
                title: titleInput.value.trim(),
                category: categorySelect.value,
                content: textarea.value.trim(),
                createdAt: new Date().toISOString()
            };

            // Bestehende Templates laden
            const result = await chrome.storage.local.get('templates');
            const templates = result.templates || [];

            // Neues Template hinzufügen
            templates.push(template);

            // Templates speichern
            await chrome.storage.local.set({ templates });

            showNotification('success', 'Vorlage erfolgreich gespeichert');

            // Kurze Verzögerung vor dem Schließen
            setTimeout(() => {
                window.close();
            }, 1000);

        } catch (error) {
            console.error('Fehler beim Speichern der Vorlage:', error);
            showNotification('error', 'Fehler beim Speichern der Vorlage');
            saveButton.disabled = false;
            saveButton.textContent = 'Speichern';
        }
    }

    // Benachrichtigung anzeigen
    function showNotification(type, message) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animation starten
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Benachrichtigung nach 3 Sekunden entfernen
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Eindeutige ID generieren
    function generateId() {
        return 'template_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Warnung beim Verlassen der Seite
    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedChanges()) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}); 