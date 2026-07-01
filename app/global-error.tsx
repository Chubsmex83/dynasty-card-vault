"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          background: "#0a0b0f",
          color: "#f5f6fa",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
          Algo salió mal
        </h1>
        <p style={{ color: "#8a8f9c" }}>
          Ocurrió un error inesperado. Intenta de nuevo.
        </p>
        <button
          onClick={reset}
          style={{
            border: "1px solid #c9a24b",
            color: "#c9a24b",
            padding: "0.6rem 1.25rem",
            borderRadius: "0.75rem",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
