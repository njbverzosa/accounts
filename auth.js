// ============================================
// SECURE ACCOUNT HOLDER SYSTEM
// ============================================

// Account credentials (hashed for security)
// In production, this would be on a server
const ACCOUNTS = {
    'admin': {
        passwordHash: btoa('nj@2024'), // Base64 encoded
        displayName: 'Administrator'
    }
    // ,
    // 'john_doe': {
    //     passwordHash: btoa('John@123'),
    //     displayName: 'John Doe'
    // },
    // 'jane_smith': {
    //     passwordHash: btoa('Jane@456'),
    //     displayName: 'Jane Smith'
    // }
};

// Session management
let currentUser = null;
let loginAttempts = 0;
const MAX_ATTEMPTS = 5;
let lockoutTime = null;
const LOCKOUT_DURATION = 30000; // 30 seconds

// ============================================
// DASHBOARD PROTECTION - RUNS FIRST
// ============================================

// Check if we're on the dashboard page
if (window.location.pathname.includes('dashboard.html')) {
    // Immediately check session before anything else
    const loggedIn = sessionStorage.getItem('loggedIn');
    const username = sessionStorage.getItem('username');
    
    if (loggedIn !== 'true' || !username || !ACCOUNTS[username]) {
        // Not logged in - redirect immediately
        window.location.href = 'index.html';
    }
}

// ============================================
// LOGIN FUNCTIONALITY
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Only run login logic if on login page
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
        // Check if already logged in
        if (sessionStorage.getItem('loggedIn') === 'true') {
            const username = sessionStorage.getItem('username');
            if (username && ACCOUNTS[username]) {
                redirectToDashboard(username);
                return;
            }
        }
        
        // Setup login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
    }
    
    // Dashboard initialization
    if (window.location.pathname.includes('dashboard.html')) {
        // Already protected above, now just display user info
        const username = sessionStorage.getItem('username');
        const displayName = sessionStorage.getItem('displayName');
        
        // Display user info
        const displayEl = document.getElementById('displayUsername');
        const timeEl = document.getElementById('loginTime');
        
        if (displayEl) {
            displayEl.textContent = displayName || username || 'User';
        }
        
        if (timeEl) {
            const loginTime = sessionStorage.getItem('loginTime');
            timeEl.textContent = loginTime || new Date().toLocaleString();
        }
    }
});

function handleLogin(e) {
    e.preventDefault();
    
    // Check lockout
    if (lockoutTime && Date.now() - lockoutTime < LOCKOUT_DURATION) {
        const remaining = Math.ceil((LOCKOUT_DURATION - (Date.now() - lockoutTime)) / 1000);
        showError(`Too many attempts. Try again in ${remaining} seconds.`);
        return;
    } else if (lockoutTime) {
        lockoutTime = null;
        loginAttempts = 0;
    }
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    // Validate input
    if (!username || !password) {
        showError('Please enter both username and password.');
        return;
    }
    
    // Check if account exists
    if (!ACCOUNTS[username]) {
        loginAttempts++;
        handleFailedAttempt();
        showError('Invalid username or password.');
        return;
    }
    
    // Verify password (Base64 comparison)
    const hashedInput = btoa(password);
    if (hashedInput !== ACCOUNTS[username].passwordHash) {
        loginAttempts++;
        handleFailedAttempt();
        showError('Invalid username or password.');
        return;
    }
    
    // Success - Show confirmation popup
    currentUser = username;
    showConfirmationPopup(username);
}

function handleFailedAttempt() {
    if (loginAttempts >= MAX_ATTEMPTS) {
        lockoutTime = Date.now();
        showError(`Too many failed attempts. Account locked for 30 seconds.`);
    }
}

function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    if (errorEl) {
        errorEl.textContent = message;
        setTimeout(() => {
            if (errorEl.textContent === message) {
                errorEl.textContent = '';
            }
        }, 5000);
    }
}

// ============================================
// CONFIRMATION POPUP
// ============================================

