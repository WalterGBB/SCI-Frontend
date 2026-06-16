import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'

import Notification from './components/Notificacion'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Footer from './components/Footer'

import loginService from './services/login'

import { useGoogleLogin } from '@react-oauth/google'
import googleLoginService from './services/googleLog'

import './global.css'

function App() {
  const [iniciandoSesion, setIniciandoSesion] = useState(false)

  const [user, setUser] = useState(null)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleUsername = (e) => {
    setUsername(e.target.value)
  }

  const handlePassword = (e) => {
    setPassword(e.target.value)
  }

  const handleLogin = async (e) => {
    e.preventDefault()

    try {
      setIniciandoSesion(true)

      const user = await loginService.login({
        username,
        password
      })

      window.localStorage.setItem(
        'loggedUser',
        JSON.stringify(user)
      )

      toast.success(`Bienvenido, ${user.name}!`)

      setUser(user)

      setUsername('')
      setPassword('')
    } catch (error) {
      toast.error('Usuario o contraseña incorrectos')

      console.error(
        'Error al hacer login:',
        error
      )

      setUsername('')
      setPassword('')
    } finally {
      setIniciandoSesion(false)
    }
  }

  const handleLogout = async () => {
    try {
      toast.success('Sesión cerrada correctamente')

      window.localStorage.removeItem(
        'loggedUser'
      )

      setUser(null)
    } catch (error) {
      toast.error('Error al cerrar sesión')

      console.error(
        'Error during logout:',
        error
      )
    }
  }

  // Mantener sesión
  useEffect(() => {
    const loggedUserJSON =
      window.localStorage.getItem(
        'loggedUser'
      )

    if (loggedUserJSON) {
      const user = JSON.parse(
        loggedUserJSON
      )

      setUser(user)
    }
  }, [])

  // Login Google
  const handleGoogleLogin = useGoogleLogin({
    flow: 'auth-code',

    onSuccess: async (resp) => {
      try {
        const response =
          await googleLoginService.loginWithGoogle(
            resp.code
          )

        toast.success(
          `Bienvenido, ${response.name}!`
        )

        window.localStorage.setItem(
          'loggedUser',
          JSON.stringify(response)
        )

        setUser(response)
      } catch (error) {
        toast.error(
          'Error al autenticar con Google'
        )

        console.error(
          'Error al autenticar con Google',
          error
        )
      }
    },

    onError: () => {
      toast.error(
        'Error en login con Google'
      )

      console.error(
        'Error en login con Google'
      )
    }
  })

  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
      />

      <div className="app-container">
        <div className="app-content">
          {user === null ? (
            <Login
              handleLogin={handleLogin}
              username={username}
              handleUsername={handleUsername}
              password={password}
              handlePassword={handlePassword}
              setUser={setUser}
              handleGoogleLogin={handleGoogleLogin}
            />
          ) : (
            <Dashboard
              user={user}
              handleLogout={handleLogout}
            />
          )}
        </div>

        <Footer />
      </div>

      {iniciandoSesion && (
        <Notification
          mensaje="Iniciando sesión..."
        />
      )}
    </>
  )
}

export default App