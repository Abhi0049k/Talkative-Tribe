const jwt = require('jsonwebtoken');
const { hash, compare } = require("bcrypt");
const { userModel } = require("../models/user.model");
const {blacklistModel} = require('../models/blacklist.model');
const {v4: uuidv4} = require('uuid');
const {default: axios} = require('axios');
const { verifiedEmail, sendingVerifyingEmail } = require('./email.controllers');
require('dotenv').config();



const login = async (req, res)=>{
    try{
        const {email, password} = req.body;
        const isUserValid = await userModel.findOne({email});
        if(!isUserValid) return res.status(404).send({msg: "Wrong Credentials"});
        const result = await compare(password, isUserValid.password);
        if(result){
            if(!isUserValid.isVerified){
                return res.status(404).send({msg: 'Your email is not verified'});
            }
            const access_token = jwt.sign({userId: isUserValid._id}, process.env.JWT_SECRET_KEY, {expiresIn: '4h'});
            return res.status(200).send({msg: 'Login Successful', access_token, 'user': isUserValid.name, 'userId': isUserValid._id });
        }
        return res.status(404).send({msg: 'Wrong Credentials'});
    }catch(err){
        console.log("/user/login: ", err.message);
        res.status(500).send({msg: err.message});
    }
}


const gettingname = async (req, res)=>{
    try{
        let {id} = req.params;
        let user = await userModel.findById(id);
        res.status(200).send({'name': user.name});
    }catch(err){
        res.status(500).send({msg: err.message});
    }
}

const register = async (req, res)=>{
    try{
        let {name, email, password} = req.body;
        const valid = await axios.get(`${process.env.EMAIL_VERIFIER_API}?email=${email}&api_key=${process.env.EMAIL_VERIFIER_API_KEY}`)
        if(valid.data.state!=='deliverable') return res.status(400).send({msg: 'Incorrect Email, please enter correct Email'});
        let userExist = await userModel.findOne({email});
        if(userExist) return res.status(400).send({msg: 'User Already Exists'});
        password = await hash(password, Number(process.env.SALT_ROUNDS));
        const newUser = new userModel({name, email, password});
        sendingVerifyingEmail(newUser._id, email);
        await newUser.save();
        res.status(200).send({msg: 'User Created'});
    }catch(err){
        console.log('/user/register: ', err.message);
        res.status(500).send({msg: err.message});
    }
}

const googleAuth = async(req, res)=>{
    try{
        let email = req.user._json.email;
        let name = req.user._json.name;
        let userExists = await userModel.findOne({email: email})
        if(userExists){
            let token = jwt.sign({userId: userExists._id}, process.env.JWT_SECRET_KEY, {expiresIn: '4h'})
            let queryString = JSON.stringify(token);
            let queryUser = JSON.stringify(userExists.name);
            let queryId = JSON.stringify(userExists._id);
            res.redirect(`http://127.0.0.1:5500/frontend/signin.html?token=${queryString}&user=${queryUser}&userId=${queryId}`)
        }else{
            let password = uuidv4();
            password = await hash(password, Number(process.env.SALT_ROUNDS));
            let newUser = new userModel({email, name, password, isVerified: true});
            await newUser.save();
            let token = jwt.sign({userId: newUser._id}, process.env.JWT_SECRET_KEY, {expiresIn: '4h'});
            let queryString = JSON.stringify(token);
            let queryUser = JSON.stringify(newUser.name);
            let queryId = JSON.stringify(newUser._id);
            res.redirect(`http://127.0.0.1:5500/frontend/signin.html?token=${queryString}&user=${queryUser}&userId=${queryId}`);
        }
    }catch(err){
        console.log(err.message);
        res.redirect('http://127.0.0.1:5500/frontend/signin.html');
    }
}

const logout = async(req, res)=>{
    try{
        const token = req.headers.authorization.split(' ')[1] || req.headers.authorization;
        const blacklisted = new blacklistModel({"token": token});
        await blacklisted.save();
        res.status(200).send({msg: 'Logout Successful'});
    }catch(err){
        console.log('/user/logout: ', err.message);
        res.status(500).send({msg: err.message});
    }
}

const verify = async (req, res)=>{
    try{

        let {id} = req.params;
        const email = verifiedEmail();
        await userModel.findByIdAndUpdate(id, {isVerified: true})
        res.send(email);
    }catch(err){
        res.status(500).send({msg: err.message});
    }
}

module.exports = {
    login, register, logout, verify, gettingname, googleAuth
}