const socket = io();

// Elements
const $messageForm = document.getElementById("message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $locationButton = document.getElementById("send-location");
const $messages = document.getElementById("messages");

// Templates
const messageTemplate = document.getElementById("message-template").innerHTML;
const locationTemplate = document.getElementById("location-message-template").innerHTML;
const sidebarTemplate = document.getElementById("sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true});

const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild;

  // Height of new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = $messages.offsetHeight;

  // Height of messages container
  const containerHeight = $messages.scrollHeight;

  // How far have I scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = containerHeight;
  }
}

socket.on('message', message => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm a')
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
})


socket.on('locationMessage', ({ username, url, createdAt }) => {
  const html = Mustache.render(locationTemplate, { 
    username,
    url,
    createdAt: moment(createdAt).format('h:mm a')
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
})

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  })

  document.getElementById('sidebar').innerHTML = html;
})

$messageForm.addEventListener('submit', e => {
  e.preventDefault();
  $messageFormButton.setAttribute('disabled', 'disabled');
  const message = e.target.elements.message;

  socket.emit("sendMessage", message.value, error => {
    $messageFormButton.removeAttribute('disabled');
    $messageFormInput.value = "";
    $messageFormInput.focus();
    if (error) {
      return console.log(error);
    }
  });

  
})

$locationButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser');
  }
  $locationButton.setAttribute('disabled', 'disabled');

  navigator.geolocation.getCurrentPosition(position => {
    const { latitude, longitude } = position.coords;
    socket.emit('sendLocation', { latitude, longitude }, () => {
      $locationButton.removeAttribute('disabled');
    })
  })
})

socket.emit('join', { username, room}, error => {
  if (error) {
    alert(error);
    location.href = '/';
  }

  console.log('Connected');
})