const formEl = document.querySelector('form');
const nameEl = document.querySelector('#name');
const emailEl = document.querySelector('#email');
const passwordEl = document.querySelector('#password');

formEl.addEventListener('submit', async (evnt)=>{
    evnt.preventDefault();
    let res = await fetch('https://talkative-tribe.onrender.com/user/register',{
        body: JSON.stringify({name: nameEl.value, email: emailEl.value, password: passwordEl.value}),
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        }
    })
    let result = res.ok
    res = await res.json();
    if(result){
        alert('Sign up Successful');
        window.location.href='signin.html';
    }else{
        alert(res.msg);
    }
})