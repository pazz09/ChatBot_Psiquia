window.addEventListener('dfMessengerLoaded', function () {
  const dfMessenger = document.querySelector('df-messenger');
  const chat = dfMessenger.shadowRoot.querySelector('df-messenger-chat');
  const historyLog = document.getElementById('history-log');

  chat.addEventListener('message', (event) => {
    const msg = event.detail.message;
    if (msg && msg.text) {
      const entry = document.createElement('li');
      entry.textContent = (msg.author === 'user' ? '👤 Usuario: ' : '🤖 Psiquia: ') + msg.text;
      historyLog.appendChild(entry);
    }
  });
});
