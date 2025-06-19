// CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = window.ENV?.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = window.ENV?.SUPABASE_ANON_KEY || '';

// Inicializar Supabase
let supabase;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase configurado correctamente');
  } catch (error) {
    console.error('Error configurando Supabase:', error);
  }
} else {
  console.log('Variables de entorno no encontradas, funcionando en modo demo');
}

// VARIABLES GLOBALES
let currentUser = null;
let currentSession = null;
let sessionConversations = []; // Para usuarios anónimos

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();

  // Añadir inicialización de captura mejorada
  setTimeout(() => {
    if (window.initializeConversationCapture) {
      window.initializeConversationCapture();
    }
  }, 3000);
});

// Exponer función de prueba globalmente
window.testExtractMessages = testExtractMessages;

async function initializeApp() {
  // Verificar si hay una sesión activa
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        currentUser = session.user;
        currentSession = session;
      }
    } catch (e) {
      console.error('Error al obtener sesión Supabase:', e);
    }
  }
  updateUserInterface();
}

// FUNCIONES DE AUTENTICACIÓN
async function register() {
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  
  if (!name || !email || !password) {
    showError('registerError', 'Por favor completa todos los campos');
    return;
  }

  if (!supabase) {
    showSuccess('registerSuccess', 'Registro exitoso (modo demo)');
    return;
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: name
        }
      }
    });

    if (error) throw error;

    showSuccess('registerSuccess', 'Registro exitoso. Revisa tu email para confirmar tu cuenta.');
    
    // Limpiar formulario
    document.getElementById('registerName').value = '';
    document.getElementById('registerEmail').value = '';
    document.getElementById('registerPassword').value = '';
    
  } catch (error) {
    showError('registerError', error.message);
  }
}

async function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  if (!email || !password) {
    showError('loginError', 'Por favor completa todos los campos');
    return;
  }

  if (!supabase) {
    // Modo demo
    currentUser = { id: 'demo', email: email, user_metadata: { full_name: 'Usuario Demo' }, created_at: new Date().toISOString() };
    updateUserInterface();
    showSection('chat');
    return;
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) throw error;

    currentUser = data.user;
    currentSession = data.session;
    updateUserInterface();
    showSection('chat');
    
  } catch (error) {
    showError('loginError', error.message);
  }
}

async function logout() {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Error en signOut:', e);
    }
  }
  
  currentUser = null;
  currentSession = null;
  sessionConversations = [];
  updateUserInterface();
  showSection('chat');
}

// FUNCIONES DE INTERFAZ
function updateUserInterface() {
  const userStatus = document.getElementById('userStatus');
  const authBtn = document.getElementById('authBtn');
  const userWelcome = document.getElementById('userWelcome');
  
  if (currentUser) {
    const userName = currentUser.user_metadata?.full_name || currentUser.email;
    userStatus.textContent = userName;
    authBtn.textContent = 'Cerrar Sesión';
    authBtn.onclick = logout;
    userWelcome.innerHTML = `<p style="color: #005f73; font-weight: bold;">¡Hola ${userName}! Puedes guardar tus conversaciones permanentemente.</p>`;
  } else {
    userStatus.textContent = 'Usuario Anónimo';
    authBtn.textContent = 'Iniciar Sesión';
    authBtn.onclick = toggleAuth;
    userWelcome.innerHTML = `<p style="color: #0a9396;">Navegando como usuario anónimo. <a href="#" onclick="toggleAuth()" style="color: #005f73; text-decoration: underline;">Inicia sesión</a> para guardar tus pacientes en tu perfil de forma permanente.</p>`;
  }
  
  // Al actualizar interfaz, recargar historial y perfil en la sección activa
  const activeSection = document.querySelector('section.active')?.id;
  if (activeSection === 'historial') loadHistorial();
  if (activeSection === 'perfil') loadProfile();
}

function toggleAuth() {
  if (currentUser) {
    logout();
  } else {
    showSection('auth');
  }
}

function showLogin() {
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('registerForm').style.display = 'none';
  hideMessages();
}

function showRegister() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
  hideMessages();
}

function hideMessages() {
  document.getElementById('loginError').style.display = 'none';
  document.getElementById('registerError').style.display = 'none';
  document.getElementById('registerSuccess').style.display = 'none';
}

function showError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;
    element.style.display = 'block';
  }
}

function showSuccess(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;
    element.style.display = 'block';
  }
}

// FUNCIONES DE CHAT
function openChat() {
  const chatContainer = document.getElementById('chatContainer');
  const mainContent = document.getElementById('mainContent');
  
  chatContainer.classList.add('open');
  mainContent.classList.add('chat-open');
  
  addSaveConversationButton();
}

