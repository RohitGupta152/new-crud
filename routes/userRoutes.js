const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const upload = require('../middleware/fileUpload');

// Add this new route for file import
router.post('/import', upload.single('file'), userController.importUsers);

// Add this new search route before other routes
router.get('/search', userController.searchUsers);

// Routes
router.post('/', userController.createUser);
router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/delete-all', userController.deleteAllUsers);
router.delete('/:id', userController.deleteUser);

module.exports = router; 