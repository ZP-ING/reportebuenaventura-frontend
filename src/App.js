"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom"
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet"
import axios from "axios"
import "./App.css"

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL
const API = `${BACKEND_URL}/api`

// Buenaventura coordinates - more precise center
const BUENAVENTURA_CENTER = [3.8962, -77.0268]

// Auth Context
const AuthContext = createContext()

const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
      // Verify token
      fetchUserInfo()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUserInfo = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`)
      setUser(response.data)
    } catch (error) {
      localStorage.removeItem("token")
      delete axios.defaults.headers.common["Authorization"]
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password })
      const { access_token, user: userData } = response.data

      localStorage.setItem("token", access_token)
      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`
      setUser(userData)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || "Error al iniciar sesión" }
    }
  }

  const register = async (email, password, full_name) => {
    try {
      const response = await axios.post(`${API}/auth/register`, { email, password, full_name })
      const { access_token, user: userData } = response.data

      localStorage.setItem("token", access_token)
      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`
      setUser(userData)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || "Error al registrarse" }
    }
  }

  const googleLogin = async (googleToken) => {
    try {
      const response = await axios.post(`${API}/auth/google`, { google_token: googleToken })
      const { access_token, user: userData } = response.data

      localStorage.setItem("token", access_token)
      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`
      setUser(userData)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || "Error con Google login" }
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    delete axios.defaults.headers.common["Authorization"]
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, googleLogin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Location Picker Component - Improved for Buenaventura
const LocationPicker = ({ onLocationSelect, initialLocation }) => {
  const [position, setPosition] = useState(initialLocation || BUENAVENTURA_CENTER)
  const [address, setAddress] = useState("")

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        const newPos = [e.latlng.lat, e.latlng.lng]
        setPosition(newPos)
        reverseGeocode(e.latlng.lat, e.latlng.lng)
      },
    })

    return position === null ? null : (
      <Marker position={position}>
        <Popup>
          <div className="text-center">
            <strong>Ubicación seleccionada</strong>
            <br />
            <small>Haz clic en otro lugar para cambiar</small>
          </div>
        </Popup>
      </Marker>
    )
  }

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`,
      )
      const data = await response.json()
      const fullAddress = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      setAddress(fullAddress)
      onLocationSelect({
        lat,
        lng,
        address: fullAddress,
      })
    } catch (error) {
      console.error("Error getting address:", error)
      const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      setAddress(fallbackAddress)
      onLocationSelect({ lat, lng, address: fallbackAddress })
    }
  }

  // Initialize with center location on first load
  useEffect(() => {
    if (!initialLocation) {
      reverseGeocode(BUENAVENTURA_CENTER[0], BUENAVENTURA_CENTER[1])
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="h-80 w-full rounded-lg overflow-hidden border-2 border-gray-300">
        <MapContainer
          center={BUENAVENTURA_CENTER}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
          key={`map-${BUENAVENTURA_CENTER[0]}-${BUENAVENTURA_CENTER[1]}`}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker />
        </MapContainer>
      </div>
      {address && (
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>Dirección:</strong> {address}
          </p>
        </div>
      )}
      <p className="text-xs text-gray-500 text-center">
        📍 Haz clic en el mapa para seleccionar la ubicación exacta del problema
      </p>
    </div>
  )
}

// Login Component
const Login = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
  })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register"
      const response = await axios.post(`${API}${endpoint}`, formData)

      if (response.data.access_token) {
        login(response.data.access_token, response.data.user)
      }
    } catch (error) {
      alert(error.response?.data?.detail || "Error en la operación")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = `${API}/auth/google`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 to-green-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">ReporteBuenaventura</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Plataforma de Quejas Ciudadanas</p>
          <p className="text-xs sm:text-sm text-yellow-600 mt-1">Ciudad de Buenaventura</p>
        </div>

        <div className="flex mb-4 sm:mb-6">
          <button
            className={`flex-1 py-2 px-3 sm:px-4 text-center rounded-l-lg transition-colors text-sm sm:text-base ${isLogin ? "bg-yellow-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            onClick={() => setIsLogin(true)}
          >
            Iniciar Sesión
          </button>
          <button
            className={`flex-1 py-2 px-3 sm:px-4 text-center rounded-r-lg transition-colors text-sm sm:text-base ${!isLogin ? "bg-yellow-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            onClick={() => setIsLogin(false)}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              required
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 text-sm sm:text-base"
          >
            {loading ? "Procesando..." : isLogin ? "Iniciar Sesión" : "Registrarse"}
          </button>
        </form>

        <div className="mt-4 sm:mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs sm:text-sm">
              <span className="px-2 bg-white text-gray-500">O continúa con</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="mt-4 w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm sm:text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuar con Google
          </button>
        </div>
      </div>
    </div>
  )
}

// Dashboard Component - Restructured with Buenaventura colors
const Dashboard = () => {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/complaints/stats/overview`)
      setStats(response.data)
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-yellow-600">ReporteBuenaventura</h1>
              <p className="text-xs sm:text-sm text-gray-600">Bienvenido, {user?.full_name}</p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                to="/create-complaint"
                className="bg-gray-600 text-white px-3 py-2 sm:px-4 sm:py-2 text-sm rounded-md hover:bg-gray-700 transition-colors"
              >
                📝 Nueva Queja
              </Link>
              <button onClick={logout} className="text-gray-600 hover:text-gray-800 text-sm px-2 py-1 sm:px-3 sm:py-2">
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-yellow-500 to-green-600 rounded-lg shadow p-4 sm:p-8 mb-6 sm:mb-8 text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-4">¡Alza tu voz en Buenaventura!</h2>
          <p className="text-base sm:text-lg mb-4 sm:mb-6">
            Reporta problemas urbanos y comunitarios para construir una mejor ciudad para todos.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link
              to="/create-complaint"
              className="bg-white text-yellow-600 px-4 py-3 sm:px-6 sm:py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-center text-sm sm:text-base"
            >
              🚨 Reportar Problema
            </Link>
            <Link
              to="/my-complaints"
              className="bg-gray-600 text-white px-4 py-3 sm:px-6 sm:py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors text-center text-sm sm:text-base"
            >
              📋 Mis Quejas
            </Link>
            <Link
              to="/track-complaints"
              className="bg-gray-600 text-white px-4 py-3 sm:px-6 sm:py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors text-center text-sm sm:text-base"
            >
              🔍 Seguir Quejas
            </Link>
          </div>
        </div>

        {/* Stats - Only total complaints */}
        {stats && (
          <div className="grid grid-cols-1 gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-lg shadow p-6 sm:p-8 text-center">
              <div className="text-4xl sm:text-5xl font-bold text-yellow-600 mb-2">{stats.total_complaints}</div>
              <div className="text-base sm:text-lg text-gray-600 font-medium">Total de Quejas Registradas</div>
              <div className="text-xs sm:text-sm text-green-600 mt-2">En la plataforma ReporteBuenaventura</div>
            </div>
          </div>
        )}

        {/* Categories Overview */}
        {stats && stats.by_category && Object.keys(stats.by_category).length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 text-center">
              📊 Quejas por Categoría
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {Object.entries(stats.by_category).map(([category, count]) => (
                <div
                  key={category}
                  className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-yellow-50 to-green-50 rounded-lg border border-yellow-200"
                >
                  <span className="text-xs sm:text-sm font-medium text-gray-800">{category}</span>
                  <span className="bg-yellow-500 text-white text-xs sm:text-sm font-bold px-2 py-1 sm:px-3 sm:py-1 rounded-full">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="mt-12 pt-8 border-t border-gray-200">
          <div className="text-center">
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-800">Desarrollado por ZP ServicioTecnico</p>
              <p className="text-xs text-gray-600 mt-1">Todos los derechos reservados © 2025</p>
            </div>
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-6">
                <div className="flex items-center">
                  <span className="mr-2">📧</span>
                  <a href="mailto:johnvalenciazp@gmail.com" className="hover:text-yellow-600 transition-colors">
                    johnvalenciazp@gmail.com
                  </a>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">📱</span>
                  <a href="tel:+573106507940" className="hover:text-yellow-600 transition-colors">
                    +57 310 650 7940
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

// My Complaints Component
const MyComplaints = () => {
  const { user } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchComplaints()
  }, [])

  const fetchComplaints = async () => {
    try {
      const response = await axios.get(`${API}/complaints`)
      setComplaints(response.data)
    } catch (error) {
      console.error("Error fetching complaints:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      recibido: "bg-yellow-100 text-yellow-800 border-yellow-200",
      en_proceso: "bg-blue-100 text-blue-800 border-blue-200",
      resuelto: "bg-green-100 text-green-800 border-green-200",
    }
    return badges[status] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getStatusText = (status) => {
    const texts = {
      recibido: "📨 Recibido",
      en_proceso: "⚙️ En Proceso",
      resuelto: "✅ Resuelto",
    }
    return texts[status] || status
  }

  const getStatusIcon = (status) => {
    const icons = {
      recibido: "📨",
      en_proceso: "⚙️",
      resuelto: "✅",
    }
    return icons[status] || "📄"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tus quejas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link
              to="/dashboard"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              ← Volver
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">📋 Mis Quejas</h1>
            <div></div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Tus Quejas Registradas</h2>
            <p className="text-sm text-gray-600 mt-1">Aquí puedes ver el estado de todas tus quejas</p>
          </div>
          <div className="divide-y divide-gray-200">
            {complaints.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes quejas registradas</h3>
                <p className="text-gray-500 mb-4">¡Empieza reportando un problema en tu ciudad!</p>
                <Link
                  to="/create-complaint"
                  className="inline-block bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Crear tu primera queja
                </Link>
              </div>
            ) : (
              complaints.map((complaint) => (
                <div key={complaint.id} className="px-6 py-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-medium text-gray-900 mr-3">{complaint.title}</h3>
                        <span
                          className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusBadge(complaint.status)}`}
                        >
                          {getStatusText(complaint.status)}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{complaint.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className="mr-2">📍</span>
                          <span>{complaint.location?.address}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="mr-2">🏢</span>
                          <span>{complaint.responsible_entity}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="mr-2">📂</span>
                          <span>{complaint.category_name}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="mr-2">📅</span>
                          <span>Creado: {new Date(complaint.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 text-center">
                      <div className="text-3xl mb-2">{getStatusIcon(complaint.status)}</div>
                      <div className="text-xs text-gray-500">ID: {complaint.id.substring(0, 8)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Track Complaints Component (Public complaints)
const TrackComplaints = () => {
  const [complaints, setComplaints] = useState([])
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllComplaints()
  }, [])

  const fetchAllComplaints = async () => {
    try {
      const response = await axios.get(`${API}/complaints/all`)
      setComplaints(response.data)
    } catch (error) {
      console.error("Error fetching all complaints:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      recibido: "bg-yellow-100 text-yellow-800 border-yellow-200",
      en_proceso: "bg-blue-100 text-blue-800 border-blue-200",
      resuelto: "bg-green-100 text-green-800 border-green-200",
    }
    return badges[status] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getStatusText = (status) => {
    const texts = {
      recibido: "📨 Recibido",
      en_proceso: "⚙️ En Proceso",
      resuelto: "✅ Resuelto",
    }
    return texts[status] || status
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando quejas públicas...</p>
        </div>
      </div>
    )
  }

  if (selectedComplaint) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                ← Volver
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Detalles de la Queja</h1>
              <div></div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">
                {selectedComplaint.status === "resuelto"
                  ? "✅"
                  : selectedComplaint.status === "en_proceso"
                    ? "⚙️"
                    : "📨"}
              </div>
              <span
                className={`px-4 py-2 text-lg font-semibold rounded-full border-2 ${getStatusBadge(selectedComplaint.status)}`}
              >
                {getStatusText(selectedComplaint.status)}
              </span>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedComplaint.title}</h2>
                <p className="text-gray-700 text-lg">{selectedComplaint.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <span className="text-xl mr-3">📍</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">Ubicación</h4>
                      <p className="text-gray-600">{selectedComplaint.location?.address}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <span className="text-xl mr-3">🏢</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">Entidad Responsable</h4>
                      <p className="text-gray-600">{selectedComplaint.responsible_entity}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <span className="text-xl mr-3">📂</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">Categoría</h4>
                      <p className="text-gray-600">{selectedComplaint.category_name}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <span className="text-xl mr-3">📅</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">Fecha de Reporte</h4>
                      <p className="text-gray-600">
                        {new Date(selectedComplaint.created_at).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 text-center">
                  ID de la Queja: <span className="font-mono font-semibold">{selectedComplaint.id}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link
              to="/dashboard"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              ← Volver
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">🔍 Seguir Quejas</h1>
            <div></div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Todas las Quejas Públicas</h2>
            <p className="text-sm text-gray-600 mt-1">Haz clic en cualquier queja para ver su estado actual</p>
          </div>
          <div className="divide-y divide-gray-200">
            {complaints.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay quejas públicas disponibles</h3>
                <p className="text-gray-500">Las quejas aparecerán aquí una vez que sean reportadas</p>
              </div>
            ) : (
              complaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="px-6 py-6 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedComplaint(complaint)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-medium text-gray-900 mr-3">{complaint.title}</h3>
                        <span
                          className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusBadge(complaint.status)}`}
                        >
                          {getStatusText(complaint.status)}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">{complaint.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className="mr-2">📍</span>
                          <span className="truncate">{complaint.location?.address}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="mr-2">📂</span>
                          <span>{complaint.category_name}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="mr-2">📅</span>
                          <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 text-center">
                      <div className="text-gray-400 hover:text-yellow-600 transition-colors">👁️</div>
                      <div className="text-xs text-gray-500 mt-1">Ver detalles</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Create Complaint Component - Improved map
const CreateComplaint = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleLocationSelect = (location) => {
    setFormData({ ...formData, location })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.location) {
      setError("Por favor selecciona la ubicación del problema en el mapa")
      return
    }

    setLoading(true)
    setError("")

    try {
      await axios.post(`${API}/complaints`, {
        title: formData.title,
        description: formData.description,
        location: formData.location,
      })
      setSuccess(true)
      setTimeout(() => {
        navigate("/my-complaints")
      }, 2000)
    } catch (error) {
      setError("Error al crear la queja. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl text-green-600 mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Queja Registrada!</h2>
          <p className="text-gray-600 mb-4">Tu queja ha sido enviada correctamente y está siendo procesada.</p>
          <p className="text-sm text-gray-500">Serás redirigido a tus quejas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link
              to="/dashboard"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              ← Volver
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">📝 Nueva Queja</h1>
            <div></div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Reportar un Problema</h2>
            <p className="text-gray-600">Ayúdanos a mejorar Buenaventura reportando problemas en tu comunidad</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Título de la Queja *</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Alumbrado público dañado en la Calle 5"
              />
              <p className="text-xs text-gray-500 mt-1">Describe brevemente el problema</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descripción Detallada *</label>
              <textarea
                required
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe detalladamente el problema: ¿qué está sucediendo?, ¿cuándo comenzó?, ¿cómo afecta a la comunidad?..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Proporciona todos los detalles posibles para una mejor atención
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">Ubicación del Problema *</label>
              <LocationPicker onLocationSelect={handleLocationSelect} />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-4 rounded-lg border border-red-200 flex items-center">
                <span className="mr-2">⚠️</span>
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                to="/dashboard"
                className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Enviando..." : "Enviar Queja"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return user ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-complaint"
            element={
              <ProtectedRoute>
                <CreateComplaint />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-complaints"
            element={
              <ProtectedRoute>
                <MyComplaints />
              </ProtectedRoute>
            }
          />
          <Route
            path="/track-complaints"
            element={
              <ProtectedRoute>
                <TrackComplaints />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