function closeChat() {
  const chatContainer = document.getElementById('chatContainer');
  const mainContent = document.getElementById('mainContent');
  
  chatContainer.classList.remove('open');
  mainContent.classList.remove('chat-open');
}

function addSaveConversationButton() {
  if (document.getElementById('saveConversationBtn')) {
    return;
  }
  
  const chatContainer = document.getElementById('chatContainer');
  const saveBtn = document.createElement('button');
  saveBtn.id = 'saveConversationBtn';
  saveBtn.className = 'save-conversation-btn';
  saveBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Conversación';
  saveBtn.onclick = showSaveConversationModal;
  
  chatContainer.appendChild(saveBtn);
}

function showSaveConversationModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Guardar Conversación</h3>
      <div class="form-group">
        <label for="conversationTitle">Título de la conversación:</label>
        <input type="text" id="conversationTitle" placeholder="Ej: Consulta sobre ansiedad - Paciente 25 años" maxlength="255">
      </div>
      <div class="modal-buttons">
        <button class="form-btn" onclick="saveCurrentConversation()">
          <i class="fas fa-save"></i> Guardar
        </button>
        <button class="form-btn secondary" onclick="closeSaveModal()">
          Cancelar
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.getElementById('conversationTitle').focus();
  
  // Cerrar modal al hacer clic fuera
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeSaveModal();
    }
  });
}

function closeSaveModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) modal.remove();
}

// FUNCIÓN MEJORADA para extraer mensajes de Dialogflow Messenger
function getDialogflowConversation() {
  console.log('🔍 Iniciando captura de conversación...');
  
  // 1. Usar el historial capturado por los interceptores (si existe)
  if (window.conversationHistory && window.conversationHistory.length > 0) {
    console.log('✅ Usando historial interceptado:', window.conversationHistory.length, 'mensajes');
    return window.conversationHistory;
  }
  
  // 2. Método de respaldo - buscar en el DOM del chatbot
  try {
    const dfMessenger = document.querySelector('df-messenger');
    if (!dfMessenger) {
      console.log('❌ No se encontró df-messenger');
      return [];
    }

    const shadowRoot = dfMessenger.shadowRoot;
    if (!shadowRoot) {
      console.log('❌ No se encontró shadowRoot');
      return [];
    }

    const dfMessengerChat = shadowRoot.querySelector('df-messenger-chat');
    if (!dfMessengerChat) {
      console.log('❌ No se encontró df-messenger-chat');
      return [];
    }

    const chatShadowRoot = dfMessengerChat.shadowRoot;
    if (!chatShadowRoot) {
      console.log('❌ No se encontró chat shadowRoot');
      return [];
    }

    // Múltiples selectores para diferentes versiones de Dialogflow
    const possibleSelectors = [
      'df-message',
      'df-user-message', 
      '.chat-bubble',
      '.message',
      '[role="listitem"]',
      '.df-messenger-message'
    ];

    let messages = [];
    
    for (const selector of possibleSelectors) {
      const messageElements = chatShadowRoot.querySelectorAll(selector);
      if (messageElements.length > 0) {
        console.log(`✅ Encontrados ${messageElements.length} mensajes con selector: ${selector}`);
        
        messageElements.forEach((msgEl, index) => {
          try {
            let text = msgEl.textContent || msgEl.innerText || '';
            text = text.trim();
            
            if (!text || text.length < 3) return;

            // Determinar si es usuario o bot
            const isUser = msgEl.hasAttribute('is-user') || 
                          msgEl.getAttribute('role') === 'user' ||
                          msgEl.classList.contains('user-message') ||
                          msgEl.tagName.toLowerCase() === 'df-user-message' ||
                          msgEl.querySelector('[data-testid="userMessage"]') ||
                          msgEl.closest('[data-testid="userMessage"]');

            messages.push({
              sender: isUser ? 'user' : 'bot',
              text: text,
              timestamp: new Date().toISOString(),
              index: index
            });
          } catch (error) {
            console.error('❌ Error procesando mensaje individual:', error);
          }
        });
        
        if (messages.length > 0) break; // Si encontramos mensajes, dejar de buscar
      }
    }

    // 3. Método alternativo si no encontramos nada
    if (messages.length === 0) {
      console.log('⚠️ Intentando método alternativo...');
      const allTextElements = chatShadowRoot.querySelectorAll('*');
      const potentialMessages = [];
      
      allTextElements.forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length > 10 && !el.querySelector('*')) {
          potentialMessages.push({
            element: el,
            text: text,
            length: text.length
          });
        }
      });

      // Filtrar mensajes válidos
      potentialMessages
        .filter(item => item.length > 15) // Filtrar mensajes muy cortos
        .forEach((item, index) => {
          messages.push({
            sender: index % 2 === 0 ? 'user' : 'bot',
            text: item.text,
            timestamp: new Date().toISOString(),
            index: index
          });
        });
    }

    console.log(`📊 Total de mensajes extraídos: ${messages.length}`);
    return messages;

  } catch (error) {
    console.error('❌ Error en getDialogflowConversation:', error);
    return [];
  }
}

