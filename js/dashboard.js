const SUPABASE_URL = "https://gsdsldjactyltkxwbdiw.supabase.co";
const SUPABASE_KEY = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCMVc2o02TcyAIhHp2UNRHOaG+UpDrpkeZDVCAIqFgdkHGfbuiMLqh1kLPutm8Zbt1KFmHisrddVC3O6F5FZXoz4N1zQNOtpSTDr/SUUtjEJaLCvIibkSfQ2/Q6fSqH6GZEz6VUNok916XpefPXW1EFkgEKkjqmpEDafoQRZFHG9sLq5J9nK6AiCNJVB6tycoLjnH/+m8LbKNtairTMTJAMAG0p5VQVUFHgcSsuztGnp9waJGabxi9wZs6AC70nefb3h/HJGyf/y0EACo4RU8wBcUQT2Y5DRTPHLo8ZaC3te2g6JpmWbGWHdsBlNA69DNW5IcSzHQIES+XGc+3vH3fV rsa-key-20250806"; // Recortado por seguridad
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function agregarEstudiante() {
  const nombre = document.getElementById("nombre").value;
  const correo = document.getElementById("correo").value;
  const clase = document.getElementById("clase").value;

  const { data: { user }, error: userError } = await client.auth.getUser();

  if (userError || !user) {
    alert("No estás autenticado.");
    return;
  }

  const { error } = await client.from("estudiantes").insert([
    {
      nombre,
      correo,
      clase,
      user_id: user.id,
    },
  ]);

  if (error) {
    alert("Error al agregar: " + error.message);
  } else {
    alert("Estudiante agregado");
    cargarEstudiantes();
  }
}

async function cargarEstudiantes() {
  const { data, error } = await client
    .from("estudiantes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    alert("Error al cargar estudiantes: " + error.message);
    return;
  }

  const lista = document.getElementById("lista-estudiantes");
  lista.innerHTML = "";

  data.forEach((est) => {
    const item = document.createElement("li");
    item.textContent = `${est.nombre} (${est.clase})`; // ← CORREGIDO
    lista.appendChild(item);

    // Rellenar select de archivos también aquí
    const select = document.getElementById("estudiante");
    const option = document.createElement("option");
    option.value = est.id;
    option.textContent = est.nombre;
    select.appendChild(option);
  });
}

async function subirArchivo() {
  const archivoInput = document.getElementById("archivo");
  const archivo = archivoInput.files[0];
  const estudianteId = document.getElementById("estudiante").value;

  if (!archivo || !estudianteId) {
    alert("Selecciona un estudiante y un archivo.");
    return;
  }

  const { data: { user }, error: userError } = await client.auth.getUser();

  if (userError || !user) {
    alert("Sesión no válida.");
    return;
  }

  const nombreRuta = `${user.id}/${archivo.name}`; // ← CORREGIDO
  const { error } = await client.storage
    .from("tareas")
    .upload(nombreRuta, archivo, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    alert("Error al subir: " + error.message);
  } else {
    alert("Archivo subido correctamente.");
    listarArchivos();
  }
}

async function listarArchivos() {
  const { data: { user }, error: userError } = await client.auth.getUser();

  if (userError || !user) {
    alert("Sesión no válida.");
    return;
  }

  const { data: archivos, error: listarError } = await client.storage
    .from("tareas")
    .list(user.id, { limit: 20 }); // ← CORREGIDO

  const lista = document.getElementById("lista-archivos");
  lista.innerHTML = "";

  if (listarError) {
    lista.innerHTML = "<li>Error al listar archivos</li>";
    return;
  }

  archivos.forEach(async (archivo) => {
    const { data: signedUrlData, error: signedUrlError } = await client.storage
      .from("tareas")
      .createSignedUrl(`${user.id}/${archivo.name}`, 60); // ← CORREGIDO

    if (signedUrlError) {
      console.error("Error al generar URL firmada:", signedUrlError.message);
      return;
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
      item.innerHTML = `<a href="${publicUrl}" target="_blank">${archivo.name}</a>`; // ← CORREGIDO
    }

    lista.appendChild(item);
  });
}

async function cerrarSesion() {
  const { error } = await client.auth.signOut();

  if (error) {
    alert("Error al cerrar sesión: " + error.message);
  } else {
    localStorage.removeItem("token");
    alert("Sesión cerrada.");
    window.location.href = "index.html";
  }
}

// Iniciar al cargar
cargarEstudiantes();
listarArchivos();
