const SUPABASE_URL = "https://gsdsldjactyltkxwbdiw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZHNsZGphY3R5bHRreHdiZGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDUxNTcsImV4cCI6MjA3MDA4MTE1N30.1hLGHX44ipgsJDIpOPHM3mU3CgvC86VdJtFLyYGtlR0";
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


// Mostrar notificaciones tipo toast automáticas
function mostrarToast(mensaje, tipo = "info", duracion = 3000) {
  const contenedor = document.getElementById("toast-container");
  if (!contenedor) return;

  const toast = document.createElement("div");
  toast.textContent = mensaje;
  toast.style.minWidth = "200px";
  toast.style.marginBottom = "10px";
  toast.style.padding = "10px 15px";
  toast.style.borderRadius = "6px";
  toast.style.color = "#fff";
  toast.style.fontWeight = "bold";
  toast.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
  toast.style.opacity = "1";
  toast.style.transition = "opacity 0.5s ease";

  switch (tipo) {
    case "error":
      toast.style.backgroundColor = "#e74c3c"; // rojo
      break;
    case "success":
      toast.style.backgroundColor = "#27ae60"; // verde
      break;
    case "info":
    default:
      toast.style.backgroundColor = "#3498db"; // azul
      break;
  }

  contenedor.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => contenedor.removeChild(toast), 500);
  }, duracion);
}

// Mostrar u ocultar formularios de login y registro
function toggleForms() {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  // Si login está visible, ocultarlo y mostrar registro, y viceversa
  if (loginForm.style.display === "none" || loginForm.style.display === "") {
    loginForm.style.display = "block";
    registerForm.style.display = "none";
  } else {
    loginForm.style.display = "none";
    registerForm.style.display = "block";
  }
}

// Registrar nuevo usuario
async function register() {
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value.trim();

  if (!email || !password) {
    mostrarToast("Por favor llena todos los campos", "error");
    return;
  }

  const { data, error } = await client.auth.signUp({ email, password });

  if (error) {
    mostrarToast("Error: " + error.message, "error");
  } else {
    mostrarToast("Registro exitoso. Revisa tu correo para verificar.", "success");
    toggleForms();
  }
}

// Iniciar sesión
async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    mostrarToast("Por favor llena todos los campos", "error");
    return;
  }

  const { data, error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    mostrarToast("Error: " + error.message, "error");
  } else {
    mostrarToast("Sesión iniciada correctamente", "success");
    localStorage.setItem("token", data.session.access_token);
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1200);
  }
}
