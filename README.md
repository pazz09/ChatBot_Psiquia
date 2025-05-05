# PsiquIA - Asistente Virtual para Psicólogos

PsiquIA es un chatbot clínico diseñado para asistir a psicólogos en la detección preliminar de trastornos mentales. A través del uso de procesamiento de lenguaje natural (PLN), una interfaz web interactiva y una base de datos basada en criterios del DSM-V, PsiquIA permite establecer un diálogo estructurado con el profesional, procesar sus respuestas, entregar sugerencias diagnósticas y posibles líneas de intervención.

## 📋 Características principales

- Identificación de síntomas mediante procesamiento de lenguaje natural
- Sugerencias diagnósticas basadas en criterios del DSM-V
- Recomendaciones de metodologías terapéuticas personalizadas
- Interfaz conversacional intuitiva

## 🚀 Guía de instalación y uso

### Requisitos previos

- Un navegador web moderno (Chrome, Firefox, Edge, Safari)
- Conexión a internet

### Pasos para ejecutar el proyecto

1. **Clonar el repositorio**
   ```
   git clone https://github.com/tu-usuario/ChatBot_Psiquia.git
   cd ChatBot_Psiquia
   ```

2. **Abrir el proyecto**
   - Abre el archivo `index.html` con Live Server
   - Si tienes Visual Studio Code, puedes usar la extensión "Live Server":
     - Instala la extensión Live Server desde el marketplace de VS Code
     - Haz clic derecho en el archivo `index.html`
     - Selecciona "Open with Live Server"

3. **Interactuar con el chatbot**
   - Una vez que la página esté cargada, verás el icono del chatbot en la esquina inferior derecha
   - Haz clic en el icono para abrir la ventana de chat

## 💬 Cómo interactuar con PsiquIA

### Iniciando la conversación

Para iniciar la conversación con el chatbot, utiliza saludos formales como:
- "Hola"
- "Buenos días"
- "Buenas tardes"
- "Buenas noches"

**Nota:** El chatbot está configurado para reconocer lenguaje formal. Expresiones informales como "ola", "wena", etc., pueden no ser reconocidas correctamente.

### Consultas sobre pacientes

Actualmente, PsiquIA está especializado en el tratamiento de depresión. Para consultar sobre un paciente, puedes usar expresiones como:

1. **Describir los síntomas del paciente:**
   ```
   "Mi paciente tiene pensamientos de inutilidad"
   "Mi paciente presenta estado de ánimo deprimido"
   "Mi paciente tiene dificultad para concentrarse"
   "..."
   ```

2. **Consultar por trastornos específicos:**
  Una vez consultas te puede entregar un diagnostico de dependiendo de lo que se trate.
Las respuestas serían:
   ```
   "De acuerdo a los síntomas descritos, se cumple con los criterios diagnósticos del Trastorno de Depresión Mayor según el DSM-5."
   "De acuerdo a los síntomas descritos, se concluye que el paciente cumple con los criterios diagnósticos del Trastorno de Pánico, según el DSM-5."
   ```
3. **Diagnosticos por trastornos específicos**
     Estas son más ejemplos para opciones de conversación para detectar los trastornos que reconoce el chatbot.

    Trastorno de Depresión Mayor (Criterio A)
   
    Para el diagnóstico, deben estar presentes cinco (o más) de los siguientes síntomas durante al menos dos semanas, y uno de los síntomas debe ser obligatoriamente el 1 o el 2:
    
    - Mi paciente tiene estado de ánimo deprimido la mayor parte del día, casi todos los días (se siente triste, vacío o sin esperanza; en niños y adolescentes puede presentarse como irritabilidad).
    - Mi paciente tiene una disminución importante del interés o placer por casi todas las actividades, la mayor parte del día, casi todos los días.
    - Mi paciente tiene una pérdida o aumento significativo de peso (más del 5% del peso corporal en un mes) o cambios en el apetito casi todos los días.
    - [...]
    
    Trastorno de Pánico (300.01 / F41.0)
    Mi paciente tiene:
    
    - Palpitaciones, golpeteo del corazón o aceleración de la frecuencia cardiaca.
    - Sudoración.
    - Temblor o sacudidas.
    - Sensación de dificultad para respirar o de asfixia.
    - Sensación de ahogo.
    - Dolor o molestias en el tórax.
    - Náuseas o malestar abdominal.
    - Sensación de mareo, inestabilidad, aturdimiento o desmayo.
    - Escalofríos o sensación de calor.
    - [...]

### Ejemplo de flujo de conversación

1. Usuario: "Buenos días"
2. PsiquIA: Hola, soy Psiquia, tu asistente clínico. ¿Qué síntomas estás observando en tu paciente?
3. Usuario: "Mi paciente tiene pensamientos de inutilidad"
4. PsiquIA: De acuerdo a los síntomas descritos, se cumple con los criterios diagnósticos del Trastorno de Depresión Mayor según el DSM-5.

## 📱 Interfaz y diseño

La interfaz web de PsiquIA presenta:
- Un encabezado con el título "Asistente Virtual para Psicólogos"
- Una sección informativa sobre cómo funciona el asistente
- El widget del chatbot en la esquina inferior derecha

## 🔍 Funcionalidades implementadas

- **Identificación de síntomas:** El sistema analiza la información proporcionada sobre el paciente y reconoce patrones de síntomas relevantes.
- **Sugerencia de posibles diagnósticos:** Basándose en los criterios del DSM-5, sugiere posibles diagnósticos diferenciales.
- **Recomendación de metodologías:** Propone intervenciones basadas en diversos enfoques terapéuticos según el perfil del paciente y diagnóstico preliminar.

## ⚠️ Limitaciones actuales

- Por ahora, el chatbot está principalmente orientado al tratamiento de depresión.
- No sustituye el juicio clínico profesional.
- Es una herramienta de apoyo, no de diagnóstico definitivo.

## 🛠️ Tecnologías utilizadas

- DialogFlow (Google) para la construcción del chatbot
- HTML5, CSS3 para la interfaz web
- JavaScript para la interactividad

## 👥 Equipo de desarrollo

- Antonia Navarrete
- Luciano Oliva
- Carlos Da Silva
- Felipe Bravo

**Nota:** PsiquIA es una herramienta de apoyo y no sustituye el juicio clínico profesional. Todas las sugerencias diagnósticas y terapéuticas deben ser evaluadas por un profesional de la salud mental calificado.
