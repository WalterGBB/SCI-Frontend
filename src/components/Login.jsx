import { useState } from 'react'
import '../styles/Login.css'

const Login = ({ username, handleUsername, password, handlePassword,
    handleLogin, handleGoogleLogin }) => {

    const [showAdminLogin, setShowAdminLogin] = useState(false)

    return (
        <div className="container-login">
            <div className="login-left">
                <form className="login-form" onSubmit={handleLogin}>
                    <div className="mobile-logo">
                        <img
                            src="https://res.cloudinary.com/francode/image/upload/v1778545865/sci-logo-menu_lgeaxs.png"
                            alt="Logo SCI"
                        />
                    </div>

                    {/* LOGIN GOOGLE */}
                    <div className="btn-google-container">
                        <button
                            type="button"
                            className="btn-google"
                            onClick={() => handleGoogleLogin()}
                        >
                            <img src='https://res.cloudinary.com/francode/image/upload/v1778545824/google-icon_aybyxb.png' alt="Google" />
                            Acceder con correo institucional
                        </button>
                    </div>

                    <p className="login-helper-text">
                        Usa tu correo <strong>@unc.edu.pe</strong>
                    </p>

                    {/* ACCESO ADMINISTRADOR */}
                    <div className="admin-login">
                        <button
                            type="button"
                            className="admin-toggle"
                            onClick={() => setShowAdminLogin(!showAdminLogin)}
                        >
                            {showAdminLogin
                                ? '▾ Ocultar acceso administrador'
                                : '▸ Acceso administrador'}
                        </button>

                        <div className={`admin-form ${showAdminLogin ? 'open' : ''}`}>
                            <div className="form-row">
                                <label htmlFor="username">usuario:</label>
                                <input
                                    type="text"
                                    id="username"
                                    placeholder="Ingrese su usuario"
                                    value={username}
                                    onChange={handleUsername}
                                    autoComplete="off"
                                />
                            </div>

                            <div className="form-row">
                                <label htmlFor="password">contraseña:</label>
                                <input
                                    type="password"
                                    id="password"
                                    placeholder="Ingrese su contraseña"
                                    value={password}
                                    onChange={handlePassword}
                                    autoComplete="off"
                                />
                            </div>

                            <div className="btn-login">
                                <button type="submit">Iniciar sesión</button>
                            </div>
                        </div>
                    </div>
                </form>

                <div className="mobile-logos">
                    <a
                        href="https://www.unc.edu.pe/"
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        <img
                            src="https://res.cloudinary.com/francode/image/upload/v1778545882/unc_us4bkp.png"
                            alt="UNC"
                        />
                    </a>

                    <a
                        href="https://www.unc.edu.pe/escuela-academico-profesional-de-ingenieria-de-sistemas/"
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        <img
                            src="https://res.cloudinary.com/francode/image/upload/v1778545800/epis_fylrm7.png"
                            alt="EPIS"
                        />
                    </a>
                </div>
            </div>

            <div className="login-right">
                <a
                    href="https://www.unc.edu.pe/escuela-academico-profesional-de-ingenieria-de-sistemas/"
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    <img src='https://res.cloudinary.com/francode/image/upload/v1778545800/epis_fylrm7.png' alt="logo superior" className="logo-top" />
                </a>

                <img
                    className="logo-center"
                    src='https://res.cloudinary.com/francode/image/upload/v1778545865/sci-logo-menu_lgeaxs.png' alt="logo SCI"
                />

                <a
                    href="https://www.unc.edu.pe/"
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    <img src='https://res.cloudinary.com/francode/image/upload/v1778545882/unc_us4bkp.png' alt="logo inferior" className="logo-bottom" />
                </a>
            </div>
        </div>
    )
}

export default Login
