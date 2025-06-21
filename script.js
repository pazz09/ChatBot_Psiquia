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
let sessionDiagnostics = []; // Para usuarios anónimos

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

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
  sessionDiagnostics = [];
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
    userWelcome.innerHTML = `<p style="color: #005f73; font-weight: bold;">¡Hola Dr./Dra. ${userName}! Como profesional de la salud mental, tu diagnóstico ayuda a mejorar nuestro sistema.</p>`;
  } else {
    userStatus.textContent = 'Usuario Anónimo';
    authBtn.textContent = 'Iniciar Sesión';
    authBtn.onclick = toggleAuth;
    userWelcome.innerHTML = `<p style="color: #0a9396;">Navegando como usuario anónimo. <a href="#" onclick="toggleAuth()" style="color: #005f73; text-decoration: underline;">Inicia sesión</a> para contribuir permanentemente al desarrollo del sistema con tus diagnósticos profesionales.</p>`;
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
  
  addProfessionalDiagnosisButton();
}

function closeChat() {
  const chatContainer = document.getElementById('chatContainer');
  const mainContent = document.getElementById('mainContent');
  
  chatContainer.classList.remove('open');
  mainContent.classList.remove('chat-open');
}

function addProfessionalDiagnosisButton() {
  if (document.getElementById('professionalDiagnosisBtn')) {
    return;
  }
  
  const chatContainer = document.getElementById('chatContainer');
  const diagnosisBtn = document.createElement('button');
  diagnosisBtn.id = 'professionalDiagnosisBtn';
  diagnosisBtn.className = 'professional-diagnosis-btn';
  diagnosisBtn.innerHTML = '<i class="fas fa-stethoscope"></i> Ingresar Diagnóstico Profesional';
  diagnosisBtn.onclick = showProfessionalDiagnosisModal;
  
  chatContainer.appendChild(diagnosisBtn);
}

function showProfessionalDiagnosisModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content professional-modal">
      <h3><i class="fas fa-user-md"></i> Diagnóstico Profesional</h3>
      <p class="modal-subtitle">Como profesional de la salud mental, tu diagnóstico es fundamental para mejorar nuestro sistema de asistencia clínica.</p>
      
      <div class="form-group">
        <label for="patientCase">Título del Caso:</label>
        <input type="text" id="patientCase" placeholder="Ej: Paciente 25 años - Episodio depresivo mayor" maxlength="255">
      </div>
      
      <div class="form-group">
        <label for="chatbotFeedback">¿Qué te sugirió el chatbot PSIQUIA?</label>
        <textarea id="chatbotFeedback" rows="4" 
          placeholder="Resumen de las sugerencias que te dio el chatbot durante la consulta..."></textarea>
      </div>
      
      <div class="form-group">
        <label for="professionalDiagnosis">Tu Diagnóstico Profesional Final:</label>
        <textarea id="professionalDiagnosis" rows="6" 
          placeholder="Como profesional de la salud mental, basándote en tu experiencia y la consulta realizada, proporciona tu diagnóstico final:

• Diagnóstico principal (DSM-5/CIE-11)
• Diagnósticos diferenciales considerados
• Severidad y especificadores
• Recomendaciones de tratamiento
• Observaciones clínicas relevantes

