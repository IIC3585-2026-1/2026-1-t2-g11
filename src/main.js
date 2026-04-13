import "./styles.css";

const seatRows = Object.freeze(Array.from({ length: 12 }, (_, index) => index + 1));
const seatLetters = Object.freeze(["A", "B", "C", "D", "E", "F"]);
const logLabels = Object.freeze({
  info: "Info",
  success: "OK",
  error: "Error",
});
const timeoutMs = 4000;
const emptyBoardingPassMessage =
  "El pase de abordar aparecerá aquí cuando el check-in termine correctamente.";
const emptyLogMessage = "Esperando una solicitud...";

const byId = (id) => document.getElementById(id);
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomFrom = (list) => list[Math.floor(Math.random() * list.length)];

const toErrorMessage = (error) =>
  error && typeof error === "object" && "message" in error
    ? String(error.message)
    : String(error);

const createAppError = (message, reported = false) =>
  Object.assign(new Error(message), { reported });

const normalizePassengerId = (value) => Number.parseInt(String(value).trim(), 10);
const isValidPassengerId = (id) => Number.isInteger(id) && id > 0;
const createPassengerName = (passengerId) => `Pasajero ${passengerId}`;
const createSeatNumber = () => `${randomFrom(seatRows)}${randomFrom(seatLetters)}`;

