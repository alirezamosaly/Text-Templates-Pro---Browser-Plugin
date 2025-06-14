// Popup JavaScript für Text Templates Pro
class TextTemplatesPro {
    constructor() {
        this.templates = [];
        this.currentCategory = 'all';
        this.isPremium = false;
        this.init();
    }

    async init() {
        await this.checkPremiumStatus();
        await this.loadTemplates();
        this.setupEventListeners();
        this.setupTextareaResize();
        this.renderTemplates();
        this.loadDefaultTemplates();
        this.updatePremiumUI();
    }

    async checkPremiumStatus() {
        try {
            // Entwicklermodus-Check
            const manifest = chrome.runtime.getManifest();
            const isDevMode = manifest.key !== undefined;
            
            if (isDevMode) {
                this.isPremium = true;
                await chrome.storage.local.set({ 'isPremium': true });
                return;
            }

            const result = await chrome.storage.local.get(['isPremium']);
            this.isPremium = result.isPremium || false;
        } catch (error) {
            console.error('Fehler beim Prüfen des Premium-Status:', error);
            this.isPremium = false;
        }
    }

    async updatePremiumUI() {
        const premiumBadge = document.getElementById('premiumBadge');
        const premiumUpsell = document.getElementById('premiumUpsell');
        const premiumOnlyElements = document.querySelectorAll('.premium-only');
        const aiPromptSection = document.querySelector('.ai-prompt-section');

        if (this.isPremium) {
            premiumBadge.style.display = 'flex';
            premiumUpsell.style.display = 'none';
            
            premiumOnlyElements.forEach(el => {
                el.classList.remove('disabled');
                el.removeAttribute('disabled');
                el.style.opacity = '1';
                el.style.pointerEvents = 'auto';
            });

            if (aiPromptSection) {
                aiPromptSection.style.display = 'block';
            }
        } else {
            premiumBadge.style.display = 'none';
            const { upsellClosed } = await chrome.storage.local.get(['upsellClosed']);
            premiumUpsell.style.display = upsellClosed ? 'none' : 'block';
            
            premiumOnlyElements.forEach(el => {
                el.classList.add('disabled');
                el.setAttribute('disabled', 'disabled');
                el.style.opacity = '0.5';
                el.style.pointerEvents = 'none';
            });

            if (aiPromptSection) {
                aiPromptSection.style.display = 'none';
            }
        }
    }

    async loadTemplates() {
        try {
            const result = await chrome.storage.local.get(['templates']);
            this.templates = result.templates || [];
        } catch (error) {
            console.error('Fehler beim Laden der Templates:', error);
            this.templates = [];
        }
    }

    async saveTemplates() {
        try {
            await chrome.storage.local.set({ templates: this.templates });
        } catch (error) {
            console.error('Fehler beim Speichern der Templates:', error);
        }
    }

