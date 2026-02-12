/**
 * Follow-up Scheduling & Notifications
 * Lead Management System - Paragon Mech Industries
 */

const FollowupManager = {
    STORAGE_KEY: 'paragon_followups',
    checkInterval: null,
    notifiedIds: new Set(),

    init() {
        this.requestNotificationPermission();
        this.startCheckingFollowups();
        this.renderUpcomingFollowups();
    },

    // Request browser notification permission
    requestNotificationPermission() {
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                document.getElementById('enableNotificationsBtn').style.display = 'inline-flex';
            }
        }
    },

    enableNotifications() {
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    App.showToast('Notifications enabled!', 'success');
                    document.getElementById('enableNotificationsBtn').style.display = 'none';
                }
            });
        }
    },

    // Get all follow-ups
    getAll() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    // Save follow-ups
    save(followups) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(followups));
    },

    // Schedule a new follow-up
    schedule(leadId, datetime, note) {
        const followups = this.getAll();
        const lead = LeadsManager.getById(leadId);
        if (!lead) return null;

        const newFollowup = {
            id: Utils.generateId(),
            leadId: leadId,
            leadName: lead.name,
            company: lead.company,
            datetime: datetime,
            note: note || '',
            createdAt: new Date().toISOString(),
            completed: false
        };

        followups.push(newFollowup);
        followups.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
        this.save(followups);
        this.renderUpcomingFollowups();
        return newFollowup;
    },

    // Get follow-ups for a specific lead
    getByLeadId(leadId) {
        return this.getAll().filter(f => f.leadId === leadId && !f.completed);
    },

    // Mark follow-up as complete
    complete(followupId) {
        const followups = this.getAll();
        const index = followups.findIndex(f => f.id === followupId);
        if (index !== -1) {
            followups[index].completed = true;
            this.save(followups);
            this.renderUpcomingFollowups();
            return true;
        }
        return false;
    },

    // Delete a follow-up
    delete(followupId) {
        const followups = this.getAll().filter(f => f.id !== followupId);
        this.save(followups);
        this.renderUpcomingFollowups();
        return true;
    },

    // Get upcoming follow-ups (next 7 days)
    getUpcoming() {
        const now = new Date();
        const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return this.getAll().filter(f => {
            if (f.completed) return false;
            const fDate = new Date(f.datetime);
            return fDate >= now || this.isToday(fDate) || this.isOverdue(fDate);
        }).slice(0, 10);
    },

    // Check if date is today
    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    },

    // Check if date is overdue
    isOverdue(date) {
        return new Date(date) < new Date();
    },

    // Render upcoming follow-ups section
    renderUpcomingFollowups() {
        const section = document.getElementById('followupsSection');
        const list = document.getElementById('followupsList');
        const upcoming = this.getUpcoming();

        if (upcoming.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        list.innerHTML = upcoming.map(f => {
            const fDate = new Date(f.datetime);
            const statusClass = this.isOverdue(fDate) ? 'overdue' : (this.isToday(fDate) ? 'today' : '');
            const dateStr = this.isToday(fDate) ? 'Today' : Utils.formatDate(f.datetime);
            const timeStr = fDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

            return `
                <div class="followup-item ${statusClass}">
                    <div class="followup-time">
                        <span class="followup-date">${dateStr}</span>
                        <span class="followup-hour">${timeStr}</span>
                    </div>
                    <div class="followup-info">
                        <span class="followup-lead-name" onclick="App.openDetailsModal('${f.leadId}')">${f.leadName}</span>
                        <span class="followup-company">${f.company}</span>
                        ${f.note ? `<span class="followup-note">${f.note}</span>` : ''}
                    </div>
                    <div class="followup-actions">
                        <button class="icon-btn view" onclick="App.openDetailsModal('${f.leadId}')" title="View Lead">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button class="icon-btn edit" onclick="FollowupManager.complete('${f.id}')" title="Mark Complete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                        </button>
                        <button class="icon-btn delete" onclick="FollowupManager.delete('${f.id}')" title="Delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    // Render scheduled follow-ups in lead details
    renderLeadFollowups(leadId) {
        const container = document.getElementById('scheduledFollowups');
        const list = document.getElementById('scheduledList');
        const followups = this.getByLeadId(leadId);

        if (followups.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        list.innerHTML = followups.map(f => {
            const fDate = new Date(f.datetime);
            const dateStr = Utils.formatDate(f.datetime);
            const timeStr = fDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

            return `
                <div class="scheduled-item">
                    <div class="scheduled-item-info">
                        <span class="scheduled-item-datetime">${dateStr} at ${timeStr}</span>
                        ${f.note ? `<span class="scheduled-item-note">${f.note}</span>` : ''}
                    </div>
                    <button class="icon-btn delete" onclick="FollowupManager.delete('${f.id}'); FollowupManager.renderLeadFollowups('${leadId}');" title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
            `;
        }).join('');
    },

    // Start checking for due follow-ups
    startCheckingFollowups() {
        this.checkFollowups();
        this.checkInterval = setInterval(() => this.checkFollowups(), 60000); // Check every minute
    },

    // Check and notify for due follow-ups
    checkFollowups() {
        if (Notification.permission !== 'granted') return;

        const now = new Date();
        const followups = this.getAll().filter(f => !f.completed);

        followups.forEach(f => {
            const fDate = new Date(f.datetime);
            const diffMs = fDate - now;
            const diffMins = diffMs / 60000;

            // Notify if within 5 minutes of scheduled time and not already notified
            if (diffMins <= 5 && diffMins >= -5 && !this.notifiedIds.has(f.id)) {
                this.sendNotification(f);
                this.notifiedIds.add(f.id);
            }
        });
    },

    // Send browser notification
    sendNotification(followup) {
        if (Notification.permission === 'granted') {
            const notification = new Notification('Follow-up Reminder', {
                body: `${followup.leadName} (${followup.company})${followup.note ? '\n' + followup.note : ''}`,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2300b894"><circle cx="12" cy="12" r="10"/></svg>',
                tag: followup.id,
                requireInteraction: true
            });

            notification.onclick = () => {
                window.focus();
                App.openDetailsModal(followup.leadId);
                notification.close();
            };
        }
    }
};

window.FollowupManager = FollowupManager;
