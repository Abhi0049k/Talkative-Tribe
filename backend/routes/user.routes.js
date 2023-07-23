const express = require('express');
const passport = require('passport');
const {authorization} = require('../middlewares/auth.middleware')
const { register, login, logout, verify, gettingname, googleAuth } = require('../controllers/user.controllers');
require('../configs/googleOauth')


const userRouter = express.Router();

userRouter.post('/register', register);

userRouter.post('/login', login);

userRouter.get('/auth/google', passport.authenticate('google', {scope: ['profile', 'email']}));

userRouter.get('/auth/google/callback', passport.authenticate('google', {failureRedirect: 'https://cute-croissant-2a6b2d.netlify.app/signin.html', session:false}), googleAuth);

userRouter.get('/verify/:id', verify)

userRouter.use(authorization);

userRouter.get('/:id', gettingname)

userRouter.post('/logout', logout);

module.exports = userRouter