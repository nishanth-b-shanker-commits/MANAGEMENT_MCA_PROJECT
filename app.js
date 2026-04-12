/**
 * NexaPort - Port Management System
 * Core Application Logic (SPA Router, State Management, & UI)
 */

const db = {
    init() {
        if (!localStorage.getItem('port_vessels')) localStorage.setItem('port_vessels', JSON.stringify([]));
        if (!localStorage.getItem('port_clearances')) localStorage.setItem('port_clearances', JSON.stringify([]));
        if (!localStorage.getItem('port_users')) localStorage.setItem('port_users', JSON.stringify([]));
    },
    get(key) { return JSON.parse(localStorage.getItem(key)); },
    set(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
};

const app = {
    currentUserRole: null,
    sidebarCollapsed: false,
    
    navConfig: {
        admin: [
            { id: 'dashboard-view', icon: 'fa-chart-line', label: 'System Overview' },
            { id: 'vessel-reg-view', icon: 'fa-ship', label: 'Vessel Registry' },
            { id: 'clearance-app-view', icon: 'fa-file-signature', label: 'All Clearances' },
            { id: 'berth-schedule-view', icon: 'fa-calendar-days', label: 'Berth Allocation' },
            { id: 'admin-panel', icon: 'fa-users-gear', label: 'User Management' }
        ],
        ship_agent: [
            { id: 'dashboard-view', icon: 'fa-table-columns', label: 'Agent Dashboard' },
            { id: 'vessel-reg-view', icon: 'fa-ship', label: 'My Vessels' },
            { id: 'clearance-app-view', icon: 'fa-file-import', label: 'Apply Clearance' }
        ],
        port_authority: [
            { id: 'dashboard-view', icon: 'fa-anchor', label: 'Port Dashboard' },
            { id: 'authority-approval-view', icon: 'fa-clipboard-check', label: 'Pending Approvals' },
            { id: 'berth-schedule-view', icon: 'fa-calendar-days', label: 'Berth Planner' }
        ],
        customs_officer: [
            { id: 'dashboard-view', icon: 'fa-building-shield', label: 'Customs Desk' },
            { id: 'authority-approval-view', icon: 'fa-box-open', label: 'Cargo Inspections' }
        ],
        health_officer: [
            { id: 'dashboard-view', icon: 'fa-briefcase-medical', label: 'Health Desk' },
            { id: 'authority-approval-view', icon: 'fa-notes-medical', label: 'Quarantine Checks' }
        ]
    },

    init() {
        db.init();
        const savedRole = localStorage.getItem('port_role');
        if (savedRole) {
            this.handleLoginSuccess(savedRole);
        } else {
            this.showLogin();
        }

        document.addEventListener('change', (e) => {
            if (e.target.id === 'login-role') {
                const role = e.target.value;
                const passwordGroup = document.getElementById('password-group');
                const otpGroup = document.getElementById('otp-group');
                
                if (role === 'admin') {
                    passwordGroup.style.display = 'block';
                    otpGroup.style.display = 'none';
                    setTimeout(() => document.getElementById('admin-password').focus(), 100);
                } else if (role) {
                    passwordGroup.style.display = 'none';
                    otpGroup.style.display = 'block';
                    setTimeout(() => document.querySelector('.otp-inputs input').focus(), 100);
                }
            }
        });
    },

    toast(message, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = 'fa-circle-info';
        if(type === 'success') icon = 'fa-circle-check';
        if(type === 'error') icon = 'fa-circle-xmark';
        
        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    showLogin() {
        document.getElementById('app-container').classList.add('hidden');
        const tpl = document.getElementById('tpl-login-view');
        if(tpl) {
            const clone = tpl.content.cloneNode(true);
            const existingLogin = document.querySelector('.login-wrapper');
            if(existingLogin) existingLogin.remove();
            document.body.appendChild(clone);
            
             // Setup OTP limits
            setTimeout(() => {
                const otpInputs = document.querySelectorAll('.otp-inputs input');
                otpInputs.forEach((input, index) => {
                    input.addEventListener('input', () => {
                        if(input.value.length === 1 && index < otpInputs.length - 1) {
                            otpInputs[index + 1].focus();
                        }
                    });
                });
            }, 100);
        }
    },

    handleLogin() {
        const role = document.getElementById('login-role').value;
        const btn = document.getElementById('login-btn');
        const passwordInput = document.getElementById('admin-password');
        
        if (role === 'admin' && passwordInput && passwordInput.value !== 'Port@123') {
            this.toast('Invalid admin password.', 'error');
            return;
        }

        if(role) {
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';
            btn.disabled = true;
            setTimeout(() => {
                this.toast('Authentication successful!', 'success');
                this.handleLoginSuccess(role);
            }, 800);
        }
    },

    handleLoginSuccess(role) {
        this.currentUserRole = role;
        localStorage.setItem('port_role', role);
        const loginView = document.querySelector('.login-wrapper');
        if(loginView) loginView.remove();

        document.getElementById('app-container').classList.remove('hidden');
        document.getElementById('user-role-display').textContent = role.replace('_', ' ');
        document.getElementById('user-name').textContent = this.getMockName(role);

        this.buildNavigation();
        this.navigate('dashboard-view');
    },

    logout() {
        localStorage.removeItem('port_role');
        this.currentUserRole = null;
        this.showLogin();
    },

    navigate(viewId) {
        const mainContent = document.getElementById('main-content');
        const tpl = document.getElementById(`tpl-${viewId}`);
        
        if (tpl) {
            mainContent.innerHTML = '';
            mainContent.appendChild(tpl.content.cloneNode(true));
            this.updateActiveNav(viewId);
            this.updatePageTitle(viewId);
            this.initViewLogic(viewId);
        } else {
            mainContent.innerHTML = `<div class="panel text-center" style="padding: 4rem;"><h2>Module Under Construction</h2></div>`;
        }
    },

    initViewLogic(viewId) {
        if (viewId === 'dashboard-view') {
            const vessels = db.get('port_vessels');
            const clearances = db.get('port_clearances');
            
            const statsCards = document.querySelectorAll('.stat-card h2');
            if(statsCards.length >= 2) {
                statsCards[0].textContent = vessels.length;
                statsCards[1].textContent = clearances.filter(c => c.status === 'Pending').length;
            }
            
            const tbody = document.querySelector('.modern-table tbody');
            if (tbody && clearances.length > 0) {
                tbody.innerHTML = clearances.reverse().slice(0, 5).map(c => `
                    <tr>
                        <td><strong>${c.vesselName}</strong></td>
                        <td>${c.imo}</td>
                        <td>${c.agent}</td>
                        <td><span class="status-badge status-${c.status.toLowerCase()}">${c.status}</span></td>
                        <td><button class="btn btn-sm btn-outline" onclick="app.toast('Viewing details...')">View</button></td>
                    </tr>
                `).join('');
            } else if (tbody) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No recent clearances found.</td></tr>';
            }
        }
        
        if (viewId === 'vessel-reg-view') {
            const form = document.querySelector('form');
            if(form) form.onsubmit = this.registerVessel.bind(this);
        }
        
        if (viewId === 'clearance-app-view') {
            const vessels = db.get('port_vessels');
            const select = document.querySelector('select');
            if(select && vessels.length > 0) {
                select.innerHTML = vessels.map(v => `<option value="${v.imo}">${v.name} (IMO: ${v.imo})</option>`).join('');
            } else if(select) {
                 select.innerHTML = '<option disabled selected>No vessels registered. Register one first.</option>';
            }
            
            const btn = document.querySelector('form .btn-primary');
            if(btn) btn.onclick = this.submitClearance.bind(this);
        }
        
        if (viewId === 'admin-panel') {
            const users = db.get('port_users');
            const tbody = document.querySelector('.modern-table tbody');
            if(tbody) {
                if (users.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No users found. Add a user.</td></tr>';
                } else {
                    tbody.innerHTML = users.map(u => `
                        <tr>
                            <td>${u.name}</td>
                            <td>${u.role}</td>
                            <td><span class="status-badge ${u.twoFa === 'Enforced' ? 'status-approved' : 'status-pending'}">${u.twoFa}</span></td>
                            <td>
                                <button class="btn btn-sm btn-outline text-danger" onclick="app.reset2FA(${u.id})">Reset 2FA</button>
                                <button class="btn btn-sm btn-outline text-danger" onclick="app.deleteUser(${u.id})"><i class="fa-solid fa-trash"></i></button>
                            </td>
                        </tr>
                    `).join('');
                }
            }
        }
        
        if (viewId === 'authority-approval-view') {
            const clearances = db.get('port_clearances');
            const pending = clearances.find(c => c.status === 'Pending');
            
            if(pending) {
                document.querySelector('.mock-pdf-page p:nth-of-type(1)').innerHTML = `<strong>Vessel:</strong> ${pending.vesselName}`;
                document.querySelector('.mock-pdf-page p:nth-of-type(2)').innerHTML = `<strong>Last Port:</strong> ${pending.lastPort}`;
                document.querySelector('.action-side p.text-sm').textContent = `Request Ref: #${pending.id}`;
                
                const buttons = document.querySelector('.action-buttons-group');
                if(buttons) {
                    buttons.innerHTML = `
                        <button class="btn btn-danger flex-1" onclick="app.updateClearance('${pending.id}', 'Rejected')"><i class="fa-solid fa-xmark"></i> Reject</button>
                        <button class="btn btn-success flex-1" onclick="app.updateClearance('${pending.id}', 'Approved')"><i class="fa-solid fa-check"></i> Approve</button>
                    `;
                }
            } else {
                document.querySelector('.doc-viewer-side').innerHTML = '<div class="panel text-center" style="padding:4rem;"><h3>No Pending Applications</h3></div>';
                document.querySelector('.action-side').innerHTML = '<div class="panel text-center" style="padding:4rem;"><h3>Current Queue is empty</h3></div>';
            }
        }
    },

    registerVessel(e) {
        e.preventDefault();
        const inputs = e.target.querySelectorAll('.input-modern');
        const name = inputs[0].value;
        const imo = inputs[1].value;
        if(!name || !imo) return this.toast('Please fill required fields', 'error');
        
        const vessels = db.get('port_vessels');
        vessels.push({ name, imo, flag: inputs[2].value, type: inputs[3].value, date: new Date().toISOString() });
        db.set('port_vessels', vessels);
        
        this.toast('Vessel Registered Successfully!', 'success');
        e.target.reset();
        setTimeout(() => this.navigate('dashboard-view'), 1000);
    },
    
    submitClearance(e) {
        e.preventDefault();
        const form = e.target.closest('form') || document.querySelector('form');
        const inputs = form.querySelectorAll('.input-modern');
        
        const imo = inputs[0].value;
        const lastPort = inputs[1].value;
        if(!imo || !lastPort) return this.toast('Select vessel and port.', 'error');
        
        const vessels = db.get('port_vessels');
        const vessel = vessels.find(v => v.imo === imo) || { name: 'Unknown' };
        
        const clearances = db.get('port_clearances');
        clearances.push({
            id: 'CLR-' + Math.floor(1000 + Math.random() * 9000),
            vesselName: vessel.name,
            imo: imo,
            agent: this.getMockName(this.currentUserRole),
            lastPort: lastPort,
            status: 'Pending',
            date: new Date().toISOString()
        });
        db.set('port_clearances', clearances);
        
        this.toast('Clearance Application Submitted!', 'success');
        setTimeout(() => this.navigate('dashboard-view'), 1000);
    },
    
    updateClearance(id, status) {
        const clearances = db.get('port_clearances');
        const target = clearances.find(c => c.id === id);
        if(target) {
            target.status = status;
            db.set('port_clearances', clearances);
            this.toast(`Application has been ${status}`, status === 'Approved' ? 'success' : 'error');
            this.navigate('dashboard-view');
        }
    },
    
    reset2FA(userId) {
        const users = db.get('port_users');
        const user = users.find(u => u.id === userId);
        if(user) {
            user.twoFa = 'Pending Setup';
            db.set('port_users', users);
            this.toast(`2FA Rest for ${user.name}`, 'info');
            this.initViewLogic('admin-panel');
        }
    },

    deleteUser(userId) {
        let users = db.get('port_users');
        users = users.filter(u => u.id !== userId);
        db.set('port_users', users);
        this.toast('User deleted successfully', 'success');
        this.initViewLogic('admin-panel');
    },

    saveNewUser(e) {
        e.preventDefault();
        const name = document.getElementById('new-user-name').value;
        const role = document.getElementById('new-user-role').value;
        const is2FAConfigured = document.getElementById('confirm-2fa-scanned');
        
        if (is2FAConfigured && !is2FAConfigured.checked && role !== 'System Administrator') {
             return this.toast('Please securely configure 2FA to proceed!', 'error');
        }

        const users = db.get('port_users');
        users.push({
            id: Date.now(),
            name: name,
            role: role,
            twoFa: role === 'System Administrator' ? 'N/A' : 'Enforced'
        });
        db.set('port_users', users);
        
        this.toast(`User ${name} created successfully!`, 'success');
        this.navigate('admin-panel');
    },

    toggle2FAConfigMode(role) {
        const section = document.getElementById('2fa-config-section');
        const checkbox = document.getElementById('confirm-2fa-scanned');
        if (!section) return;
        
        if (role === 'System Administrator') {
            section.style.display = 'none';
            if (checkbox) checkbox.required = false;
        } else {
            section.style.display = 'block';
            if (checkbox) checkbox.required = true;
        }
    },

    buildNavigation() {
        const navContainer = document.getElementById('sidebar-nav');
        navContainer.innerHTML = '';
        const links = this.navConfig[this.currentUserRole] || this.navConfig['admin'];
        
        links.forEach(link => {
            const btn = document.createElement('button');
            btn.className = 'nav-item';
            btn.dataset.target = link.id;
            btn.onclick = () => this.navigate(link.id);
            btn.innerHTML = `<i class="fa-solid ${link.icon}"></i><span>${link.label}</span>`;
            navContainer.appendChild(btn);
        });
    },

    updateActiveNav(viewId) {
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.remove('active');
            if(el.dataset.target === viewId) el.classList.add('active');
        });
        const sidebar = document.querySelector('.sidebar');
        if(window.innerWidth <= 768 && sidebar.classList.contains('mobile-open')) {
            sidebar.classList.remove('mobile-open');
        }
    },

    updatePageTitle(viewId) {
        const configItem = (this.navConfig[this.currentUserRole] || []).find(item => item.id === viewId);
        document.getElementById('page-title').textContent = configItem ? configItem.label : 'Dashboard';
    },

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if(window.innerWidth <= 768) {
            sidebar.classList.toggle('mobile-open');
        } else {
            sidebar.classList.toggle('collapsed');
        }
    },

    getMockName(role) {
        const names = {
            'admin': 'PORT ADMIN',
            'ship_agent': 'Ship Agent Account',
            'port_authority': 'Port Authority Node',
            'customs_officer': 'Customs Department',
            'health_officer': 'Health Department'
        };
        return names[role] || 'User Profile';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
