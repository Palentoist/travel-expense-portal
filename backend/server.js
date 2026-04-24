const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Data file path
const DATA_FILE = path.join(__dirname, 'data', 'claims.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
        claims: [],
        users: [
            { id: 'emp1', name: 'John Smith', role: 'employee', email: 'john@company.com' },
            { id: 'emp2', name: 'Sarah Johnson', role: 'employee', email: 'sarah@company.com' },
            { id: 'mgr1', name: 'Robert Williams', role: 'manager', email: 'robert@company.com' },
            { id: 'mgr2', name: 'Emily Davis', role: 'manager', email: 'emily@company.com' },
            { id: 'adm1', name: 'Michael Brown', role: 'admin', email: 'michael@company.com' }
        ],
        categories: [
            { name: 'Airfare', limit: 5000 },
            { name: 'Hotel', limit: 3000 },
            { name: 'Meals', limit: 500 },
            { name: 'Transportation', limit: 1000 },
            { name: 'Other', limit: 2000 }
        ]
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
}

// Read data
function readData() {
    const data = fs.readFileSync(DATA_FILE);
    return JSON.parse(data);
}

// Write data
function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Get all claims
app.get('/api/claims', (req, res) => {
    const data = readData();
    const { status, employeeId, search, page = 1, limit = 10 } = req.query;
    
    let claims = data.claims;
    
    // Filter by status
    if (status) {
        claims = claims.filter(c => c.status === status);
    }
    
    // Filter by employee
    if (employeeId) {
        claims = claims.filter(c => c.employeeId === employeeId);
    }
    
    // Search
    if (search) {
        const searchLower = search.toLowerCase();
        claims = claims.filter(c => 
            c.tripName.toLowerCase().includes(searchLower) ||
            c.employeeName.toLowerCase().includes(searchLower) ||
            c.id.toLowerCase().includes(searchLower)
        );
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedClaims = claims.slice(startIndex, endIndex);
    
    res.json({
        claims: paginatedClaims,
        total: claims.length,
        page: parseInt(page),
        totalPages: Math.ceil(claims.length / limit)
    });
});

// Get single claim
app.get('/api/claims/:id', (req, res) => {
    const data = readData();
    const claim = data.claims.find(c => c.id === req.params.id);
    
    if (!claim) {
        return res.status(404).json({ error: 'Claim not found' });
    }
    
    res.json(claim);
});

// Create new claim
app.post('/api/claims', (req, res) => {
    const data = readData();
    const { employeeId, employeeName, tripName, startDate, endDate, categories, totalAmount } = req.body;
    
    // Policy checks
    for (const cat of categories) {
        const categoryPolicy = data.categories.find(c => c.name === cat.name);
        if (categoryPolicy && cat.amount > categoryPolicy.limit) {
            return res.status(400).json({ 
                error: `Amount for ${cat.name} exceeds policy limit of $${categoryPolicy.limit}` 
            });
        }
    }
    
    const newClaim = {
        id: uuidv4().substring(0, 8).toUpperCase(),
        employeeId,
        employeeName,
        tripName,
        startDate,
        endDate,
        categories,
        totalAmount,
        status: 'submitted',
        comments: [],
        submittedDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
    };
    
    data.claims.unshift(newClaim);
    writeData(data);
    
    res.status(201).json(newClaim);
});

// Update claim status
app.put('/api/claims/:id/status', (req, res) => {
    const data = readData();
    const claimIndex = data.claims.findIndex(c => c.id === req.params.id);
    
    if (claimIndex === -1) {
        return res.status(404).json({ error: 'Claim not found' });
    }
    
    const { status, comment, user } = req.body;
    const validStatuses = ['submitted', 'under review', 'approved', 'rejected', 'reimbursed'];
    
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    
    data.claims[claimIndex].status = status;
    data.claims[claimIndex].lastUpdated = new Date().toISOString();
    
    if (comment) {
        data.claims[claimIndex].comments.push({
            id: uuidv4(),
            user: user || 'System',
            text: comment,
            timestamp: new Date().toISOString()
        });
    }
    
    writeData(data);
    res.json(data.claims[claimIndex]);
});

// Add comment to claim
app.post('/api/claims/:id/comments', (req, res) => {
    const data = readData();
    const claimIndex = data.claims.findIndex(c => c.id === req.params.id);
    
    if (claimIndex === -1) {
        return res.status(404).json({ error: 'Claim not found' });
    }
    
    const { text, user } = req.body;
    
    const comment = {
        id: uuidv4(),
        user: user || 'System',
        text,
        timestamp: new Date().toISOString()
    };
    
    data.claims[claimIndex].comments.push(comment);
    data.claims[claimIndex].lastUpdated = new Date().toISOString();
    
    writeData(data);
    res.status(201).json(comment);
});

// Get dashboard stats
app.get('/api/dashboard', (req, res) => {
    const data = readData();
    
    const stats = {
        totalClaims: data.claims.length,
        pendingApprovals: data.claims.filter(c => c.status === 'submitted').length,
        underReview: data.claims.filter(c => c.status === 'under review').length,
        approved: data.claims.filter(c => c.status === 'approved').length,
        reimbursed: data.claims.filter(c => c.status === 'reimbursed').length,
        rejected: data.claims.filter(c => c.status === 'rejected').length,
        totalReimbursed: data.claims
            .filter(c => c.status === 'reimbursed')
            .reduce((sum, c) => sum + c.totalAmount, 0),
        overdueClaims: data.claims.filter(c => {
            const daysSinceSubmission = (new Date() - new Date(c.submittedDate)) / (1000 * 60 * 60 * 24);
            return daysSinceSubmission > 14 && c.status === 'submitted';
        }).length
    };
    
    res.json(stats);
});

// Get users
app.get('/api/users', (req, res) => {
    const data = readData();
    res.json(data.users);
});

// Get categories
app.get('/api/categories', (req, res) => {
    const data = readData();
    res.json(data.categories);
});

// Start server
app.listen(PORT, () => {
    console.log(`Travel Expense Portal API running on http://localhost:${PORT}`);
});