Tu criterio profesional es el estándar de oro que nos ayuda a mejorar."></textarea>
      </div>
      
      <div class="form-group">
        <label for="chatbotAccuracy">Evaluación del Chatbot:</label>
        <select id="chatbotAccuracy">
          <option value="">Selecciona una opción</option>
          <option value="muy_acertado">Muy acertado - Coincidió con mi diagnóstico</option>
          <option value="parcialmente_acertado">Parcialmente acertado - Algunas sugerencias útiles</option>
          <option value="poco_acertado">Poco acertado - Requiere mejoras significativas</option>
          <option value="no_acertado">No acertado - Diagnóstico incorrecto</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="improvements">Sugerencias para mejorar el chatbot:</label>
        <textarea id="improvements" rows="3" 
          placeholder="¿Qué aspectos debería mejorar el chatbot? ¿Qué preguntas adicionales debería hacer? ¿Qué información faltó?"></textarea>
      </div>
      
      <div class="modal-buttons">
        <button class="form-btn professional-btn" onclick="saveProfessionalDiagnosis()">
          <i class="fas fa-save"></i> Guardar Diagnóstico Profesional
        </button>
        <button class="form-btn secondary" onclick="closeDiagnosisModal()">
          Cancelar
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.getElementById('patientCase').focus();
  
  // Cerrar modal al hacer clic fuera
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeDiagnosisModal();
    }
  });
}

function closeDiagnosisModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) modal.remove();
}

async function saveProfessionalDiagnosis() {
  const patientCase = document.getElementById('patientCase').value.trim();
  const chatbotFeedback = document.getElementById('chatbotFeedback').value.trim();
  const professionalDiagnosis = document.getElementById('professionalDiagnosis').value.trim();
  const chatbotAccuracy = document.getElementById('chatbotAccuracy').value;
  const improvements = document.getElementById('improvements').value.trim();
  
  if (!patientCase) {
    alert('Por favor ingresa un título para el caso');
    return;
  }
  
  if (!professionalDiagnosis) {
    alert('Por favor ingresa tu diagnóstico profesional');
    return;
  }

  try {
    const diagnosticData = {
      case_title: patientCase,
      chatbot_suggestions: chatbotFeedback,
      professional_diagnosis: professionalDiagnosis,
      chatbot_accuracy: chatbotAccuracy,
      improvement_suggestions: improvements,
      created_at: new Date().toISOString()
    };

    console.log('💾 Guardando diagnóstico profesional:', diagnosticData);

    // Guardar según el tipo de usuario
    if (currentUser && supabase) {
      // Usuario registrado - guardar en Supabase
      const insertObj = {
        ...diagnosticData,
        user_id: currentUser.id,
        professional_name: currentUser.user_metadata?.full_name || currentUser.email
      };

      const { data, error } = await supabase
        .from('professional_diagnostics')
        .insert([insertObj])
        .select();

      if (error) {
        console.error('❌ Error de Supabase:', error);
        throw error;
      }

      console.log('✅ Diagnóstico guardado en Supabase:', data);
      alert('¡Diagnóstico profesional guardado exitosamente!\n\nGracias por contribuir al mejoramiento de nuestro sistema clínico.');
      
    } else {
      // Usuario anónimo - guardar en memoria de la sesión
      const newDiagnostic = {
        id: Date.now(),
        ...diagnosticData,
        professional_name: 'Profesional Anónimo'
      };
      
      sessionDiagnostics.push(newDiagnostic);
      console.log('✅ Diagnóstico guardado en memoria:', newDiagnostic);
      alert('Diagnóstico guardado temporalmente (solo para esta sesión).\n\n¡Inicia sesión para contribuir permanentemente al desarrollo del sistema!');
    }

    // Cerrar modal y actualizar historial si está activo
    closeDiagnosisModal();
    
    const activeSection = document.querySelector('section.active')?.id;
    if (activeSection === 'historial') {
      loadHistorial();
    }

  } catch (error) {
    console.error('❌ Error guardando diagnóstico:', error);
    alert('Error al guardar el diagnóstico: ' + (error.message || 'Error desconocido'));
  }
}

// Función de utilidad para el botón en el HTML (mantener compatibilidad)
function guardarConversacion() {
  showProfessionalDiagnosisModal();
}

// FUNCIONES DE NAVEGACIÓN
function showSection(sectionName) {
  const sections = document.querySelectorAll('main section');
  sections.forEach(section => section.classList.remove('active'));
  
  const target = document.getElementById(sectionName);
  if (target) target.classList.add('active');
  
  // Cargar contenido específico según la sección
  if (sectionName === 'historial') {
    loadHistorial();
  } else if (sectionName === 'perfil') {
    loadProfile();
  }
}

