# Snowball.

Snowball es una aplicación web para simular crecimiento patrimonial y calcular escenarios de independencia financiera (FIRE).
Está hecha con Angular 21 y Tailwind CSS v4, y la idea principal era crear una herramienta rápida, privada y fácil de usar para hacer proyecciones financieras a largo plazo.

Toda la información se guarda localmente en el navegador, sin depender de APIs externas ni servicios en la nube.

---

## Características

### Simulación financiera

- Proyección de patrimonio a lo largo de los años
- Cálculo de interés compuesto teniendo en cuenta inflación
- Estimación de objetivos FIRE
- Diferentes perfiles de riesgo y rentabilidad
- Escenarios optimista, esperado y pesimista

### Arquitectura

La aplicación sigue una estructura bastante simple y desacoplada:

- Un componente principal que centraliza estado, persistencia y cálculos
- Componentes de UI reutilizables para gráficos, KPIs, sliders y paneles
- Comunicación mediante Signals y Outputs de Angular

### Selector de divisa (€ / $)

La app soporta euro y dólar con formato adaptado automáticamente:

- `50.000 €`
- `$50,000`

La preferencia de moneda se guarda automáticamente en LocalStorage.

### Gráficos y rendimiento

Los gráficos están hechos con Chart.js.

Para evitar parpadeos al mover sliders o cambiar parámetros, las actualizaciones rápidas se renderizan sin animación y las transiciones importantes sí mantienen animaciones suaves.

También incluye:

- gráfico de crecimiento patrimonial
- distribución de cartera
- cono de incertidumbre según volatilidad

### Tema oscuro

La interfaz tiene soporte completo para dark mode usando Tailwind v4.

---

## Stack

- Angular 21
- Tailwind CSS v4
- Chart.js
- Transloco (i18n ES/EN)
- Vitest

---

## Estructura

```txt
src/
├── app/
│   ├── components/
│   ├── core/
│   │   ├── services/
│   │   └── utils/
│   ├── app.ts
│   ├── app.html
│   └── styles.css
├── public/
│   └── i18n/
```

---

## Instalación

Instalar dependencias:

```bash
npm install
```

Iniciar entorno de desarrollo:

```bash
npm run start
```

La aplicación estará disponible en:

```txt
http://localhost:4200
```

Ejecutar tests:

```bash
npm run test
```

---

## Privacidad

Snowball funciona con una filosofía local-first.

Los datos no salen del navegador y no se envían a servidores externos.
La persistencia se hace mediante LocalStorage y los datos pueden exportarse/importarse en formato JSON.
