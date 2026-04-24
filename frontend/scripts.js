// API Configuration
const API_URL = 'http://localhost:3000/api';

// State
let currentUser = {
    id: 'emp1',
    name: 'John Smith',
    role: 'employee'
};

let currentPage = 'dashboard';
let allClaimsPage = 1;
let allClaimsTotalPages = 1;

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initUserSwitch();
    initExpenseForm();
    loadDashboard();
});

// Navigation
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateTo(page);
        });
    });
}

function navigateTo(page) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });

    // Update page
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`${page}-page`).classList.add('active');

    currentPage = page;

    // Load page data
    switch (page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'my-claims':
            loadMyClaims();
            break;
        case 'approval-queue':
            loadApprovalQueue();
            break;
        case 'all-claims':
            loadAllClaims();
            break;
    }
}

// User Switch
function initUserSwitch() {
    const userSwitch = document.getElementById('userSwitch');
    userSwitch.addEventListener('change', (e) => {
        const option = e.target.selectedOptions[0];
        currentUser = {
            id: option.value,
            name: option.dataset.name,
            role: option.dataset.role
        };

        updateUserDisplay();
        updateUIBasedOnRole();

        // Reload current page
        navigateTo(currentPage);
    });
}

function updateUserDisplay() {
    document.getElementById('currentUserName').textContent = currentUser.name;
    document.getElementById('currentUserRole').textContent = currentUser.role;
}

function updateUIBasedOnRole() {
    const approvalNav = document.getElementById('approval-nav');
    if (currentUser.role === 'manager' || currentUser.role === 'admin') {
        approvalNav.style.display = 'flex';
    } else {
        approvalNav.style.display = 'none';
    }
}

