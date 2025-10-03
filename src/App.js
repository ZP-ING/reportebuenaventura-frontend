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

// Star Rating Component
const StarRating = ({ rating, onRatingChange, readOnly = false, size = "medium" }) => {
  const [hover, setHover] = useState(0)
  const sizeClasses = {
    small: "text-sm",
    medium: "text-xl",
    large: "text-2xl",
  }

  return (
    <div className="flex items-center space-x-1">
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1
        return (
          <button
            key={index}
            type="button"
            disabled={readOnly}
            className={`${sizeClasses[size]} ${readOnly ? "cursor-default" : "cursor-pointer hover:scale-110 transition-transform"} ${
              ratingValue <= (hover || rating) ? "text-yellow-400" : "text-gray-300"
            }`}
            onClick={() => !readOnly && onRatingChange && onRatingChange(ratingValue)}
            onMouseEnter={() => !readOnly && setHover(ratingValue)}
            onMouseLeave={() => !readOnly && setHover(0)}
          >
            ⭐
          </button>
        )
      })}
      {rating > 0 && <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>}
    </div>
  )
}

// Rating Modal Component
const RatingModal = ({ complaint, isOpen, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rating === 0) return

    setLoading(true)
    try {
      await onSubmit(rating, comment)
      onClose()
      setRating(0)
      setComment("")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 10000 }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" style={{ zIndex: 10001 }}>
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Calificar Atención</h3>
          <p className="text-gray-600">¿Cómo calificarías la atención recibida para esta queja?</p>
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-sm">{complaint?.title}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center">
            <label className="block text-sm font-medium text-gray-700 mb-3">Tu calificación</label>
            <StarRating rating={rating} onRatingChange={setRating} size="large" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Comentarios (opcional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Cuéntanos sobre tu experiencia..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={rating === 0 || loading}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50 transition-colors"
            >
              {loading ? "Enviando..." : "Enviar Calificación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Entity Redirect Modal Component
const EntityRedirectModal = ({ complaint, isOpen, onClose }) => {
  const handleRedirect = async () => {
    if (complaint?.entity_info?.website_url) {
      // Mark as redirected
      try {
        await axios.put(`${API}/complaints/${complaint.id}/redirect`)
      } catch (error) {
        console.error("Error marking as redirected:", error)
      }

      // Open entity website
      window.open(complaint.entity_info.website_url, "_blank")
      onClose()
    }
  }

  if (!isOpen || !complaint) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 10000 }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6" style={{ zIndex: 10001 }}>
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">🏢</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Redirigir a Entidad Competente</h3>
          <p className="text-gray-600">Tu reporte será enviado a la entidad responsable</p>
        </div>

        <div className="bg-gradient-to-r from-yellow-50 to-green-50 rounded-lg p-4 mb-6">
          <h4 className="font-bold text-gray-900 mb-2">{complaint.entity_info?.name}</h4>
          <p className="text-sm text-gray-700 mb-3">{complaint.entity_info?.description}</p>

          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <span className="font-medium mr-2">📧</span>
              <span>{complaint.entity_info?.contact_email}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium mr-2">📞</span>
              <span>{complaint.entity_info?.phone}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium mr-2">📍</span>
              <span>{complaint.entity_info?.address}</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h5 className="font-semibold text-blue-900 mb-2">Tu Reporte:</h5>
          <p className="font-medium text-blue-800">{complaint.title}</p>
          <p className="text-xs text-blue-700 mt-1">Categoría: {complaint.category_name}</p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleRedirect}
            className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-green-500 text-white rounded-md hover:from-yellow-600 hover:to-green-600 transition-colors"
          >
            Ir a {complaint.entity_info?.name}
          </button>
        </div>
      </div>
    </div>
  )
}

