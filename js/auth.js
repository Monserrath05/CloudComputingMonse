const SUPABASE_URL = "https://gsdsldjactyltkxwbdiw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZHNsZGphY3R5bHRreHdiZGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDUxNTcsImV4cCI6MjA3MDA4MTE1N30.1hLGHX44ipgsJDIpOPHM3mU3CgvC86VdJtFLyYGtlR0";
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


function mostrarToast(mensaje, tipo = "info", duracion = 3000) {
  const contenedor = document.getElementById("toast-container");
  if (!contenedor) return; // Por si no existe

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

function toggleForms() {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  loginForm.style.display = loginForm.style.display === "none" ? "block" : "none";
  registerForm.style.display = registerForm.style.display === "none" ? "block" : "none";
}

async function register() {
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;

  const { data, error } = await client.auth.signUp({
    email,
    password,
  });

  if (error) {
    mostrarToast("Error: " + error.message, "error");
  } else {
    mostrarToast("Registro exitoso.", "success");
    toggleForms();
  }
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    mostrarToast("Error: " + error.message, "error");
  } else {
    mostrarToast("Sesión iniciada.", "success");
    localStorage.setItem("token", data.session.access_token);

    window.location.href = "dashboard.html";
  }
}