// FUNCIONES DE HISTORIAL DE PACIENTES (DIAGNÓSTICOS PROFESIONALES)
async function loadHistorial() {
  const historialContent = document.getElementById('historialContent');
  if (!historialContent) return;
  
  historialContent.innerHTML = '<div class="loading">Cargando historial...</div>';
  
  try {
    let diagnostics = [];
    if (currentUser && supabase) {
      // Usuario registrado - cargar desde Supabase
      const { data, error } = await supabase
        .from('professional_diagnostics')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      diagnostics = data || [];
    } else {
      // Usuario anónimo - cargar desde memoria de sesión
      diagnostics = sessionDiagnostics
        .slice() // crear copia
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    displayHistorial(diagnostics, historialContent);
  } catch (error) {
    console.error('Error cargando historial:', error);
    historialContent.innerHTML = '<p style="color: #d32f2f; text-align: center;">Error cargando el historial de pacientes</p>';
  }
}

function displayHistorial(diagnostics, container) {
  if (!diagnostics.length) {
    container.innerHTML = `
      <div style="text-align: center; color: #666; padding: 3rem;">
        <i class="fas fa-clipboard-list" style="font-size: 4rem; margin-bottom: 1.5rem; opacity: 0.3;"></i>
        <h3 style="margin-bottom: 1rem;">No hay casos registrados</h3>
        <p style="margin-bottom: 2rem;">
          No has registrado ningún diagnóstico profesional aún.<br>
          ¡Realiza una consulta con el chatbot e ingresa tu primer caso clínico!
        </p>
        <button class="form-btn" onclick="openChat()" style="margin-top: 1rem;">
          <i class="fas fa-plus"></i> Registrar Primer Caso
        </button>
      </div>
    `;
    return;
  }
  
  let html = '';
  
  // Mensaje informativo según tipo de usuario
  if (!currentUser) {
    html += `
      <div style="background: #fff3cd; color: #856404; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; border-left: 4px solid #ffc107;">
        <i class="fas fa-exclamation-triangle"></i>
        <strong>Historial Temporal:</strong> Como usuario anónimo, estos casos solo se mantienen durante la sesión actual. 
        <a href="#" onclick="toggleAuth()" style="color: #856404; text-decoration: underline;">
          Inicia sesión
        </a> para mantener un historial permanente.
      </div>
    `;
  } else {
    html += `
      <div style="background: #d1ecf1; color: #0c5460; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; border-left: 4px solid #17a2b8;">
        <i class="fas fa-database"></i>
        <strong>Historial Permanente:</strong> Como profesional registrado, todos tus casos se guardan de forma segura. 
        Tienes <strong>${diagnostics.length}</strong> caso${diagnostics.length !== 1 ? 's' : ''} registrado${diagnostics.length !== 1 ? 's' : ''}.
      </div>
    `;
  }
  
  // Controles del historial
  html += `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h3 style="margin: 0; color: #2c3e50;">
        <i class="fas fa-history"></i> Historial de Casos Clínicos
      </h3>
      <div>
        <button class="form-btn" onclick="openChat()" style="background-color: #28a745; margin-right: 1rem;">
          <i class="fas fa-plus"></i> Nuevo Caso
        </button>
        <button class="clear-history-btn" onclick="clearHistorial()" style="background-color: #dc3545; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
          <i class="fas fa-trash"></i> Limpiar Historial
        </button>
      </div>
    </div>
  `;
  
  // Lista de diagnósticos
  diagnostics.forEach((diag, index) => {
    const createdDate = new Date(diag.created_at).toLocaleDateString('es-CL', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const createdTime = new Date(diag.created_at).toLocaleTimeString('es-CL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    // Etiquetas de precisión del chatbot
    const accuracyLabels = {
      'muy_acertado': { icon: '✅', text: 'Muy acertado', color: '#28a745' },
      'parcialmente_acertado': { icon: '🟡', text: 'Parcialmente acertado', color: '#ffc107' },
      'poco_acertado': { icon: '🟠', text: 'Poco acertado', color: '#fd7e14' },
      'no_acertado': { icon: '❌', text: 'No acertado', color: '#dc3545' }
    };
    
    const accuracy = accuracyLabels[diag.chatbot_accuracy] || { icon: '⚪', text: 'Sin evaluar', color: '#6c757d' };
    
    html += `
      <div class="historial-item" style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 1.5rem; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        
        <!-- Header del caso -->
        <div style="background: #f8f9fa; padding: 1rem; border-bottom: 1px solid #e0e0e0;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="flex: 1;">
              <h4 style="margin: 0 0 0.5rem 0; color: #2c3e50; font-size: 1.1rem;">
                <i class="fas fa-clipboard-check" style="color: #17a2b8;"></i>
                Caso #${diagnostics.length - index}: ${diag.case_title}
              </h4>
              <div style="font-size: 0.9rem; color: #6c757d;">
                <i class="fas fa-calendar"></i> ${createdDate} a las ${createdTime}
                <span style="margin-left: 1rem;">
                  <i class="fas fa-user-md"></i> ${diag.professional_name || 'Profesional Anónimo'}
                </span>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 1rem;">
              <span style="background: ${accuracy.color}; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: bold;">
                ${accuracy.icon} ${accuracy.text}
              </span>
              <button onclick="deleteHistorialItem(${diag.id})" style="background: #dc3545; color: white; border: none; padding: 0.5rem; border-radius: 4px; cursor: pointer;">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Contenido del caso -->
        <div style="padding: 1.5rem;">
          
          ${diag.chatbot_suggestions ? `
          <div style="margin-bottom: 1.5rem;">
            <h5 style="color: #17a2b8; margin-bottom: 0.5rem; border-bottom: 2px solid #17a2b8; padding-bottom: 0.25rem; display: inline-block;">
              <i class="fas fa-robot"></i> Sugerencias del Chatbot PSIQUIA
            </h5>
            <div style="background: #e3f2fd; padding: 1rem; border-radius: 6px; border-left: 4px solid #2196f3;">
              <p style="margin: 0; line-height: 1.6;">${diag.chatbot_suggestions}</p>
            </div>
          </div>
          ` : ''}
          
          <div style="margin-bottom: 1.5rem;">
            <h5 style="color: #28a745; margin-bottom: 0.5rem; border-bottom: 2px solid #28a745; padding-bottom: 0.25rem; display: inline-block;">
              <i class="fas fa-user-md"></i> Diagnóstico Profesional Final
            </h5>
            <div style="background: #f8fff9; padding: 1rem; border-radius: 6px; border-left: 4px solid #28a745;">
              <pre style="white-space: pre-wrap; font-family: inherit; margin: 0; line-height: 1.6;">${diag.professional_diagnosis}</pre>
            </div>
          </div>
          
          ${diag.improvement_suggestions ? `
          <div style="margin-bottom: 1rem;">
            <h5 style="color: #ffc107; margin-bottom: 0.5rem; border-bottom: 2px solid #ffc107; padding-bottom: 0.25rem; display: inline-block;">
              <i class="fas fa-lightbulb"></i> Sugerencias de Mejora
            </h5>
            <div style="background: #fffbf0; padding: 1rem; border-radius: 6px; border-left: 4px solid #ffc107;">
              <p style="margin: 0; line-height: 1.6;">${diag.improvement_suggestions}</p>
            </div>
          </div>
          ` : ''}
          
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

async function deleteHistorialItem(diagnosticId) {
  if (!confirm('¿Estás seguro de que quieres eliminar este caso del historial?')) return;
  
  try {
    if (currentUser && supabase) {
      const { error } = await supabase
        .from('professional_diagnostics')
        .delete()
        .eq('id', diagnosticId)
        .eq('user_id', currentUser.id);
      
      if (error) throw error;
    } else {
      sessionDiagnostics = sessionDiagnostics.filter(d => d.id !== diagnosticId);
    }
    
    // Recargar historial
    loadHistorial();
    
  } catch (error) {
    console.error('Error eliminando caso del historial:', error);
    alert('Error al eliminar el caso del historial');
  }
}

async function clearHistorial() {
  const count = currentUser && supabase 
    ? (await supabase.from('professional_diagnostics').select('id', { count: 'exact' }).eq('user_id', currentUser.id)).count || 0
    : sessionDiagnostics.length;
    
  if (!confirm(`¿Estás seguro de que quieres eliminar todos los ${count} casos del historial?\n\nEsta acción no se puede deshacer.`)) return;
  
  try {
    if (currentUser && supabase) {
      const { error } = await supabase
        .from('professional_diagnostics')
        .delete()
        .eq('user_id', currentUser.id);
      
      if (error) throw error;
    } else {
      sessionDiagnostics = [];
    }
    
    // Recargar historial
    loadHistorial();
    
  } catch (error) {
    console.error('Error limpiando historial:', error);
    alert('Error al limpiar el historial');
  }
}

// FUNCIÓN DE PERFIL 
function loadProfile() {
  const profileContent = document.getElementById('profileContent');
  if (!profileContent) return;
  
  if (currentUser) {
    const userName = currentUser.user_metadata?.full_name || 'Usuario';
    const fechaReg = currentUser.created_at 
      ? new Date(currentUser.created_at).toLocaleDateString('es-CL', { dateStyle: 'long' })
      : '';
    profileContent.innerHTML = `
      <div class="auth-form">
        <h3><i class="fas fa-user-md"></i> Información Profesional</h3>
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
          <input type="text" value="Profesional Registrado" readonly>
        </div>
        ${fechaReg ? `
        <div class="form-group">
          <label>Fecha de Registro:</label>
          <input type="text" value="${fechaReg}" readonly>
        </div>` : ''}
        
        <div style="background: #e8f5e8; padding: 1rem; border-radius: 5px; margin: 1rem 0;">
          <h4 style="color: #2e7d32; margin: 0 0 0.5rem 0;">
            <i class="fas fa-heart"></i> Contribución al Sistema
          </h4>
          <p style="margin: 0; color: #2e7d32;">
            Como profesional registrado, tus diagnósticos contribuyen permanentemente 
            al desarrollo y mejora de nuestro sistema de asistencia clínica.
          </p>
        </div>
        
        <button class="form-btn" onclick="logout()" style="background-color: #d32f2f;">
          <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
        </button>
      </div>
    `;
  } else {
    // Perfil para usuarios anónimos
    profileContent.innerHTML = `
      <div style="text-align: center; color: #666; padding: 2rem;">
        <i class="fas fa-user-slash" style="font-size: 4rem; margin-bottom: 1.5rem; opacity: 0.3;"></i>
        <h3 style="margin-bottom: 1rem;">Usuario Anónimo</h3>
        <p style="margin-bottom: 2rem; line-height: 1.6;">
          Estás navegando como usuario anónimo. Tus diagnósticos se guardan 
          temporalmente solo durante esta sesión.
        </p>
        
        <div style="background: #fff3cd; color: #856404; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; border-left: 4px solid #ffc107;">
          <h4 style="color: #856404; margin: 0 0 1rem 0;">
            <i class="fas fa-star"></i> Beneficios de Registrarse
          </h4>
          <ul style="text-align: left; margin: 0; padding-left: 1.5rem;">
            <li>Historial permanente de casos clínicos</li>
            <li>Contribución al desarrollo del sistema</li>
            <li>Acceso a estadísticas personales</li>
            <li>Sincronización entre dispositivos</li>
            <li>Respaldo seguro de información</li>
          </ul>
        </div>
        
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          <button class="form-btn" onclick="toggleAuth()" style="background-color: #28a745;">
            <i class="fas fa-user-plus"></i> Crear Cuenta
          </button>
          <button class="form-btn" onclick="toggleAuth()" style="background-color: #17a2b8;">
            <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
          </button>
        </div>
      </div>
    `;
  }
}

// FUNCIONES DE ESTADÍSTICAS Y REPORTES
async function getStatistics() {
  try {
    let diagnostics = [];
    
    if (currentUser && supabase) {
      const { data, error } = await supabase
        .from('professional_diagnostics')
        .select('*')
        .eq('user_id', currentUser.id);
      
      if (error) throw error;
      diagnostics = data || [];
    } else {
      diagnostics = sessionDiagnostics;
    }
    
    const stats = {
      totalCases: diagnostics.length,
      accuracyStats: {
        muy_acertado: diagnostics.filter(d => d.chatbot_accuracy === 'muy_acertado').length,
        parcialmente_acertado: diagnostics.filter(d => d.chatbot_accuracy === 'parcialmente_acertado').length,
        poco_acertado: diagnostics.filter(d => d.chatbot_accuracy === 'poco_acertado').length,
        no_acertado: diagnostics.filter(d => d.chatbot_accuracy === 'no_acertado').length,
        sin_evaluar: diagnostics.filter(d => !d.chatbot_accuracy).length
      },
      recentCases: diagnostics
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
    };
    
    return stats;
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return null;
  }
}

// FUNCIÓN PARA EXPORTAR DATOS
async function exportData() {
  try {
    let diagnostics = [];
    
    if (currentUser && supabase) {
      const { data, error } = await supabase
        .from('professional_diagnostics')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      diagnostics = data || [];
    } else {
      diagnostics = sessionDiagnostics;
    }
    
    if (!diagnostics.length) {
      alert('No hay datos para exportar');
      return;
    }
    
    // Convertir a CSV
    const headers = [
      'Título del Caso',
      'Sugerencias del Chatbot',
      'Diagnóstico Profesional',
      'Evaluación del Chatbot',
      'Sugerencias de Mejora',
      'Fecha de Creación',
      'Profesional'
    ];
    
    let csvContent = headers.join(',') + '\n';
    
    diagnostics.forEach(diag => {
      const row = [
        `"${diag.case_title || ''}"`,
        `"${(diag.chatbot_suggestions || '').replace(/"/g, '""')}"`,
        `"${(diag.professional_diagnosis || '').replace(/"/g, '""')}"`,
        `"${diag.chatbot_accuracy || 'Sin evaluar'}"`,
        `"${(diag.improvement_suggestions || '').replace(/"/g, '""')}"`,
        `"${new Date(diag.created_at).toLocaleString('es-CL')}"`,
        `"${diag.professional_name || 'Profesional Anónimo'}"`
      ];
      csvContent += row.join(',') + '\n';
    });
    
    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historial_casos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
  } catch (error) {
    console.error('Error exportando datos:', error);
    alert('Error al exportar los datos');
  }
}

