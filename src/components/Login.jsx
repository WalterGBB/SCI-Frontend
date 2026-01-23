import '../styles/Login.css'
import epis from '../assets/epis.png'
import unc from '../assets/unc.png'
import logo from '../assets/sci-logo.png'

import axios from 'axios'
import { GoogleLogin } from '@react-oauth/google'

const Login = ({
    username,
    handleUsername,
    password,
    handlePassword,
    handleLogin,
    setUser   // 👈 importante (igual que en tu login normal)
}) => {

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const token = credentialResponse.credential

            // Enviar token de Google al backend
            const response = await axios.post('/api/login/google', {
                token
            })

            // Guardar usuario logueado (igual que login normal)
            window.localStorage.setItem(
                'loggedUser',
                JSON.stringify(response.data)
            )

            setUser(response.data)

        } catch (error) {
            console.error('Error al autenticar con Google', error)
        }
    }

    const handleGoogleError = () => {
        console.error('Error en login con Google')
    }

    return (
        <div className="container-login">
            <div className="login-left">
                <form className="login-form" onSubmit={handleLogin}>
                    <label htmlFor="username">usuario:</label>
                    <input
                        type="text"
                        id="username"
                        placeholder="ingrese su nombre de usuario"
                        value={username}
                        onChange={handleUsername}
                        autoComplete="off"
                    />

                    <label htmlFor="password">contraseña:</label>
                    <input
                        type="password"
                        id="password"
                        placeholder="ingrese su contraseña"
                        value={password}
                        onChange={handlePassword}
                        autoComplete="off"
                    />

                    <div className="container-button">
                        <button type="submit">Iniciar sesión</button>
                    </div>

                    {/* LOGIN / REGISTRO CON GOOGLE */}
                    <div className="google-login">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            theme="outline"
                            size="large"
                            text="signup_with"
                            shape="rectangular"
                        />
                    </div>
                </form>
            </div>

            <div className="login-right">
                <a
                    href="https://www.unc.edu.pe/escuela-academico-profesional-de-ingenieria-de-sistemas/"
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    <img src={epis} alt="logo superior" className="logo-top" />
                </a>

                <img src={logo} alt="logo SCI" className="eye-logo" />
                <p className="sci-title">SCI</p>

                <a
                    href="https://www.unc.edu.pe/"
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    <img src={unc} alt="logo inferior" className="logo-bottom" />
                </a>
            </div>
        </div>
    )
}

export default Login
