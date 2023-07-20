const formEl = document.querySelector('form');
const emailEl = document.querySelector('#email');
const passwordEl = document.querySelector('#password');

formEl.addEventListener('submit', async (evnt)=>{
    evnt.preventDefault();
    let res = await fetch('https://group-chat-production.up.railway.app/user/login',{
        body: JSON.stringify({email: emailEl.value, password: passwordEl.value}),
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        }
    })
    let result = res.ok
    res = await res.json();
    if(result){
        alert('Login Successful');
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('username', res.user);
        localStorage.setItem('userId', res.userId);
        window.location.href = 'index.html'
    }else{
        alert(res.msg)
    }
})