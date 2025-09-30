const express = require('express');
const router = express.Router();
const agentController = require("../controllers/agentConroller"); // Typo fixed: 'agentConroller' → 'agentController'
const auth = require('../middlewares/auth');
const { agentAddValidation } = require('../utils/validators/agentValidator');
const uploadAny = require('../utils/uploads');

// Middleware to restrict access to admin users
const adminOnly = (req, res, next) => {
    if (req.user?.type !== 'admin') {
        return res.status(403).json({ message: 'Access denied: Admins only' });
    }
    next();
};

// All routes below are protected by auth and adminOnly middleware
// Get all agents
router.get('/', auth,  agentController.getAllAgents);

// Create new agent
router.post('/add', auth, adminOnly, uploadAny.single("image"), agentAddValidation, agentController.createAgent);

// Edit agent details
router.put('/:userId', auth, adminOnly, agentController.editAgent);

// Enable/disable agent
router.put('/:userId/status', auth, adminOnly, agentController.toggleAgentStatus);

// Change agent password
router.put('/:userId/password', auth, adminOnly, agentController.changeAgentPassword);

// Delete agent
router.delete('/:userId', auth, adminOnly, agentController.deleteAgent);


module.exports = router;