function showConfirmationPopup(username) {
    const modal = document.getElementById('confirmationModal');
    const confirmUsername = document.getElementById('confirmUsername');
    
    if (modal && confirmUsername) {
        confirmUsername.textContent = username;
        modal.classList.add('active');
    }
}

function closeModal() {
    const modal = document.getElementById('confirmationModal');
    if (modal) {
        modal.classList.remove('active');
        currentUser = null;
        // Clear password field
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.value = '';
        }
    }
}

function confirmLogin() {
    if (!currentUser) return;
    
    // Complete login
    const username = currentUser;
    const displayName = ACCOUNTS[username].displayName;
    
    // Store session
    sessionStorage.setItem('loggedIn', 'true');
    sessionStorage.setItem('username', username);
    sessionStorage.setItem('displayName', displayName);
    sessionStorage.setItem('loginTime', new Date().toLocaleString());
    
    // Close modal
    closeModal();
    
    // Reset attempts
    loginAttempts = 0;
    
    // Redirect to dashboard
    redirectToDashboard(username);
}

// ============================================
// DASHBOARD FUNCTIONS
// ============================================

function redirectToDashboard(username) {
    window.location.href = 'dashboard.html';
}

// ============================================
// LOGOUT FUNCTIONALITY
// ============================================

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.clear();
        window.location.href = 'index.html';
    }
}

// ============================================
// TOGGLE PASSWORD VISIBILITY
// ============================================

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.toggle-password');
    
    if (passwordInput) {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            if (toggleBtn) toggleBtn.textContent = '🙈';
        } else {
            passwordInput.type = 'password';
            if (toggleBtn) toggleBtn.textContent = '👁️';
        }
    }
}

// ============================================
// PREVENT BACK BUTTON AFTER LOGOUT
// ============================================

window.addEventListener('pageshow', function(e) {
    if (e.persisted) {
        // Page loaded from cache - check session
        if (window.location.pathname.includes('dashboard.html')) {
            if (sessionStorage.getItem('loggedIn') !== 'true') {
                window.location.href = 'index.html';
            }
        }
    }
});

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

document.addEventListener('keydown', function(e) {
    // Escape to close modal
    if (e.key === 'Escape') {
        const modal = document.getElementById('confirmationModal');
        if (modal && modal.classList.contains('active')) {
            closeModal();
        }
    }
    
    // Enter to confirm in modal
    if (e.key === 'Enter') {
        const modal = document.getElementById('confirmationModal');
        if (modal && modal.classList.contains('active')) {
            confirmLogin();
        }
    }
});

// ============================================
// TOGGLE PASSWORD ON ACCOUNT CARDS
// ============================================

function toggleAccountPassword(elementId) {
    const passwordEl = document.getElementById(elementId);
    const toggleBtn = passwordEl.parentElement.querySelector('.password-toggle');
    
    if (!passwordEl) return;
    
    // Get the actual password from the element's text content
    const currentText = passwordEl.textContent;
    const actualPassword = passwordEl.dataset.password || currentText;
    
    // Store the actual password if not already stored
    if (!passwordEl.dataset.password) {
        passwordEl.dataset.password = actualPassword;
    }
    
    if (passwordEl.classList.contains('visible')) {
        // Hide password
        passwordEl.textContent = '••••••••';
        passwordEl.classList.remove('visible');
        if (toggleBtn) {
            toggleBtn.textContent = '👁️';
            toggleBtn.classList.remove('showing');
        }
    } else {
        // Show password
        passwordEl.textContent = passwordEl.dataset.password;
        passwordEl.classList.add('visible');
        if (toggleBtn) {
            toggleBtn.textContent = '🙈';
            toggleBtn.classList.add('showing');
        }
    }
}

// Initialize password elements with stored data
document.addEventListener('DOMContentLoaded', function() {
    // Store actual passwords as data attributes
    const passwordElements = document.querySelectorAll('.password-value');
    passwordElements.forEach(el => {
        const actualPassword = el.textContent;
        el.dataset.password = actualPassword;
        // Only hide if it's not already hidden
        if (!el.classList.contains('visible')) {
            el.textContent = '••••••••';
        }
    });
});