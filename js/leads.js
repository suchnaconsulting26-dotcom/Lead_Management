/**
 * Lead Data Management
 * Lead Management System - Paragon Mech Industries
 */

const LeadsManager = {
    STORAGE_KEY: 'paragon_leads',

    getAll() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        if (!data) {
            this.initializeSampleData();
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
        }
        return JSON.parse(data);
    },

    getById(id) {
        return this.getAll().find(lead => lead.id === id);
    },

    add(leadData) {
        const leads = this.getAll();
        const newLead = {
            id: Utils.generateId(),
            ...leadData,
            notes: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        leads.unshift(newLead);
        this.save(leads);
        return newLead;
    },

    update(id, leadData) {
        const leads = this.getAll();
        const index = leads.findIndex(lead => lead.id === id);
        if (index !== -1) {
            leads[index] = { ...leads[index], ...leadData, updatedAt: new Date().toISOString() };
            this.save(leads);
            return leads[index];
        }
        return null;
    },

    delete(id) {
        const leads = this.getAll().filter(lead => lead.id !== id);
        this.save(leads);
        return true;
    },

    addNote(leadId, noteText) {
        const leads = this.getAll();
        const lead = leads.find(l => l.id === leadId);
        if (lead) {
            const note = { id: Utils.generateId(), text: noteText, createdAt: new Date().toISOString() };
            lead.notes = lead.notes || [];
            lead.notes.unshift(note);
            lead.updatedAt = new Date().toISOString();
            this.save(leads);
            return note;
        }
        return null;
    },

    deleteNote(leadId, noteId) {
        const leads = this.getAll();
        const lead = leads.find(l => l.id === leadId);
        if (lead && lead.notes) {
            lead.notes = lead.notes.filter(n => n.id !== noteId);
            lead.updatedAt = new Date().toISOString();
            this.save(leads);
            return true;
        }
        return false;
    },

    save(leads) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(leads));
    },

    getStats() {
        const leads = this.getAll();
        return {
            total: leads.length,
            new: leads.filter(l => l.status === 'new').length,
            contacted: leads.filter(l => l.status === 'contacted').length,
            followup: leads.filter(l => l.status === 'followup').length,
            proposal: leads.filter(l => l.status === 'proposal').length,
            won: leads.filter(l => l.status === 'won').length,
            lost: leads.filter(l => l.status === 'lost').length
        };
    },

    search(query, statusFilter = 'all') {
        let leads = this.getAll();
        if (statusFilter !== 'all') leads = leads.filter(lead => lead.status === statusFilter);
        if (query) {
            const term = query.toLowerCase();
            leads = leads.filter(lead =>
                lead.name.toLowerCase().includes(term) ||
                lead.company.toLowerCase().includes(term) ||
                lead.email.toLowerCase().includes(term) ||
                (lead.phone && lead.phone.includes(term))
            );
        }
        return leads;
    },

    initializeSampleData() {
        const samples = [
            { name: 'Rajesh Kumar', company: 'Tata Steel Ltd', email: 'rajesh.kumar@tatasteel.com', phone: '+91 98765 43210', status: 'qualified', source: 'exhibition', value: 2500000, notes: [{ id: 'n1', text: 'Met at India Manufacturing Show 2026.', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }] },
            { name: 'Priya Sharma', company: 'Mahindra & Mahindra', email: 'priya.sharma@mahindra.com', phone: '+91 87654 32109', status: 'contacted', source: 'website', value: 1800000, notes: [] },
            { name: 'Vikram Patel', company: 'Larsen & Toubro', email: 'v.patel@lnt.com', phone: '+91 76543 21098', status: 'new', source: 'referral', value: 3200000, notes: [] },
            { name: 'Anita Desai', company: 'Bharat Forge', email: 'anita.desai@bharatforge.com', phone: '+91 65432 10987', status: 'proposal', source: 'cold-call', value: 4500000, notes: [] },
            { name: 'Suresh Reddy', company: 'Ashok Leyland', email: 'suresh.reddy@ashokleyland.com', phone: '+91 54321 09876', status: 'won', source: 'email', value: 5800000, notes: [] },
            { name: 'Meera Iyer', company: 'TVS Motors', email: 'meera.iyer@tvsmotor.com', phone: '+91 43210 98765', status: 'new', source: 'social', value: 1200000, notes: [] }
        ].map((s, i) => ({
            id: 'lead_' + (Date.now() + i),
            ...s,
            createdAt: new Date(Date.now() - (i + 1) * 3 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
        }));
        this.save(samples);
    }
};

window.LeadsManager = LeadsManager;
