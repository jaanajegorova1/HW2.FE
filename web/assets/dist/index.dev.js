'use strict';

// console.log(1000);
var root = document.getElementById('root');
var user = localStorage.getItem('user');
var formMessageElement = null;
var messagesWrapperDiv = null;
var inputValue = null;
var inoutMessageElement = null;
var messageConfigBlock = null;
var messageConfigIsOpened = false;

var initBottomFormMessage = function initBottomFormMessage() {
  formMessageElement = document.createElement('form');
  formMessageElement.classList.add('bottom-form');
  inoutMessageElement = document.createElement('input');
  inoutMessageElement.placeholder = 'Enter your message';
  inoutMessageElement.classList.add('input-message');
  if (inputValue) inoutMessageElement.value = inputValue;
  inoutMessageElement.addEventListener('input', function (event) {
    var value = event.target.value;
    inputValue = value;
  });
  var button = document.createElement('button');
  button.innerText = 'Send';
  formMessageElement.appendChild(inoutMessageElement);
  formMessageElement.appendChild(button);
  root.appendChild(formMessageElement);
  formMessageElement.addEventListener('submit', function _callee(event) {
    var content, username, messageObject, response, data;
    return regeneratorRuntime.async(
      function _callee$(_context) {
        while (1) {
          switch ((_context.prev = _context.next)) {
            case 0:
              _context.prev = 0;
              event.preventDefault();
              content = event.target[0].value;
              username = JSON.parse(user).username;
              messageObject = {
                username: username,
                content: content,
              };
              _context.next = 7;
              return regeneratorRuntime.awrap(
                fetch('/api/message', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(messageObject),
                })
              );

            case 7:
              response = _context.sent;
              _context.next = 10;
              return regeneratorRuntime.awrap(response.json());

            case 10:
              data = _context.sent;
              console.log('data: ', data);
              document.location.reload();
              _context.next = 18;
              break;

            case 15:
              _context.prev = 15;
              _context.t0 = _context['catch'](0);
              console.log('ERROR: ', _context.t0);

            case 18:
            case 'end':
              return _context.stop();
          }
        }
      },
      null,
      null,
      [[0, 15]]
    );
  });
};

var initFetchMessages = function initFetchMessages() {
  return fetch('/api/messages')
    .then(function (res) {
      return res.json();
    })
    .then(function (body) {
      console.log('messages: ', body.messages);
      var messages = body.messages;
      messagesWrapperDiv = document.createElement('div');
      messagesWrapperDiv.classList.add('messages-wrapper');
      root.appendChild(messagesWrapperDiv);
      messages.forEach(function (message) {
        var isUserAuthorOfMessage =
          message.username == JSON.parse(user).username;
        var messageDiv = document.createElement('div');
        messageDiv.classList.add('message');

        if (isUserAuthorOfMessage) {
          messageDiv.classList.add('message-of-mine');
          var messageConfigButton = document.createElement('button');
          messageConfigButton.innerText = 'config';
          messageConfigButton.classList.add('config-button');
          messageDiv.appendChild(messageConfigButton);
          messageConfigButton.addEventListener('click', function (event) {
            if (messageConfigIsOpened) destroyMessageConfig();
            var xCoord = event.clientX,
              yCoord = event.clientY;
            console.log('xCoord: ', xCoord, ' yCoord: ', yCoord);
            messageConfigBlock = document.createElement('div');
            messageConfigBlock.classList.add('message-config');
            messageConfigBlock.style.top = yCoord + 'px';
            messageConfigBlock.style.left = xCoord + 'px';
            var buttonEdit = document.createElement('button');
            var buttonDelete = document.createElement('button');
            buttonEdit.innerText = 'Edit';
            buttonDelete.innerText = 'Delete';
            messageConfigBlock.appendChild(buttonEdit);
            messageConfigBlock.appendChild(buttonDelete);
            buttonEdit.addEventListener('click', function (event) {
              var currentMessage = message;
              inputValue = currentMessage.content;
              inoutMessageElement.value = currentMessage.content;
            });
            root.appendChild(messageConfigBlock);
            messageConfigIsOpened = !messageConfigIsOpened;
          });
        }

        var messageP = document.createElement('p');
        messageP.innerHTML = message.content;
        var messageAvatarImg = document.createElement('img');
        messageAvatarImg.setAttribute('src', message.avatar);
        messageAvatarImg.setAttribute('width', 32);
        messageAvatarImg.setAttribute('height', 32);
        var messageUsernameP = document.createElement('p');
        messageUsernameP.innerText = message.username;
        messageDiv.appendChild(messageAvatarImg);
        messageDiv.appendChild(messageUsernameP);
        messageDiv.appendChild(messageP);
        messagesWrapperDiv.appendChild(messageDiv);
      });
      if (user) initBottomFormMessage();
    });
};

