import "./styles.css";

// Función impura, es el entrypoint
document.getElementById("passenger-submit").onclick = (event) => {
  event.preventDefault();
  const passengerId = document.getElementById("passenger-id").value;
  const submitButton = document.getElementById("passenger-submit");
  submitButton.disabled = true;

  clearBoardingPass();
  clearStatusMessages();

  Promise.race([
    iniciarCheckIn(passengerId),
    delay(4000).then(() => {
      throw new Error("Tiempo de espera agotado");
    }),
  ])
    .then((pase) => mostrarResultado(pase))
    .catch((error) => mostrarError(error.message))
    .finally(() => (submitButton.disabled = false));
};

// Función impura. Side-effects necesarios para cambiar DOM.
function iniciarCheckIn(passengerId) {
  logEstado("Iniciando validaciones...");

  return Promise.all([
    validarPasaporte(passengerId).then(logStep("Pasaporte verificado ✓")),
    verificarRestriccionesVisa(passengerId).then(logStep("Visa verificada ✓")),
  ])
    .then(logStep("Pasaporte y visa verificados ✓"))
    .then(asignarAsiento)
    .then((asiento) => {
      logEstado(`Asiento asignado: ${asiento} ✓`);
      return generarPaseAbordar({ passengerId, asiento });
    });
}

// Funciones puras de la API. En estricto rigor no pueden ser puras ya que son
// llamadas a una API externa, pero para este proyecto, la simulación es pura.
function validarPasaporte(id) {
  return delay(1500).then(() => {
    if (id % 2 === 1) {
      return id;
    }
    throw new Error("El ID de pasaporte es inválido (número par)");
  });
}

function verificarRestriccionesVisa(id) {
  return delay(2000).then(() => {
    if (Math.random() > 0.3) {
      return id;
    }
    throw new Error("Visa no válida para el destino");
  });
}

function asignarAsiento() {
  const filas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const letras = ["A", "B", "C", "D", "E", "F"];
  const fila = filas[Math.floor(Math.random() * filas.length)];
  const letra = letras[Math.floor(Math.random() * letras.length)];

  return new Promise((resolve) =>
    setTimeout(() => resolve(`${fila}${letra}`), 1000),
  );
}

function generarPaseAbordar(datos) {
  return delay(500).then(() => ({
    passengerId: datos.passengerId,
    passengerName: `Pasajero ${datos.passengerId}`,
    seat: datos.asiento,
    gate: `A${(datos.passengerId % 8) + 1}`,
    zone: (datos.passengerId % 4) + 1,
    flightNumber: 700 + (datos.passengerId % 230),
    issuedAt: new Date().toLocaleTimeString("es-UY", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    //passportStatus: datos.passport.status,
    //visaStatus: datos.visa.status,
  }));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Funciones para manipular DOM.
function logStep(logText) {
  return () => {
    logEstado(logText);
  };
}

function logEstado(logText, color) {
  console.log(logText);
  const logContainer = document.getElementById("request-status");
  const logEntry = document.createElement("div");
  logEntry.className = "log-entry";
  logEntry.textContent = `${new Date().toLocaleTimeString()} - ${logText}`;

	if (color !== undefined) {
  logEntry.style.color = color;
	}

  logContainer.appendChild(logEntry);
}


function mostrarResultado(boardingPass) {
  const html = `<header class="boarding-pass__header">
    <div>
      <p class="boarding-pass__eyebrow">AsyncAir Boarding Pass</p>
      <h3>${boardingPass.passengerName}</h3>
      <p class="boarding-pass__subtitle">
        Check-in confirmado para el vuelo AA-${boardingPass.flightNumber}
      </p>
    </div>
    <strong class="boarding-pass__seat">${boardingPass.seat}</strong>
  </header>
  <div class="boarding-pass__grid">
    <article class="boarding-pass__field">
      <span>ID</span>
      <strong>${boardingPass.passengerId}</strong>
    </article>
    <article class="boarding-pass__field">
      <span>Puerta</span>
      <strong>${boardingPass.gate}</strong>
    </article>
    <article class="boarding-pass__field">
      <span>Zona</span>
      <strong>${boardingPass.zone}</strong>
    </article>
    <article class="boarding-pass__field">
      <span>Emitido</span>
      <strong>${boardingPass.issuedAt}</strong>
    </article>
  </div>
  <div class="boarding-pass__tags">
    <span class="boarding-pass__tag">Pasaporte verificado</span>
    <span class="boarding-pass__tag">Visa aprobada</span>
  </div>
`;

  document.getElementById("boarding-pass").innerHTML = html;
}

function mostrarError(errorText) {
	logEstado(errorText, "red");
  const errorBanner = document.getElementById("error-banner");
  errorBanner.textContent = errorText;
  errorBanner.hidden = false;

  setTimeout(() => {
    errorBanner.hidden = true;
    errorBanner.textContent = "";
  }, 5000);
}

function clearBoardingPass() {
  const boardingPassElement = document.getElementById("boarding-pass");
  boardingPassElement.innerHTML = "";
}

function clearStatusMessages() {
  const statusElement = document.getElementById("request-status");
  Array.from(statusElement.children).forEach((child) =>
    statusElement.removeChild(child),
  );
}
