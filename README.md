# Snowball<span style="color:#8b5cf6">.</span> - Planificador Financiero e Interactivo

**Snowball** es un simulador patrimonial de vanguardia y calculadora de jubilación anticipada (**F.I.R.E.**) construido sobre la arquitectura reactiva y moderna de **Angular 21** y estilizado con la potencia de **Tailwind CSS v4**. 

Diseñado bajo la filosofía de *Local-First* y máxima privacidad, permite a los usuarios proyectar su crecimiento financiero a largo plazo, visualizar con precisión matemática el impacto del interés compuesto bajo el coste de la vida (inflación real), estimar escenarios de riesgo con cono de incertidumbre paramétrico, y calcular su independencia financiera.

---

## 🌟 Características Destacadas

### 1. Arquitectura de Componentes Desacoplada (Smart/Dumb)
La aplicación separa estrictamente la gestión del estado global de las vistas de presentación:
* **Smart Shell (`App`):** Centraliza la sincronización asíncrona, carga/guardado en `LocalStorage`, exportaciones/importaciones en JSON y los cálculos actuariales.
* **Componentes de Presentación:** Módulos altamente reutilizables y limpios para el encabezado (`app-header`), panel de parámetros (`app-control-panel`), tarjetas KPI (`app-kpi-cards`), pestaña de crecimiento gráfico (`app-growth-tab`), y calculadora de libertad financiera (`app-fire-tab`).
* **Comunicación Unidireccional pura:** Consumo de datos mediante la API reactiva moderna **Signal Inputs** (`input()`, `input.required()`) y envío de acciones mediante **Outputs** (`output()`).

### 2. Selector de Divisas Global Inteligente (€ / $)
* **Typographical Symmetrical Rules:** La interfaz formatea de manera determinista los importes bajo reglas estrictas:
  * El **Euro (`€`)** se dibuja **siempre a la derecha y separado por un espacio de no-ruptura (`\u00A0`)** para evitar desbordamientos visuales molestos (`50.000 €`).
  * El **Dólar (`$`)** se posiciona **siempre pegado a la izquierda del importe** (`$50,000`).
* **Traducciones Limpias:** Remoción absoluta de caracteres monetarios estáticos de los archivos JSON de internacionalización (`es.json`/`en.json`), delegando el posicionamiento regional en la tubería de Angular.
* **Persistencia:** La moneda preferida se almacena de forma persistente en `LocalStorage` en tiempo real.

### 3. Cono de Incertidumbre Paramétrico (Montecarlo continuo)
* Modelado cuantitativo de volatilidad acumulada ($\sigma\sqrt{t}$) para predecir escenarios de dispersión del patrimonio en el tiempo:
  * **Optimista (Percentil 90):** Retornos favorables sostenidos.
  * **Esperado (Percentil 50 / Mediana):** Curva determinista ajustada.
  * **Pesimista (Percentil 10):** Impacto acumulativo de periodos inflacionarios o bajistas severos.
* **Volatilidad Dinámica por Cartera:** Asignación inteligente de volatilidad ($\sigma$) según el perfil de riesgo seleccionado (Conservador = 5%, Moderado = 8%, Agresivo = 12%, Extremo = 15%) o interpolación matemática continua si se parametrizan retornos personalizados de forma manual.

### 4. Gráficos Reactivos de Alto Rendimiento (Chart.js)
* **Smooth Dragging Updates:** Para solventar el molesto parpadeo de reconstrucción de Chart.js al deslizar parámetros interactivos, implementamos un ciclo de dibujado híbrido:
  * Las actualizaciones de datos por sliders se realizan de forma **instantánea sin animación** (`update('none')`), aportando una fluidez espectacular al arrastrar.
  * Las transiciones discretas (cambio de modo de gráfico, cambio de tema oscuro/claro, conmutación de divisa) conservan animaciones de entrada suaves y elegantes.
