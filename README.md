# AsyncAir - Check-in asincrónico y funcional

## Integrantes Grupo 11 / Tarea 2

Gary Yael Díaz Crisosto <gdiaz1@uc.cl>

David Elías Leal Olivares <dlealo@estudiante.uc.cl>

Jaime Alejandro Pérez Lisboa <jaime.perez@uc.cl>

Larry Andrés Uribe Araya <jlarry@uc.cl>

## Objetivo del trabajo

Este proyecto resuelve el problema planteado para la aerolínea AsyncAir: procesar el check-in de un pasajero simulando llamadas a una API con Promises, aplicando programación asincrónica y principios del paradigma funcional en JavaScript.

El flujo implementado valida la documentación del pasajero, asigna un asiento y genera un pase de abordar final. Además, informa al usuario lo que ocurre en tiempo real en el DOM, incluyendo errores y estados de la solicitud.

## Implementación realizada

En el estado actual del repositorio se implementó lo siguiente:

- una interfaz funcional en `index.html` conectada con `src/main.js`,
- un formulario con input numérico para el ID del pasajero,
- un botón que se bloquea mientras el check-in está en ejecución,
- una consola visual de eventos para seguir cada paso del proceso,
- un banner de error para mostrar fallos de manera clara,
- una tarjeta final de boarding pass cuando el flujo termina exitosamente,
- estilos visuales en rojo, azul y blanco para dar una identidad consistente a la interfaz.

Esto deja el proyecto listo para ser probado localmente y presentado en clase con ejemplos de éxito y error.

## Qué resuelve la aplicación

La aplicación cumple con los puntos pedidos en la consigna:

- `validarPasaporte(id)` tarda 1.5 segundos y falla si el ID es par.
- `verificarRestriccionesVisa(id)` tarda 2 segundos y falla aleatoriamente el 30% de las veces con el mensaje `Visa no válida para el destino`.
- `asignarAsiento()` tarda 1 segundo y devuelve un asiento aleatorio.
- `generarPaseAbordar(datos)` tarda 0.5 segundos y arma el objeto final del pasajero.
- `iniciarCheckIn(pasajeroId)` orquesta todo el proceso.
- Las validaciones de pasaporte y visa se ejecutan al mismo tiempo.
- El asiento solo se asigna si ambas validaciones fueron exitosas.
- El pase de abordar solo se genera si todo lo anterior fue correcto.
- Si ocurre un error, se detienen los pasos siguientes y el error se muestra claramente en la interfaz.
- El botón se deshabilita mientras el proceso está en curso para evitar condiciones de carrera.
- Se implementó el bonus de `timeout global` de 4 segundos usando `Promise.race`.

## Cómo funciona el flujo

El proceso completo sigue esta secuencia:

1. El usuario ingresa un ID y envía el formulario.
2. Se valida primero que el ID sea un número válido mayor a 0.
3. Se registran eventos en la consola visual del DOM.
4. Se ejecutan en paralelo las promesas de pasaporte y visa con `Promise.all`.
5. Si alguna falla, se captura el error y se informa al usuario.
6. Si ambas terminan bien, se asigna un asiento.
7. Luego se genera el pase de abordar.
8. Finalmente se renderiza una tarjeta con los datos del pasajero.

## Decisiones de diseño y enfoque funcional

La solución intenta respetar la idea del paradigma funcional dentro de un problema que necesariamente tiene efectos secundarios, como temporizadores, aleatoriedad y manipulación del DOM.

### Principios aplicados

- Se separó la lógica del proceso de check-in de la lógica de renderizado.
- Se evitaron clases y estructuras orientadas a objetos.
- Se trabajó con funciones pequeñas y compuestas.
- No se usan `for` ni `while`.
- Se evita modificar estructuras previas: en general se crean nuevos valores u objetos para cada paso.
- Los efectos secundarios inevitables se aislaron en funciones puntuales, especialmente en la parte de UI y simulación asincrónica.

### Ejemplos concretos del enfoque funcional

- `normalizePassengerId`, `isValidPassengerId` y `toErrorMessage` transforman datos de entrada sin depender del DOM.
- `settleConcurrentStep` y `runLoggedStep` encapsulan patrones reutilizables para componer promesas con logging y manejo de errores.
- `ensureNoFailures` transforma el resultado de las validaciones concurrentes sin lógica imperativa compleja.
- `iniciarCheckIn` compone todo el flujo mediante encadenamiento de promesas.

### Sobre la pureza funcional

No todas las funciones pueden ser puras en este problema, porque algunas dependen del tiempo, del azar o del DOM. En lugar de ignorar eso, se aisló esa parte en funciones específicas y se mantuvo el resto del flujo lo más declarativo posible. Esa fue una decisión consciente para equilibrar claridad, corrección y las restricciones de la consigna.

## Manejo de errores en el DOM

Esta parte fue agregada de forma explícita para cubrir el requisito de mostrar errores y estados visualmente.

La interfaz presenta los errores de dos maneras:

- Un banner visible con el mensaje del error.
- Una consola de estado donde se van agregando eventos en tiempo real.

Ejemplos de mensajes que puede ver el usuario:

- `Iniciando validaciones...`
- `Pasaporte verificado`
- `Visa verificada`
- `Error: El ID de pasaporte es inválido`
- `Error: Visa no válida para el destino`
- `Pase de abordar generado`

