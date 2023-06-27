const express = require('express');
const {authorization} = require('../middlewares/auth.middleware')
const { register, login, logout, verify, gettingname } = require('../controllers/user.controllers');

const userRouter = express.Router();

userRouter.post('/register', register);

userRouter.post('/login', login);

userRouter.get('/verify/:id', verify)

userRouter.use(authorization);

userRouter.get('/:id', gettingname)

userRouter.post('/logout', logout);

module.exports = userRouter