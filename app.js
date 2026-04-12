/**
 * NexaPort - Port Management System
 * Core Application Logic (SPA Router & Role Management)
 */

const app = {
    currentUserRole: null,
    sidebarCollapsed: false,
    
    // Configuration of navigation for each role
    navConfig: {
        admin: [
            { id: 'dashboard-view', icon: 'fa-chart-line', label: 'System Overview' },
            { id: 'vessel-reg-view', icon: 'fa-ship', label: 'Vessel Registry' },
            { id: 'clearance-app-view', icon: 'fa-file-signature', label: 'All Clearances' },
            { id: 'berth-schedule-view', icon: 'fa-calendar-days', label: 'Berth Allocation' },
            { id: 'admin-panel', icon: 'fa-users-gear', label: 'User Management' },
            { id: 'reports', icon: 'fa-chart-pie', label: 'Reports & Analytics' }
        ],
        ship_agent: [
            { id: 'dashboard-view', icon: 'fa-table-columns', label: 'Agent Dashboard' },
            { id: 'vessel-reg-view', icon: 'fa-ship', label: 'My Vessels' },
            { id: 'clearance-app-view', icon: 'fa-file-import', label: 'Apply Clearance' },
            { id: 'support', icon: 'fa-circle-question', label: 'Help & Support' }
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
        // Check if user is theoretically logged in (mock session)
        const savedRole = localStorage.getItem('nexa_role');
        if (savedRole) {
            this.handleLoginSuccess(savedRole);
        } else {
            this.showLogin();
        }

        // Setup Login Form interactions
        document.getElementById('login-role').addEventListener('change', (e) => {
            if(e.target.value) {
                document.getElementById('otp-group').style.display = 'block';
                // auto focus first OTP input
                setTimeout(() => document.querySelector('.otp-inputs input').focus(), 100);
            }
        });

        // OTP inputs auto-advance
        const otpInputs = document.querySelectorAll('.otp-inputs input');
        otpInputs.forEach((input, index) => {
            input.addEventListener('input', () => {
                if(input.value.length === 1 && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            });
            input.addEventListener('keydown', (e) => {
                if(e.key === 'Backspace' && input.value.length === 0 && index > 0) {
                    otpInputs[index - 1].focus();
                }
            });
        });
    },

    showLogin() {
        document.getElementById('app-container').classList.add('hidden');
        
        // Inject Login template directly into body for full screen
        const tpl = document.getElementById('tpl-login-view');
        if(tpl) {
            const clone = tpl.content.cloneNode(true);
            const existingLogin = document.querySelector('.login-wrapper');
            if(existingLogin) existingLogin.remove();
            document.body.appendChild(clone);
        }
    },

    handleLogin() {
        const role = document.getElementById('login-role').value;
        const btn = document.getElementById('login-btn');
        if(role) {
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';
            btn.disabled = true;
            
            // Simulate API delay
            setTimeout(() => {
                this.handleLoginSuccess(role);
            }, 1000);
        }
    },

    handleLoginSuccess(role) {
        this.currentUserRole = role;
        localStorage.setItem('nexa_role', role);
        
        // Clean up login view
        const loginView = document.querySelector('.login-wrapper');
        if(loginView) loginView.remove();

        // Setup App UI
        document.getElementById('app-container').classList.remove('hidden');
        document.getElementById('user-role-display').textContent = role.replace('_', ' ');
        document.getElementById('user-name').textContent = this.getMockName(role);

        this.buildNavigation();
        
        // Navigate to default view (usually dashboard)
        this.navigate('dashboard-view');
    },

    logout() {
        localStorage.removeItem('nexa_role');
        this.currentUserRole = null;
        this.showLogin();
    },

    navigate(viewId) {
        const mainContent = document.getElementById('main-content');
        
        // Try to find the template
        const tpl = document.getElementById(`tpl-${viewId}`);
        
        if (tpl) {
            mainContent.innerHTML = '';
            mainContent.appendChild(tpl.content.cloneNode(true));
            this.updateActiveNav(viewId);
            this.updatePageTitle(viewId);
        } else {
            // Fallback for views not yet implemented in frontend demo
            mainContent.innerHTML = `
                <div class="panel text-center" style="padding: 4rem;">
                    <i class="fa-solid fa-person-digging fa-3x text-muted mb-4"></i>
                    <h2>Module Under Construction</h2>
                    <p class="text-muted mt-2">The ${viewId} module is currently being built by the development team.</p>
                </div>
            `;
            this.updateActiveNav(viewId);
            this.updatePageTitle(viewId);
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
            
            btn.innerHTML = `
                <i class="fa-solid ${link.icon}"></i>
                <span>${link.label}</span>
            `;
            navContainer.appendChild(btn);
        });
    },

    updateActiveNav(viewId) {
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.remove('active');
            if(el.dataset.target === viewId) {
                el.classList.add('active');
            }
        });
        
        // Close mobile sidebar if open
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
            'admin': 'Sarah Jenkins (Admin)',
            'ship_agent': 'Capt. Thomas (Agent)',
            'port_authority': 'Director Vance',
            'customs_officer': 'Officer Chen',
            'health_officer': 'Dr. Alvez'
        };
        return names[role] || 'User';
    }
};

// Initialize App on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
