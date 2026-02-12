/**
 * Utility Functions
 * Lead Management System - Paragon Mech Industries
 */

const Utils = {
    /**
     * Generate a unique ID
     */
    generateId() {
        return 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Format date to readable string
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('en-IN', options);
    },

    /**
     * Format date with time
     */
    formatDateTime(dateString) {
        const date = new Date(dateString);
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('en-IN', options);
    },

    /**
     * Format currency (Indian Rupees)
     */
    formatCurrency(amount) {
        if (!amount) return '—';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    },

    /**
     * Capitalize first letter
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Validate phone number (basic)
     */
    isValidPhone(phone) {
        if (!phone) return true; // Phone is optional
        const phoneRegex = /^[\d\s\-+()]{8,}$/;
        return phoneRegex.test(phone);
    },

    /**
     * Get source display name
     */
    getSourceLabel(source) {
        const sources = {
            'website': 'Website',
            'referral': 'Referral',
            'social': 'Social Media',
            'email': 'Email Campaign',
            'cold-call': 'Cold Call',
            'exhibition': 'Exhibition',
            'other': 'Other'
        };
        return sources[source] || source;
    },

    /**
     * Get relative time string
     */
    getRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 7) {
            return this.formatDate(dateString);
        } else if (diffDays > 0) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else if (diffMins > 0) {
            return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    }
};

// Make Utils available globally
window.Utils = Utils;