// Location Picker Component
const LocationPicker = ({ onLocationSelect, initialLocation }) => {
  const [position, setPosition] = useState(initialLocation || BUENAVENTURA_CENTER)
  const [address, setAddress] = useState("")
  const [isSelected, setIsSelected] = useState(false)

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        const newPos = [e.latlng.lat, e.latlng.lng]
        setPosition(newPos)
        setIsSelected(true)
        reverseGeocode(e.latlng.lat, e.latlng.lng)
      },
    })

    return position === null ? null : (
      <Marker position={position}>
        <Popup>
          <div className="text-center">
            <strong>✅ Ubicación seleccionada</strong>
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

// Google Login Component
const GoogleLoginButton = ({ onGoogleLogin, loading }) => {
  const handleGoogleLogin = () => {
    // Using Google Identity Services (new approach)
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id:
          process.env.REACT_APP_GOOGLE_CLIENT_ID ||
          "292558896580-7j5dg4pdjjdmqakj6b9ppu3vp7h5g4eh.apps.googleusercontent.com",
        callback: handleCredentialResponse,
      })

      window.google.accounts.id.prompt()
    } else {
      alert("Google login service is not available. Please try again later.")
    }
  }

  const handleCredentialResponse = (response) => {
    onGoogleLogin(response.credential)
  }

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={loading}
      className="w-full bg-white text-gray-700 py-2 px-4 rounded-md border-2 border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center justify-center"
    >
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
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
      {loading ? "Cargando..." : "Continuar con Google"}
    </button>
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
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login, register, googleLogin } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Load Google Identity Services
    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      let result
      if (isLogin) {
        result = await login(formData.email, formData.password)
      } else {
        result = await register(formData.email, formData.password, formData.full_name)
      }

      if (result.success) {
        navigate("/dashboard")
      } else {
        setError(result.error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async (credential) => {
    setError("")
    setLoading(true)

    try {
      const result = await googleLogin(credential)
      if (result.success) {
        navigate("/dashboard")
      } else {
        setError(result.error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 to-green-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ReporteBuenaventura</h1>
          <p className="text-gray-600 mt-2">Sistema de Reportes Ciudadanos</p>
          <p className="text-sm text-yellow-600 mt-1">Ciudad de Buenaventura</p>
        </div>

        <div className="flex mb-6">
          <button
            className={`flex-1 py-2 px-4 text-center rounded-l-lg transition-colors ${isLogin ? "bg-yellow-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            onClick={() => setIsLogin(true)}
          >
            Iniciar Sesión
          </button>
          <button
            className={`flex-1 py-2 px-4 text-center rounded-r-lg transition-colors ${!isLogin ? "bg-yellow-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Ingresa tu nombre completo"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="ejemplo@buenaventura.gov.co"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Ingresa tu contraseña"
            />
          </div>

          {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600 disabled:opacity-50 transition-colors"
          >
            {loading ? "Cargando..." : isLogin ? "Iniciar Sesión" : "Registrarse"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-3">O continúa con</p>
          <GoogleLoginButton onGoogleLogin={handleGoogleLogin} loading={loading} />
        </div>
      </div>
    </div>
  )
}

// Dashboard Component
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
              <h1 className="text-2xl font-bold text-yellow-600">ReporteBuenaventura</h1>
              <p className="text-sm text-gray-600">Bienvenido, {user?.full_name}</p>
            </div>
            <div className="flex items-center space-x-4">
              {user?.is_admin && (
                <Link
                  to="/admin"
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                >
                  Panel Admin
                </Link>
              )}
              <Link
                to="/create-complaint"
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Nuevo Reporte
              </Link>
              <button onClick={logout} className="text-gray-600 hover:text-gray-900 transition-colors">
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-yellow-500 to-green-600 rounded-lg shadow p-8 mb-8 text-white">
          <h2 className="text-3xl font-bold mb-4">Alza tu voz en Buenaventura</h2>
          <p className="text-lg mb-6">
            Reporta problemas urbanos y comunitarios para construir una mejor ciudad para todos.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/my-complaints"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Mis Reportes
            </Link>
            <Link
              to="/track-complaints"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Seguir Reportes
            </Link>
          </div>
        </div>

        {/* Stats - Only total complaints */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-5xl font-bold text-yellow-600 mb-2">{stats.total_complaints}</div>
              <div className="text-lg text-gray-600 font-medium">Total de Reportes Registrados</div>
              <div className="text-sm text-green-600 mt-2">En la plataforma ReporteBuenaventura</div>
              {stats.average_rating && (
                <div className="mt-4 flex items-center justify-center">
                  <StarRating rating={Math.round(stats.average_rating)} readOnly size="small" />
                  <span className="ml-2 text-sm text-gray-600">Calificación promedio</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="bg-gray-800 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">ReporteBuenaventura</h3>
              <p className="text-sm text-gray-300">
                Plataforma de reportes ciudadanos para construir una mejor Buenaventura.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contacto</h3>
              <div className="text-sm text-gray-300 space-y-2">
                <p>Email: johnvalenciazp@gmail.com</p>
                <p>WhatsApp: 3106507940</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Información</h3>
              <p className="text-sm text-gray-300">
                Sistema de gestión de reportes ciudadanos para la ciudad de Buenaventura, Valle del Cauca.
              </p>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>Desarrollado por Jhon William Angulo Valencia</p>
            <p className="mt-2">Todos los derechos reservados © {new Date().getFullYear()}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// My Complaints Component with Rating
const MyComplaints = () => {
  const { user } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [ratingModal, setRatingModal] = useState({ isOpen: false, complaint: null })
  const [redirectModal, setRedirectModal] = useState({ isOpen: false, complaint: null })
  const [commentModal, setCommentModal] = useState({ isOpen: false, complaint: null })
  const [newComment, setNewComment] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)

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

  const handleRating = async (rating, comment) => {
    try {
      await axios.put(`${API}/complaints/${ratingModal.complaint.id}/rating`, {
        rating,
        comment,
      })
      fetchComplaints() // Refresh complaints
    } catch (error) {
      console.error("Error submitting rating:", error)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    setSubmittingComment(true)
    try {
      await axios.post(`${API}/complaints/${commentModal.complaint.id}/comments`, {
        content: newComment,
      })
      setNewComment("")
      setCommentModal({ isOpen: false, complaint: null })
      fetchComplaints() // Refresh to show new comment
    } catch (error) {
      console.error("Error adding comment:", error)
      alert("Error al agregar comentario")
    } finally {
      setSubmittingComment(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      recibido: "bg-yellow-100 text-yellow-800 border-yellow-200",
      en_proceso: "bg-blue-100 text-blue-800 border-blue-200",
      realizado: "bg-purple-100 text-purple-800 border-purple-200",
      solucionado: "bg-green-100 text-green-800 border-green-200",
      resuelto: "bg-green-100 text-green-800 border-green-200",
    }
    return badges[status] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getStatusText = (status) => {
    const texts = {
      recibido: "📨 Recibido",
      en_proceso: "⚙️ En Proceso",
      realizado: "✔️ Realizado",
      solucionado: "✅ Solucionado",
      resuelto: "✅ Resuelto",
    }
    return texts[status] || status
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tus reportes...</p>
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
            <h1 className="text-xl font-semibold text-gray-900">📋 Mis Reportes</h1>
            <div></div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Tus Reportes Registrados</h2>
            <p className="text-sm text-gray-600 mt-1">
              Aquí puedes ver el estado de todos tus reportes y redirigirlos a las entidades competentes
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {complaints.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes reportes registrados</h3>
                <p className="text-gray-500 mb-4">¡Empieza reportando un problema en tu ciudad!</p>
                <Link
                  to="/create-complaint"
                  className="inline-block bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Crear tu primer reporte
                </Link>
              </div>
            ) : (
              complaints.map((complaint) => (
                <div key={complaint.id} className="px-6 py-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <h3 className="text-lg font-medium text-gray-900 mr-3">{complaint.title}</h3>
                        <span
                          className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusBadge(complaint.status)}`}
                        >
                          {getStatusText(complaint.status)}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-4">{complaint.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500 mb-4">
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

                      {/* User Info */}
                      <div className="bg-blue-50 rounded-lg p-3 mb-4">
                        <div className="flex items-center text-sm">
                          <span className="mr-2">👤</span>
                          <span className="font-medium">Reportado por:</span>
                          <span className="ml-2">{complaint.user_name}</span>
                          <span className="mx-2">•</span>
                          <span>{complaint.user_email}</span>
                        </div>
                      </div>

                      {/* Rating Display */}
                      {complaint.rating && (
                        <div className="mb-4">
                          <div className="flex items-center mb-2">
                            <span className="text-sm font-medium text-gray-700 mr-2">Tu calificación:</span>
                            <StarRating rating={complaint.rating} readOnly size="small" />
                          </div>
                          {complaint.rating_comment && (
                            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded italic">
                              "{complaint.rating_comment}"
                            </p>
                          )}
                        </div>
                      )}

                      {complaint.comments && complaint.comments.length > 0 && (
                        <div className="mb-4 bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">
                            💬 Comentarios ({complaint.comments.length})
                          </h4>
                          <div className="space-y-3">
                            {complaint.comments.map((comment) => (
                              <div key={comment.id} className="bg-white rounded-lg p-3 border border-gray-200">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center mb-1">
                                      <span className="font-medium text-sm text-gray-900">{comment.user_name}</span>
                                      <span className="mx-2 text-gray-400">•</span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(comment.created_at).toLocaleDateString()}{" "}
                                        {new Date(comment.created_at).toLocaleTimeString()}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700">{comment.content}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => setRedirectModal({ isOpen: true, complaint })}
                          className="bg-gradient-to-r from-yellow-500 to-green-500 text-white px-4 py-2 rounded-md hover:from-yellow-600 hover:to-green-600 transition-colors text-sm"
                        >
                          🏢 Ir a Entidad Competente
                        </button>

                        <button
                          onClick={() => setCommentModal({ isOpen: true, complaint })}
                          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm"
                        >
                          💬 Agregar Comentario
                        </button>

                        {(complaint.status === "resuelto" || complaint.status === "solucionado") &&
                          !complaint.rating && (
                            <button
                              onClick={() => setRatingModal({ isOpen: true, complaint })}
                              className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors text-sm"
                            >
                              ⭐ Calificar Atención
                            </button>
                          )}
                      </div>
                    </div>

                    <div className="ml-4 text-center">
                      <div className="text-xs text-gray-500">ID: {complaint.id.substring(0, 8)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <RatingModal
        complaint={ratingModal.complaint}
        isOpen={ratingModal.isOpen}
        onClose={() => setRatingModal({ isOpen: false, complaint: null })}
        onSubmit={handleRating}
      />

      <EntityRedirectModal
        complaint={redirectModal.complaint}
        isOpen={redirectModal.isOpen}
        onClose={() => setRedirectModal({ isOpen: false, complaint: null })}
      />

      {commentModal.isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ zIndex: 10000 }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" style={{ zIndex: 10001 }}>
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Agregar Comentario</h3>
              <p className="text-sm text-gray-600">Comparte información adicional sobre este reporte</p>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-sm">{commentModal.complaint?.title}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tu comentario</label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Escribe tu comentario aquí..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setCommentModal({ isOpen: false, complaint: null })
                  setNewComment("")
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || submittingComment}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {submittingComment ? "Enviando..." : "Agregar Comentario"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Track Complaints Component (Public complaints with detailed view)
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
      realizado: "bg-purple-100 text-purple-800 border-purple-200",
      solucionado: "bg-green-100 text-green-800 border-green-200",
      resuelto: "bg-green-100 text-green-800 border-green-200",
    }
    return badges[status] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getStatusText = (status) => {
    const texts = {
      recibido: "📨 Recibido",
      en_proceso: "⚙️ En Proceso",
      realizado: "✔️ Realizado",
      solucionado: "✅ Solucionado",
      resuelto: "✅ Resuelto",
    }
    return texts[status] || status
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando reportes públicos...</p>
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
              <h1 className="text-xl font-semibold text-gray-900">Detalles del Reporte</h1>
              <div></div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">
                {selectedComplaint.status === "solucionado" || selectedComplaint.status === "resuelto"
                  ? "✅"
                  : selectedComplaint.status === "en_proceso"
                    ? "⚙️"
                    : selectedComplaint.status === "realizado"
                      ? "✔️"
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

              {/* User Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Información del Reportante</h4>
                <div className="flex items-center text-sm text-blue-800">
                  <span className="mr-2">👤</span>
                  <span className="font-medium">{selectedComplaint.user_name}</span>
                  <span className="mx-2">•</span>
                  <span>{selectedComplaint.user_email}</span>
                </div>
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
                      {selectedComplaint.entity_info && (
                        <div className="mt-2 text-sm text-gray-500">
                          <p>📧 {selectedComplaint.entity_info.contact_email}</p>
                          <p>📞 {selectedComplaint.entity_info.phone}</p>
                        </div>
                      )}
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

              {/* Rating Display */}
              {selectedComplaint.rating && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 mb-2">Calificación del Ciudadano</h4>
                  <div className="flex items-center mb-2">
                    <StarRating rating={selectedComplaint.rating} readOnly size="medium" />
                  </div>
                  {selectedComplaint.rating_comment && (
                    <p className="text-sm text-yellow-800 italic">"{selectedComplaint.rating_comment}"</p>
                  )}
                </div>
              )}

              {selectedComplaint.comments && selectedComplaint.comments.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    💬 Comentarios ({selectedComplaint.comments.length})
                  </h4>
                  <div className="space-y-3">
                    {selectedComplaint.comments.map((comment) => (
                      <div key={comment.id} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center mb-1">
                          <span className="font-medium text-sm text-gray-900">{comment.user_name}</span>
                          <span className="mx-2 text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleDateString()}{" "}
                            {new Date(comment.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 text-center">
                  ID del Reporte: <span className="font-mono font-semibold">{selectedComplaint.id}</span>
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
            <h1 className="text-xl font-semibold text-gray-900">🔍 Seguir Reportes</h1>
            <div></div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Todos los Reportes Públicos</h2>
            <p className="text-sm text-gray-600 mt-1">
              Haz clic en cualquier reporte para ver su estado actual y detalles
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {complaints.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay reportes públicos disponibles</h3>
                <p className="text-gray-500">Los reportes aparecerán aquí una vez que sean registrados</p>
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

                      {/* User Info */}
                      <div className="mb-3 text-sm text-blue-600">
                        <span>
                          👤 Reportado por: {complaint.user_name} ({complaint.user_email})
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className="mr-2">📍</span>
                          <span className="truncate">{complaint.location?.address}</span>
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
                          <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
                        </div>
                        {complaint.comments && complaint.comments.length > 0 && (
                          <div className="flex items-center">
                            <span className="mr-2">💬</span>
                            <span>
                              {complaint.comments.length} comentario{complaint.comments.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Rating Display */}
                      {complaint.rating && (
                        <div className="mt-3 flex items-center">
                          <span className="text-sm text-gray-600 mr-2">Calificación:</span>
                          <StarRating rating={complaint.rating} readOnly size="small" />
                        </div>
                      )}
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

// Create Complaint Component
const CreateComplaint = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [redirectModal, setRedirectModal] = useState({ isOpen: false, complaint: null })
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
      const response = await axios.post(`${API}/complaints`, {
        title: formData.title,
        description: formData.description,
        location: formData.location,
      })

      setSuccess(true)

      // Show redirect modal after a short delay
      setTimeout(() => {
        setRedirectModal({ isOpen: true, complaint: response.data })
      }, 1500)
    } catch (error) {
      setError("Error al crear el reporte. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const handleRedirectClose = () => {
    setRedirectModal({ isOpen: false, complaint: null })
    navigate("/my-complaints")
  }

  if (success && !redirectModal.isOpen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl text-green-600 mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Reporte Registrado!</h2>
          <p className="text-gray-600 mb-4">Tu reporte ha sido enviado correctamente y clasificado automáticamente.</p>
          <p className="text-sm text-gray-500">Preparando redirección a la entidad competente...</p>
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
            <h1 className="text-xl font-semibold text-gray-900">📝 Nuevo Reporte</h1>
            <div></div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Reportar un Problema</h2>
            <p className="text-gray-600">
              Ayúdanos a mejorar Buenaventura reportando problemas en tu comunidad. Tu reporte será dirigido
              automáticamente a la entidad competente.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Título del Reporte *</label>
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
                Proporciona todos los detalles posibles para una mejor clasificación y atención
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

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">🤖 Clasificación Automática</h4>
              <p className="text-sm text-blue-800">
                Nuestro sistema analizará tu reporte y lo dirigirá automáticamente a la entidad competente (Secretaría
                de Infraestructura, Servicios Públicos, Policía, etc.) para una atención más rápida y eficiente.
              </p>
            </div>

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
                className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-green-500 text-white rounded-lg hover:from-yellow-600 hover:to-green-600 disabled:opacity-50 transition-colors"
              >
                {loading ? "Procesando..." : "Enviar Reporte"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Entity Redirect Modal */}
      <EntityRedirectModal
        complaint={redirectModal.complaint}
        isOpen={redirectModal.isOpen}
        onClose={handleRedirectClose}
      />
    </div>
  )
}

// Admin Dashboard Component
const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState(null)
  const [complaints, setComplaints] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [statusUpdate, setStatusUpdate] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    if (!user?.is_admin) {
      navigate("/dashboard")
      return
    }
    fetchAdminData()
  }, [user, navigate])

  const fetchAdminData = async () => {
    try {
      const [statsRes, complaintsRes, usersRes] = await Promise.all([
        axios.get(`${API}/admin/stats/detailed`),
        axios.get(`${API}/admin/complaints`),
        axios.get(`${API}/admin/users`),
      ])
      setStats(statsRes.data)
      setComplaints(complaintsRes.data)
      setUsers(usersRes.data)
    } catch (error) {
      console.error("Error fetching admin data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (complaintId, newStatus) => {
    try {
      await axios.put(`${API}/complaints/${complaintId}/status`, { status: newStatus })
      fetchAdminData()
      setSelectedComplaint(null)
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  const handleDeleteComplaint = async (complaintId) => {
    if (!window.confirm("¿Estás seguro de eliminar este reporte?")) return
    try {
      await axios.delete(`${API}/admin/complaints/${complaintId}`)
      fetchAdminData()
    } catch (error) {
      console.error("Error deleting complaint:", error)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("¿Estás seguro de eliminar este usuario?")) return
    try {
      await axios.delete(`${API}/admin/users/${userId}`)
      fetchAdminData()
    } catch (error) {
      console.error("Error deleting user:", error)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("¿Estás seguro de eliminar este comentario?")) return
    try {
      await axios.delete(`${API}/comments/${commentId}`)
      fetchAdminData()
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      recibido: "bg-yellow-100 text-yellow-800 border-yellow-200",
      en_proceso: "bg-blue-100 text-blue-800 border-blue-200",
      realizado: "bg-purple-100 text-purple-800 border-purple-200",
      solucionado: "bg-green-100 text-green-800 border-green-200",
    }
    return badges[status] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getStatusText = (status) => {
    const texts = {
      recibido: "Recibido",
      en_proceso: "En Proceso",
      realizado: "Realizado",
      solucionado: "Solucionado",
    }
    return texts[status] || status
  }

  const filteredComplaints = complaints.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.user_email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-yellow-600 to-green-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
              <p className="text-sm text-yellow-100">ReporteBuenaventura</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="bg-white text-gray-700 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                Ver como Usuario
              </Link>
              <button onClick={logout} className="text-white hover:text-yellow-100 transition-colors">
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === "overview"
                  ? "border-yellow-500 text-yellow-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Resumen
            </button>
            <button
              onClick={() => setActiveTab("complaints")}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === "complaints"
                  ? "border-yellow-500 text-yellow-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Reportes ({complaints.length})
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === "users"
                  ? "border-yellow-500 text-yellow-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Usuarios ({users.length})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && stats && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-3xl font-bold text-yellow-600">{stats.total_complaints}</div>
                <div className="text-sm text-gray-600 mt-1">Total Reportes</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-3xl font-bold text-blue-600">{stats.total_users}</div>
                <div className="text-sm text-gray-600 mt-1">Total Usuarios</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-3xl font-bold text-green-600">
                  {stats.average_rating ? stats.average_rating.toFixed(1) : "N/A"}
                </div>
                <div className="text-sm text-gray-600 mt-1">Calificación Promedio</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-3xl font-bold text-purple-600">
                  {stats.average_response_time_hours ? Math.round(stats.average_response_time_hours) : "N/A"}h
                </div>
                <div className="text-sm text-gray-600 mt-1">Tiempo Promedio de Respuesta</div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reportes por Estado</h3>
                <div className="space-y-3">
                  {Object.entries(stats.by_status).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusBadge(status)}`}>
                          {getStatusText(status)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                          <div
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{ width: `${(count / stats.total_complaints) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reportes por Categoría</h3>
                <div className="space-y-3">
                  {Object.entries(stats.by_category)
                    .slice(0, 5)
                    .map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{category}</span>
                        <div className="flex items-center">
                          <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${(count / stats.total_complaints) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Entity Distribution */}
              <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reportes por Entidad</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(stats.by_entity).map(([entity, count]) => (
                    <div key={entity} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700 flex-1">{entity}</span>
                      <span className="text-lg font-bold text-yellow-600 ml-2">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complaints Tab */}
        {activeTab === "complaints" && (
          <div className="space-y-6">
            {/* Search */}
            <div className="bg-white rounded-lg shadow p-4">
              <input
                type="text"
                placeholder="Buscar reportes por título, descripción, usuario o email..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Complaints List */}
            <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
              {filteredComplaints.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No se encontraron reportes</div>
              ) : (
                filteredComplaints.map((complaint) => (
                  <div key={complaint.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-4">
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

                        {/* User Info */}
                        <div className="bg-blue-50 rounded-lg p-3 mb-3">
                          <div className="text-sm">
                            <span className="font-medium">Usuario:</span> {complaint.user_name} ({complaint.user_email})
                            {complaint.user_phone && <span> - Tel: {complaint.user_phone}</span>}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-500 mb-3">
                          <div>Categoría: {complaint.category_name}</div>
                          <div>Entidad: {complaint.responsible_entity}</div>
                          <div>Ubicación: {complaint.location?.address}</div>
                          <div>Fecha: {new Date(complaint.created_at).toLocaleDateString()}</div>
                        </div>

                        {/* Rating */}
                        {complaint.rating && (
                          <div className="mb-3">
                            <StarRating rating={complaint.rating} readOnly size="small" />
                            {complaint.rating_comment && (
                              <p className="text-sm text-gray-600 mt-1 italic">"{complaint.rating_comment}"</p>
                            )}
                          </div>
                        )}

                        {/* Comments */}
                        {complaint.comments && complaint.comments.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <h4 className="text-sm font-semibold text-gray-700">
                              Comentarios ({complaint.comments.length})
                            </h4>
                            {complaint.comments.map((comment) => (
                              <div key={comment.id} className="bg-gray-50 rounded p-2 text-sm">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="font-medium">{comment.user_name}:</span> {comment.content}
                                    <div className="text-xs text-gray-500 mt-1">
                                      {new Date(comment.created_at).toLocaleString()}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="text-red-600 hover:text-red-800 text-xs"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <select
                        value={complaint.status}
                        onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      >
                        <option value="recibido">Recibido</option>
                        <option value="en_proceso">En Proceso</option>
                        <option value="realizado">Realizado</option>
                        <option value="solucionado">Solucionado</option>
                      </select>
                      <button
                        onClick={() => handleDeleteComplaint(complaint.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                      >
                        Eliminar Reporte
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* Search */}
            <div className="bg-white rounded-lg shadow p-4">
              <input
                type="text"
                placeholder="Buscar usuarios por nombre o email..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Users List */}
            <div className="bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Registro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.phone || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            user.is_admin ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.is_admin ? "Admin" : "Usuario"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {!user.is_admin && (
                          <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-900">
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
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
