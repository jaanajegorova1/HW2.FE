"use strict";

// console.log(1000);
var root = document.getElementById("root");
var user = localStorage.getItem('user');

if (!user) {
  //esli polzovatelja net
  var headerNonAuth = document.createElement('header');
  headerNonAuth.innerText = 'The CSS Whisperer';
  root.appendChild(headerNonAuth);
  var buttonForCallingAuthDialog = document.createElement('button');
  buttonForCallingAuthDialog.innerText = 'Log in';
  headerNonAuth.appendChild(buttonForCallingAuthDialog); //knopku pomestili v header

  buttonForCallingAuthDialog.addEventListener("click", function (event) {
    event.preventDefault(); //iskljuchenije obnovlenije stranicy pri nazhatija knopki, kak by reloading page avtomaticheskoje, esli knopka vnutri formy, hotja i vne formy, tozhe mozhet imet tezhe problemy

    var dialogForWrapper = document.createElement('div');
    dialogForWrapper.classList.add('dialog-auth-wrapper');
    var dialogForAuth = document.createElement('div');
    dialogForAuth.classList.add('dialog-auth');
    var formForAuth = document.createElement('form');
    var inputForAuth = document.createElement('input');
    var buttonSubmitAuth = document.createElement('button');
    buttonSubmitAuth.innerText = 'Log in';
    var buttonLeaveAuth = document.createElement('button');
    buttonLeaveAuth.innerText = 'Close';
    formForAuth.appendChild(inputForAuth);
    formForAuth.appendChild(buttonSubmitAuth);
    formForAuth.appendChild(buttonLeaveAuth);
    dialogForAuth.appendChild(formForAuth);
    dialogForWrapper.appendChild(dialogForAuth);
    root.appendChild(dialogForWrapper);
    formForAuth.addEventListener('submit', function _callee(event) {
      var username, response, data, _user;

      return regeneratorRuntime.async(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              event.preventDefault();
              username = event.target[0].value; //bez [0] budet oshibka undefined

              console.log('username: ', username);
              _context.next = 6;
              return regeneratorRuntime.awrap(fetch("/api/user?username=".concat(username)));

            case 6:
              response = _context.sent;
              _context.next = 9;
              return regeneratorRuntime.awrap(response.json());

            case 9:
              data = _context.sent;
              console.log('data: ', data);
              _user = data.user;
              localStorage.setItem('user', _user);
              document.location.reload(); //perezagruzka stranicy

              _context.next = 19;
              break;

            case 16:
              _context.prev = 16;
              _context.t0 = _context["catch"](0);
              alert(_context.t0);

            case 19:
            case "end":
              return _context.stop();
          }
        }
      }, null, null, [[0, 16]]);
    });
  });
} else {
  //esli suwestvuet to drugoj scenarij
  var _headerNonAuth = document.createElement('header');

  _headerNonAuth.innerText = 'You are authorized';
  root.appendChild(_headerNonAuth);
} // localStorage.setItem("test1", "test1");
// const test1 = localStorage.getItem("test1");
// if (test1) {
//     console.log("true"); //proverka esli test1 suwestvuet, to true vyvedet
// } else {
//     console.log("false");  //esli net. to false vyvedet
// }
// fetch(`/api/messages`).then((res) => console.log(res));


fetch("/api/messages").then(function (res) {
  return res.json();
}).then(function (body) {
  console.log('messages: ', body.messages);
  var messages = body.messages;
  var messagesWrapperDiv = document.createElement('div');
  messagesWrapperDiv.classList.add('messages-wrapper');
  root.appendChild(messagesWrapperDiv);
  messages.forEach(function (message) {
    var messageDiv = document.createElement('div');
    messageDiv.classList.add('message'); //osnovnaja objortka bloka soobwenij

    var messageP = document.createElement('p');
    messageP.innerText = message.content; //sam tekst soobwenija

    var messageAvatarImg = document.createElement('img');
    messageAvatarImg.setAttribute('src', message.avatar);
    messageAvatarImg.setAttribute('width', 32);
    messageAvatarImg.setAttribute('height', 32); //avatarka

    var messageUsernameP = document.createElement('p');
    messageUsernameP.innerText = message.username; //username
    //messageDiv.innerText = message.content;

    messageDiv.appendChild(messageAvatarImg);
    messageDiv.appendChild(messageUsernameP);
    messageDiv.appendChild(messageP);
    messagesWrapperDiv.appendChild(messageDiv);
  });
});