// Dashboard
async function loadDashboard() {
    try {
        const response = await fetch(`${API_URL}/dashboard`);
        const stats = await response.json();

        const statsGrid = document.getElementById('statsGrid');
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-file-invoice"></i></div>
                <div class="stat-value">${stats.totalClaims}</div>
                <div class="stat-label">Total Claims</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-clock"></i></div>
                <div class="stat-value">${stats.pendingApprovals}</div>
                <div class="stat-label">Pending Approval</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                <div class="stat-value">${stats.approved}</div>
                <div class="stat-label">Approved</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-money-bill-wave"></i></div>
                <div class="stat-value">$${stats.totalReimbursed.toLocaleString()}</div>
                <div class="stat-label">Total Reimbursed</div>
            </div>
            <div class="stat-card warning">
                <div class="stat-icon"><i class="fas fa-exclamation-triangle"></i></div>
                <div class="stat-value">${stats.overdueClaims}</div>
                <div class="stat-label">Overdue Claims</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-times-circle"></i></div>
                <div class="stat-value">${stats.rejected}</div>
                <div class="stat-label">Rejected</div>
            </div>
        `;

        // Load recent claims
        const claimsResponse = await fetch(`${API_URL}/claims?limit=5`);
        const claimsData = await claimsResponse.json();

        const recentClaims = document.getElementById('recentClaims');
        if (claimsData.claims.length === 0) {
            recentClaims.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted);">No claims submitted yet</div>';
        } else {
            recentClaims.innerHTML = claimsData.claims.map(claim => `
                <div class="recent-claim-item" onclick="viewClaimDetail('${claim.id}')">
                    <div>
                        <div style="font-weight: 600; margin-bottom: 4px;">${claim.tripName}</div>
                        <div style="font-size: 13px; color: var(--text-muted);">${claim.employeeName} • ${formatDate(claim.submittedDate)}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 600; color: var(--gold);">$${claim.totalAmount.toLocaleString()}</div>
                        <span class="status-badge status-${claim.status.replace(' ', '-')}">${claim.status}</span>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// New Claim Form
function initExpenseForm() {
    const categoryLimits = {
        'Airfare': 5000,
        'Hotel': 3000,
        'Meals': 500,
        'Transportation': 1000,
        'Other': 2000
    };

    const categoriesContainer = document.getElementById('expenseCategories');
    const addCategoryBtn = document.getElementById('addCategoryBtn');

    // Add initial category
    addExpenseRow(categoriesContainer, categoryLimits);

    addCategoryBtn.addEventListener('click', () => {
        addExpenseRow(categoriesContainer, categoryLimits);
    });

    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').value = today;
    document.getElementById('endDate').value = today;

    // Form submission
    document.getElementById('claimForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitClaim();
    });

    // Update total on any amount change
    categoriesContainer.addEventListener('input', updateTotal);
}

function addExpenseRow(container, categoryLimits) {
    const row = document.createElement('div');
    row.className = 'expense-row';
    row.innerHTML = `
        <div class="form-group" style="margin:0;">
            <label>Category</label>
            <select class="category-select">
                ${Object.keys(categoryLimits).map(cat => `<option value="${cat}">${cat}</option>`).join('')}
            </select>
        </div>
        <div class="form-group" style="margin:0;">
            <label>Amount ($)</label>
            <input type="number" class="amount-input" min="0" step="0.01" required placeholder="0.00">
        </div>
        <div class="form-group" style="margin:0;">
            <label>Limit</label>
            <div class="limit-display" style="padding:10px; color: var(--text-muted); font-size:13px;">$5,000</div>
        </div>
        <button type="button" class="btn-remove" onclick="this.closest('.expense-row').remove(); updateTotal();">
            <i class="fas fa-trash"></i>
        </button>
    `;

    // Update limit display when category changes
    const categorySelect = row.querySelector('.category-select');
    const limitDisplay = row.querySelector('.limit-display');
    const amountInput = row.querySelector('.amount-input');

    categorySelect.addEventListener('change', () => {
        const limit = categoryLimits[categorySelect.value];
        limitDisplay.textContent = `$${limit.toLocaleString()}`;

        // Check if amount exceeds limit
        if (amountInput.value && parseFloat(amountInput.value) > limit) {
            amountInput.style.borderColor = 'var(--danger)';
        } else {
            amountInput.style.borderColor = '';
        }
    });

    amountInput.addEventListener('input', () => {
        const limit = categoryLimits[categorySelect.value];
        if (parseFloat(amountInput.value) > limit) {
            amountInput.style.borderColor = 'var(--danger)';
        } else {
            amountInput.style.borderColor = '';
        }
    });

    container.appendChild(row);
    updateTotal();
}

function updateTotal() {
    const amounts = document.querySelectorAll('.amount-input');
    let total = 0;
    amounts.forEach(input => {
        total += parseFloat(input.value) || 0;
    });
    document.getElementById('totalAmount').textContent = `$${total.toFixed(2)}`;
}

async function submitClaim() {
    const tripName = document.getElementById('tripName').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!tripName) {
        alert('Please enter a trip name');
        return;
    }

    const categories = [];
    const rows = document.querySelectorAll('.expense-row');

    for (const row of rows) {
        const category = row.querySelector('.category-select').value;
        const amount = parseFloat(row.querySelector('.amount-input').value) || 0;

        if (amount > 0) {
            categories.push({ name: category, amount });
        }
    }

    if (categories.length === 0) {
        alert('Please add at least one expense category with an amount greater than 0');
        return;
    }

    const totalAmount = categories.reduce((sum, cat) => sum + cat.amount, 0);

    const claimData = {
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        tripName,
        startDate,
        endDate,
        categories,
        totalAmount
    };

    try {
        const response = await fetch(`${API_URL}/claims`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(claimData)
        });

        if (!response.ok) {
            const error = await response.json();
            alert(`Error: ${error.error}`);
            return;
        }

        const claim = await response.json();
        alert(`Claim submitted successfully! Claim ID: ${claim.id}`);
        resetForm();
        navigateTo('my-claims');
    } catch (error) {
        console.error('Error submitting claim:', error);
        alert('Error submitting claim. Please try again.');
    }
}

function resetForm() {
    document.getElementById('claimForm').reset();
    const container = document.getElementById('expenseCategories');
    container.innerHTML = '';

    const categoryLimits = {
        'Airfare': 5000,
        'Hotel': 3000,
        'Meals': 500,
        'Transportation': 1000,
        'Other': 2000
    };
    addExpenseRow(container, categoryLimits);

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').value = today;
    document.getElementById('endDate').value = today;
    updateTotal();
}

// My Claims
async function loadMyClaims() {
    const search = document.getElementById('myClaimsSearch')?.value || '';
    const status = document.getElementById('myClaimsStatusFilter')?.value || '';

    let url = `${API_URL}/claims?employeeId=${currentUser.id}`;
    if (status) url += `&status=${status}`;
    if (search) url += `&search=${search}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        renderClaimsTable('myClaimsTableBody', data.claims, 'employee');
    } catch (error) {
        console.error('Error loading my claims:', error);
    }
}

// Approval Queue
async function loadApprovalQueue() {
    if (currentUser.role !== 'manager' && currentUser.role !== 'admin') {
        document.getElementById('approvalTableBody').innerHTML =
            '<tr><td colspan="7" style="text-align:center; padding:40px;">You do not have permission to view this page</td></tr>';
        return;
    }

    const search = document.getElementById('approvalSearch')?.value || '';
    const status = document.getElementById('approvalStatusFilter')?.value || 'submitted';

    let url = `${API_URL}/claims?status=${status}`;
    if (search) url += `&search=${search}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        renderClaimsTable('approvalTableBody', data.claims, 'manager');
    } catch (error) {
        console.error('Error loading approval queue:', error);
    }
}

