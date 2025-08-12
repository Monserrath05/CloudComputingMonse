const SUPABASE_URL = "https://gsdsldjactyltkxwbdiw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZHNsZGphY3R5bHRreHdiZGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDUxNTcsImV4cCI6MjA3MDA4MTE1N30.1hLGHX44ipgsJDIpOPHM3mU3CgvC86VdJtFLyYGtlR0";
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const listaEstudiantes = document.getElementById("lista-estudiantes");
const selectEstudiante = document.getElementById("estudiante");
const listaArchivos = document.getElementById("lista-archivos");

const inputNombre = document.getElementById("nombre");
const inputCorreo = document.getElementById("correo");
const inputClase = document.getElementById("clase");
const btnAgregarActualizar = document.getElementById("btnAgregarActualizar");

let editarId = null;

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
      toast.style.backgroundColor = "#e74c3c";
      break;
    case "success":
      toast.style.backgroundColor = "#27ae60";
      break;
    case "info":
    default:
      toast.style.backgroundColor = "#3498db";
      break;
  }

  contenedor.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => contenedor.removeChild(toast), 500);
  }, duracion);
}

async function cargarEstudiantes() {
  const { data, error } = await client.from("estudiantes").select();
  if (error) {
    mostrarToast("Error al cargar estudiantes: " + error.message, "error");
    return;
  }
  listaEstudiantes.innerHTML = "";
  selectEstudiante.innerHTML = "<option value=''>Selecciona un estudiante</option>";

  data.forEach((est) => {
    // Listado de estudiantes
    const li = document.createElement("li");
    li.textContent = `${est.nombre} - ${est.correo} - ${est.clase}`;

    // Botón Editar
    const btnEditar = document.createElement("button");
    btnEditar.textContent = "Editar";
    btnEditar.onclick = () => editarEstudiante(est);

    // Botón Eliminar
    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "Eliminar";
    btnEliminar.onclick = () => eliminarEstudiante(est.id);

    li.appendChild(btnEditar);
    li.appendChild(btnEliminar);
    listaEstudiantes.appendChild(li);

    // Opciones del select para subir archivo
    const option = document.createElement("option");
    option.value = est.id;
    option.textContent = est.nombre;
    selectEstudiante.appendChild(option);
  });

  await mostrarArchivos();
}

function editarEstudiante(est) {
  inputNombre.value = est.nombre;
  inputCorreo.value = est.correo;
  inputClase.value = est.clase;
  editarId = est.id;
  btnAgregarActualizar.textContent = "Actualizar";
}

async function eliminarEstudiante(id) {
  if (!confirm("¿Seguro que quieres eliminar este estudiante?")) return;

  const { error } = await client.from("estudiantes").delete().eq("id", id);
  if (error) {
    mostrarToast("Error al eliminar estudiante: " + error.message, "error");
  } else {
    mostrarToast("Estudiante eliminado", "success");
    if (editarId === id) {
      limpiarFormulario();
    }
    cargarEstudiantes();
  }
}

function limpiarFormulario() {
  inputNombre.value = "";
  inputCorreo.value = "";
  inputClase.value = "";
  editarId = null;
  btnAgregarActualizar.textContent = "Agregar";
}

btnAgregarActualizar.addEventListener("click", async () => {
  const nombre = inputNombre.value.trim();
  const correo = inputCorreo.value.trim();
  const clase = inputClase.value.trim();

  if (!nombre || !correo || !clase) {
    mostrarToast("Completa todos los campos", "error");
    return;
  }

  if (editarId) {
    const { error } = await client
      .from("estudiantes")
      .update({ nombre, correo, clase })
      .eq("id", editarId);
    if (error) {
      mostrarToast("Error al actualizar: " + error.message, "error");
    } else {
      mostrarToast("Estudiante actualizado", "success");
      limpiarFormulario();
      cargarEstudiantes();
    }
  } else {
    const { error } = await client
      .from("estudiantes")
      .insert([{ nombre, correo, clase }]);
    if (error) {
      mostrarToast("Error al agregar estudiante: " + error.message, "error");
    } else {
      mostrarToast("Estudiante agregado", "success");
      limpiarFormulario();
      cargarEstudiantes();
    }
  }
});

async function subirArchivo() {
  const estudianteId = selectEstudiante.value;
  const archivoInput = document.getElementById("archivo");
  const archivo = archivoInput.files[0];

  if (!estudianteId) {
    mostrarToast("Selecciona un estudiante para subir archivo", "error");
    return;
  }
  if (!archivo) {
    mostrarToast("Selecciona un archivo para subir", "error");
    return;
  }

  const rutaArchivo = `${estudianteId}/${Date.now()}_${archivo.name}`;

  const { error } = await client.storage
    .from("archivos")
    .upload(rutaArchivo, archivo);

  if (error) {
    mostrarToast("Error al subir archivo: " + error.message, "error");
  } else {
    mostrarToast("Archivo subido con éxito", "success");
    archivoInput.value = "";
    mostrarArchivos();
  }
}

async function mostrarArchivos() {
  listaArchivos.innerHTML = "";

  const { data: estudiantes, error: errorEstudiantes } = await client
    .from("estudiantes")
    .select("id,nombre");

  if (errorEstudiantes) {
    mostrarToast("Error al cargar estudiantes: " + errorEstudiantes.message, "error");
    return;
  }

  for (const estudiante of estudiantes) {
    // Listar archivos en la carpeta con el id del estudiante
    const { data: archivos, error: errorArchivos } = await client.storage
      .from("archivos")
      .list(estudiante.id.toString());

    if (errorArchivos) {
      mostrarToast("Error al listar archivos: " + errorArchivos.message, "error");
      continue;
    }

    if (archivos.length === 0) continue;

    const titulo = document.createElement("h3");
    titulo.textContent = `Archivos de ${estudiante.nombre}`;
    listaArchivos.appendChild(titulo);

    const ul = document.createElement("ul");

    for (const archivo of archivos) {
      // Obtener URL firmada para mostrar archivo
      const { data: urlData, error: errorUrl } = await client.storage
        .from("archivos")
        .createSignedUrl(`${estudiante.id}/${archivo.name}`, 60);

      if (errorUrl) {
        mostrarToast("Error al generar URL: " + errorUrl.message, "error");
        continue;
      }

      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = urlData.signedUrl;
      a.textContent = archivo.name;
      a.target = "_blank";
      li.appendChild(a);
      ul.appendChild(li);
    }
    listaArchivos.appendChild(ul);
  }
}

// Función para cerrar sesión (si usas autenticación)
function cerrarSesion() {
  client.auth.signOut();
  localStorage.removeItem("token");
  window.location.href = "index.html";
}

// Cargar estudiantes y archivos al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  cargarEstudiantes();
});