* **Asignación de Activos Sincronizada:** Gráfico tipo *doughnut* para la distribución sugerida de renta fija/variable según perfil, renderizado asíncronamente con desfase seguro de layout (`setTimeout`) para garantizar visibilidad al 100%.

### 5. UI de Alta Gama con Tailwind CSS v4
* **Tema Oscuro Nivel Premium:** Soporte nativo de Tailwind v4 adaptado a selectores de clase mediante variante customizada `@custom-variant dark (&:where(.dark, .dark *))` para garantizar conmutación fluida en tiempo real de toda la paleta de colores del DOM.
* **Sliders con Tope en Tiempo Real:** Las cajas de texto de entrada se sincronizan y limitan bidireccionalmente a cotas realistas (Capital inicial máximo de `500.000 €/$` e Inflación anual máxima de `10%`).

---

## 🛠️ Stack Tecnológico

* **Core:** [Angular 21](https://angular.dev/) (Standalone Components, Signals, Computed, Effects)
* **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/) & [PostCSS](https://postcss.org/)
* **Gráficos:** [Chart.js](https://www.chartjs.org/) (Evolución de Riqueza & Distribución de Cartera)
* **Internacionalización:** [@jsverse/transloco](https://github.com/jsverse/transloco) (Doble idioma ES / EN con persistencia)
* **Test Runner:** [Vitest](https://vitest.dev/) (28 tests unitarios exitosos cubriendo servicios, lógica matemática, interfaces reactivas y utilidades de formateo)

---

## 📂 Estructura de Directorios Clave

```text
wealthflow/
├── public/
│   ├── favicon.svg      # Favicon vectorial con auto-tema (Modo Claro/Oscuro en SO)
│   └── i18n/
│       ├── es.json      # Diccionario de traducciones en Español
│       └── en.json      # Diccionario de traducciones en Inglés
├── src/
│   ├── app/
│   │   ├── app.ts       # Smart Container Component (Orquestador de estado)
│   │   ├── app.html     # Plantilla declarativa del Dashboard
│   │   ├── components/  # Componentes Dumb de presentación
│   │   │   ├── control-panel/    # Sliders parametrizables y perfiles
│   │   │   ├── kpi-cards/        # Tarjetas estáticas de impacto simétricas
│   │   │   ├── growth-tab/       # Aislamiento e inicialización de Chart.js
│   │   │   ├── fire-tab/         # Pestaña FIRE con desglose y plazos
│   │   │   ├── header/           # Navbar superior simétrico
│   │   │   └── slider-input/     # Cajas numéricas con clamps y key-locks
│   │   ├── core/
│   │   │   ├── services/
│   │   │   │   └── finance.service.ts  # Servicio matemático determinista puro
│   │   │   └── utils/
│   │   │       └── currency-formatter.ts # Utilidad tipográfica de divisas (€ / $)
│   │   ├── styles.css   # Estilos globales y variables de Tailwind v4
│   │   └── index.html   # Shell HTML5 con enlace a favicons vectorial y fallback
```

---

## 💻 Instalación y Ejecución Local

1. **Clonar e instalar dependencias:**
   ```bash
   cd C:\Users\black\OneDrive\Escritorio\portfolio-angular\wealthflow
   npm install
   ```

2. **Iniciar servidor de desarrollo:**
   ```bash
   npm run start
   ```
   Abre [http://localhost:4200/](http://localhost:4200/) en tu navegador.

3. **Ejecutar pruebas unitarias (Vitest):**
   ```bash
   npm run test
   ```
   La suite validará los 28 tests con un 100% de éxito.

---

## 🔒 Privacidad Local-First
Tus datos financieros te pertenecen exclusivamente a ti. **Snowball** no realiza peticiones a APIs externas ni bases de datos en la nube para procesar tu simulación. El autoguardado funciona localmente en el navegador (`LocalStorage`) y la portabilidad se realiza mediante importación/exportación de archivos JSON locales de forma síncrona.