const createLogEntry = (type, message) => ({
  type,
  message,
  time: new Date().toLocaleTimeString("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }),
});

const createEmptyLogMarkup = () => `
  <li class="log-entry log-entry--idle">
    <span class="log-entry__meta">Sistema</span>
    <p>${emptyLogMessage}</p>
  </li>
`;

const createLogMarkup = (entry) => `
  <li class="log-entry log-entry--${entry.type}">
    <span class="log-entry__meta">${logLabels[entry.type]} · ${entry.time}</span>
    <p>${entry.message}</p>
  </li>
`;

const createEmptyBoardingPassMarkup = () => `
  <p>${emptyBoardingPassMessage}</p>
`;

const createBoardingPassMarkup = (boardingPass) => `
  <header class="boarding-pass__header">
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

function validarPasaporte(id) {
  return delay(1500).then(() => {
    if (id % 2 === 0) {
      throw createAppError("El ID de pasaporte es inválido (número par)");
    }

    return { passengerId: id, status: "validado" };
  });
}

function verificarRestriccionesVisa(id) {
  return delay(2000).then(() => {
    if (Math.random() < 0.3) {
      throw createAppError("Visa no válida para el destino");
    }

    return { passengerId: id, status: "aprobada" };
  });
}

function asignarAsiento() {
  return delay(1000).then(createSeatNumber);
}

function generarPaseAbordar(datos) {
  return delay(500).then(() => ({
    passengerId: datos.passengerId,
    passengerName: createPassengerName(datos.passengerId),
    seat: datos.seat,
    gate: `A${(datos.passengerId % 8) + 1}`,
    zone: (datos.passengerId % 4) + 1,
    flightNumber: 700 + (datos.passengerId % 230),
    issuedAt: new Date().toLocaleTimeString("es-UY", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    passportStatus: datos.passport.status,
    visaStatus: datos.visa.status,
  }));
}

const settleConcurrentStep = (promise, successMessage, notify) =>
  promise
    .then((value) => {
      notify(createLogEntry("success", successMessage));
      return { status: "fulfilled", value };
    })
    .catch((error) => {
      const appError = createAppError(toErrorMessage(error), true);
      notify(createLogEntry("error", `Error: ${appError.message}`));
      return { status: "rejected", reason: appError };
    });

const runLoggedStep = (promise, successMessage, notify) =>
  promise
    .then((value) => {
      notify(createLogEntry("success", successMessage));
      return value;
    })
    .catch((error) => {
      const appError = createAppError(toErrorMessage(error), true);
      notify(createLogEntry("error", `Error: ${appError.message}`));
      throw appError;
    });

const ensureNoFailures = (results) => {
  const failure = results.find((result) => result.status === "rejected");

  if (failure) {
    throw failure.reason;
  }

  return results.map((result) => result.value);
};

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    delay(ms).then(() => {
      throw createAppError("Tiempo de espera agotado");
    }),
  ]);

function iniciarCheckIn(passengerId, notify = () => {}) {
  notify(createLogEntry("info", "Iniciando validaciones..."));

  const validations = Promise.all([
    settleConcurrentStep(
      validarPasaporte(passengerId),
      "Pasaporte verificado",
      notify,
    ),
    settleConcurrentStep(
      verificarRestriccionesVisa(passengerId),
      "Visa verificada",
      notify,
    ),
  ]).then(ensureNoFailures);

  const process = validations
    .then(([passport, visa]) => {
      notify(createLogEntry("success", "Pasaporte y visa verificados"));
      notify(createLogEntry("info", "Validaciones completadas. Asignando asiento..."));
      return runLoggedStep(asignarAsiento(), "Asiento asignado", notify).then(
        (seat) => ({
          passengerId,
          passport,
          visa,
          seat,
        }),
      );
    })
    .then((data) => {
      notify(createLogEntry("info", "Generando pase de abordar..."));
      return runLoggedStep(
        generarPaseAbordar(data),
        "Pase de abordar generado",
        notify,
      );
    });

  return withTimeout(process, timeoutMs);
}

const setStatus = (elements, state, label) => {
  elements.requestStatus.dataset.state = state;
  elements.requestStatus.textContent = label;
};

const setBusy = (elements, isBusy) => {
  elements.submitButton.disabled = isBusy;
  elements.submitButton.textContent = isBusy
    ? "Procesando..."
    : "Procesar check-in";
  elements.form.setAttribute("aria-busy", String(isBusy));
};

const clearError = (elements) => {
  elements.errorBanner.hidden = true;
  elements.errorBanner.textContent = "";
};

const renderError = (elements, message) => {
  elements.errorBanner.hidden = false;
  elements.errorBanner.textContent = `Error: ${message}`;
  setStatus(elements, "error", "Con error");
};

const resetLogs = (elements) => {
  elements.logSection.innerHTML = createEmptyLogMarkup();
};

const appendLog = (elements, entry) => {
  const isIdleLog = elements.logSection.firstElementChild?.classList.contains(
    "log-entry--idle",
  );

  if (isIdleLog) {
    elements.logSection.innerHTML = "";
  }

  elements.logSection.insertAdjacentHTML("beforeend", createLogMarkup(entry));
};

const renderEmptyBoardingPass = (elements) => {
  elements.boardingPass.className = "boarding-pass boarding-pass--empty";
  elements.boardingPass.innerHTML = createEmptyBoardingPassMarkup();
};

const renderBoardingPass = (elements, boardingPass) => {
  elements.boardingPass.className = "boarding-pass";
  elements.boardingPass.innerHTML = createBoardingPassMarkup(boardingPass);
  setStatus(elements, "success", "Check-in listo");
};

const createElements = () => ({
  form: byId("checkin-form"),
  input: byId("passenger-id"),
  submitButton: byId("passenger-submit"),
  requestStatus: byId("request-status"),
  errorBanner: byId("error-banner"),
  logSection: byId("log-section"),
  boardingPass: byId("boarding-pass"),
});

const handleSubmit = (elements) => (event) => {
  event.preventDefault();

  const passengerId = normalizePassengerId(elements.input.value);

  clearError(elements);
  renderEmptyBoardingPass(elements);
  resetLogs(elements);

  if (!isValidPassengerId(passengerId)) {
    const message = "Ingresa un ID numérico mayor a 0.";

    appendLog(elements, createLogEntry("error", `Error: ${message}`));
    renderError(elements, message);
    return;
  }

  setBusy(elements, true);
  setStatus(elements, "processing", "Procesando");

  iniciarCheckIn(passengerId, (entry) => appendLog(elements, entry))
    .then((boardingPass) => {
      renderBoardingPass(elements, boardingPass);
    })
    .catch((error) => {
      if (!error?.reported) {
        appendLog(elements, createLogEntry("error", `Error: ${toErrorMessage(error)}`));
      }

      renderError(elements, toErrorMessage(error));
    })
    .finally(() => {
      setBusy(elements, false);
    });
};

const initializeApp = () => {
  const elements = createElements();

  if (Object.values(elements).some((element) => !element)) {
    return;
  }

  renderEmptyBoardingPass(elements);
  resetLogs(elements);
  setStatus(elements, "idle", "Listo");
  elements.form.addEventListener("submit", handleSubmit(elements));
};

initializeApp();
