const SUPABASE_URL = "https://gsdsldjactyltkxwbdiw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZHNsZGphY3R5bHRreHdiZGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDUxNTcsImV4cCI6MjA3MDA4MTE1N30.1hLGHX44ipgsJDIpOPHM3mU3CgvC86VdJtFLyYGtlR0";
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let idEnEdicion = null;

const btnAgregarActualizar = document.getElementById("btnAgregarActualizar");
btnAgregarActualizar.addEventListener("click", agregarOActualizarEstudiante);

async function agregarOActualizarEstudiante() {
  const nombre = document.getElementById("nombre").value.trim();
  const correo = document.getElementById("correo").value.trim();
  const clase = document.getElementById("clase").value.trim();

  if (!nombre || !correo || !clase) {
    mostrarToast("Por favor completa todos los campos.", "error");
    return;
  }

  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) {
    mostrarToast("No estás autenticado.", "error");
    return;
  }

  if (idEnEdicion) {
    // Actualizar estudiante
    const { error } = await client
      .from("estudiantes")
      .update({ nombre, correo, clase })
      .eq("id", idEnEdicion);

    if (error) {
      mostrarToast("Error al actualizar: " + error.message, "error");
    } else {
      mostrarToast("Estudiante actualizado", "success");
      idEnEdicion = null;
      btnAgregarActualizar.textContent = "Agregar";
      limpiarFormulario();
      cargarEstudiantes();
      cargarEstudiantesSelect();
    }
  } else {
    // Agregar estudiante
    const { error } = await client.from("estudiantes").insert({
      nombre,
      correo,
      clase,
      user_id: user.id,
    });

    if (error) {
      mostrarToast("Error al agregar: " + error.message, "error");
    } else {
      mostrarToast("Estudiante agregado", "success");
      limpiarFormulario();
      cargarEstudiantes();
      cargarEstudiantesSelect();
    }
  }
}

function limpiarFormulario() {
  document.getElementById("nombre").value = "";
  document.getElementById("correo").value = "";
  document.getElementById("clase").value = "";
}

async function cargarEstudiantes() {
  const { data, error } = await client
    .from("estudiantes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    mostrarToast("Error al cargar estudiantes: " + error.message, "error");
    return;
  }

  const lista = document.getElementById("lista-estudiantes");
  lista.innerHTML = "";

  data.forEach((est) => {
    const item = document.createElement("li");
    item.innerHTML = `
      ${est.nombre} (${est.clase})
      <div>
        <button onclick="editarEstudiante('${est.id}', '${escapeHTML(est.nombre)}', '${escapeHTML(est.correo)}', '${escapeHTML(est.clase)}')">✏</button>
        <button onclick="eliminarEstudiante('${est.id}')">🗑</button>
      </div>
    `;
    lista.appendChild(item);
  });
}

function escapeHTML(text) {
  return text.replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

function editarEstudiante(id, nombre, correo, clase) {
  document.getElementById("nombre").value = nombre;
  document.getElementById("correo").value = correo;
  document.getElementById("clase").value = clase;
  idEnEdicion = id;
  btnAgregarActualizar.textContent = "Actualizar";
}

async function eliminarEstudiante(id) {
  if (!confirm("¿Seguro que quieres eliminar este estudiante?")) return;

  const { error } = await client.from("estudiantes").delete().eq("id", id);

  if (error) {
    mostrarToast("Error al eliminar: " + error.message, "error");
  } else {
    mostrarToast("Estudiante eliminado", "success");
    cargarEstudiantes();
    cargarEstudiantesSelect();
  }
}

async function cargarEstudiantesSelect() {
  const { data, error } = await client
    .from("estudiantes")
    .select("id, nombre")
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error al cargar estudiantes para select:", error.message);
    return;
  }

  const select = document.getElementById("estudiante");
  select.innerHTML = "";

  data.forEach((est) => {
    const option = document.createElement("option");
    option.value = est.id;
    option.textContent = est.nombre;
    select.appendChild(option);
  });
}