    loadDefaultTemplates() {
        if (this.templates.length === 0) {
            this.templates = [
                {
                    id: 'dev-git-commit',
                    title: 'Git Commit Message',
                    category: 'dev',
                    content: 'feat: add new feature\\n\\n- Implement user authentication\\n- Add validation logic\\n- Update documentation\\n\\nCloses #123',
                    isPremium: false
                },
                {
                    id: 'dev-code-review',
                    title: 'Code Review Template',
                    category: 'dev',
                    content: '## Code Review\\n\\n### Positives:\\n- Clean code structure\\n- Good variable naming\\n\\n### Verbesserungen:\\n- [ ] Add error handling\\n- [ ] Improve performance\\n- [ ] Add unit tests\\n\\n### Fazit:\\nLGTM with minor changes',
                    isPremium: false
                },
                {
                    id: 'email-meeting',
                    title: 'Meeting Einladung',
                    category: 'email',
                    content: 'Betreff: Meeting Einladung - [Thema]\\n\\nHallo [Name],\\n\\nich möchte Sie zu einem Meeting einladen:\\n\\n📅 Datum: [Datum]\\n🕐 Zeit: [Zeit]\\n📍 Ort: [Ort/Link]\\n📋 Agenda: [Agenda]\\n\\nBitte bestätigen Sie Ihre Teilnahme.\\n\\nBeste Grüße,\\n[Ihr Name]',
                    isPremium: false
                },
                {
                    id: 'support-ticket-response',
                    title: 'Support Ticket Antwort',
                    category: 'support',
                    content: 'Hallo [Kundenname],\\n\\nvielen Dank für Ihre Anfrage (Ticket #[Nummer]).\\n\\nIch habe Ihr Problem analysiert und folgende Lösung gefunden:\\n\\n1. [Schritt 1]\\n2. [Schritt 2]\\n3. [Schritt 3]\\n\\nSollten Sie weitere Fragen haben, zögern Sie nicht, sich zu melden.\\n\\nFreundliche Grüße,\\n[Support Team]',
                    isPremium: false
                },
                {
                    id: 'ai-code-generation',
                    title: 'KI Code Generation Prompt',
                    category: 'ai',
                    content: 'Du bist ein erfahrener Softwareentwickler. Erstelle eine [Programmiersprache] Funktion, die [Beschreibung der Funktionalität].\\n\\nAnforderungen:\\n- Verwende moderne Best Practices\\n- Füge Fehlerbehandlung hinzu\\n- Schreibe sauberen, kommentierten Code\\n- Erstelle auch Unit Tests\\n\\nCode-Stil: [Stil-Präferenzen]',
                    isPremium: true
                },
                {
                    id: 'ai-text-optimization',
                    title: 'Text Optimierung Prompt',
                    category: 'ai',
                    content: 'Optimiere den folgenden Text für [Zielgruppe] und [Zweck]:\\n\\n[ORIGINAL TEXT]\\n\\nOptimierungskriterien:\\n- Klarheit und Verständlichkeit\\n- Professioneller Ton\\n- Prägnante Formulierung\\n- SEO-Optimierung (falls relevant)\\n\\nBitte gib mir 3 Varianten mit unterschiedlichen Ansätzen.',
                    isPremium: true
                }
            ];
            this.saveTemplates();
        }
    }