// FUNCIÓN para mostrar diálogo de captura manual
function showManualCaptureDialog() {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <h3>Captura Manual de Conversación</h3>
        <p>No se pudo capturar automáticamente. Por favor, pega el contenido de la conversación:</p>
        <div class="form-group">
          <label for="manualConversation">Conversación:</label>
          <textarea id="manualConversation" rows="10" 
                    placeholder="Pega aquí el contenido de la conversación...
Ejemplo:
Usuario: Hola, necesito ayuda
Bot: ¡Hola! ¿En qué puedo ayudarte?
Usuario: Mi paciente tiene ansiedad
Bot: Entiendo, cuéntame más detalles..."></textarea>
        </div>
        <div class="modal-buttons">
          <button class="form-btn" onclick="processManualConversation()">
            <i class="fas fa-check"></i> Procesar
          </button>
          <button class="form-btn secondary" onclick="cancelManualCapture()">
            Cancelar
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    document.getElementById('manualConversation').focus();
    
    // Funciones para el modal manual
    window.processManualConversation = function() {
      const text = document.getElementById('manualConversation').value.trim();
      modal.remove();
      
      if (text) {
        // Procesar el texto para convertirlo en mensajes
        const lines = text.split('\n').filter(line => line.trim());
        const messages = [];
        
        lines.forEach((line, index) => {
          const trimmedLine = line.trim();
          if (trimmedLine) {
            // Intentar detectar si es usuario o bot
            let sender = 'bot';
            let text = trimmedLine;
            
            if (trimmedLine.toLowerCase().startsWith('usuario:') || 
                trimmedLine.toLowerCase().startsWith('user:') ||
                trimmedLine.toLowerCase().startsWith('yo:')) {
              sender = 'user';
              text = trimmedLine.substring(trimmedLine.indexOf(':') + 1).trim();
            } else if (trimmedLine.toLowerCase().startsWith('bot:') || 
                       trimmedLine.toLowerCase().startsWith('psiquia:') ||
                       trimmedLine.toLowerCase().startsWith('asistente:')) {
              sender = 'bot';
              text = trimmedLine.substring(trimmedLine.indexOf(':') + 1).trim();
            }
            
            messages.push({
              sender: sender,
              text: text,
              timestamp: new Date().toISOString(),
              index: index
            });
          }
        });
        
        resolve(messages);
      } else {
        resolve([]);
      }
    };
    
    window.cancelManualCapture = function() {
      modal.remove();
      resolve([]);
    };
  });
}

