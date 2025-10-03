/**
 * Script de prueba de conexión Frontend → Backend
 *
 * Cómo usar:
 * 1. Abre tu sitio en Vercel
 * 2. Abre la consola del navegador (F12)
 * 3. Copia y pega este código completo
 * 4. Presiona Enter
 * 5. Revisa los resultados
 */

console.log("🔍 Iniciando diagnóstico de conexión...\n")

// 1. Verificar variable de entorno
const backendUrl = process.env.REACT_APP_BACKEND_URL
console.log("1️⃣ Variable de entorno REACT_APP_BACKEND_URL:", backendUrl || "❌ NO CONFIGURADA")

if (!backendUrl) {
  console.error("❌ ERROR CRÍTICO: REACT_APP_BACKEND_URL no está configurada en Vercel")
  console.log("📝 Solución: Agrega la variable en Vercel Settings → Environment Variables")
  console.log("   Valor: https://reportebuenaventura-backend-production-ce1e.up.railway.app")
}

// 2. Probar conexión al backend
const testBackendUrl = backendUrl || "https://reportebuenaventura-backend-production-ce1e.up.railway.app"
console.log("\n2️⃣ Probando conexión a:", testBackendUrl)

fetch(`${testBackendUrl}/api/entities`)
  .then((response) => {
    console.log("📡 Respuesta recibida:", response.status, response.statusText)

    if (response.ok) {
      return response.json()
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  })
  .then((data) => {
    console.log("✅ CONEXIÓN EXITOSA!")
    console.log("📊 Datos recibidos:", data.length, "entidades")
    console.log("🎉 El backend está funcionando correctamente")
    console.log("\n📋 Primeras 3 entidades:")
    data.slice(0, 3).forEach((entity, i) => {
      console.log(`   ${i + 1}. ${entity.name}`)
    })
  })
  .catch((error) => {
    console.error("❌ ERROR DE CONEXIÓN:", error.message)

    if (error.message.includes("CORS")) {
      console.log("\n🔧 Problema: CORS no configurado en Railway")
      console.log("📝 Solución:")
      console.log("   1. Ve a Railway → tu proyecto backend → Variables")
      console.log("   2. Agrega o edita: CORS_ORIGINS")
      console.log("   3. Valor: https://reportebuenaventura-frontend.vercel.app,http://localhost:3000")
      console.log("   4. Redesplega Railway")
    } else if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      console.log("\n🔧 Problema: No se puede alcanzar el backend")
      console.log("📝 Posibles causas:")
      console.log("   - Railway está caído o no desplegado")
      console.log("   - La URL del backend es incorrecta")
      console.log("   - Problemas de red")
      console.log("\n✅ Verifica:")
      console.log("   1. Abre: https://reportebuenaventura-backend-production-ce1e.up.railway.app/docs")
      console.log("   2. Deberías ver la documentación de FastAPI")
      console.log("   3. Si no carga, revisa Railway")
    } else {
      console.log("\n🔧 Error desconocido")
      console.log("📝 Revisa:")
      console.log("   - Logs de Railway")
      console.log("   - Logs de Vercel")
      console.log("   - Variables de entorno en ambas plataformas")
    }
  })

// 3. Verificar localStorage
console.log("\n3️⃣ Verificando token de autenticación...")
const token = localStorage.getItem("token")
if (token) {
  console.log("✅ Token encontrado en localStorage")
  console.log("🔑 Token (primeros 20 caracteres):", token.substring(0, 20) + "...")

  // Probar autenticación
  fetch(`${testBackendUrl}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => {
      if (response.ok) {
        return response.json()
      } else {
        throw new Error("Token inválido o expirado")
      }
    })
    .then((user) => {
      console.log("✅ Autenticación válida!")
      console.log("👤 Usuario:", user.full_name, `(${user.email})`)
      console.log("🔐 Admin:", user.is_admin ? "Sí" : "No")
    })
    .catch((error) => {
      console.log("⚠️ Token inválido o expirado:", error.message)
      console.log("📝 Intenta cerrar sesión y volver a iniciar")
    })
} else {
  console.log("ℹ️ No hay token (no has iniciado sesión)")
}

// 4. Resumen
console.log("\n" + "=".repeat(60))
console.log("📊 RESUMEN DEL DIAGNÓSTICO")
console.log("=".repeat(60))
console.log("Backend URL:", testBackendUrl)
console.log("Variable configurada:", backendUrl ? "✅" : "❌")
console.log("Token presente:", token ? "✅" : "❌")
console.log("\n⏳ Esperando resultados de las pruebas de conexión...")
console.log("=".repeat(60))
