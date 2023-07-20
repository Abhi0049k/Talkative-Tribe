const token = localStorage.getItem('token');
const user = localStorage.getItem('username');
const userId = localStorage.getItem('userId');
let logoutBtn = document.querySelector('ul li.logout');
let userDis = document.querySelector('ul li.username');
let createRoom = document.querySelector('#createRoom');
const chatContainer = document.querySelector('.container .right .chatContainer');
const roomsList = document.querySelector('.container .left .channels .roomsList');
const userList = document.querySelector('.container .left .users .usersList');
const inputField = document.querySelector('.container .right form #inputField');
const sendBtn = document.querySelector('.container .right form input[type="submit"]');
const formEl = document.querySelector('.container .right form');
const baseServerUrl = 'https://group-chat-production.up.railway.app'
userDis.innerText = user;
let activeRoom = '';
let prevRoom = '';

if (!token) {
    window.location.href = 'signin.html';
}
else {
    const socket = io(`${baseServerUrl}`, { transports: ['websocket'], auth: { token } });

    if (activeRoom === '') {
        chatContainer.innerHTML = `<h1>Join a Room to use group chat</h1>`;
    }

    socket.on('userList', (user) => {
        console.log('Event: userList');
        let arr = user.map((el) => {
            return `<p>${el.name}</p>`;
        })
        userList.innerHTML = arr.join('\n');
    })

    socket.on('nroom', () => {
        console.log('Event: nroom');
        socket.emit('rList');
    })

    socket.on('roomList', (rooms) => {
        let arr = rooms.map((el) => `<p data-roomName="${el.room}">${el.room}</p>`);
        roomsList.innerHTML = arr.join('\n');
        const roomList = document.querySelectorAll('.container .left .channels .roomsList p');
        roomList.forEach((el) => {
            el.addEventListener('click', (event) => {
                prevRoom = activeRoom;
                activeRoom = el.dataset.roomname;
                socket.emit('joinRoom', { activeRoom, prevRoom });
            })
        });
    })

    socket.on('welcome', (obj) => {
        let { msgList, user } = obj;
        if (user._id == userId)
            chatContainer.innerHTML = `<p><span class='welcomeMsg'>Welcome to room: ${obj.activeRoom}</span></p>`;
        else
            chatContainer.innerHTML = `<p><span class='welcomeMsg'>${user.name} has joined this room</span></p>`
        displayMsg(msgList, user);
    })

    const displayMsg = (msgList, user) => {
        let mList = msgList.map((el) => {
            if (el.userId == userId) {
                return myMessage(el);
            } else {
                return distMessage(el, user);
            }
        });
        chatContainer.innerHTML = mList.join('\n');
    }

    const distMessage = (el, user) => {
        let str = `<div class="parentDistParent">
            <div class="distParent"><span>From ...</span><p class="dist">${el.msg}</p></div>
        </div>
        `;
        return str;
    }

    const myMessage = (el) => {
        let str = `
        <div class="myParent"><p class="my">${el.msg}</p></div>
        `;
        return str
    }

    socket.on('receiveMsg', async (msg) => {
        if (msg.userId === userId) {
            let div = document.createElement('div');
            div.setAttribute('class', 'myParent');
            let p = document.createElement('p');
            p.setAttribute('class', 'my');
            p.innerText = msg.msg;
            div.append(p);
            chatContainer.append(div);
        } else {
            let name = await fetch(`${baseServerUrl}/user/${msg.userId}`, {
                method: 'GET',
                headers: {
                    'Content-type': 'application/json',
                    authorization: `Bearer ${token}`
                }
            });
            name = await name.json();
            let div = document.createElement('div');
            div.setAttribute('class', 'parentDistParent');
            let innerDiv = document.createElement('div');
            innerDiv.setAttribute('class', 'distParent');
            let span = document.createElement('span');
            span.innerText = `From ${name.name.split(' ')[0]}`;
            let p = document.createElement('p');
            p.setAttribute('class', 'dist');
            p.innerText = msg.msg;
            innerDiv.append(span);
            innerDiv.append(p);
            div.append(innerDiv);
            chatContainer.append(div);
        }
    })

    logoutBtn.addEventListener('click', async () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('userId');
        let res = await fetch(`${baseServerUrl}/user/logout`,{
            method: 'POST',
            headers:{
                'Content-type': 'application/json',
                authorization: `Bearer ${token}`
            }
        })
        if(res.ok){
            alert('Logout Successful');
            window.location.href = 'https://cute-croissant-2a6b2d.netlify.app/signin.html';
        }else{
            alert('Try Again after sometime');
        }
    })

    createRoom.addEventListener('click', () => {
        let name = prompt('Enter room name');
        socket.emit('createRoom', name);
    })

    formEl.addEventListener('submit', (evnt) => {
        evnt.preventDefault();
        let msg = inputField.value;
        let obj = { msg, activeRoom };
        socket.emit('msgSent', obj);
        inputField.value = '';
    })
}

