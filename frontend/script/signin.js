const formEl = document.querySelector('form');
const emailEl = document.querySelector('#email');
const passwordEl = document.querySelector('#password');

(()=>{
    try{
        let queryString = window.location.search;
        queryString = queryString.split('%22&');
        let token = queryString[0].split('?');
        token = token[1].split('%22')[1];
        let user = queryString[1].split('=%22');
        user = user[1].replace('%20', ' ')
        let userId = queryString[2].split('%22');
        userId = userId[1];
        localStorage.setItem('token', token);
        localStorage.setItem('username', user);
        localStorage.setItem('userId', userId);
        window.location.href = 'index.html';
    }catch(err){
        console.log(err);
    }
})();

formEl.addEventListener('submit', async (evnt)=>{
    evnt.preventDefault();
    let res = await fetch('http://localhost:8998/user/login',{
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