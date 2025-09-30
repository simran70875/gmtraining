const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { signupValidation, loginValidation } = require("../utils/validators/authValidator");
const auth = require("../middlewares/auth");

router.post("/signup", signupValidation, authController.signUp);
router.post("/login", loginValidation, authController.login);
router.put("/edit", auth, authController.editUser);
router.put("/change-password", auth, authController.changePassword);

// Admin user management
router.get('/users', auth, authController.getAllEndUsers);


router.get('/usersCount', auth, authController.getUsersCount);


router.put('/user/:userId', auth, authController.editUserByAdmin);
router.put('/user/:userId/status', auth, authController.toggleUserStatus);
router.delete('/user/:userId', auth, authController.deleteUser);




module.exports = router;