const token = localStorage.getItem('token');
const user = localStorage.getItem('username');
const userId = localStorage.getItem('userId');
let logoutBtn = document.querySelector('ul li.logout');
let userDis = document.querySelector('ul li.username');
let createRoom = document.querySelector('#createRoom');
let loginContainer = document.querySelector('#loginMessage');
let loginMessage = document.querySelector('#loginMessage .h1 h1');
const chatContainer = document.querySelector('.container .right .chatContainer');
const roomsList = document.querySelector('.container .left .channels .roomsList');
const userList = document.querySelector('.container .left .users .usersList');
const inputField = document.querySelector('.container .right form #inputField');
const sendBtn = document.querySelector('.container .right form input[type="submit"]');
const formEl = document.querySelector('.container .right form');
const baseServerUrl = 'https://talkative-tribe.onrender.com'
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
        let arr = user.map((el) => {
            return `<p>${el.name}</p>`;
        })
        userList.innerHTML = arr.join('\n');
    })

    socket.on('nroom', () => {
        socket.emit('rList');
    })

    socket.on('roomList', (rooms) => {
        let arr = rooms.map((el)=>{
            if(el.creatorId==userId)
            return `<p class="myCreatedRoom" data-roomName="${el.room}"><span>${el.room}</span><i class="fa-solid fa-trash trashCan" data-roomName="${el.room}"></i></p>`;
            else
            return `<p data-roomName="${el.room}"><span>${el.room}</span></p>`;
        })
        roomsList.innerHTML = arr.join('\n');
        const roomList = document.querySelectorAll('.container .left .channels .roomsList p');
        roomList.forEach((el) => {
            el.addEventListener('click', (event) => {
                prevRoom = activeRoom;
                activeRoom = el.dataset.roomname;
                socket.emit('joinRoom', { activeRoom, prevRoom });
            })
        });
        const trashCans = document.querySelectorAll('.container .left .channels .roomsList p .trashCan');
        trashCans.forEach((el)=>{
            el.addEventListener('click', (evnt)=>{
                evnt.stopPropagation();
                evnt.stopImmediatePropagation();
                deleteRoom(evnt.target.getAttribute('data-roomName'));
            })
        })
    })

    const deleteRoom = (el)=>{
        socket.emit('deleteRoom', {room: el, token});
    }

    socket.on('roomDeleted', (obj)=>{
        if(activeRoom===obj.room){
            activeRoom='';
            chatContainer.innerHTML = `<h1>Join a Room to use group chat</h1>`;
            if(obj.creatorId!==userId)
            alert(`Room ${obj.room} has been deleted by it's creator`)
        }
    })

    socket.on('welcome', (obj) => {
        let { msgList, user } = obj;
        displayMsg(msgList);
    })

    const displayMsg = (msgList) => {
        let mList = msgList.map((el) => {
            if (el.userId == userId) {
                return myMessage(el);
            } else {
                return distMessage(el);
            }
        });
        chatContainer.innerHTML = mList.join('\n');
        let allTrashMsg = document.querySelectorAll('.myParent .my .trashMsg');
        allTrashMsg.forEach((el)=>{
            el.addEventListener('click', (evnt)=>{
                deleteMessage(evnt.target.getAttribute('data-id'));
            })
        })
    }

    const deleteMessage = (id)=>{
        socket.emit('deleteMessage', {id, activeRoom, token});
    }

    const distMessage = (el) => {
        let str = `<div class="parentDistParent">
            <div class="distParent"><span>From ${el.username.split(' ')[0]}</span><p class="dist">${el.msg}</p></div>
        </div>
        `;
        return str;
    }

    const myMessage = (el) => {
        let str = `
        <div class="myParent"><p class="my"><span>${el.msg}</span><i class="fa-solid fa-trash trashMsg" data-id="${el._id}"></i></p></div>
        `;
        return str
    }

    socket.on('receiveMsg', async (msg) => {
        if (msg.userId === userId) {
            let div = document.createElement('div');
            div.setAttribute('class', 'myParent');
            let p = document.createElement('p');
            p.setAttribute('class', 'my');
            let msgSpan = document.createElement('span');
            msgSpan.innerText = msg.msg;
            let trashCan = document.createElement('i');
            trashCan.setAttribute('class', 'fa-solid fa-trash trashMsg')
            trashCan.setAttribute('data-id', msg._id);
            trashCan.addEventListener('click', (evnt)=>{
                deleteMessage(evnt.target.getAttribute('data-id'));
            })
            p.append(msgSpan);
            p.append(trashCan)
            div.append(p);
            chatContainer.append(div);
        } else {
            let name = msg.username.split(' ')[0];
            let div = document.createElement('div');
            div.setAttribute('class', 'parentDistParent');
            let innerDiv = document.createElement('div');
            innerDiv.setAttribute('class', 'distParent');
            let span = document.createElement('span');
            span.innerText = `From ${name}`;
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
            window.location.href = 'signin.html';
        }else{
            alert('Try Again after sometime');
        }
    })

    createRoom.addEventListener('click', () => {
        let name = prompt('Enter group name');
        if(name)
        socket.emit('createRoom', {name, userId});
    })

    formEl.addEventListener('submit', (evnt) => {
        evnt.preventDefault();
        let msg = inputField.value;
        let obj = { msg, activeRoom , username: user};
        socket.emit('msgSent', obj);
        inputField.value = '';
    })
    socket.on('LoginAgain', (data='Login Again.')=>{
        loginMessage.innerText = data;
        let p = document.querySelector('#loginContainer .h1 p');
        loginContainer.style.display = 'flex';
        if(data==='Login Again'){
            setTimeout(()=>{
                p.innerText = 'Redirecting to Login Page in 2 second';
                localStorage.removeItem('username')
                localStorage.removeItem('userId')
                localStorage.removeItem('token')
                window.location.href='signin.html';
            }, 2000);
        }else{
            setTimeout(()=>{
                loginContainer.style.display = 'none';
            }, 2500);
        }
    })
}