async function subirArchivo() {
  const archivoInput = document.getElementById("archivo");
  const archivo = archivoInput.files[0];

  if (!archivo) {
    mostrarToast("Selecciona un archivo primero.", "error");
    return;
  }

  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) {
    mostrarToast("Sesión no válida.", "error");
    return;
  }

  const estudianteSeleccionado = document.getElementById("estudiante").value;
  if (!estudianteSeleccionado) {
    mostrarToast("Selecciona un estudiante para subir el archivo.", "error");
    return;
  }

  const nombreRuta = `${user.id}/${estudianteSeleccionado}/${archivo.name}`;

  const { data, error } = await client.storage
    .from("tareas")
    .upload(nombreRuta, archivo, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    mostrarToast("Error al subir archivo: " + error.message, "error");
  } else {
    mostrarToast("Archivo subido correctamente.", "success");
    archivoInput.value = "";
    listarArchivos();
  }
}

async function listarArchivos() {
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) {
    mostrarToast("Sesión no válida.", "error");
    return;
  }

  const { data: archivos, error: listarError } = await client.storage
    .from("tareas")
    .list(user.id, { limit: 50 });

  const lista = document.getElementById("lista-archivos");
  lista.innerHTML = "";

  if (listarError) {
    lista.innerHTML = "<li>Error al listar archivos</li>";
    return;
  }

  for (const archivo of archivos) {
    const { data: signedUrlData, error: signedUrlError } = await client.storage
      .from("tareas")
      .createSignedUrl(`${user.id}/${archivo.name}`, 60);

    if (signedUrlError) {
      console.error("Error al generar URL firmada:", signedUrlError.message);
      continue;
    }

    const publicUrl = signedUrlData.signedUrl;
    const item = document.createElement("li");

    const esImagen = archivo.name.match(/\.(jpg|jpeg|png|gif)$/i);
    const esPDF = archivo.name.match(/\.pdf$/i);

    if (esImagen) {
      item.innerHTML = `
        <strong>${archivo.name}</strong><br>
        <a href="${publicUrl}" target="_blank">
          <img src="${publicUrl}" width="150" style="border:1px solid #ccc; margin:5px;" />
        </a>
      `;
    } else if (esPDF) {
      item.innerHTML = `
        <strong>${archivo.name}</strong><br>
        <a href="${publicUrl}" target="_blank">Ver PDF</a>
      `;
    } else {
      item.innerHTML = `<a href="${publicUrl}" target="_blank">${archivo.name}</a>`;
    }

    lista.appendChild(item);
  }
}

async function cerrarSesion() {
  const { error } = await client.auth.signOut();

  if (error) {
    mostrarToast("Error al cerrar sesión: " + error.message, "error");
  } else {
    localStorage.removeItem("token");
    mostrarToast("Sesión cerrada.", "success");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
  }
}

function mostrarToast(mensaje, tipo = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.textContent = mensaje;

  toast.style.position = "relative";
  toast.style.marginBottom = "10px";
  toast.style.padding = "12px 20px";
  toast.style.borderRadius = "8px";
  toast.style.color = "#fff";
  toast.style.fontWeight = "600";
  toast.style.minWidth = "250px";
  toast.style.boxShadow = "0 3px 8px rgba(0,0,0,0.3)";
  toast.style.opacity = "1";
  toast.style.transition = "opacity 0.5s ease";

  if (tipo === "success") {
    toast.style.backgroundColor = "#28a745";
  } else if (tipo === "error") {
    toast.style.backgroundColor = "#dc3545";
  } else {
    toast.style.backgroundColor = "#007bff";
  }

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => container.removeChild(toast), 500);
  }, 3000);
}

// Cargar datos iniciales y suscripción
document.addEventListener("DOMContentLoaded", () => {
  cargarEstudiantes();
  cargarEstudiantesSelect();
  listarArchivos();
});
