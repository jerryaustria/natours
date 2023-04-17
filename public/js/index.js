/* eslint-disable */
import '@babel/polyfill';
import 'polyfill';
import { login, logout } from './login';
import {updateSettings} from './updateSetting';
import {bookTour} from './stripe';

// install a polyfill which will make some of the newer Javascript features work in older browsers as well
// npm i @babel/polyfill or npm i polyfill for latest npm

//DOM ELEMENTS
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');



// Values


//DELEGATION

if(loginForm){
    loginForm.addEventListener('submit',e =>{
        e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
        login(email, password); 
    });
}

if(logOutBtn) {
  
    logOutBtn.addEventListener('click', logout);
}

if(userDataForm){
    userDataForm.addEventListener('submit', e=>{
        e.preventDefault();

        const form  = new FormData();
        form.append('name',document.getElementById('name').value);
        form.append('email',document.getElementById('email').value);
        form.append('photo', document.getElementById('photo').files[0]);

        console.log(form);

        updateSettings(form,'data');

        // const name = document.getElementById('name').value;
        // const email = document.getElementById('email').value;
        // updateSettings({name, email},'data');
    });
}

if(userPasswordForm){
    userPasswordForm.addEventListener('submit',async e=>{
        e.preventDefault();

        document.querySelector('.btn--save-password').textContent = "Updating...";

        const passwordCurrent = document.getElementById('password-current').value;
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('password-confirm').value;

        const result  = await updateSettings({passwordCurrent, password, passwordConfirm},'password');
        
        document.querySelector('.btn--save-password').textContent = "Save Password";
        document.getElementById('password-current').value = "";
        document.getElementById('password').value = "";
        document.getElementById('password-confirm').value = "";

    })
}

if (bookBtn){
    alert("clicked");
    bookBtn.addEventListener('click', e=>{
        e.target.textContent = 'Processing...';
        // const tourId = e.target.dataset.tourId; OR
        const {tourId} = e.target.dataset;
        
        bookTour(tourId);
    });
}
    
