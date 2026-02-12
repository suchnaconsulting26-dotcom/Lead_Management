/**
 * Authentication System
 * Lead Management System - Paragon Mech Industries
 */

const Auth = {
    USERS_KEY: 'paragon_users',
    SESSION_KEY: 'paragon_session',
    // Replace with your Google Client ID for production
    // Get one from: https://console.cloud.google.com/apis/credentials
    GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',

    init() {
        this.bindEvents();
        this.initGoogleSignIn();
        this.checkExistingSession();
    },

    bindEvents() {
        // Tab switching
        document.querySelectorAll('.login-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));

        // Signup form
        document.getElementById('signupForm').addEventListener('submit', (e) => this.handleSignup(e));

        // Google Sign-In button
        document.getElementById('googleSignInBtn').addEventListener('click', () => this.handleGoogleSignIn());
    },

    // Initialize Google Sign-In
    initGoogleSignIn() {
        // Check if Google Identity Services is loaded
        if (typeof google !== 'undefined' && google.accounts) {
            try {
                google.accounts.id.initialize({
                    client_id: this.GOOGLE_CLIENT_ID,
                    callback: (response) => this.handleGoogleCallback(response),
                    auto_select: false
                });
            } catch (e) {
                console.log('Google Sign-In not configured');
            }
        }
    },

    // Switch between login and signup tabs
    switchTab(tab) {
        document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.form-panel').forEach(p => p.classList.remove('active'));

        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}Panel`).classList.add('active');

        // Clear errors
        document.getElementById('loginError').classList.remove('show');
        document.getElementById('signupError').classList.remove('show');
    },

    // Handle login form submission
    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim().toLowerCase();
        const password = document.getElementById('loginPassword').value;

        const users = this.getUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            this.showError('loginError', 'No account found with this email');
            return;
        }

        if (user.password !== this.hashPassword(password)) {
            this.showError('loginError', 'Incorrect password');
            return;
        }

        this.createSession(user);
        this.showToast('Login successful!', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    },

    // Handle signup form submission
    handleSignup(e) {
        e.preventDefault();
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim().toLowerCase();
        const password = document.getElementById('signupPassword').value;

        if (password.length < 6) {
            this.showError('signupError', 'Password must be at least 6 characters');
            return;
        }

        const users = this.getUsers();

        if (users.find(u => u.email === email)) {
            this.showError('signupError', 'An account with this email already exists');
            return;
        }

        const newUser = {
            id: this.generateId(),
            name: name,
            email: email,
            password: this.hashPassword(password),
            provider: 'email',
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        this.saveUsers(users);
        this.createSession(newUser);

        this.showToast('Account created successfully!', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    },

    // Handle Google Sign-In button click
    handleGoogleSignIn() {
        if (typeof google !== 'undefined' && google.accounts && this.GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
            google.accounts.id.prompt();
        } else {
            // Demo mode - simulate Google sign-in
            this.showToast('Google Sign-In requires configuration. Using demo mode.', 'success');

            const demoUser = {
                id: this.generateId(),
                name: 'Demo User',
                email: 'demo@paragonmech.com',
                provider: 'google',
                picture: null,
                createdAt: new Date().toISOString()
            };

            // Check if demo user exists, if not create
            const users = this.getUsers();
            let user = users.find(u => u.email === demoUser.email);

            if (!user) {
                users.push(demoUser);
                this.saveUsers(users);
                user = demoUser;
            }

            this.createSession(user);
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        }
    },

    // Handle Google Sign-In callback
    handleGoogleCallback(response) {
        try {
            // Decode the JWT token
            const payload = this.decodeJWT(response.credential);

            const googleUser = {
                id: this.generateId(),
                name: payload.name,
                email: payload.email.toLowerCase(),
                provider: 'google',
                googleId: payload.sub,
                picture: payload.picture,
                createdAt: new Date().toISOString()
            };

            // Check if user exists
            const users = this.getUsers();
            let user = users.find(u => u.email === googleUser.email);

            if (!user) {
                // Create new user
                users.push(googleUser);
                this.saveUsers(users);
                user = googleUser;
            } else if (user.provider !== 'google') {
                // Update existing email user to link Google account
                user.googleId = googleUser.googleId;
                user.picture = googleUser.picture;
                this.saveUsers(users);
            }

            this.createSession(user);
            this.showToast('Signed in with Google!', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        } catch (error) {
            console.error('Google sign-in error:', error);
            this.showError('loginError', 'Google sign-in failed. Please try again.');
        }
    },

    // Decode JWT token (simple base64 decode for payload)
    decodeJWT(token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    },

    // Create user session
    createSession(user) {
        const session = {
            userId: user.id,
            name: user.name,
            email: user.email,
            picture: user.picture || null,
            provider: user.provider,
            loginAt: new Date().toISOString()
        };
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    },

    // Get current session
    getSession() {
        const data = localStorage.getItem(this.SESSION_KEY);
        return data ? JSON.parse(data) : null;
    },

    // Check if user is logged in
    isLoggedIn() {
        return this.getSession() !== null;
    },

    // Logout
    logout() {
        localStorage.removeItem(this.SESSION_KEY);
        window.location.href = 'login.html';
    },

    // Check existing session on page load
    checkExistingSession() {
        if (this.isLoggedIn()) {
            window.location.href = 'index.html';
        }
    },

    // Get all users
    getUsers() {
        const data = localStorage.getItem(this.USERS_KEY);
        return data ? JSON.parse(data) : [];
    },

    // Save users
    saveUsers(users) {
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    },

    // Simple hash function for passwords (demo purposes - use proper hashing in production)
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'hash_' + Math.abs(hash).toString(16);
    },

    // Generate unique ID
    generateId() {
        return 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },

    // Show error message
    showError(elementId, message) {
        const errorEl = document.getElementById(elementId);
        errorEl.textContent = message;
        errorEl.classList.add('show');
    },

    // Show toast notification
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.querySelector('.toast-message').textContent = message;
        toast.className = `toast ${type} show`;
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
};

// Auth guard for protected pages
const AuthGuard = {
    protect() {
        if (!Auth.isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    getUser() {
        return Auth.getSession();
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => Auth.init());

// Export for use in other files
window.Auth = Auth;
window.AuthGuard = AuthGuard;
