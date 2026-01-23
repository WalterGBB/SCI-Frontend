import { useState, useEffect } from 'react'

import Login from './components/Login'
import Menu from './components/Menu'

import loginService from './services/login'
import incidentsService from './services/incidents'

import './global.css'

function App() {
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
      const user = await loginService.login({ username, password })
      window.localStorage.setItem('loggedUser', JSON.stringify(user))
      incidentsService.setToken(user.token)
      setUser(user)
      setUsername('')
      setPassword('')
    } catch (error) {
      window.alert('Usuario o contraseña incorrectos')
      console.error("Error during login:", error)
      setUsername('')
      setPassword('')
    }
  }

  const handleLogout = async () => {
    try {
      window.localStorage.removeItem('loggedUser')
      incidentsService.setToken(null) // Limpiamos el token
      setUser(null)
    } catch (error) {
      console.error("Error during logout:", error)
    }
  }

  // Hook para mantener la sesión si el usuario ya está logueado (usando localStorage)
  useEffect(() => {
    const loggedUserJSON = window.localStorage.getItem('loggedUser')
    if (loggedUserJSON) {
      const user = JSON.parse(loggedUserJSON)
      setUser(user)
      incidentsService.setToken(user.token) // Configura el token para futuras peticiones
    }
  }, [])

  return (
    <>
      {
        user === null ? (
          <Login
            handleLogin={handleLogin}
            username={username}
            handleUsername={handleUsername}
            password={password}
            handlePassword={handlePassword}
            setUser={setUser}
          />
        ) : (
          <Menu user={user} handleLogout={handleLogout} />
        )
      }
    </>
  )
}

export default App
