const express = require('express');
const router = express.Router();
const {registerUser, userLogin, refreshTokenController, userLogout} = require('../controllers/user-controller.js')



router.post('/register', registerUser);
router.post('/login', userLogin);
router.post('/refresh-token', refreshTokenController);
router.post('/logout', userLogout);


module.exports = router;