    setupEventListeners() {
        // Kategorie-Filter
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentCategory = e.target.dataset.category;
                this.renderTemplates();
            });
        });

        // Suche
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.renderTemplates(e.target.value);
        });

        // Neue Vorlage hinzufügen
        document.getElementById('addTemplateBtn').addEventListener('click', () => {
            this.showAddTemplateModal();
        });

        // Modal schließen
        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideAddTemplateModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.hideAddTemplateModal();
        });

        // Template-Formular
        document.getElementById('templateForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTemplate();
        });

        // Einstellungen
        document.getElementById('settingsBtn').addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });

        // Upgrade Button
        document.getElementById('upgradeBtn').addEventListener('click', () => {
            this.handleUpgrade();
        });

        // Close Upsell
        document.getElementById('closeUpsell').addEventListener('click', () => {
            this.hidePremiumUpsell();
        });

        // Event Listener für den Generate-Button
        document.getElementById('generatePromptBtn').addEventListener('click', async () => {
            const loadingIndicator = document.getElementById('loadingIndicator');
            const promptResult = document.getElementById('promptResult');
            const promptContent = promptResult.querySelector('.prompt-content');
            const generateBtn = document.getElementById('generatePromptBtn');
            const promptInput = document.getElementById('promptInput');

            try {
                // Validierung
                if (!promptInput.value.trim()) {
                    showNotification('Bitte geben Sie einen Prompt ein.', 'error');
                    return;
                }

                // UI aktualisieren
                generateBtn.disabled = true;
                loadingIndicator.style.display = 'flex';
                promptResult.style.display = 'none';

                // Prompt generieren
                const generator = new AIPromptGenerator();
                const generatedPrompt = await generator.generatePrompt(promptInput.value);

                // Ergebnis anzeigen
                promptContent.textContent = generatedPrompt;
                promptResult.style.display = 'block';
            } catch (error) {
                showNotification(error.message, 'error');
            } finally {
                loadingIndicator.style.display = 'none';
                generateBtn.disabled = false;
            }
        });

        // Event Listener für den Copy-Button
        document.querySelector('.copy-button').addEventListener('click', () => {
            const promptContent = document.querySelector('.prompt-content').textContent;
            navigator.clipboard.writeText(promptContent).then(() => {
                showNotification('Prompt in Zwischenablage kopiert!', 'success');
            }).catch(() => {
                showNotification('Fehler beim Kopieren des Prompts.', 'error');
            });
        });
    }

    renderTemplates(searchTerm = '') {
        const container = document.getElementById('templatesContainer');
        let filteredTemplates = this.templates;

        // Kategorie-Filter
        if (this.currentCategory !== 'all') {
            filteredTemplates = filteredTemplates.filter(t => t.category === this.currentCategory);
        }

        // Suchfilter
        if (searchTerm) {
            filteredTemplates = filteredTemplates.filter(t => 
                t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.content.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        container.innerHTML = '';

        if (filteredTemplates.length === 0) {
            container.innerHTML = '<div class="no-templates">Keine Vorlagen gefunden</div>';
            return;
        }

        filteredTemplates.forEach(template => {
            const templateEl = this.createTemplateElement(template);
            container.appendChild(templateEl);
        });
    }

    createTemplateElement(template) {
        const div = document.createElement('div');
        div.className = 'template-item';
        if (template.isPremium) {
            div.classList.add('premium');
        }

        div.innerHTML = `
            <div class="template-header">
                <h4 class="template-title">${template.title}</h4>
                <div class="template-actions">
                    ${template.isPremium ? '<span class="premium-label">Premium</span>' : ''}
                    <button class="action-btn copy-btn" data-id="${template.id}" title="Kopieren">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                    <button class="action-btn edit-btn" data-id="${template.id}" title="Bearbeiten">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                    <button class="action-btn delete-btn" data-id="${template.id}" title="Löschen">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <polyline points="3,6 5,6 21,6" stroke="currentColor" stroke-width="2"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="template-preview">${this.truncateText(template.content, 100)}</div>
        `;

        // Event Listeners für Aktionen
        div.querySelector('.copy-btn').addEventListener('click', () => this.copyTemplate(template.id));
        div.querySelector('.edit-btn').addEventListener('click', () => this.editTemplate(template.id));
        div.querySelector('.delete-btn').addEventListener('click', () => this.deleteTemplate(template.id));

        return div;
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    async copyTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;

        try {
            await navigator.clipboard.writeText(template.content);
            this.showNotification('Template kopiert!', 'success');
            
            // Template in aktives Tab einfügen
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                try {
                    await chrome.tabs.sendMessage(tab.id, {
                        action: 'insertText',
                        text: template.content
                    });
                } catch (error) {
                    // Wenn das Content Script nicht verfügbar ist, nur in die Zwischenablage kopieren
                    console.log('Content Script nicht verfügbar, nur in Zwischenablage kopiert');
                }
            }
        } catch (error) {
            console.error('Fehler beim Kopieren:', error);
            this.showNotification('Fehler beim Kopieren', 'error');
        }
    }

    editTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;

        document.getElementById('templateTitle').value = template.title;
        document.getElementById('templateCategory').value = template.category;
        document.getElementById('templateContent').value = template.content;
        
        // Automatische Größenanpassung für Textarea
        const textarea = document.getElementById('templateContent');
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight) + 'px';
        
        this.editingTemplateId = templateId;
        this.showAddTemplateModal();
    }

    // Event Listener für Textarea-Größenanpassung
    setupTextareaResize() {
        const textarea = document.getElementById('templateContent');
        if (textarea) {
            textarea.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });
        }
    }

    async deleteTemplate(templateId) {
        if (!confirm('Template wirklich löschen?')) return;

        this.templates = this.templates.filter(t => t.id !== templateId);
        await this.saveTemplates();
        this.renderTemplates();
        this.showNotification('Template gelöscht', 'success');
    }

    showAddTemplateModal() {
        document.getElementById('addTemplateModal').classList.add('show');
    }

    hideAddTemplateModal() {
        document.getElementById('addTemplateModal').classList.remove('show');
        document.getElementById('templateForm').reset();
        this.editingTemplateId = null;
    }

    async addTemplate() {
        const title = document.getElementById('templateTitle').value;
        const category = document.getElementById('templateCategory').value;
        const content = document.getElementById('templateContent').value;

        if (!title || !content) {
            this.showNotification('Bitte alle Felder ausfüllen', 'error');
            return;
        }

        const template = {
            id: this.editingTemplateId || 'custom-' + Date.now(),
            title,
            category,
            content,
            isPremium: false
        };

        if (this.editingTemplateId) {
            const index = this.templates.findIndex(t => t.id === this.editingTemplateId);
            this.templates[index] = template;
        } else {
            this.templates.push(template);
        }

        await this.saveTemplates();
        this.renderTemplates();
        this.hideAddTemplateModal();
        this.showNotification('Template gespeichert!', 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    async handleUpgrade() {
        try {
            // Öffne die Upgrade-Seite im Chrome Web Store
            const storeUrl = 'https://chrome.google.com/webstore/detail/text-templates-pro/[EXTENSION_ID]';
            await chrome.tabs.create({ url: storeUrl });
        } catch (error) {
            console.error('Fehler beim Upgrade-Prozess:', error);
            this.showNotification('Fehler beim Upgrade-Prozess', 'error');
        }
    }

    hidePremiumUpsell() {
        const premiumUpsell = document.getElementById('premiumUpsell');
        premiumUpsell.style.display = 'none';
        
        // Speichere den Status, dass die Nachricht geschlossen wurde
        chrome.storage.local.set({ 'upsellClosed': true });
    }
}

// Gemini API Konfiguration
const GEMINI_API_KEY = 'AIzaSyB4jcy82CXUTMziF6aTBuW9380Zg_kWpBg';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// KI-Prompt-Generator
class AIPromptGenerator {
    constructor() {
        this.apiKey = 'AIzaSyB4jcy82CXUTMziF6aTBuW9380Zg_kWpBg';
        this.apiEndpoint = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent';
    }

    async init() {
        // API-Key ist bereits gesetzt, keine Initialisierung nötig
        return;
    }

    async generatePrompt(template) {
        try {
            await this.init();
            
            const prompt = this.buildPromptRequest(template);
            console.log('Sende Request an:', this.apiEndpoint);
            console.log('Request Body:', JSON.stringify(prompt, null, 2));
            
            const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(prompt)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Fehler Details:', errorData);
                throw new Error(`API-Fehler: ${response.status} - ${errorData.error?.message || 'Unbekannter Fehler'}`);
            }

            const data = await response.json();
            console.log('API Antwort:', data);
            return this.processResponse(data);
        } catch (error) {
            console.error('Fehler beim Generieren des Prompts:', error);
            if (error.message.includes('API-Key')) {
                throw new Error('Bitte konfigurieren Sie zuerst Ihren Gemini API-Key in den Einstellungen.');
            }
            throw new Error(`Fehler bei der KI-Generierung: ${error.message}`);
        }
    }

    buildPromptRequest(template) {
        return {
            contents: [{
                parts: [{
                    text: `Generiere einen professionellen Prompt basierend auf folgendem Template:\n\n${template}`
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        };
    }

    processResponse(data) {
        try {
            if (!data.candidates || data.candidates.length === 0) {
                throw new Error('Keine Antwort von der KI erhalten');
            }

            const generatedText = data.candidates[0].content.parts[0].text;
            if (!generatedText) {
                throw new Error('Leere Antwort von der KI');
            }

            return generatedText;
        } catch (error) {
            console.error('Fehler beim Verarbeiten der KI-Antwort:', error);
            throw new Error('Fehler beim Verarbeiten der KI-Antwort');
        }
    }
}

// UI-Elemente für KI-Prompt-Generator
function setupAIPromptGenerator() {
    const promptGenerator = new AIPromptGenerator();
    const generatePromptBtn = document.getElementById('generatePromptBtn');
    const promptResult = document.getElementById('promptResult');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const promptContent = document.querySelector('.prompt-content');
    const usePromptBtn = document.getElementById('usePromptBtn');

    if (generatePromptBtn) {
        generatePromptBtn.addEventListener('click', async () => {
            try {
                loadingIndicator.style.display = 'flex';
                generatePromptBtn.disabled = true;
                promptResult.style.display = 'none';

                const template = document.getElementById('templateContent').value;
                const generatedPrompt = await promptGenerator.generatePrompt(template);
                promptContent.textContent = generatedPrompt;
                promptResult.style.display = 'block';
            } catch (error) {
                showNotification(error.message, 'error');
            } finally {
                loadingIndicator.style.display = 'none';
                generatePromptBtn.disabled = false;
            }
        });
    }

    if (usePromptBtn) {
        usePromptBtn.addEventListener('click', () => {
            const promptText = promptContent.textContent;
            if (promptText) {
                document.getElementById('templateContent').value = promptText;
                showNotification('Prompt wurde in das Template übernommen');
            }
        });
    }
}

// Benachrichtigung anzeigen
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    window.textTemplatesPro = new TextTemplatesPro();
    setupAIPromptGenerator();
});

