const SUPABASE_URL = "https://gsdsldjactyltkxwbdiw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZHNsZGphY3R5bHRreHdiZGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDUxNTcsImV4cCI6MjA3MDA4MTE1N30.1hLGHX44ipgsJDIpOPHM3mU3CgvC86VdJtFLyYGtlR0";
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Mostrar toast (notificaciones pequeñas)
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

// Variables para manejar edición
let editarId = null;

// Función para cargar estudiantes en la lista y en el select
async function cargarEstudiantes() {
  const listaEstudiantes = document.getElementById('lista-estudiantes');
  const estudianteSelect = document.getElementById('estudiante');

  listaEstudiantes.innerHTML = '';
  estudianteSelect.innerHTML = '<option value="">Selecciona un estudiante</option>';

  const { data, error } = await client.from('estudiantes').select('id, nombre, correo, clase').order('nombre');

  if (error) {
    mostrarToast('Error al cargar estudiantes: ' + error.message, 'error');
    return;
  }

  data.forEach(estudiante => {
    // Lista de estudiantes
    const li = document.createElement('li');
    li.textContent = `${estudiante.nombre} | ${estudiante.correo} | ${estudiante.clase}`;

    // Botones Editar y Eliminar
    const divBotones = document.createElement('div');

    const btnEditar = document.createElement('button');
    btnEditar.textContent = 'Editar';
    btnEditar.onclick = () => prepararEdicion(estudiante);
    divBotones.appendChild(btnEditar);

    const btnEliminar = document.createElement('button');
    btnEliminar.textContent = 'Eliminar';
    btnEliminar.onclick = () => eliminarEstudiante(estudiante.id);
    divBotones.appendChild(btnEliminar);

    li.appendChild(divBotones);
    listaEstudiantes.appendChild(li);

    // Select para subir archivo
    const option = document.createElement('option');
    option.value = estudiante.id;
    option.textContent = estudiante.nombre;
    estudianteSelect.appendChild(option);
  });
}

// Preparar edición de estudiante
function prepararEdicion(estudiante) {
  document.getElementById('nombre').value = estudiante.nombre;
  document.getElementById('correo').value = estudiante.correo;
  document.getElementById('clase').value = estudiante.clase;
  editarId = estudiante.id;
  document.getElementById('btnAgregarActualizar').textContent = 'Actualizar';
}

// Agregar o actualizar estudiante
async function agregarActualizarEstudiante() {
  const nombre = document.getElementById('nombre').value.trim();
  const correo = document.getElementById('correo').value.trim();
  const clase = document.getElementById('clase').value.trim();

  if (!nombre || !correo || !clase) {
    mostrarToast('Llena todos los campos', 'error');
    return;
  }

  if (editarId) {
    // Actualizar
    const { error } = await client.from('estudiantes').update({ nombre, correo, clase }).eq('id', editarId);
    if (error) {
      mostrarToast('Error al actualizar: ' + error.message, 'error');
      return;
    }
    mostrarToast('Estudiante actualizado', 'success');
    editarId = null;
    document.getElementById('btnAgregarActualizar').textContent = 'Agregar';
  } else {
    // Agregar nuevo
    const { error } = await client.from('estudiantes').insert([{ nombre, correo, clase }]);
    if (error) {
      mostrarToast('Error al agregar: ' + error.message, 'error');
      return;
    }
    mostrarToast('Estudiante agregado', 'success');
  }

  // Limpiar campos
  document.getElementById('nombre').value = '';
  document.getElementById('correo').value = '';
  document.getElementById('clase').value = '';

  cargarEstudiantes();
}

// Eliminar estudiante
async function eliminarEstudiante(id) {
  if (!confirm('¿Seguro que quieres eliminar este estudiante?')) return;

  const { error } = await client.from('estudiantes').delete().eq('id', id);

  if (error) {
    mostrarToast('Error al eliminar: ' + error.message, 'error');
    return;
  }
  mostrarToast('Estudiante eliminado', 'success');
  cargarEstudiantes();
}

// Subir archivo
async function subirArchivo() {
  const estudianteSelect = document.getElementById('estudiante');
  const archivoInput = document.getElementById('archivo');

  if (!estudianteSelect.value) {
    mostrarToast('Selecciona un estudiante', 'error');
    return;
  }
  if (!archivoInput.files.length) {
    mostrarToast('Selecciona un archivo', 'error');
    return;
  }

  const archivo = archivoInput.files[0];
  const nombreArchivo = `${estudianteSelect.value}_${Date.now()}_${archivo.name}`;

  const { error } = await client.storage.from('archivos').upload(nombreArchivo, archivo);

  if (error) {
    mostrarToast('Error al subir archivo: ' + error.message, 'error');
    return;
  }

  mostrarToast('Archivo subido', 'success');
  archivoInput.value = '';

  cargarArchivos();
}

// Cargar archivos y mostrar con URLs
async function cargarArchivos() {
  const listaArchivos = document.getElementById('lista-archivos');
  listaArchivos.innerHTML = '';

  const { data, error } = await client.storage.from('archivos').list('', { limit: 100, sortBy: { column: 'name', order: 'asc' } });

  if (error) {
    mostrarToast('Error al cargar archivos: ' + error.message, 'error');
    return;
  }

  if (!data.length) {
    listaArchivos.innerHTML = '<li>No hay archivos subidos.</li>';
    return;
  }

  for (const archivo of data) {
    // Obtén URL pública o firmada para cada archivo
    let url = client.storage.from('archivos').getPublicUrl(archivo.name).data.publicUrl;

    // Si no es público, genera URL firmada
    if (!url || url.includes('null')) {
      const { data: urlFirmada, error: errorUrl } = await client.storage.from('archivos').createSignedUrl(archivo.name, 60);
      if (errorUrl) {
        console.error('Error al generar URL firmada:', errorUrl.message);
        continue;
      }
      url = urlFirmada.signedUrl;
    }

    const li = document.createElement('li');
    li.innerHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer">${archivo.name}</a>`;
    listaArchivos.appendChild(li);
  }
}

// Cerrar sesión
async function cerrarSesion() {
  await client.auth.signOut();
  window.location.href = "index.html";
}

// Evento click para botón agregar/actualizar
document.getElementById('btnAgregarActualizar').addEventListener('click', agregarActualizarEstudiante);

// Inicialización cuando carga la página
document.addEventListener('DOMContentLoaded', () => {
  cargarEstudiantes();
  cargarArchivos();
});
