const express = require('express');
const connection = require('./configs/db')
const app = express();
require('dotenv').config();
const socketServer = require('./configs/socket');
const userRouter = require('./routes/user.routes');
const cors = require('cors');

const port = process.env.PORT||5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res)=>{
    res.status(200).send({msg: 'Welcome to the landing page'})
})

app.use('/user', userRouter);

const Server = require('http').createServer(app);

socketServer(Server);

Server.listen(port, ()=>{
    connection();
    console.log(`Server is running at ${port}`);
})