// FUNCIÓN para guardar la conversación (CORREGIDA)
async function saveCurrentConversation() {
  const titleInput = document.getElementById('conversationTitle');
  if (!titleInput) return;
  
  let title = titleInput.value.trim();
  if (!title) {
    alert('Por favor ingresa un título para la conversación');
    return;
  }

  try {
    // Esperar un poco para asegurar que la conversación esté completamente cargada
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('🔄 Iniciando proceso de guardado...');
    let messages = getDialogflowConversation();
    
    // Si no hay mensajes, ofrecer captura manual
    if (!messages || messages.length === 0) {
      console.log('⚠️ No se encontraron mensajes automáticamente');
      const useManual = confirm('No se pudo capturar automáticamente la conversación. ¿Deseas ingresarla manualmente?');
      if (useManual) {
        messages = await showManualCaptureDialog();
      }
    }
    
    if (!messages || messages.length === 0) {
      alert('No se encontró contenido de chat para guardar. Asegúrate de haber tenido una conversación antes de guardar.');
      return;
    }

    // Crear el contenido de la conversación
    const content = messages.map(m => {
      const label = m.sender === 'user' ? 'Usuario' : 'PSIQUIA';
      return `${label}: ${m.text}`;
    }).join('\n\n');

    console.log('💾 Guardando conversación:', { title, messagesCount: messages.length });

    // Guardar según el tipo de usuario
    if (currentUser && supabase) {
      // Usuario registrado - guardar en Supabase
      const insertObj = {
        user_id: currentUser.id,
        title: title,
        content: content,
        messages: messages,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('conversations')
        .insert([insertObj])
        .select();

      if (error) {
        console.error('❌ Error de Supabase:', error);
        throw error;
      }

      console.log('✅ Conversación guardada en Supabase:', data);
      alert('¡Conversación guardada exitosamente en tu cuenta!');
      
    } else {
      // Usuario anónimo - guardar en memoria de la sesión
      const newConversation = {
        id: Date.now(),
        title: title,
        content: content,
        messages: messages,
        created_at: new Date().toISOString()
      };
      
      sessionConversations.push(newConversation);
      console.log('✅ Conversación guardada en memoria:', newConversation);
      alert('Conversación guardada temporalmente (solo para esta sesión).\n\n¡Inicia sesión para guardar permanentemente!');
    }

    // Cerrar modal y actualizar historial si está activo
    closeSaveModal();
    
    const activeSection = document.querySelector('section.active')?.id;
    if (activeSection === 'historial') {
      loadHistorial();
    }

  } catch (error) {
    console.error('❌ Error guardando conversación:', error);
    alert('Error al guardar la conversación: ' + (error.message || 'Error desconocido'));
  }
}

// FUNCIÓN DE PRUEBA MEJORADA
function testExtractMessages() {
  console.log('=== 🔍 TEST DE EXTRACCIÓN DE MENSAJES ===');
  
  // Probar historial interceptado
  if (window.conversationHistory) {
    console.log('📱 Historial interceptado:', window.conversationHistory);
    console.log('📊 Total interceptado:', window.conversationHistory.length);
  } else {
    console.log('❌ No hay historial interceptado disponible');
  }
  
  // Probar método tradicional
  const traditionalMessages = getDialogflowConversation();
  console.log('🔧 Método tradicional:', traditionalMessages);
  console.log('📊 Total tradicional:', traditionalMessages.length);
  
  // Información de debugging detallada
  const dfMessenger = document.querySelector('df-messenger');
  console.log('🤖 df-messenger encontrado:', !!dfMessenger);
  
  if (dfMessenger && dfMessenger.shadowRoot) {
    const chat = dfMessenger.shadowRoot.querySelector('df-messenger-chat');
    console.log('💬 df-messenger-chat encontrado:', !!chat);
    
    if (chat && chat.shadowRoot) {
      const allElements = chat.shadowRoot.querySelectorAll('*');
      console.log('🔢 Total elementos en chat:', allElements.length);
      
      // Buscar elementos con texto relevante
      const textElements = Array.from(allElements).filter(el => {
        const text = el.textContent?.trim();
        return text && text.length > 10 && !el.querySelector('*');
      });
      
      console.log('📝 Elementos con texto relevante:', textElements.length);
      
      textElements.slice(0, 5).forEach((el, idx) => {
        console.log(`📄 Elemento ${idx}:`, {
          tag: el.tagName,
          classes: el.className,
          text: el.textContent?.trim().substring(0, 100) + '...'
        });
      });
    }
  }
  
  const finalMessages = traditionalMessages.length > 0 ? traditionalMessages : (window.conversationHistory || []);
  console.log('🎯 Mensajes finales para usar:', finalMessages.length);
  
  return finalMessages;
}

// Función de utilidad para el botón en el HTML (mantener compatibilidad)
function guardarConversacion() {
  showSaveConversationModal();
}

// FUNCIONES DE NAVEGACIÓN
function showSection(sectionName) {
  const sections = document.querySelectorAll('main section');
  sections.forEach(section => section.classList.remove('active'));
  
  const target = document.getElementById(sectionName);
  if (target) target.classList.add('active');
  
  // Cargar contenido si aplica
  if (sectionName === 'historial') {
    loadHistorial();
  } else if (sectionName === 'perfil') {
    loadProfile();
  }
}

// FUNCIONES DE HISTORIAL
async function loadHistorial() {
  const historialContent = document.getElementById('historialContent');
  if (!historialContent) return;
  
  try {
    let conversations = [];
    if (currentUser && supabase) {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, title, content, messages, created_at')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      conversations = data || [];
    } else {
      // Anónimo: de memoria
      conversations = sessionConversations
        .slice() // copiar
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    displayHistorial(conversations, historialContent);
  } catch (error) {
    console.error('Error cargando historial:', error);
    historialContent.innerHTML = '<p>Error cargando el historial</p>';
  }
}

function displayHistorial(conversations, container) {
  if (!conversations.length) {
    container.innerHTML = `
      <div style="text-align: center; color: #666; padding: 2rem;">
        <i class="fas fa-comments" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
        <p>No hay conversaciones guardadas aún.</p>
        <p>¡Inicia una consulta clínica y guárdala!</p>
      </div>
    `;
    return;
  }
  
  let html = '';
  if (!currentUser) {
    html += `
      <div style="background: #fff3cd; color: #856404; padding: 1rem; border-radius: 5px; margin-bottom: 1rem;">
        <i class="fas fa-exclamation-triangle"></i>
        <strong>Nota:</strong> Estas conversaciones son temporales. Inicia sesión para guardar permanentemente.
      </div>
    `;
  }
  html += `
    <div style="text-align: right; margin-bottom: 1rem;">
      <button class="clear-history-btn" onclick="clearHistory()">
        <i class="fas fa-trash"></i> Limpiar Historial
      </button>
    </div>
  `;
  
  conversations.forEach(conv => {
    const msgs = Array.isArray(conv.messages) ? conv.messages : [];
    const createdDate = new Date(conv.created_at).toLocaleDateString('es-CL', { dateStyle: 'short' });
    const createdTime = new Date(conv.created_at).toLocaleTimeString('es-CL', { timeStyle: 'short' });
    
    html += `
      <div class="history-item">
        <div class="history-header">
          <h3>${conv.title}</h3>
          <div class="history-meta">
            <span class="history-date">${createdDate} ${createdTime}</span>
            <button class="delete-conversation-btn" onclick="deleteConversation(${conv.id})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="history-messages">
    `;
    if (msgs.length) {
      msgs.forEach(message => {
        const clase = message.sender === 'user' ? 'bot' : 'user';
        const autor = message.sender === 'user' ? '🤖 PSIQUIA' : '👤 Tú';
        html += `
          <div class="message ${clase}">
            <div class="message-author">${autor}</div>
            <div>${message.text}</div>
          </div>
        `;
      });
    } else {
      html += `<pre style="white-space: pre-wrap;">${conv.content}</pre>`;
    }
    html += `
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

async function deleteConversation(conversationId) {
  if (!confirm('¿Estás seguro de que quieres eliminar esta conversación?')) return;
  try {
    if (currentUser && supabase) {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', currentUser.id);
      if (error) throw error;
    } else {
      sessionConversations = sessionConversations.filter(c => c.id !== conversationId);
    }
    loadHistorial();
  } catch (error) {
    console.error('Error eliminando conversación:', error);
    alert('Error al eliminar la conversación');
  }
}

async function clearHistory() {
  if (!confirm('¿Estás seguro de que quieres limpiar todo el historial?')) return;
  if (currentUser && supabase) {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('user_id', currentUser.id);
      if (error) throw error;
    } catch (error) {
      console.error('Error eliminando historial:', error);
    }
  } else {
    sessionConversations = [];
  }
  loadHistorial();
}


// FUNCIÓN DE PERFIL
function loadProfile() {
  const profileContent = document.getElementById('profileContent');
  if (!profileContent) return;
  
  if (currentUser) {
    const userName = currentUser.user_metadata?.full_name || 'Usuario';
    const fechaReg = currentUser.created_at 
      ? new Date(currentUser.created_at).toLocaleDateString('es-CL', { dateStyle: 'short' })
      : '';
    profileContent.innerHTML = `
      <div class="auth-form">
        <h3>Información Personal</h3>
        <div class="form-group">
          <label>Nombre:</label>
          <input type="text" value="${userName}" readonly>
        </div>
        <div class="form-group">
          <label>Email:</label>
          <input type="email" value="${currentUser.email}" readonly>
        </div>
        <div class="form-group">
          <label>Tipo de Usuario:</label>
          <input type="text" value="Usuario Registrado" readonly>
        </div>
        ${fechaReg ? `
        <div class="form-group">
          <label>Fecha de Registro:</label>
          <input type="text" value="${fechaReg}" readonly>
        </div>` : ''}
        <button class="form-btn" onclick="logout()" style="background-color: #d32f2f;">
          <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
        </button>
      </div>
    `;
  } else {
    profileContent.innerHTML = `
      <div style="text-align: center; color: #666; padding: 2rem;">
        <i class="fas fa-user-slash" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
        <p>No has iniciado sesión.</p>
        <p>Inicia sesión para ver tu perfil y guardar tu historial permanentemente.</p>
        <button class="form-btn" onclick="toggleAuth()" style="margin-top: 1rem;">
          <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
        </button>
      </div>
    `;
  }
}


function toggleChat() {
  const chatContainer = document.getElementById("chatContainer");
  chatContainer.classList.toggle("open");
}