// All Claims
async function loadAllClaims(page = 1) {
    const search = document.getElementById('allClaimsSearch')?.value || '';
    const status = document.getElementById('allClaimsStatusFilter')?.value || '';

    let url = `${API_URL}/claims?page=${page}&limit=10`;
    if (status) url += `&status=${status}`;
    if (search) url += `&search=${search}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        allClaimsTotalPages = data.totalPages;
        allClaimsPage = data.page;

        renderClaimsTable('allClaimsTableBody', data.claims, 'admin');
        renderPagination();
    } catch (error) {
        console.error('Error loading all claims:', error);
    }
}

function renderClaimsTable(tableBodyId, claims, viewType) {
    const tbody = document.getElementById(tableBodyId);

    if (claims.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:40px; color: var(--text-muted);">No claims found</td></tr>';
        return;
    }

    tbody.innerHTML = claims.map(claim => `
        <tr>
            <td><strong style="color: var(--accent-light);">#${claim.id}</strong></td>
            ${viewType !== 'employee' ? `<td>${claim.employeeName}</td>` : ''}
            <td>${claim.tripName}</td>
            <td style="color: var(--gold); font-weight: 600;">$${claim.totalAmount.toLocaleString()}</td>
            <td><span class="status-badge status-${claim.status.replace(' ', '-')}">${claim.status}</span></td>
            <td>${formatDate(claim.submittedDate)}</td>
            <td>
                <button class="btn-action btn-view" onclick="viewClaimDetail('${claim.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                ${viewType === 'manager' && (claim.status === 'submitted' || claim.status === 'under review') ? `
                    <button class="btn-action btn-approve" onclick="updateClaimStatus('${claim.id}', 'approved')">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn-action btn-reject" onclick="updateClaimStatus('${claim.id}', 'rejected')">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
                ${viewType === 'admin' && claim.status === 'approved' ? `
                    <button class="btn-action btn-approve" onclick="updateClaimStatus('${claim.id}', 'reimbursed')">
                        <i class="fas fa-money-bill"></i> Reimburse
                    </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function renderPagination() {
    const container = document.getElementById('allClaimsPagination');
    if (allClaimsTotalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';

    if (allClaimsPage > 1) {
        html += `<button onclick="loadAllClaims(${allClaimsPage - 1})">Previous</button>`;
    }

    html += `<span>Page ${allClaimsPage} of ${allClaimsTotalPages}</span>`;

    if (allClaimsPage < allClaimsTotalPages) {
        html += `<button onclick="loadAllClaims(${allClaimsPage + 1})">Next</button>`;
    }

    container.innerHTML = html;
}

// Claim Detail Modal
async function viewClaimDetail(claimId) {
    try {
        const response = await fetch(`${API_URL}/claims/${claimId}`);
        const claim = await response.json();

        document.getElementById('modalTitle').textContent = `Claim #${claim.id}`;

        const content = document.getElementById('claimDetailContent');
        content.innerHTML = `
            <div class="detail-row">
                <span class="detail-label">Claim ID</span>
                <span class="detail-value">#${claim.id}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Employee</span>
                <span class="detail-value">${claim.employeeName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Trip Name</span>
                <span class="detail-value">${claim.tripName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Dates</span>
                <span class="detail-value">${formatDate(claim.startDate)} - ${formatDate(claim.endDate)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status</span>
                <span class="status-badge status-${claim.status.replace(' ', '-')}">${claim.status}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Total Amount</span>
                <span class="detail-value" style="color: var(--gold); font-size: 18px;">$${claim.totalAmount.toLocaleString()}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Submitted</span>
                <span class="detail-value">${formatDate(claim.submittedDate)}</span>
            </div>
            
            <h3 style="margin-top: 20px; color: var(--accent-light);">Expense Breakdown</h3>
            ${claim.categories.map(cat => `
                <div class="detail-row">
                    <span class="detail-label">${cat.name}</span>
                    <span class="detail-value">$${cat.amount.toLocaleString()}</span>
                </div>
            `).join('')}
            
            <div class="comments-section">
                <h3 style="color: var(--accent-light); margin-bottom: 12px;">Comments</h3>
                ${claim.comments && claim.comments.length > 0 ?
                claim.comments.map(comment => `
                        <div class="comment-item">
                            <div class="comment-user">${comment.user}</div>
                            <div class="comment-text">${comment.text}</div>
                            <div class="comment-time">${formatDate(comment.timestamp)}</div>
                        </div>
                    `).join('')
                : '<p style="color: var(--text-muted); font-size: 14px;">No comments yet</p>'
            }
                
                <div class="comment-input-group">
                    <input type="text" id="commentInput" placeholder="Add a comment...">
                    <button class="btn-primary" onclick="addComment('${claim.id}')" style="padding: 10px 20px;">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;

        // Action buttons
        const actions = document.getElementById('modalActions');
        actions.innerHTML = '';

        if (currentUser.role === 'manager' && (claim.status === 'submitted' || claim.status === 'under review')) {
            actions.innerHTML += `
                <button class="btn-action btn-review" onclick="updateClaimStatus('${claim.id}', 'under review'); closeModal();">
                    <i class="fas fa-search"></i> Under Review
                </button>
                <button class="btn-action btn-approve" onclick="updateClaimStatus('${claim.id}', 'approved'); closeModal();">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="btn-action btn-reject" onclick="updateClaimStatus('${claim.id}', 'rejected'); closeModal();">
                    <i class="fas fa-times"></i> Reject
                </button>
            `;
        }

        if (currentUser.role === 'admin' && claim.status === 'approved') {
            actions.innerHTML += `
                <button class="btn-action btn-approve" onclick="updateClaimStatus('${claim.id}', 'reimbursed'); closeModal();">
                    <i class="fas fa-money-bill"></i> Mark as Reimbursed
                </button>
            `;
        }

        document.getElementById('claimDetailModal').classList.add('active');
        document.getElementById('claimDetailModal').dataset.claimId = claimId;
    } catch (error) {
        console.error('Error loading claim detail:', error);
    }
}

function closeModal() {
    document.getElementById('claimDetailModal').classList.remove('active');
}

async function addComment(claimId) {
    const input = document.getElementById('commentInput');
    const text = input.value.trim();

    if (!text) return;

    try {
        await fetch(`${API_URL}/claims/${claimId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text,
                user: currentUser.name
            })
        });

        input.value = '';
        viewClaimDetail(claimId); // Refresh modal
    } catch (error) {
        console.error('Error adding comment:', error);
    }
}