var destroyOldContent = function destroyOldContent() {
  root.removeChild(messagesWrapperDiv);
  root.removeChild(formMessageElement);
  messagesWrapperDiv = null;
  formMessageElement = null;
};

var destroyMessageConfig = function destroyMessageConfig() {
  root.removeChild(messageConfigBlock);
  messageConfigBlock = null;
  messageConfigIsOpened = false;
};

if (!user) {
  var headerNonAuth = document.createElement('header');
  headerNonAuth.innerText = 'The CSS Whisperer';
  root.appendChild(headerNonAuth);
  var buttonForCallingAuthDialog = document.createElement('button');
  buttonForCallingAuthDialog.innerText = 'Log in';
  headerNonAuth.appendChild(buttonForCallingAuthDialog);
  buttonForCallingAuthDialog.addEventListener('click', function (event) {
    event.preventDefault();
    var dialogForAuthWrapper = document.createElement('div');
    dialogForAuthWrapper.classList.add('dialog-auth-wrapper');
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
    dialogForAuthWrapper.appendChild(dialogForAuth);
    root.appendChild(dialogForAuthWrapper);
    formForAuth.addEventListener('submit', function _callee2(event) {
      var username, response, data, _user;

      return regeneratorRuntime.async(
        function _callee2$(_context2) {
          while (1) {
            switch ((_context2.prev = _context2.next)) {
              case 0:
                _context2.prev = 0;
                event.preventDefault();
                username = event.target[0].value;
                console.log('username: ', username);
                _context2.next = 6;
                return regeneratorRuntime.awrap(
                  fetch('/api/user?username='.concat(username))
                );

              case 6:
                response = _context2.sent;
                _context2.next = 9;
                return regeneratorRuntime.awrap(response.json());

              case 9:
                data = _context2.sent;
                console.log('data: ', data);
                _user = data.user;
                localStorage.setItem('user', JSON.stringify(_user));
                document.location.reload();
                _context2.next = 19;
                break;

              case 16:
                _context2.prev = 16;
                _context2.t0 = _context2['catch'](0);
                alert(_context2.t0);

              case 19:
              case 'end':
                return _context2.stop();
            }
          }
        },
        null,
        null,
        [[0, 16]]
      );
    });
  });
} else {
  var _headerNonAuth = document.createElement('header');

  _headerNonAuth.innerText = 'Вы авторизовались';
  root.appendChild(_headerNonAuth); // initBottomFormMessage();
}

initFetchMessages(); // setInterval(() => {
// 	destroyOldContent();
// 	initFetchMessages();
// }, 5000);
// fetch(`/api/messages`)
// 	.then((res) => res.json())
// 	.then((body) => {
// 		console.log("messages: ", body.messages);
// 		const messages = body.messages;
// 		const messagesWrapperDiv = document.createElement("div");
// 		messagesWrapperDiv.classList.add("messages-wrapper");
// 		root.appendChild(messagesWrapperDiv);
// 		messages.forEach((message) => {
// 			const messageDiv = document.createElement("div");
// 			messageDiv.classList.add("message");
// 			const messageP = document.createElement("p");
// 			messageP.innerHTML = message.content;
// 			const messageAvatarImg = document.createElement("img");
// 			messageAvatarImg.setAttribute("src", message.avatar);
// 			messageAvatarImg.setAttribute("width", 32);
// 			messageAvatarImg.setAttribute("height", 32);
// 			const messageUsernameP = document.createElement("p");
// 			messageUsernameP.innerText = message.username;
// 			// messageDiv.innerText = message.content;
// 			messageDiv.appendChild(messageAvatarImg);
// 			messageDiv.appendChild(messageUsernameP);
// 			messageDiv.appendChild(messageP);
// 			messagesWrapperDiv.appendChild(messageDiv);
// 		});
// 		if (user) initBottomFormMessage();
// 	});
