import '../styles/Menu.css'

import { nombreCorto } from '../utils/nombreCorto'
import hasAccess from '../utils/auth/hasAccess'
import PERMISOS from '../utils/auth/permisosRol'

const Menu = ({
    user,
    menuOpen,
    setMenuOpen,
    activeSection,
    scrollTo,
    refResumen,
    refNueva,
    refHistorial,
    refEstadisticas,
    refUsuarios,
    handleLogout,
    setGestionOpen
}) => {
    return (
        <>
            <button
                className="menu-toggle"
                onClick={() => setMenuOpen(!menuOpen)}
            >
                {menuOpen ? '✕' : '☰'}
            </button>

            <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
                <div className="logo">
                    <img
                        src="https://res.cloudinary.com/francode/image/upload/v1778545865/sci-logo-menu_lgeaxs.png"
                        alt="Logo SCI"
                        onClick={() =>
                            scrollTo(refResumen, 'resumen')
                        }
                    />

                    <div className="info">
                        <p className="user-name">
                            {nombreCorto(user.name, false)}
                        </p>

                        <p className="rol">
                            Rol: {user.rol}
                        </p>
                    </div>
                </div>

                <nav className="menu">
                    {hasAccess(user.rol, PERMISOS.nueva) && (
                        <button
                            className={`btn ${activeSection === 'nueva'
                                ? 'active'
                                : ''
                                }`}
                            onClick={() =>
                                scrollTo(refNueva, 'nueva')
                            }
                        >
                            ✍🏻 Nueva incidencia
                        </button>
                    )}

                    {hasAccess(user.rol, PERMISOS.historial) && (
                        <button
                            className={`btn ${activeSection === 'historial'
                                ? 'active'
                                : ''
                                }`}
                            onClick={() =>
                                scrollTo(
                                    refHistorial,
                                    'historial'
                                )
                            }
                        >
                            📋 Incidencias
                        </button>
                    )}

                    {hasAccess(user.rol, PERMISOS.estadisticas) && (
                        <button
                            className={`btn ${activeSection ===
                                'estadisticas' ||
                                activeSection === 'reportes'
                                ? 'active'
                                : ''
                                }`}
                            onClick={() =>
                                scrollTo(
                                    refEstadisticas,
                                    'estadisticas'
                                )
                            }
                        >
                            📊 Análisis
                        </button>
                    )}

                    {hasAccess(user.rol, PERMISOS.usuarios) && (
                        <button
                            className={`btn users ${activeSection === 'usuarios'
                                ? 'active'
                                : ''
                                }`}
                            onClick={() =>
                                scrollTo(
                                    refUsuarios,
                                    'usuarios'
                                )
                            }
                        >
                            <img
                                src="https://res.cloudinary.com/francode/image/upload/v1778545885/users-icon_pwxkgd.png"
                                alt="Icono de Usuarios"
                            />
                            Usuarios
                        </button>
                    )}

                    <div className="sidebar-footer-actions">
                        <button
                            className="btn-salir"
                            onClick={handleLogout}
                        >
                            <img src="https://img.icons8.com/material-outlined/24/shutdown--v1.png" alt="salir-ícono" />
                            salir
                        </button>

                        {(user.rol === 'Administrador' ||
                            user.rol ===
                            'Administrativo') && (
                                <button
                                    className="btn-db-admin"
                                    title="Gestionar Cursos"
                                    onClick={() =>
                                        setGestionOpen(true)
                                    }
                                >
                                    <img
                                        src="https://res.cloudinary.com/francode/image/upload/v1778545792/edit-db_b1ou3a.png"
                                        alt="DB Admin"
                                    />
                                </button>
                            )}
                    </div>
                </nav>

                <span className="version">
                    V. 1.0
                </span>
            </aside>
        </>
    )
}

export default Menu