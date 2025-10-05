// console.log(1000);

const root = document.getElementById(`root`);
const user = localStorage.getItem('user');

if (!user) {
  //esli polzovatelja net
  const headerNonAuth = document.createElement('header');
  headerNonAuth.innerText = 'The CSS Whisperer';
  root.appendChild(headerNonAuth);

  const buttonForCallingAuthDialog = document.createElement('button');
  buttonForCallingAuthDialog.innerText = 'Log in';
  headerNonAuth.appendChild(buttonForCallingAuthDialog); //knopku pomestili v header

  buttonForCallingAuthDialog.addEventListener(`click`, function (event) {
    event.preventDefault(); //iskljuchenije obnovlenije stranicy pri nazhatija knopki, kak by reloading page avtomaticheskoje, esli knopka vnutri formy, hotja i vne formy, tozhe mozhet imet tezhe problemy

    const dialogForWrapper = document.createElement('div');
    dialogForWrapper.classList.add('dialog-auth-wrapper');
    const dialogForAuth = document.createElement('div');
    dialogForAuth.classList.add('dialog-auth');

    const formForAuth = document.createElement('form');
    const inputForAuth = document.createElement('input');
    const buttonSubmitAuth = document.createElement('button');
    buttonSubmitAuth.innerText = 'Log in';
    const buttonLeaveAuth = document.createElement('button');
    buttonLeaveAuth.innerText = 'Close';

    formForAuth.appendChild(inputForAuth);
    formForAuth.appendChild(buttonSubmitAuth);
    formForAuth.appendChild(buttonLeaveAuth);

    dialogForAuth.appendChild(formForAuth);

    dialogForWrapper.appendChild(dialogForAuth);
    root.appendChild(dialogForWrapper);

    formForAuth.addEventListener('submit', async function (event) {
      try {
        event.preventDefault();
        const username = event.target[0].value; //bez [0] budet oshibka undefined
        console.log('username: ', username);

        const response = await fetch(`/api/user?username=${username}`);
        const data = await response.json();
        console.log('data: ', data);
        const user = data.user;
        localStorage.setItem('user', user);
        document.location.reload(); //perezagruzka stranicy
      } catch (error) {
        alert(error);
      }
    });
  });
} else {
  //esli suwestvuet to drugoj scenarij
  const headerNonAuth = document.createElement('header');
  headerNonAuth.innerText = 'You are authorized';
  root.appendChild(headerNonAuth);
}

// localStorage.setItem("test1", "test1");

// const test1 = localStorage.getItem("test1");

// if (test1) {
//     console.log("true"); //proverka esli test1 suwestvuet, to true vyvedet
// } else {
//     console.log("false");  //esli net. to false vyvedet
// }

// fetch(`/api/messages`).then((res) => console.log(res));
fetch(`/api/messages`)
  .then((res) => res.json())
  .then((body) => {
    console.log('messages: ', body.messages);

    const messages = body.messages;

    const messagesWrapperDiv = document.createElement('div');
    messagesWrapperDiv.classList.add('messages-wrapper');

    root.appendChild(messagesWrapperDiv);

    messages.forEach((message) => {
      const messageDiv = document.createElement('div');
      messageDiv.classList.add('message'); //osnovnaja objortka bloka soobwenij

      const messageP = document.createElement('p');
      messageP.innerText = message.content; //sam tekst soobwenija

      const messageAvatarImg = document.createElement('img');
      messageAvatarImg.setAttribute('src', message.avatar);
      messageAvatarImg.setAttribute('width', 32);
      messageAvatarImg.setAttribute('height', 32); //avatarka

      const messageUsernameP = document.createElement('p');
      messageUsernameP.innerText = message.username; //username
      //messageDiv.innerText = message.content;

      messageDiv.appendChild(messageAvatarImg);
      messageDiv.appendChild(messageUsernameP);
      messageDiv.appendChild(messageP);

      messagesWrapperDiv.appendChild(messageDiv);
    });
  });
