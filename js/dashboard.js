// Conexión a Supabase
const SUPABASE_URL = "https://gsdsldjactyltkxwbdiw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZHNsZGphY3R5bHRreHdiZGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDUxNTcsImV4cCI6MjA3MDA4MTE1N30.1hLGHX44ipgsJDIpOPHM3mU3CgvC86VdJtFLyYGtlR0";
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


async function verificarSesion() {
  const { data: { session } } = await client.auth.getSession();
  if (!session) {
    showToast("Debes iniciar sesión", "error");
    window.location.href = "index.html";
    return;
  }
  cargarEstudiantes();
  listarArchivos();
}

// Agregar estudiante
async function agregarEstudiante() {
  const nombre = document.getElementById("nombre").value.trim();
  const correo = document.getElementById("correo").value.trim();
  const clase = document.getElementById("clase").value.trim();

  if (!nombre || !correo || !clase) return showToast("Completa todos los campos", "error");

  const { data: { user } } = await client.auth.getUser();

  const { error } = await client.from("estudiantes").insert([
    { nombre, correo, clase, user_id: user.id }
  ]);

  if (error) showToast(error.message, "error");
  else {
    showToast("Estudiante agregado", "success");
    cargarEstudiantes();
  }
}

// Actualizar estudiante
async function actualizarEstudiante(id) {
  const nuevoNombre = prompt("Nuevo nombre:");
  if (!nuevoNombre) return;

  const { error } = await client.from("estudiantes").update({ nombre: nuevoNombre }).eq("id", id);

  if (error) showToast(error.message, "error");
  else {
    showToast("Estudiante actualizado", "success");
    cargarEstudiantes();
  }
}

// Eliminar estudiante
async function eliminarEstudiante(id) {
  if (!confirm("¿Seguro que deseas eliminar este estudiante?")) return;

  const { error } = await client.from("estudiantes").delete().eq("id", id);

  if (error) showToast(error.message, "error");
  else {
    showToast("Estudiante eliminado", "success");
    cargarEstudiantes();
  }
}

// Cargar lista de estudiantes
async function cargarEstudiantes() {
  const { data, error } = await client.from("estudiantes").select("*").order("created_at", { ascending: false });

  const lista = document.getElementById("lista-estudiantes");
  lista.innerHTML = "";

  if (error) return showToast(error.message, "error");

  data.forEach(est => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${est.nombre} (${est.clase})
      <button onclick="actualizarEstudiante(${est.id})">✏️</button>
      <button onclick="eliminarEstudiante(${est.id})">🗑️</button>
    `;
    lista.appendChild(li);
  });
}

// Subir archivo
async function subirArchivo() {
  const archivo = document.getElementById("archivo").files[0];
  if (!archivo) return showToast("Selecciona un archivo", "error");

  const { data: { user } } = await client.auth.getUser();
  const ruta = `${user.id}/${archivo.name}`;

  const { error } = await client.storage.from("tareas").upload(ruta, archivo, { upsert: false });

  if (error) showToast(error.message, "error");
  else {
    showToast("Archivo subido", "success");
    listarArchivos();
  }
}

// Listar archivos
async function listarArchivos() {
  const { data: { user } } = await client.auth.getUser();
  const { data, error } = await client.storage.from("tareas").list(user.id);

  const lista = document.getElementById("lista-archivos");
  lista.innerHTML = "";

  if (error) return showToast(error.message, "error");

  data.forEach(file => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${file.name}
      <button onclick="eliminarArchivo('${file.name}')">🗑️</button>
    `;
    lista.appendChild(li);
  });
}

// Eliminar archivo
async function eliminarArchivo(nombre) {
  const { data: { user } } = await client.auth.getUser();
  const { error } = await client.storage.from("tareas").remove([`${user.id}/${nombre}`]);

  if (error) showToast(error.message, "error");
  else {
    showToast("Archivo eliminado", "success");
    listarArchivos();
  }
}

async function cerrarSesion() {
  await client.auth.signOut();
  window.location.href = "index.html";
}

verificarSesion();
