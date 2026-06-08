import { useRef, useState, useEffect, useMemo } from 'react'
import '../styles/Menu.css'
import incidentsService from '../services/incidents'
import ambientesService from '../services/ambientes'
import cursosService from '../services/cursos'
import categoriasService from '../services/categorias'
import userService from '../services/users'

import Resumen from './Resumen'
import NuevaIncidencia from './NuevaIncidencia'
import Estadisticas from './Estadisticas'
import Historial from './Historial'
import Reportes from './Reportes'
import Users from './Users'

import { nombreCorto } from '../utils/nombreCorto'
import hasAccess from '../utils/auth/hasAccess'
import PERMISOS from '../utils/auth/permisosRol'

import ModalGestion from './ModalGestion'

const Menu = ({ user, handleLogout }) => {
    // Refs a cada sección del DOM
    const refResumen = useRef(null)
    const refNueva = useRef(null)
    const refEstadisticas = useRef(null)
    const refHistorial = useRef(null)
    const refReportes = useRef(null)
    const refUsuarios = useRef(null)

    // Sección activa (para resaltar el botón)
    const [activeSection, setActiveSection] = useState('resumen')

    // Bandera para saber si el scroll fue por clic (evita falsos positivos en el observer)
    const isScrollingByClick = useRef(false)

    // Temporizador para detectar el fin del scroll
    const scrollTimeout = useRef(null)

    // --- Lógica de Navegación Optimizada ---
    const scrollTo = (ref, sectionName) => {
        if (!ref.current) return

        isScrollingByClick.current = true // Bloqueamos el observer temporalmente
        setActiveSection(sectionName)     // Marcamos el botón como activo inmediatamente

        ref.current.scrollIntoView({ behavior: 'smooth' })

        // Detectamos el fin del scroll animado de forma dinámica
        const detectEnd = () => {
            if (scrollTimeout.current) clearTimeout(scrollTimeout.current)

            scrollTimeout.current = setTimeout(() => {
                isScrollingByClick.current = false // Liberamos el observer
                window.removeEventListener('scroll', detectEnd)
            }, 150) // 150ms sin movimiento indican que el scroll terminó
        }

        window.addEventListener('scroll', detectEnd)
    }

    useEffect(() => {
        const sections = [
            { id: 'resumen', ref: refResumen },
            { id: 'nueva', ref: refNueva },
            { id: 'estadisticas', ref: refEstadisticas },
            { id: 'historial', ref: refHistorial },
            { id: 'reportes', ref: refReportes },
            { id: 'usuarios', ref: refUsuarios }
        ]

        // Observer para detectar qué sección está en pantalla al usar el mouse wheel
        const observer = new IntersectionObserver(
            entries => {
                // Si el scroll es provocado por un clic en el menú, ignoramos el observer
                if (isScrollingByClick.current) return

                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id)
                    }
                })
            },
            {
                threshold: 0.6 // La sección debe ocupar el 60% de la pantalla para activarse
            }
        )

        sections.forEach(section => {
            if (section.ref.current) {
                observer.observe(section.ref.current)
            }
        })

        // Cleanup al desmontar el componente
        return () => {
            sections.forEach(section => {
                if (section.ref.current) {
                    observer.unobserve(section.ref.current)
                }
            })
            if (scrollTimeout.current) {
                clearTimeout(scrollTimeout.current)
            }
        }
    }, [])

    // --- Gestión de Datos ---
    // Incidencias
    const [incidents, setIncidents] = useState([])
    // Modal de datos editables
    const [gestionOpen, setGestionOpen] = useState(false)
    // Usuarios
    const [users, setUsers] = useState([])
    // Carga de datos de usuarios
    const [loading, setLoading] = useState(true)
    // Ambientes
    const [ambientes, setAmbientes] = useState([])
    // Cursos
    const [cursos, setCursos] = useState([])
    // Categorías
    const [categorias, setCategorias] = useState([])
    // Cursos activos (para el dropdown de nueva incidencia)
    const cursosActivos = useMemo(() => {
        return cursos.filter(c => c.active)
    }, [cursos])

    // Hook para cargar las incidencias al montar el componente
    useEffect(() => {
        const fetchIncidents = async () => {
            try {
                const data = await incidentsService.getAll()
                setIncidents(data)
            } catch (error) {
                console.error('Error al cargar incidencias:', error)
            }
        }
        fetchIncidents()
    }, [])

    // Hook para cargar los ambientes al montar el componente
    useEffect(() => {
        const fetchAmbientes = async () => {
            try {
                const data = await ambientesService.getAll()
                setAmbientes(data)
            } catch (error) {
                console.error(error)
                window.alert('Error al cargar ambientes')
            }
        }
        fetchAmbientes()
    }, [])

    // Hook para cargar los cursos al montar el componente
    useEffect(() => {
        const fetchCursos = async () => {
            try {
                const cursos = await cursosService.getAll()
                setCursos(cursos)
            } catch (e) {
                console.error('Error al cargar cursos:', e)
            }
        }

        fetchCursos()
    }, [])

    // Hook para cargar las categorías al montar el componente
    useEffect(() => {
        const fetchCategorias = async () => {
            try {
                const categorias = await categoriasService.getAll()
                setCategorias(categorias)
            } catch (e) {
                console.error('Error al cargar categorías:', e)
            }
        }

        fetchCategorias()
    }, [])

    // Hook para cargar los usuarios al montar el componente (necesario para la sección de usuarios y los forms de registro y edición de incidencia)
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await userService.getAll()
                setUsers(data)
            } catch (error) {
                console.error('Error al cargar usuarios:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchUsers()
    }, [])

    // Usuarios de tipo de rol "Docente" para el dropdown de asignar incidencia
    const docentes = useMemo(() => {
        return users.filter(u => u.rol === 'Docente')
    }, [users])

    return (
        <div className="container-menu">
            <aside className="sidebar">
                <div className="logo">
                    <img
                        src='https://res.cloudinary.com/francode/image/upload/v1778545865/sci-logo-menu_lgeaxs.png'
                        alt="Logo SCI"
                        onClick={() => scrollTo(refResumen, 'resumen')}
                    />
                    <div className='info'>
                        <p className="user-name">
                            {nombreCorto(user.name, true)}
                        </p>
                        <p className="rol">Rol: {user.rol}</p>
                    </div>
                </div>

                <nav className="menu">
                    {hasAccess(user.rol, PERMISOS.nueva) && (
                        <button
                            className={`btn ${activeSection === 'nueva' ? 'active' : ''}`}
                            onClick={() => scrollTo(refNueva, 'nueva')}
                        >
                            ✍🏻 Nueva incidencia
                        </button>
                    )}

                    {hasAccess(user.rol, PERMISOS.historial) && (
                        <button
                            className={`btn ${activeSection === 'historial' ? 'active' : ''}`}
                            onClick={() => scrollTo(refHistorial, 'historial')}
                        >
                            📋 Incidencias
                        </button>
                    )}

                    {hasAccess(user.rol, PERMISOS.estadisticas) && (
                        <button
                            className={`btn 
                            ${activeSection === 'estadisticas' || activeSection === 'reportes'
                                    ? 'active' : ''}`}
                            onClick={() => scrollTo(refEstadisticas, 'estadisticas')}
                        >
                            📊 Análisis
                        </button>
                    )}

                    {hasAccess(user.rol, PERMISOS.usuarios) && (
                        <button
                            className={`btn ${activeSection === 'usuarios' ? 'active' : ''} users`}
                            onClick={() => scrollTo(refUsuarios, 'usuarios')}
                        >
                            <img src='https://res.cloudinary.com/francode/image/upload/v1778545885/users-icon_pwxkgd.png' alt="Icono de Usuarios" />
                            Usuarios
                        </button>
                    )}

                    {/* Footer del Sidebar: Salir y Configuración de DB */}
                    <div className="sidebar-footer-actions">
                        <button className="btn-salir" onClick={handleLogout}>
                            ⏻ salir
                        </button>

                        {(user.rol === 'Administrador' || user.rol === 'Administrativo') && (
                            <button
                                className="btn-db-admin"
                                title="Gestionar Cursos"
                                onClick={() => setGestionOpen(true)}
                            >
                                <img src='https://res.cloudinary.com/francode/image/upload/v1778545792/edit-db_b1ou3a.png' alt="DB Admin" />
                            </button>
                        )}
                    </div>
                </nav>

                <span className="version">V. 1.0</span>
            </aside>

            {/* Secciones principales */}
            <div className="secciones">
                {hasAccess(user.rol, PERMISOS.resumen) && (
                    <Resumen
                        ref={refResumen}
                        id="resumen"
                        incidents={incidents}
                        onAtenderClick={() => scrollTo(refHistorial, 'historial')}
                    />
                )}
                {hasAccess(user.rol, PERMISOS.nueva) && (
                    <NuevaIncidencia
                        ref={refNueva}
                        id="nueva"
                        setIncidents={setIncidents}
                        handleLogout={handleLogout}
                        cursosActivos={cursosActivos}
                        categorias={categorias}
                        ambientes={ambientes}
                        docentes={docentes}
                    />
                )}
                {hasAccess(user.rol, PERMISOS.historial) && (
                    <Historial
                        ref={refHistorial}
                        id="historial"
                        incidents={incidents}
                        setIncidents={setIncidents}
                        ambientes={ambientes}
                        cursosActivos={cursosActivos}
                        categorias={categorias}
                        docentes={docentes}
                    />
                )}
                {hasAccess(user.rol, PERMISOS.estadisticas) && (
                    <Estadisticas
                        ref={refEstadisticas}
                        id="estadisticas"
                        incidents={incidents}
                    />
                )}
                {hasAccess(user.rol, PERMISOS.reportes) && (
                    <Reportes
                        ref={refReportes}
                        id="reportes"
                        incidents={incidents}
                        resumenRef={refResumen}
                        estadisticasRef={refEstadisticas}
                    />
                )}
                {hasAccess(user.rol, PERMISOS.usuarios) && (
                    <Users
                        ref={refUsuarios}
                        id="usuarios"
                        users={users}
                        setUsers={setUsers}
                        loading={loading}
                    />
                )}
            </div>
            {gestionOpen && (
                <ModalGestion
                    ambientes={ambientes}
                    setAmbientes={setAmbientes}
                    cursos={cursos}
                    setCursos={setCursos}
                    categorias={categorias}
                    setCategorias={setCategorias}
                    onClose={() => setGestionOpen(false)}
                    handleLogout={handleLogout}
                />
            )}
        </div>
    )
}

export default Menu