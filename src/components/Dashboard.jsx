import { useRef, useState, useEffect, useMemo } from 'react'
import '../styles/Dashboard.css'

import incidentsService from '../services/incidents'
import ambientesService from '../services/ambientes'
import cursosService from '../services/cursos'
import categoriasService from '../services/categorias'
import userService from '../services/users'

import Menu from './Menu'
import Resumen from './Resumen'
import NuevaIncidencia from './NuevaIncidencia'
import Estadisticas from './Estadisticas'
import Historial from './Historial'
import Reportes from './Reportes'
import Users from './Users'
import ModalGestion from './ModalGestion'

import hasAccess from '../utils/auth/hasAccess'
import PERMISOS from '../utils/auth/permisosRol'

const Dashboard = ({
    user,
    handleLogout
}) => {
    // Sidebar
    const [menuOpen, setMenuOpen] = useState(false)

    // Modal de gestión
    const [gestionOpen, setGestionOpen] = useState(false)

    // Sección activa
    const [activeSection, setActiveSection] = useState('resumen')

    // Refs
    const refResumen = useRef(null)
    const refNueva = useRef(null)
    const refEstadisticas = useRef(null)
    const refHistorial = useRef(null)
    const refReportes = useRef(null)
    const refUsuarios = useRef(null)

    // Control del observer
    const isScrollingByClick = useRef(false)
    const scrollTimeout = useRef(null)

    // Datos
    const [incidents, setIncidents] = useState([])
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)

    const [ambientes, setAmbientes] = useState([])
    const [cursos, setCursos] = useState([])
    const [categorias, setCategorias] = useState([])

    // Cursos activos
    const cursosActivos = useMemo(
        () => cursos.filter(c => c.active),
        [cursos]
    )

    // Docentes
    const docentes = useMemo(
        () => users.filter(u => u.rol === 'Docente'),
        [users]
    )

    // Navegación
    const scrollTo = (ref, sectionName) => {
        if (!ref.current) return

        isScrollingByClick.current = true

        setActiveSection(sectionName)

        ref.current.scrollIntoView({
            behavior: 'smooth'
        })

        const detectEnd = () => {
            if (scrollTimeout.current) {
                clearTimeout(scrollTimeout.current)
            }

            scrollTimeout.current = setTimeout(() => {
                isScrollingByClick.current = false
                window.removeEventListener(
                    'scroll',
                    detectEnd
                )
            }, 150)
        }

        window.addEventListener(
            'scroll',
            detectEnd
        )

        if (window.innerWidth <= 768) {
            setMenuOpen(false)
        }
    }

    // Observer de secciones
    useEffect(() => {
        const sections = [
            { id: 'resumen', ref: refResumen },
            { id: 'nueva', ref: refNueva },
            { id: 'estadisticas', ref: refEstadisticas },
            { id: 'historial', ref: refHistorial },
            { id: 'reportes', ref: refReportes },
            { id: 'usuarios', ref: refUsuarios }
        ]

        const observer = new IntersectionObserver(
            entries => {
                if (isScrollingByClick.current) return

                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id)
                    }
                })
            },
            {
                threshold: 0.6
            }
        )

        sections.forEach(section => {
            if (section.ref.current) {
                observer.observe(section.ref.current)
            }
        })

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

    // Incidencias
    useEffect(() => {
        const fetchIncidents = async () => {
            try {
                const data =
                    await incidentsService.getAll()

                setIncidents(data)
            } catch (error) {
                console.error(
                    'Error al cargar incidencias:',
                    error
                )
            }
        }

        fetchIncidents()
    }, [])

    // Ambientes
    useEffect(() => {
        const fetchAmbientes = async () => {
            try {
                const data =
                    await ambientesService.getAll()

                setAmbientes(data)
            } catch (error) {
                console.error(error)
            }
        }

        fetchAmbientes()
    }, [])

    // Cursos
    useEffect(() => {
        const fetchCursos = async () => {
            try {
                const data =
                    await cursosService.getAll()

                setCursos(data)
            } catch (error) {
                console.error(
                    'Error al cargar cursos:',
                    error
                )
            }
        }

        fetchCursos()
    }, [])

    // Categorías
    useEffect(() => {
        const fetchCategorias = async () => {
            try {
                const data =
                    await categoriasService.getAll()

                setCategorias(data)
            } catch (error) {
                console.error(
                    'Error al cargar categorías:',
                    error
                )
            }
        }

        fetchCategorias()
    }, [])

    // Usuarios
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data =
                    await userService.getAll()

                setUsers(data)
            } catch (error) {
                console.error(
                    'Error al cargar usuarios:',
                    error
                )
            } finally {
                setLoading(false)
            }
        }

        fetchUsers()
    }, [])

    return (
        <div className="container-menu">
            <Menu
                user={user}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                activeSection={activeSection}
                scrollTo={scrollTo}
                refResumen={refResumen}
                refNueva={refNueva}
                refHistorial={refHistorial}
                refEstadisticas={refEstadisticas}
                refUsuarios={refUsuarios}
                handleLogout={handleLogout}
                setGestionOpen={setGestionOpen}
            />

            <main
                className={`main-content ${menuOpen
                    ? 'sidebar-open'
                    : 'sidebar-closed'
                    }`}
            >
                <div className="secciones">
                    {hasAccess(user.rol, PERMISOS.resumen) && (
                        <Resumen
                            ref={refResumen}
                            id="resumen"
                            incidents={incidents}
                            onAtenderClick={() =>
                                scrollTo(
                                    refHistorial,
                                    'historial'
                                )
                            }
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
            </main>

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

export default Dashboard