async function updateClaimStatus(claimId, status) {
    try {
        await fetch(`${API_URL}/claims/${claimId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status,
                user: currentUser.name,
                comment: `Status changed to "${status}" by ${currentUser.name}`
            })
        });

        // Reload current page
        navigateTo(currentPage);
    } catch (error) {
        console.error('Error updating claim status:', error);
    }
}

// Search handlers
document.addEventListener('DOMContentLoaded', () => {
    // Delay adding event listeners until elements exist
    setTimeout(() => {
        const myClaimsSearch = document.getElementById('myClaimsSearch');
        const myClaimsFilter = document.getElementById('myClaimsStatusFilter');
        const approvalSearch = document.getElementById('approvalSearch');
        const approvalFilter = document.getElementById('approvalStatusFilter');
        const allClaimsSearch = document.getElementById('allClaimsSearch');
        const allClaimsFilter = document.getElementById('allClaimsStatusFilter');

        if (myClaimsSearch) myClaimsSearch.addEventListener('input', debounce(loadMyClaims, 300));
        if (myClaimsFilter) myClaimsFilter.addEventListener('change', loadMyClaims);
        if (approvalSearch) approvalSearch.addEventListener('input', debounce(loadApprovalQueue, 300));
        if (approvalFilter) approvalFilter.addEventListener('change', loadApprovalQueue);
        if (allClaimsSearch) allClaimsSearch.addEventListener('input', debounce(() => loadAllClaims(1), 300));
        if (allClaimsFilter) allClaimsFilter.addEventListener('change', () => loadAllClaims(1));
    }, 100);
});

// Utility functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Close modal on outside click
window.addEventListener('click', (e) => {
    const modal = document.getElementById('claimDetailModal');
    if (e.target === modal) {
        closeModal();
    }
});

// Initialize user display
updateUserDisplay();
updateUIBasedOnRole();