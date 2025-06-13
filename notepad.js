class CloudNoteApp {
    constructor() {
        this.notes = [];
        this.currentNoteId = null;
        this.isAutoSaving = false;
        this.autoSaveTimer = null;
        this.currentUser = null; // Stores the currently logged-in username

        // Get DOM elements for authentication
        this.authContainer = document.getElementById('authContainer');
        this.appContainer = document.getElementById('appContainer');
        this.authSubtitle = document.getElementById('authSubtitle');

        this.loginForm = document.getElementById('loginForm');
        this.loginUsernameInput = document.getElementById('loginUsername');
        this.loginPasswordInput = document.getElementById('loginPassword');
        this.loginError = document.getElementById('loginError');
        this.showSignupLink = document.getElementById('showSignup');

        this.signupForm = document.getElementById('signupForm');
        this.signupUsernameInput = document.getElementById('signupUsername');
        this.signupPasswordInput = document.getElementById('signupPassword');
        this.confirmPasswordInput = document.getElementById('confirmPassword');
        this.signupError = document.getElementById('signupError');
        this.showLoginLink = document.getElementById('showLogin');

        this.logoutBtn = document.getElementById('logoutBtn');

        // Initialize existing app elements and attach their event listeners
        this.initializeElements();
        this.attachEventListeners();

        // Attach authentication-specific event listeners
        this.attachAuthEventListeners();

        // Check if a user is already logged in on app load
        this.checkAuthStatus();
    }

    // --- Existing App Initialization ---
    initializeElements() {
        this.newNoteBtn = document.getElementById('newNoteBtn');
        this.searchInput = document.getElementById('searchInput');
        this.notesList = document.getElementById('notesList');
        this.noteTitle = document.getElementById('noteTitle');
        this.noteContent = document.getElementById('noteContent');
        this.saveBtn = document.getElementById('saveBtn');
        this.deleteBtn = document.getElementById('deleteBtn');
        this.noteCount = document.getElementById('noteCount');
        this.wordCount = document.getElementById('wordCount');
        this.lastSaved = document.getElementById('lastSaved');
        this.statusMessage = document.getElementById('statusMessage');
        this.totalNotes = document.getElementById('totalNotes');
        this.toast = document.getElementById('toast');
        this.toastMessage = document.getElementById('toastMessage');
    }

    attachEventListeners() {
        this.newNoteBtn.addEventListener('click', () => this.createNewNote());
        this.saveBtn.addEventListener('click', () => this.saveCurrentNote());
        this.deleteBtn.addEventListener('click', () => this.deleteCurrentNote());
        this.searchInput.addEventListener('input', (e) => this.filterNotes(e.target.value));
        this.noteContent.addEventListener('input', () => {
            this.updateWordCount();
            this.scheduleAutoSave();
        });
        this.noteTitle.addEventListener('input', () => {
            this.scheduleAutoSave();
        });
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    // --- New Authentication Event Listeners ---
    attachAuthEventListeners() {
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        this.showSignupLink.addEventListener('click', () => this.showSignupForm());
        this.showLoginLink.addEventListener('click', () => this.showLoginForm());
        this.logoutBtn.addEventListener('click', () => this.logout());
    }

    // --- Authentication Logic ---

    /**
     * Checks if a user is currently logged in and shows the appropriate UI.
     */
    checkAuthStatus() {
        this.currentUser = localStorage.getItem('cloudnote-current-user');
        if (this.currentUser) {
            this.showApp(); // Show the main application
        } else {
            this.showLoginForm(); // Show the login form by default
            this.showAuthContainer(); // Ensure auth container is visible
        }
    }

    /**
     * Displays the authentication container (login/signup forms) and hides the main app.
     */
    showAuthContainer() {
        this.authContainer.style.display = 'flex';
        this.appContainer.style.display = 'none';
        // Clear any previous error messages when switching views
        this.loginError.style.display = 'none';
        this.signupError.style.display = 'none';
    }

    /**
     * Displays the main CloudNote application and hides the authentication container.
     * Loads notes for the logged-in user.
     */
    showApp() {
        this.authContainer.style.display = 'none';
        this.appContainer.style.display = 'flex';
        this.loadNotesFromStorage(); // Load notes specific to the current user
        this.updateUI(); // Update the notes list and counts
        this.showToast(`Welcome, ${this.currentUser}!`); // Greet the user
    }

    /**
     * Shows the login form and hides the signup form.
     */
    showLoginForm() {
        this.loginForm.style.display = 'block';
        this.signupForm.style.display = 'none';
        this.authSubtitle.textContent = 'Login to access your notes';
        this.loginError.style.display = 'none'; // Clear any previous error
        // Clear signup fields when switching to login
        this.signupUsernameInput.value = '';
        this.signupPasswordInput.value = '';
        this.confirmPasswordInput.value = '';
    }

    /**
     * Shows the signup form and hides the login form.
     */
    showSignupForm() {
        this.loginForm.style.display = 'none';
        this.signupForm.style.display = 'block';
        this.authSubtitle.textContent = 'Create your CloudNote account';
        this.signupError.style.display = 'none'; // Clear any previous error
        // Clear login fields when switching to signup
        this.loginUsernameInput.value = '';
        this.loginPasswordInput.value = '';
    }

    /**
     * Handles user login attempt.
     * @param {Event} e - The submit event from the login form.
     */
    handleLogin(e) {
        e.preventDefault(); // Prevent default form submission
        const username = this.loginUsernameInput.value.trim();
        const password = this.loginPasswordInput.value;

        // In a real application, this would be a secure API call to a backend
        const users = JSON.parse(localStorage.getItem('cloudnote-users') || '{}');

        if (users[username] && users[username].password === password) {
            this.currentUser = username;
            localStorage.setItem('cloudnote-current-user', username); // Store current user session
            this.showApp();
        } else {
            this.loginError.textContent = 'Invalid username or password.';
            this.loginError.style.display = 'block';
        }
    }

    /**
     * Handles user signup attempt.
     * @param {Event} e - The submit event from the signup form.
     */
    handleSignup(e) {
        e.preventDefault(); // Prevent default form submission
        const username = this.signupUsernameInput.value.trim();
        const password = this.signupPasswordInput.value;
        const confirmPassword = this.confirmPasswordInput.value;

        // Basic frontend validation
        if (username.length < 3) {
            this.signupError.textContent = 'Username must be at least 3 characters long.';
            this.signupError.style.display = 'block';
            return;
        }
        if (password.length < 6) {
            this.signupError.textContent = 'Password must be at least 6 characters long.';
            this.signupError.style.display = 'block';
            return;
        }
        if (password !== confirmPassword) {
            this.signupError.textContent = 'Passwords do not match.';
            this.signupError.style.display = 'block';
            return;
        }

        // In a real application, this would register the user securely in a backend database
        let users = JSON.parse(localStorage.getItem('cloudnote-users') || '{}');

        if (users[username]) {
            this.signupError.textContent = 'Username already exists. Please choose another.';
            this.signupError.style.display = 'block';
            return;
        }

        users[username] = { password: password }; // Storing plaintext password for demo purposes (NOT SECURE!)
        localStorage.setItem('cloudnote-users', JSON.stringify(users));

        this.currentUser = username;
        localStorage.setItem('cloudnote-current-user', username);
        this.showApp();
        this.showToast('Account created and logged in!');
    }

    /**
     * Logs out the current user, clears user data, and returns to the login page.
     */
    logout() {
        if (confirm('Are you sure you want to log out?')) {
            this.currentUser = null;
            localStorage.removeItem('cloudnote-current-user'); // Clear current session
            this.notes = []; // Clear notes from memory for privacy/security
            this.currentNoteId = null; // No note selected
            this.saveNotesToStorage(); // Save empty notes array for the logged-out user (clears their notes)
            this.clearEditor(); // Clear the editor interface
            this.updateUI(); // Update the UI to reflect no notes
            this.showAuthContainer(); // Show the authentication page
            this.showLoginForm(); // Default to login form
            this.showToast('Logged out successfully!');
        }
    }

    // --- Note Management (Modified to be user-specific) ---

    /**
     * Generates a unique key for storing notes in localStorage based on the current user.
     * @returns {string} The localStorage key.
     */
    getStorageKey() {
        // Notes are stored under a user-specific key
        return `cloudnote-notes-${this.currentUser}`;
    }

    /**
     * Loads notes for the current user from localStorage.
     */
    loadNotesFromStorage() {
        if (!this.currentUser) return; // Only load if a user is logged in
        const savedNotes = localStorage.getItem(this.getStorageKey());
        if (savedNotes) {
            this.notes = JSON.parse(savedNotes);
        } else {
            this.notes = []; // No notes for this user yet
        }
        this.clearEditor(); // Clear editor when loading new user's notes or no notes
        this.currentNoteId = null; // No note selected initially
    }

    /**
     * Saves the current user's notes to localStorage.
     */
    saveNotesToStorage() {
        if (!this.currentUser) return; // Only save if a user is logged in
        localStorage.setItem(this.getStorageKey(), JSON.stringify(this.notes));
    }

    // --- Existing Note Functionality (minor adjustments for user-specific handling) ---

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    createNewNote() {
        if (!this.currentUser) {
            this.showToast('Please log in or sign up to create notes.');
            return;
        }
        const newNote = {
            id: this.generateId(),
            title: 'Untitled Note',
            content: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.notes.unshift(newNote);
        this.currentNoteId = newNote.id;
        this.saveNotesToStorage();
        this.updateUI();
        this.loadNoteIntoEditor(newNote);
        this.noteTitle.focus();
        this.showToast('New note created!');
    }

    saveCurrentNote() {
        if (!this.currentNoteId || !this.currentUser) return;

        const noteIndex = this.notes.findIndex(note => note.id === this.currentNoteId);
        if (noteIndex === -1) return;

        const title = this.noteTitle.value.trim() || 'Untitled Note';
        const content = this.noteContent.value;

        this.notes[noteIndex] = {
            ...this.notes[noteIndex],
            title: title,
            content: content,
            updatedAt: new Date().toISOString()
        };

        this.saveNotesToStorage();
        this.updateUI();
        this.updateLastSaved();
        this.showToast('Note saved successfully!');
        this.updateStatus('Note saved');
    }

    deleteCurrentNote() {
        if (!this.currentNoteId || !this.currentUser) return;

        if (confirm('Are you sure you want to delete this note?')) {
            this.notes = this.notes.filter(note => note.id !== this.currentNoteId);
            this.currentNoteId = null;
            this.saveNotesToStorage();
            this.updateUI();
            this.clearEditor();
            this.showToast('Note deleted successfully!');
            this.updateStatus('Note deleted');
        }
    }

    loadNoteIntoEditor(note) {
        this.noteTitle.value = note.title;
        this.noteContent.value = note.content;
        this.updateWordCount();
        this.updateLastSaved(note.updatedAt);
    }

    clearEditor() {
        this.noteTitle.value = '';
        this.noteContent.value = '';
        this.updateWordCount();
        this.lastSaved.textContent = 'Not saved';
    }

    filterNotes(searchTerm) {
        const filtered = this.notes.filter(note =>
            note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.content.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderNotesList(filtered);
    }

    scheduleAutoSave() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }

        this.autoSaveTimer = setTimeout(() => {
            if (this.currentNoteId) {
                this.saveCurrentNote();
            }
        }, 2000); // Auto-save after 2 seconds of inactivity
    }

    updateWordCount() {
        const words = this.noteContent.value.trim().split(/\s+/).filter(word => word.length > 0);
        this.wordCount.textContent = `${words.length} words`;
    }

    updateLastSaved(timestamp = null) {
        const time = timestamp ? new Date(timestamp) : new Date();
        this.lastSaved.textContent = `Last saved: ${time.toLocaleTimeString()}`;
    }

    updateStatus(message) {
        this.statusMessage.textContent = message;
        setTimeout(() => {
            this.statusMessage.textContent = 'Ready';
        }, 3000);
    }

    renderNotesList(notesToRender = this.notes) {
        if (notesToRender.length === 0) {
            this.notesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-sticky-note"></i>
                    <p>No notes found</p>
                    <small>Create your first note to get started</small>
                </div>
            `;
            return;
        }

        this.notesList.innerHTML = notesToRender.map(note => {
            const isActive = note.id === this.currentNoteId ? 'active' : '';
            const preview = note.content.substring(0, 100) + (note.content.length > 100 ? '...' : '');
            const date = new Date(note.updatedAt).toLocaleDateString();

            return `
                <div class="note-item ${isActive}" data-id="${note.id}">
                    <h4>${this.escapeHtml(note.title)}</h4>
                    <p>${this.escapeHtml(preview)}</p>
                    <div class="note-date">${date}</div>
                </div>
            `;
        }).join('');

        this.notesList.querySelectorAll('.note-item').forEach(item => {
            item.addEventListener('click', () => {
                const noteId = item.dataset.id;
                const note = this.notes.find(n => n.id === noteId);
                if (note) {
                    this.currentNoteId = noteId;
                    this.loadNoteIntoEditor(note);
                    this.updateUI();
                }
            });
        });
    }

    updateUI() {
        this.renderNotesList();
        this.noteCount.textContent = this.notes.length;
        this.totalNotes.textContent = `${this.notes.length} total notes`;

        this.notesList.querySelectorAll('.note-item').forEach(item => {
            item.classList.toggle('active', item.dataset.id === this.currentNoteId);
        });
    }

    showToast(message) {
        this.toastMessage.textContent = message;
        this.toast.classList.add('show');

        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + S for save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.saveCurrentNote();
        }

        // Ctrl/Cmd + N for new note
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            this.createNewNote();
        }

        // Ctrl/Cmd + F for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            this.searchInput.focus();
        }
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }
}

// Initialize the app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cloudNoteApp = new CloudNoteApp();

    console.log('CloudNote - Online Notepad initialized!');
    console.log('Keyboard shortcuts:');
    console.log('  Ctrl/Cmd + S: Save note');
    console.log('  Ctrl/Cmd + N: New note');
    console.log('  Ctrl/Cmd + F: Focus search');
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CloudNoteApp;
}