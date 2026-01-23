import { useRef, useState, useEffect } from 'react'
import '../styles/Menu.css'
import incidentsService from '../services/incidents'

import logo from '../assets/sci-logo-menu.png'
import Resumen from './Resumen'
import NuevaIncidencia from './NuevaIncidencia'
import Estadisticas from './Estadisticas'
import Historial from './Historial'
import Reportes from './Reportes'

const Menu = ({ user, handleLogout }) => {
    // Refs a cada sección del DOM
    const refResumen = useRef(null)
    const refNueva = useRef(null)
    const refEstadisticas = useRef(null)
    const refHistorial = useRef(null)
    const refReportes = useRef(null)

    // Sección activa (para resaltar el botón)
    const [activeSection, setActiveSection] = useState('resumen')

    // Bandera para saber si el scroll fue por clic
    const isScrollingByClick = useRef(false)

    // Temporizador para detectar el fin del scroll manual
    const scrollTimeout = useRef(null)

    // Scroll suave hacia una sección (usado al hacer clic en los botones)
    const scrollTo = (ref, sectionName) => {
        if (!ref.current) return

        isScrollingByClick.current = true // Evitamos que el observer actúe durante el scroll animado
        setActiveSection(sectionName)     // Activamos el botón inmediatamente

        ref.current.scrollIntoView({ behavior: 'smooth' })

        // Una vez pasado el scroll animado, volvemos a permitir que el observer actúe
        setTimeout(() => {
            isScrollingByClick.current = false
        }, 1000)
    }

    useEffect(() => {
        // Todas las secciones a observar
        const sections = [
            { id: 'resumen', ref: refResumen },
            { id: 'nueva', ref: refNueva },
            { id: 'estadisticas', ref: refEstadisticas },
            { id: 'historial', ref: refHistorial },
            { id: 'reportes', ref: refReportes },
        ]

        // Observer para detectar cuál sección está visible
        const observer = new IntersectionObserver(
            entries => {
                if (isScrollingByClick.current) return // Si es scroll por clic, ignoramos

                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id) // Activamos el botón correspondiente
                    }
                })
            },
            {
                threshold: 0.6 // Al menos el 60% visible para activar
            }
        )

        // Observar cada sección
        sections.forEach(section => {
            if (section.ref.current) {
                observer.observe(section.ref.current)
            }
        })

        // Detectar scroll manual (rueda o teclado) y reiniciar la bandera
        const handleScroll = () => {
            if (isScrollingByClick.current) return

            // Si hay un timeout previo, lo cancelamos
            if (scrollTimeout.current) {
                clearTimeout(scrollTimeout.current)
            }

            // Reiniciamos la bandera después de 100ms sin scroll (scroll manual terminado)
            scrollTimeout.current = setTimeout(() => {
                isScrollingByClick.current = false
            }, 1000)
        }

        window.addEventListener('scroll', handleScroll)

        // Cleanup al desmontar
        return () => {
            sections.forEach(section => {
                if (section.ref.current) {
                    observer.unobserve(section.ref.current)
                }
            })

            window.removeEventListener('scroll', handleScroll)
            if (scrollTimeout.current) {
                clearTimeout(scrollTimeout.current)
            }
        }
    }, [])

    // Incidencias centralizadas (estado compartido entre secciones)
    const [incidents, setIncidents] = useState([])

    // Cargar incidencias una vez al inicio
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

    return (
        <div className="container-menu">
            <aside className="sidebar">
                <div className="logo">
                    <img
                        src={logo}
                        alt="Logo SCI"
                        onClick={() => scrollTo(refResumen, 'resumen')}
                    />
                    <div className='info'>
                        <p className="bienvenida">¡ Bienvenido, {user.name} !</p>
                        <p className="rol">Rol: {user.rol}</p>
                    </div>
                </div>

                <nav className="menu">
                    <button
                        className={`btn ${activeSection === 'nueva' ? 'active' : ''}`}
                        onClick={() => scrollTo(refNueva, 'nueva')}
                    >
                        ➕ Nueva incidencia
                    </button>
                    <button
                        className={`btn ${activeSection === 'estadisticas' ? 'active' : ''}`}
                        onClick={() => scrollTo(refEstadisticas, 'estadisticas')}
                    >
                        📊 Estadísticas
                    </button>
                    <button
                        className={`btn ${activeSection === 'historial' ? 'active' : ''}`}
                        onClick={() => scrollTo(refHistorial, 'historial')}
                    >
                        📂 Historial
                    </button>
                    <button
                        className={`btn ${activeSection === 'reportes' ? 'active' : ''}`}
                        onClick={() => scrollTo(refReportes, 'reportes')}
                    >
                        📑 Generar reportes
                    </button>
                    <button className="btn btn-salir" onClick={handleLogout}>⏻ salir</button>
                </nav>

                <p className="version">V. 1.0</p>
            </aside>

            {/* Secciones principales */}
            <div className="secciones">
                <Resumen
                    ref={refResumen}
                    id="resumen"
                    incidents={incidents} // Pasamos las incidencias al resumen
                    onAtenderClick={() => scrollTo(refHistorial, 'historial')} // Función para el botón atender
                />
                <NuevaIncidencia
                    ref={refNueva}
                    id="nueva"
                    user={user}
                    setIncidents={setIncidents} // Pasamos la función para actualizar las incidencias
                    handleLogout={handleLogout} // Pasamos la función de logout por si hay error de token
                />
                <Estadisticas
                    ref={refEstadisticas}
                    id="estadisticas"
                    incidents={incidents} // Pasamos las incidencias a las estadísticas
                />
                <Historial
                    ref={refHistorial}
                    id="historial"
                    incidents={incidents} // Pasamos las incidencias al historial
                    setIncidents={setIncidents} // Pasamos la función para actualizar las incidencias
                />
                <Reportes
                    ref={refReportes}
                    id="reportes"
                    incidents={incidents} // Pasamos las incidencias a los reportes
                />
            </div>
        </div>
    )
}

export default Menu
