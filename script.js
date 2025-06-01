// Función para abrir el chat
function openChat() {
  const chatContainer = document.getElementById('chatContainer');
  const mainContent = document.getElementById('mainContent');
  
  chatContainer.classList.add('open');
  mainContent.classList.add('chat-open');
}

// Función para cerrar el chat
function closeChat() {
  const chatContainer = document.getElementById('chatContainer');
  const mainContent = document.getElementById('mainContent');
  
  chatContainer.classList.remove('open');
  mainContent.classList.remove('chat-open');
}

// Función para mostrar secciones
function showSection(sectionName) {
  // Ocultar todas las secciones
  const sections = document.querySelectorAll('section');
  sections.forEach(section => {
    section.classList.remove('active');
  });
  
  // Mostrar la sección seleccionada
  const targetSection = document.getElementById(sectionName);
  if (targetSection) {
    targetSection.classList.add('active');
  }
}

// Tu código original del historial (mantenido)
window.addEventListener('dfMessengerLoaded', function () {
  const dfMessenger = document.querySelector('df-messenger');
  const chat = dfMessenger.shadowRoot.querySelector('df-messenger-chat');
  const historyLog = document.getElementById('history-log');

  if (chat && historyLog) {
    chat.addEventListener('message', (event) => {
      const msg = event.detail.message;
      if (msg && msg.text) {
        const entry = document.createElement('li');
        entry.textContent = (msg.author === 'user' ? '👤 Usuario: ' : '🤖 Psiquia: ') + msg.text;
        historyLog.appendChild(entry);
      }
    });
  }
});