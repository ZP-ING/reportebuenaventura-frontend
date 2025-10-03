/**
 * Utilidad para probar la conexión con el backend
 * Abre la consola del navegador (F12) y ejecuta: testBackendConnection()
 */

export const testBackendConnection = async () => {
  const backendUrl = process.env.REACT_APP_BACKEND_URL

  console.log("=".repeat(60))
  console.log("Prueba de Conexión con Backend")
  console.log("=".repeat(60))
  console.log()

  // 1. Verificar variable de entorno
  console.log("1. Verificando variable de entorno...")
  if (!backendUrl) {
    console.error("✗ REACT_APP_BACKEND_URL no está configurada")
    console.log("Solución: Configura esta variable en Vercel")
    return
  }
  console.log(`✓ REACT_APP_BACKEND_URL: ${backendUrl}`)
  console.log()

  // 2. Probar endpoint público
  console.log("2. Probando endpoint público /api/entities...")
  try {
    const response = await fetch(`${backendUrl}/api/entities`)
    if (response.ok) {
      const data = await response.json()
      console.log(`✓ Backend responde correctamente`)
      console.log(`  Entidades encontradas: ${data.length}`)
    } else {
      console.error(`✗ Backend respondió con error: ${response.status}`)
      console.log(`  Verifica que el backend esté corriendo en Railway`)
    }
  } catch (error) {
    console.error("✗ Error de conexión:", error.message)
    if (error.message.includes("CORS")) {
      console.log("  Problema de CORS detectado")
      console.log("  Solución: Verifica CORS_ORIGINS en Railway")
    } else if (error.message.includes("Failed to fetch")) {
      console.log("  No se puede conectar al backend")
      console.log("  Solución: Verifica que el backend esté corriendo")
    }
  }
  console.log()

  // 3. Probar login
  console.log("3. Probando endpoint de login...")
  try {
    const response = await fetch(`${backendUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@test.com",
        password: "test123",
      }),
    })

    if (response.status === 401) {
      console.log("✓ Endpoint de login funciona (credenciales incorrectas esperadas)")
    } else if (response.ok) {
      console.log("✓ Endpoint de login funciona")
    } else {
      console.error(`✗ Error inesperado: ${response.status}`)
    }
  } catch (error) {
    console.error("✗ Error al probar login:", error.message)
  }
  console.log()

  console.log("=".repeat(60))
  console.log("Prueba completada")
  console.log("=".repeat(60))
}

// Hacer disponible globalmente en desarrollo
if (process.env.NODE_ENV === "development") {
  window.testBackendConnection = testBackendConnection
}
