const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const morgan = require("morgan");

const app = express();
const PORT = 3000;

// Configuración de EJS y layouts
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(expressLayouts);
app.set("layout", "./layouts/main");

// 1. Morgan como middleware de terceros
app.use(morgan("dev"));

// 2. Middleware personalizado global: Identificador de solicitudes (BIB-XXXX)
let contadorSolicitudes = 1;
const identificarSolicitud = (req, res, next) => {
  const numeroFormateado = String(contadorSolicitudes).padStart(4, "0");
  res.locals.solicitudId = `BIB-${numeroFormateado}`;
  contadorSolicitudes++;
  next();
};
app.use(identificarSolicitud);

// 3. Middleware personalizado global: Medición de duración usando el evento finish
const medirDuracion = (req, res, next) => {
  const tiempoInicio = Date.now();
  
  res.on("finish", () => {
    const duracion = Date.now() - tiempoInicio;
    const id = res.locals.solicitudId || "N/A";
    console.log(`[${id}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Duración: ${duracion}ms`);
  });

  next();
};
app.use(medirDuracion);

// 4. Middleware incorporado (parsers y recursos estáticos)
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ==========================================
// DATOS INICIALES EN MEMORIA (al menos 4 reservas)
// ==========================================
const salasPermitidas = ["Sala Norte", "Sala Sur", "Sala Multimedia"];

let reservas = [
  {
    id: 1,
    estudiante: "María Pérez",
    email: "maria.perez@example.com",
    sala: "Sala Norte",
    fecha: "2026-10-01",
    turno: "Mañana",
    personas: 3
  },
  {
    id: 2,
    estudiante: "Carlos Gómez",
    email: "carlos.gomez@example.com",
    sala: "Sala Sur",
    fecha: "2026-10-01",
    turno: "Tarde",
    personas: 2
  },
  {
    id: 3,
    estudiante: "Lucía Fernández",
    email: "lucia.f@example.com",
    sala: "Sala Multimedia",
    fecha: "2026-10-02",
    turno: "Noche",
    personas: 4
  },
  {
    id: 4,
    estudiante: "Juan Rodríguez",
    email: "juan.r@example.com",
    sala: "Sala Norte",
    fecha: "2026-10-03",
    turno: "Mañana",
    personas: 1
  }
];

// ==========================================
// RUTAS GENERALES DE LA APLICACIÓN
// ==========================================
app.get("/", (req, res) => {
  res.render("inicio", { titulo: "Inicio - Biblioteca" });
});

app.get("/estado", (req, res) => {
  res.json({
    servicio: "activo",
    reservas: reservas.length,
    solicitudId: res.locals.solicitudId
  });
});

// ==========================================
// ROUTER DE RESERVAS (Montado en /reservas)
// ==========================================
const reservasRouter = express.Router();

// Middleware de área para el router de reservas
const prepararAreaReservas = (req, res, next) => {
  res.locals.seccion = "Reservas de salas";
  next();
};
reservasRouter.use(prepararAreaReservas);

// GET /reservas (Listado)
reservasRouter.get("/", (req, res) => {
  res.render("reservas/lista", { titulo: "Listado de Reservas", reservas });
});

// GET /reservas/nueva (Formulario) -> DEBE IR ANTES de /:id
reservasRouter.get("/nueva", (req, res) => {
  res.render("reservas/nueva", { 
    titulo: "Nueva Reserva", 
    error: null, 
    valores: {} 
  });
});

// GET /reservas/:id (Detalle)
reservasRouter.get("/:id", (req, res) => {
  const idBuscado = Number(req.params.id);
  const reserva = reservas.find(r => r.id === idBuscado);

  if (!reserva) {
    return res.status(404).render("no-encontrado", {
      titulo: "Reserva no encontrada",
      mensaje: "La reserva solicitada no existe."
    });
  }

  res.render("reservas/detalle", { titulo: `Detalle de Reserva #${reserva.id}`, reserva });
});

// Middleware de validación para el POST
const validarReserva = (req, res, next) => {
  // 1. Normalizar textos con trim()
  const estudiante = req.body.estudiante ? req.body.estudiante.trim() : "";
  const email = req.body.email ? req.body.email.trim() : "";
  const sala = req.body.sala ? req.body.sala.trim() : "";
  const fecha = req.body.fecha ? req.body.fecha.trim() : "";
  const turno = req.body.turno ? req.body.turno.trim() : "";
  const personas = Number(req.body.personas);

  const turnosPermitidos = ["Mañana", "Tarde", "Noche"];
  let mensajeError = null;

  // 3, 4, 5, 6, 7. Comprobaciones de validación
  if (!estudiante || !email || !sala || !fecha || !turno || isNaN(personas)) {
    mensajeError = "Todos los campos son obligatorios.";
  } else if (!email.includes("@")) {
    mensajeError = "El correo electrónico debe contener '@'.";
  } else if (!salasPermitidas.includes(sala)) {
    mensajeError = "La sala seleccionada no es válida.";
  } else if (!turnosPermitidos.includes(turno)) {
    mensajeError = "El turno seleccionado no es válido.";
  } else if (personas < 1 || personas > 6) {
    mensajeError = "La cantidad de personas debe ser un número entero entre 1 y 6.";
  }

  // 8 y 9. Si hay error, responde 400, renderiza el formulario conservando los valores y mostrando el error con role="alert"
  if (mensajeError) {
    return res.status(400).render("reservas/nueva", {
      titulo: "Nueva Reserva",
      error: mensajeError,
      valores: req.body
    });
  }

  // 10. Si todo es exitoso, preparar req.reservaValidada y ejecutar next()
  req.reservaValidada = {
    estudiante,
    email,
    sala,
    fecha,
    turno,
    personas
  };

  next();
};

// Handler final para crear la reserva
const crearReserva = (req, res) => {
  const nuevoId = reservas.length > 0 ? reservas[reservas.length - 1].id + 1 : 1;
  
  const nuevaReserva = {
    id: nuevoId,
    ...req.reservaValidada
  };

  reservas.push(nuevaReserva);
  res.redirect("/reservas");
};

// POST /reservas
reservasRouter.post("/", validarReserva, crearReserva);

// Montar el router bajo /reservas
app.use("/reservas", reservasRouter);

// ==========================================
// 12. PÁGINA 404 AL FINAL DEL PIPELINE
// ==========================================
app.use((req, res) => {
  res.status(404).render("no-encontrado", {
    titulo: "Página no encontrada",
    mensaje: "La dirección solicitada no existe."
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});