Además, se aplicó CSS para diferenciar visualmente:

- estado en proceso,
- estado exitoso,
- estado con error,
- tarjeta final del boarding pass.

La interfaz usa una paleta rojo, azul y blanco para mantener una presentación consistente y fácil de distinguir durante la demostración.

Esto mejora la experiencia del usuario y también ayuda a explicar el comportamiento asincrónico durante la presentación.

## Bonus implementado

Se implementó un timeout global de 4 segundos con `Promise.race`.

Esto significa que si el proceso completo tarda más de ese tiempo, la promesa principal falla con el mensaje:

`Tiempo de espera agotado`

Observación importante: con los tiempos actuales del ejercicio, el flujo exitoso tarda aproximadamente 3.5 segundos, por lo que el timeout no debería activarse en condiciones normales. Aun así, quedó implementado correctamente como protección global.

## Estructura del proyecto

```text
.
|-- index.html
|-- package.json
|-- README.md
|-- public/
`-- src/
    |-- main.js
    `-- styles.css
```

## Tecnologías utilizadas

- JavaScript moderno con módulos ES
- HTML5
- CSS3
- Vite

## Cómo ejecutar el proyecto

### Desarrollo

```bash
npm install
npm run dev
```

Luego abrir en el navegador la URL local que muestra Vite, normalmente:

```text
http://localhost:5173
```

### Build de producción

```bash
npm run build
```

## Casos de prueba recomendados

Para la demostración y para responder preguntas del otro grupo, conviene probar varios escenarios.

### 1. ID inválido desde el formulario

- Entrada: vacío, texto no numérico o número menor o igual a 0.
- Resultado esperado: mensaje de error inmediato sin iniciar el proceso.

### 2. Error de pasaporte

- Entrada: un ID par, por ejemplo `2468`.
- Resultado esperado: falla con `El ID de pasaporte es inválido (número par)`.

### 3. Flujo correcto

- Entrada: un ID impar, por ejemplo `13579`.
- Resultado esperado: si la visa no falla aleatoriamente, se genera asiento y pase de abordar.

### 4. Error aleatorio de visa

- Entrada: un ID impar, por ejemplo `13579`.
- Resultado esperado: en aproximadamente 3 de cada 10 intentos aparecerá `Visa no válida para el destino`.

### 5. Verificación del bloqueo del botón

- Acción: iniciar un check-in y observar el botón.
- Resultado esperado: el botón queda deshabilitado mientras la solicitud está en curso y se habilita al finalizar.

## Qué explicar en la presentación

Para transmitir bien el trabajo a la clase, recomendamos explicar estas ideas en este orden:

1. Qué problema resuelve la app.
2. Por qué las validaciones de pasaporte y visa deben correr en paralelo.
3. Por qué `Promise.all` sirve para la parte concurrente.
4. Por qué el asiento se asigna solo después de validar todo.
5. Cómo se captura cualquier error y se detiene la cadena.
6. Cómo la consola visual del DOM permite observar el estado del proceso.
7. Qué parte del código responde al enfoque funcional.

## Uso de IA

La IA fue utilizada como asistente de apoyo, no como sustituto de la comprensión del problema.

Se utilizó para:

- proponer una estructura inicial de la solución,
- revisar la claridad del flujo asincrónico,
- mejorar la presentación visual del DOM,
- redactar documentación técnica del proyecto.

Lo que hizo el grupo a partir de esa ayuda fue:

- validar que la solución cumpliera la consigna,
- revisar que las promesas y errores funcionaran correctamente,
- entender y ajustar el código antes de presentarlo,
- verificar que el resultado pudiera explicarse con claridad.

En otras palabras, la IA se usó como una herramienta de productividad y revisión, pero el objetivo del trabajo sigue siendo comprender y defender la solución implementada.

## Autoevaluación breve según la rúbrica

### 1. Cumplimiento del problema planteado

Se implementó el flujo completo con concurrencia, secuencia, manejo de errores, actualización del DOM y bonus de timeout. Por eso consideramos que este criterio está cubierto de forma sólida.

### 2. Capacidad de transmitir el trabajo

La aplicación muestra visualmente cada etapa del proceso, lo que facilita explicar qué ocurre y cuándo ocurre. Además, la lógica fue separada de la interfaz para que la lectura del código sea más clara durante la exposición.

### 3. Forma de uso de la IA

La IA se usó como apoyo para iterar más rápido, documentar mejor y revisar la solución, pero no reemplazó la comprensión del equipo. Cada parte del flujo debe poder explicarse en clase.

### 4. Calidad y rigurosidad de la autoevaluación

Reconocemos que el proyecto aplica programación funcional en un contexto realista, donde hay efectos secundarios inevitables. La decisión no fue fingir pureza absoluta, sino aislar esos efectos y mantener la composición del flujo lo más clara y funcional posible.

## Posibles mejoras futuras

- agregar tests automatizados para los distintos escenarios,
- permitir ingresar nombre del pasajero además del ID,
- mostrar una barra de progreso por etapas,
- registrar métricas de duración de cada promesa.

## Estado actual

El proyecto compila correctamente con:

```bash
npm run build
```

Y está listo para demostración local con:

```bash
npm run dev
```