// FUNCIÓN PARA MOSTRAR ESTADÍSTICAS EN EL HISTORIAL
async function showStatistics() {
  const stats = await getStatistics();
  if (!stats) return;
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  
  const totalEvaluated = stats.accuracyStats.muy_acertado + 
                        stats.accuracyStats.parcialmente_acertado + 
                        stats.accuracyStats.poco_acertado + 
                        stats.accuracyStats.no_acertado;
  
  const accuracyPercentage = totalEvaluated > 0 
    ? Math.round((stats.accuracyStats.muy_acertado / totalEvaluated) * 100)
    : 0;
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <h3><i class="fas fa-chart-bar"></i> Estadísticas de Casos</h3>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 2rem 0;">
        
        <div style="background: #e3f2fd; padding: 1.5rem; border-radius: 8px; text-align: center;">
          <div style="font-size: 2rem; font-weight: bold; color: #1976d2;">${stats.totalCases}</div>
          <div style="color: #1976d2; font-weight: bold;">Casos Totales</div>
        </div>
        
        <div style="background: #e8f5e8; padding: 1.5rem; border-radius: 8px; text-align: center;">
          <div style="font-size: 2rem; font-weight: bold; color: #2e7d32;">${accuracyPercentage}%</div>
          <div style="color: #2e7d32; font-weight: bold;">Precisión Alta</div>
        </div>
        
      </div>
      
      <h4 style="color: #2c3e50; margin: 2rem 0 1rem 0;">Evaluación del Chatbot</h4>
      <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px;">
        <div style="margin-bottom: 1rem;">
          <span style="color: #28a745;">✅ Muy acertado:</span> 
          <strong>${stats.accuracyStats.muy_acertado}</strong> casos
        </div>
        <div style="margin-bottom: 1rem;">
          <span style="color: #ffc107;">🟡 Parcialmente acertado:</span> 
          <strong>${stats.accuracyStats.parcialmente_acertado}</strong> casos
        </div>
        <div style="margin-bottom: 1rem;">
          <span style="color: #fd7e14;">🟠 Poco acertado:</span> 
          <strong>${stats.accuracyStats.poco_acertado}</strong> casos
        </div>
        <div style="margin-bottom: 1rem;">
          <span style="color: #dc3545;">❌ No acertado:</span> 
          <strong>${stats.accuracyStats.no_acertado}</strong> casos
        </div>
        <div>
          <span style="color: #6c757d;">⚪ Sin evaluar:</span> 
          <strong>${stats.accuracyStats.sin_evaluar}</strong> casos
        </div>
      </div>
      
      <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: center;">
        <button class="form-btn" onclick="exportData()" style="background-color: #28a745;">
          <i class="fas fa-download"></i> Exportar Datos
        </button>
        <button class="form-btn secondary" onclick="closeModal()">
          Cerrar
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Cerrar modal al hacer clic fuera
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeModal();
    }
  });
}

function closeModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) modal.remove();
}

// FUNCIONES DE UTILIDAD ADICIONALES
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// EVENTOS DEL TECLADO
document.addEventListener('keydown', function(e) {
  // Cerrar modales con ESC
  if (e.key === 'Escape') {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
  }
  
  // Enviar formularios con Ctrl+Enter
  if (e.ctrlKey && e.key === 'Enter') {
    if (document.querySelector('.modal-overlay')) {
      const saveBtn = document.querySelector('.professional-btn');
      if (saveBtn) saveBtn.click();
    }
  }
});

// INICIALIZACIÓN DE EVENTOS
document.addEventListener('DOMContentLoaded', function() {
  // Agregar botón de estadísticas al historial cuando se cargue
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.target.id === 'historialContent' && mutation.target.innerHTML.includes('Historial de Casos')) {
        addStatisticsButton();
      }
    });
  });
  
  const historialContent = document.getElementById('historialContent');
  if (historialContent) {
    observer.observe(historialContent, { childList: true, subtree: true });
  }
});

function addStatisticsButton() {
  // Evitar duplicar el botón
  if (document.getElementById('statisticsBtn')) return;
  
  const clearBtn = document.querySelector('.clear-history-btn');
  if (clearBtn && clearBtn.parentNode) {
    const statsBtn = document.createElement('button');
    statsBtn.id = 'statisticsBtn';
    statsBtn.className = 'form-btn';
    statsBtn.style.cssText = 'background-color: #17a2b8; color: white; margin-right: 1rem;';
    statsBtn.innerHTML = '<i class="fas fa-chart-bar"></i> Estadísticas';
    statsBtn.onclick = showStatistics;
    
    clearBtn.parentNode.insertBefore(statsBtn, clearBtn);
  }
}

console.log('✅ Sistema de diagnósticos profesionales cargado completamente');