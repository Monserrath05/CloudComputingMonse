// Conexión a Supabase
const SUPABASE_URL = "https://gsdsldjactyltkxwbdiw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZHNsZGphY3R5bHRreHdiZGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDUxNTcsImV4cCI6MjA3MDA4MTE1N30.1hLGHX44ipgsJDIpOPHM3mU3CgvC86VdJtFLyYGtlR0";
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


async function verificarSesion() {
  const { data: { session } } = await client.auth.getSession();
  if (!session) {
    showToast("⚠️ Debes iniciar sesión.", "warning");
    window.location.href = "index.html";
    return;
  }
  cargarEstudiantes();
  listarArchivos();
}

// 📌 Agregar estudiante
async function agregarEstudiante() {
  const nombre = document.getElementById("nombre").value.trim();
  const correo = document.getElementById("correo").value.trim();
  const clase = document.getElementById("clase").value.trim();

  if (!nombre || !correo || !clase) {
    showToast("⚠️ Completa todos los campos.", "warning");
    return;
  }

  const { data: { user } } = await client.auth.getUser();

  const { error } = await client.from("estudiantes").insert([{ nombre, correo, clase, user_id: user.id }]);

  if (error) {
    showToast("❌ " + error.message, "error");
  } else {
    showToast("✅ Estudiante agregado.", "success");
    cargarEstudiantes();
  }
}

// 📌 Editar estudiante
async function editarEstudiante(id) {
  const nombre = prompt("Nuevo nombre:");
  const correo = prompt("Nuevo correo:");
  const clase = prompt("Nueva clase:");

  if (!nombre || !correo || !clase) return;

  const { error } = await client.from("estudiantes").update({ nombre, correo, clase }).eq("id", id);

  if (error) {
    showToast("❌ " + error.message, "error");
  } else {
    showToast("✅ Estudiante actualizado.", "success");
    cargarEstudiantes();
  }
}

// 📌 Eliminar estudiante
async function eliminarEstudiante(id) {
  if (!confirm("¿Eliminar estudiante?")) return;

  const { error } = await client.from("estudiantes").delete().eq("id", id);

  if (error) {
    showToast("❌ " + error.message, "error");
  } else {
    showToast("✅ Estudiante eliminado.", "success");
    cargarEstudiantes();
  }
}

// 📌 Cargar estudiantes
async function cargarEstudiantes() {
  const { data, error } = await client.from("estudiantes").select("*").order("created_at", { ascending: false });

  const lista = document.getElementById("lista-estudiantes");
  const select = document.getElementById("estudiante");
  lista.innerHTML = "";
  select.innerHTML = "<option value=''>Seleccione un estudiante</option>";

  if (error) return showToast("❌ " + error.message, "error");

  data.forEach(est => {
    const li = document.createElement("li");
    li.textContent = `${est.nombre} (${est.clase}) `;

    const btnEdit = document.createElement("button");
    btnEdit.textContent = "✏️";
    btnEdit.classList.add("btn-edit");
    btnEdit.addEventListener("click", () => editarEstudiante(est.id));

    const btnDel = document.createElement("button");
    btnDel.textContent = "🗑️";
    btnDel.classList.add("btn-del");
    btnDel.addEventListener("click", () => eliminarEstudiante(est.id));

    li.appendChild(btnEdit);
    li.appendChild(btnDel);
    lista.appendChild(li);

    const option = document.createElement("option");
    option.value = est.id;
    option.textContent = est.nombre;
    select.appendChild(option);
  });
}

// 📌 Subir archivo
async function subirArchivo() {
  const archivo = document.getElementById("archivo").files[0];
  const estudianteId = document.getElementById("estudiante").value;

  if (!archivo || !estudianteId) {
    showToast("⚠️ Selecciona estudiante y archivo.", "warning");
    return;
  }

  const { data: { user } } = await client.auth.getUser();
  const ruta = `${user.id}/${archivo.name}`;

  const { error } = await client.storage.from("tareas").upload(ruta, archivo, { upsert: false });

  if (error) {
    showToast("❌ " + error.message, "error");
  } else {
    showToast("✅ Archivo subido.", "success");
    listarArchivos();
  }
}

// 📌 Eliminar archivo
async function eliminarArchivo(nombre) {
  const { data: { user } } = await client.auth.getUser();
  const { error } = await client.storage.from("tareas").remove([`${user.id}/${nombre}`]);

  if (error) {
    showToast("❌ " + error.message, "error");
  } else {
    showToast("✅ Archivo eliminado.", "success");
    listarArchivos();
  }
}

// 📌 Listar archivos
async function listarArchivos() {
  const { data: { user } } = await client.auth.getUser();
  const { data, error } = await client.storage.from("tareas").list(user.id);

  const lista = document.getElementById("lista-archivos");
  lista.innerHTML = "";

  if (error) return showToast("❌ " + error.message, "error");

  data.forEach(archivo => {
    const li = document.createElement("li");
    li.textContent = archivo.name;

    const btnDel = document.createElement("button");
    btnDel.textContent = "🗑️";
    btnDel.classList.add("btn-del");
    btnDel.addEventListener("click", () => eliminarArchivo(archivo.name));

    li.appendChild(btnDel);
    lista.appendChild(li);
  });
}

// 📌 Notificaciones
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

async function cerrarSesion() {
  await client.auth.signOut();
  window.location.href = "index.html";
}

verificarSesion();
