/**
 * Main Application Controller
 * Lead Management System - Paragon Mech Industries
 */

const App = {
    currentLeadId: null,

    init() {
        // Auth guard - redirect to login if not authenticated
        if (!AuthGuard.protect()) return;

        this.setupUserProfile();
        this.bindEvents();
        this.renderStats();
        this.renderLeads();
        FollowupManager.init();
    },

    setupUserProfile() {
        const user = AuthGuard.getUser();
        if (!user) return;

        // Update user name display
        const firstName = user.name.split(' ')[0];
        document.getElementById('userName').textContent = firstName;
        document.getElementById('userDropdownName').textContent = user.name;
        document.getElementById('userDropdownEmail').textContent = user.email;

        // Update avatar
        const avatarEl = document.getElementById('userAvatar');
        if (user.picture) {
            avatarEl.innerHTML = `<img src="${user.picture}" alt="${user.name}">`;
        } else {
            avatarEl.textContent = user.name.charAt(0).toUpperCase();
        }

        // User menu toggle
        document.getElementById('userMenuBtn').addEventListener('click', () => {
            document.getElementById('userDropdown').classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                document.getElementById('userDropdown').classList.remove('active');
            }
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            Auth.logout();
        });
    },

    bindEvents() {
        // Add Lead Button
        document.getElementById('addLeadBtn').addEventListener('click', () => this.openLeadModal());

        // Close Lead Modal
        document.getElementById('closeLeadModal').addEventListener('click', () => this.closeLeadModal());
        document.getElementById('cancelLeadBtn').addEventListener('click', () => this.closeLeadModal());

        // Lead Form Submit
        document.getElementById('leadForm').addEventListener('submit', (e) => this.handleLeadSubmit(e));

        // Close Details Modal
        document.getElementById('closeDetailsModal').addEventListener('click', () => this.closeDetailsModal());

        // Close Delete Modal
        document.getElementById('closeDeleteModal').addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => this.confirmDelete());

        // Search and Filter
        document.getElementById('searchInput').addEventListener('input', Utils.debounce(() => this.renderLeads(), 300));
        document.getElementById('statusFilter').addEventListener('change', () => this.renderLeads());

        // Add Note
        document.getElementById('addNoteBtn').addEventListener('click', () => this.addNote());

        // Stat cards click
        document.querySelectorAll('.stat-card').forEach(card => {
            card.addEventListener('click', () => {
                const status = card.dataset.status;
                document.getElementById('statusFilter').value = status;
                this.renderLeads();
            });
        });

        // Close modals on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', () => {
                this.closeLeadModal();
                this.closeDetailsModal();
                this.closeDeleteModal();
                this.closeScheduleModal();
            });
        });

        // Schedule Follow-up
        document.getElementById('scheduleFollowupBtn').addEventListener('click', () => this.openScheduleModal());
        document.getElementById('closeScheduleModal').addEventListener('click', () => this.closeScheduleModal());
        document.getElementById('cancelScheduleBtn').addEventListener('click', () => this.closeScheduleModal());
        document.getElementById('scheduleForm').addEventListener('submit', (e) => this.handleScheduleSubmit(e));

        // Enable Notifications button
        document.getElementById('enableNotificationsBtn').addEventListener('click', () => FollowupManager.enableNotifications());
    },

    renderStats() {
        const stats = LeadsManager.getStats();
        document.getElementById('totalLeads').textContent = stats.total;
        document.getElementById('newLeads').textContent = stats.new;
        document.getElementById('contactedLeads').textContent = stats.contacted;
        document.getElementById('followupLeads').textContent = stats.followup;
        document.getElementById('wonLeads').textContent = stats.won;
    },

    renderLeads() {
        const query = document.getElementById('searchInput').value;
        const status = document.getElementById('statusFilter').value;
        const leads = LeadsManager.search(query, status);

        const tbody = document.getElementById('leadsTableBody');
        const emptyState = document.getElementById('emptyState');

        if (leads.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        tbody.innerHTML = leads.map(lead => `
            <tr>
                <td data-label="Name"><span class="lead-name" onclick="App.openDetailsModal('${lead.id}')">${lead.name}</span></td>
                <td data-label="Company">${lead.company}</td>
                <td data-label="Email" class="lead-email">${lead.email}</td>
                <td data-label="Phone">${lead.phone || '—'}</td>
                <td data-label="Status"><span class="status-badge ${lead.status}">${lead.status}</span></td>
                <td data-label="Source">${Utils.getSourceLabel(lead.source)}</td>
                <td data-label="Created">${Utils.formatDate(lead.createdAt)}</td>
                <td class="actions-cell">
                    <button class="icon-btn view" onclick="App.openDetailsModal('${lead.id}')" title="View Details">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    <button class="icon-btn edit" onclick="App.openLeadModal('${lead.id}')" title="Edit Lead">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="icon-btn delete" onclick="App.openDeleteModal('${lead.id}')" title="Delete Lead">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    openLeadModal(id = null) {
        const modal = document.getElementById('leadModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('leadForm');

        form.reset();

        if (id) {
            const lead = LeadsManager.getById(id);
            if (lead) {
                title.textContent = 'Edit Lead';
                document.getElementById('leadId').value = lead.id;
                document.getElementById('leadName').value = lead.name;
                document.getElementById('leadCompany').value = lead.company;
                document.getElementById('leadEmail').value = lead.email;
                document.getElementById('leadPhone').value = lead.phone || '';
                document.getElementById('leadStatus').value = lead.status;
                document.getElementById('leadSource').value = lead.source;
                document.getElementById('leadValue').value = lead.value || '';
                document.getElementById('leadNotes').value = '';
            }
        } else {
            title.textContent = 'Add New Lead';
            document.getElementById('leadId').value = '';
        }

        modal.classList.add('active');
    },

    closeLeadModal() {
        document.getElementById('leadModal').classList.remove('active');
    },

    handleLeadSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('leadId').value;
        const data = {
            name: document.getElementById('leadName').value.trim(),
            company: document.getElementById('leadCompany').value.trim(),
            email: document.getElementById('leadEmail').value.trim(),
            phone: document.getElementById('leadPhone').value.trim(),
            status: document.getElementById('leadStatus').value,
            source: document.getElementById('leadSource').value,
            value: parseFloat(document.getElementById('leadValue').value) || 0
        };

        if (id) {
            LeadsManager.update(id, data);
            this.showToast('Lead updated successfully', 'success');
        } else {
            LeadsManager.add(data);
            this.showToast('Lead added successfully', 'success');
        }

        this.closeLeadModal();
        this.renderStats();
        this.renderLeads();
    },

    openDetailsModal(id) {
        const lead = LeadsManager.getById(id);
        if (!lead) return;

        this.currentLeadId = id;

        document.getElementById('detailsTitle').textContent = lead.name;
        document.getElementById('detailName').textContent = lead.name;
        document.getElementById('detailCompany').textContent = lead.company;
        document.getElementById('detailEmail').textContent = lead.email;
        document.getElementById('detailPhone').textContent = lead.phone || '—';
        document.getElementById('detailStatus').innerHTML = `<span class="status-badge ${lead.status}">${lead.status}</span>`;
        document.getElementById('detailSource').textContent = Utils.getSourceLabel(lead.source);
        document.getElementById('detailValue').textContent = Utils.formatCurrency(lead.value);
        document.getElementById('detailCreated').textContent = Utils.formatDateTime(lead.createdAt);

        this.renderNotes(lead.notes || []);
        FollowupManager.renderLeadFollowups(id);
        document.getElementById('detailsModal').classList.add('active');
    },

    closeDetailsModal() {
        document.getElementById('detailsModal').classList.remove('active');
        this.currentLeadId = null;
    },

    renderNotes(notes) {
        const container = document.getElementById('notesList');
        if (notes.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.875rem;">No notes yet</p>';
            return;
        }
        container.innerHTML = notes.map(note => `
            <div class="note-item">
                <div class="note-header">
                    <span class="note-date">${Utils.getRelativeTime(note.createdAt)}</span>
                    <button class="note-delete" onclick="App.deleteNote('${note.id}')">&times;</button>
                </div>
                <p class="note-text">${note.text}</p>
            </div>
        `).join('');
    },

    addNote() {
        const input = document.getElementById('newNoteInput');
        const text = input.value.trim();
        if (!text || !this.currentLeadId) return;

        LeadsManager.addNote(this.currentLeadId, text);
        input.value = '';

        const lead = LeadsManager.getById(this.currentLeadId);
        this.renderNotes(lead.notes || []);
        this.showToast('Note added', 'success');
    },

    deleteNote(noteId) {
        if (!this.currentLeadId) return;
        LeadsManager.deleteNote(this.currentLeadId, noteId);
        const lead = LeadsManager.getById(this.currentLeadId);
        this.renderNotes(lead.notes || []);
    },

    openDeleteModal(id) {
        this.currentLeadId = id;
        document.getElementById('deleteModal').classList.add('active');
    },

    closeDeleteModal() {
        document.getElementById('deleteModal').classList.remove('active');
        this.currentLeadId = null;
    },

    confirmDelete() {
        if (this.currentLeadId) {
            LeadsManager.delete(this.currentLeadId);
            this.closeDeleteModal();
            this.renderStats();
            this.renderLeads();
            this.showToast('Lead deleted', 'success');
        }
    },

    // Schedule Modal
    openScheduleModal() {
        if (!this.currentLeadId) return;
        const lead = LeadsManager.getById(this.currentLeadId);
        if (!lead) return;

        document.getElementById('scheduleLeadId').value = this.currentLeadId;
        document.getElementById('scheduleLeadInfo').innerHTML = `<strong>${lead.name}</strong> <span>• ${lead.company}</span>`;

        // Set default date to tomorrow and time to 10:00 AM
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('followupDate').value = tomorrow.toISOString().split('T')[0];
        document.getElementById('followupTime').value = '10:00';
        document.getElementById('followupNote').value = '';

        document.getElementById('scheduleModal').classList.add('active');
    },

    closeScheduleModal() {
        document.getElementById('scheduleModal').classList.remove('active');
    },

    handleScheduleSubmit(e) {
        e.preventDefault();
        const leadId = document.getElementById('scheduleLeadId').value;
        const date = document.getElementById('followupDate').value;
        const time = document.getElementById('followupTime').value;
        const note = document.getElementById('followupNote').value.trim();

        if (!leadId || !date || !time) return;

        const datetime = new Date(`${date}T${time}`).toISOString();
        FollowupManager.schedule(leadId, datetime, note);

        this.closeScheduleModal();
        FollowupManager.renderLeadFollowups(leadId);
        this.showToast('Follow-up scheduled!', 'success');
    },

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.querySelector('.toast-message').textContent = message;
        toast.className = `toast ${type} show`;
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
};

// Initialize app on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
