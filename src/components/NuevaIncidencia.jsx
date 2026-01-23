import { forwardRef, useState, useEffect, useMemo } from 'react'

import '../styles/NuevaIncidencia.css'
import { formatActivo } from '../utils/formatActivo'
import incidentsService from '../services/incidents'

import cancelar from '../assets/cancelar.png'
import guardar from '../assets/guardar.png'
import pcD from '../assets/pc-docente.png'
import pcE from '../assets/pc-estudiante.png'
import proyector from '../assets/proyector.png'
import ecran from '../assets/ecran.png'
import control from '../assets/control.png'
import pizarra from '../assets/pizarra.png'
import cortinas from '../assets/cortinas.png'
import extintor from '../assets/extintor.png'
import puertas from '../assets/puertas.png'
import estantes from '../assets/estantes.png'
import servidor from '../assets/servidor.png'
import EdPc from '../assets/ed-pc.png'
import escritorio from '../assets/escritorio.png'
import carpeta from '../assets/carpeta.png'
import silla from '../assets/silla.png'
import mesa from '../assets/mesa.png'

// Función de ordenamiento reutilizable
const sortActivos = (set) => {
    return Array.from(set).sort((a, b) => {
        if (a === 'pcD') return -1
        if (b === 'pcD') return 1

        const isANum = typeof a === 'number'
        const isBNum = typeof b === 'number'
        if (isANum && isBNum) return a - b
        if (isANum && !isBNum) return -1
        if (!isANum && isBNum) return 1

        return String(a).localeCompare(String(b))
    })
}

// Configuración centralizada por procedencia
const CONFIGS = {
    'Laboratorio 1': {
        pcs: Array.from({ length: 35 }, (_, i) => i + 1),
        gridCols: 5,
        pasadizoCondition: (i) => (i + 1) % 5 === 3,
        pceWidth: '55px',
        pceHeight: '50px',
        extras: [
            { name: 'Proyector', img: proyector },
            { name: 'Ecran', img: ecran },
            { name: 'Control', img: control },
            { name: 'Pizarra', img: pizarra },
            { name: 'Cortinas', img: cortinas },
            { name: 'Extintor', img: extintor },
            { name: 'Puertas', img: puertas },
            { name: 'Estantes', img: estantes }
        ]
    },
    'Laboratorio 2': {
        pcs: Array.from({ length: 32 }, (_, i) => i + 1),
        gridCols: 4,
        pasadizoCondition: (i) => (i + 1) % 4 === 2,
        pceWidth: '55px',
        pceHeight: '50px',
        extras: [
            { name: 'Proyector', img: proyector },
            { name: 'Ecran', img: ecran },
            { name: 'Control', img: control },
            { name: 'Pizarra', img: pizarra },
            { name: 'Cortinas', img: cortinas },
            { name: 'Extintor', img: extintor },
            { name: 'Puertas', img: puertas },
            { name: 'Estantes', img: estantes }
        ]
    },
    'Laboratorio 3': {
        pcs: Array.from({ length: 35 }, (_, i) => i + 1),
        gridCols: 5,
        pasadizoCondition: (i) => (i + 1) % 5 === 3,
        pceWidth: '55px',
        pceHeight: '50px',
        extras: [
            { name: 'Proyector', img: proyector },
            { name: 'Ecran', img: ecran },
            { name: 'Control', img: control },
            { name: 'Pizarra', img: pizarra },
            { name: 'Cortinas', img: cortinas },
            { name: 'Extintor', img: extintor },
            { name: 'Puertas', img: puertas },
            { name: 'Estantes', img: estantes },
            { name: 'Servidor', img: servidor }
        ]
    },
    'Laboratorio 4': {
        pcs: Array.from({ length: 24 }, (_, i) => i + 1),
        gridCols: 6,
        pasadizoCondition: () => false,
        pceWidth: '50px',
        pceHeight: '45px',
        extras: [
            { name: 'Proyector', img: proyector },
            { name: 'Ecran', img: ecran },
            { name: 'Control', img: control },
            { name: 'Pizarra', img: pizarra },
            { name: 'Cortinas', img: cortinas },
            { name: 'Extintor', img: extintor },
            { name: 'Puertas', img: puertas },
            { name: 'Estantes', img: estantes },
            { name: 'Servidor', img: servidor }
        ]
    },
    'Aula 1': {
        equipo_docente: [
            { name: 'PC', img: EdPc },
            { name: 'Silla', img: silla },
            { name: 'Escritorio', img: escritorio },
        ],
        proyector: [
            { name: 'Proyector', img: proyector },
            { name: 'Control', img: control },
            { name: 'Ecran', img: ecran },

        ],
        mobiliario: [
            { name: 'Carpetas', img: carpeta },
            { name: 'Estantes', img: estantes },
        ],
        otros: [
            { name: 'Pizarra', img: pizarra },
            { name: 'Cortinas', img: cortinas },
            { name: 'Puertas', img: puertas },
            { name: 'Extintor', img: extintor },
        ]
    },
    'Aula 2': {
        equipo_docente: [
            { name: 'PC', img: EdPc },
            { name: 'Silla', img: silla },
            { name: 'Escritorio', img: escritorio },
        ],
        proyector: [
            { name: 'Proyector', img: proyector },
            { name: 'Control', img: control },
            { name: 'Ecran', img: ecran },

        ],
        mobiliario: [
            { name: 'Carpetas', img: carpeta },
            { name: 'Estantes', img: estantes },
        ],
        otros: [
            { name: 'Pizarra', img: pizarra },
            { name: 'Cortinas', img: cortinas },
            { name: 'Puertas', img: puertas },
            { name: 'Extintor', img: extintor },
        ]
    },
    'Aula 3': {
        equipo_docente: [
            { name: 'PC', img: EdPc },
            { name: 'Silla', img: silla },
            { name: 'Escritorio', img: escritorio },
        ],
        proyector: [
            { name: 'Proyector', img: proyector },
            { name: 'Control', img: control },
            { name: 'Ecran', img: ecran },

        ],
        mobiliario: [
            { name: 'Carpetas', img: carpeta },
            { name: 'Estantes', img: estantes },
        ],
        otros: [
            { name: 'Pizarra', img: pizarra },
            { name: 'Cortinas', img: cortinas },
            { name: 'Puertas', img: puertas },
            { name: 'Extintor', img: extintor },
        ]
    },
    'Aula 4': {
        equipo_docente: [
            { name: 'PC', img: EdPc },
            { name: 'Silla', img: silla },
            { name: 'Escritorio', img: escritorio },
        ],
        proyector: [
            { name: 'Proyector', img: proyector },
            { name: 'Control', img: control },
            { name: 'Ecran', img: ecran },

        ],
        mobiliario: [
            { name: 'Sillas', img: silla },
            { name: 'Mesas', img: mesa },
            { name: 'Estantes', img: estantes },
        ],
        otros: [
            { name: 'Pizarra', img: pizarra },
            { name: 'Cortinas', img: cortinas },
            { name: 'Puertas', img: puertas },
            { name: 'Extintor', img: extintor },
        ]
    },
    'Aula 5': {
        equipo_docente: [
            { name: 'PC', img: EdPc },
            { name: 'Silla', img: silla },
            { name: 'Escritorio', img: escritorio },
        ],
        proyector: [
            { name: 'Proyector', img: proyector },
            { name: 'Control', img: control },
            { name: 'Ecran', img: ecran },

        ],
        mobiliario: [
            { name: 'Carpetas', img: carpeta },
            { name: 'Estantes', img: estantes },
        ],
        otros: [
            { name: 'Pizarra', img: pizarra },
            { name: 'Cortinas', img: cortinas },
            { name: 'Puertas', img: puertas },
            { name: 'Extintor', img: extintor },
        ]
    },
    'Aula 6': {
        equipo_docente: [
            { name: 'PC', img: EdPc },
            { name: 'Silla', img: silla },
            { name: 'Escritorio', img: escritorio },
        ],
        proyector: [
            { name: 'Proyector', img: proyector },
            { name: 'Control', img: control },
            { name: 'Ecran', img: ecran },

        ],
        mobiliario: [
            { name: 'Sillas', img: silla },
            { name: 'Mesas', img: mesa },
            { name: 'Estantes', img: estantes },
        ],
        otros: [
            { name: 'Pizarra', img: pizarra },
            { name: 'Cortinas', img: cortinas },
            { name: 'Puertas', img: puertas },
            { name: 'Extintor', img: extintor },
        ]
    },
    'Aula 7': {
        equipo_docente: [
            { name: 'PC', img: EdPc },
            { name: 'Silla', img: silla },
            { name: 'Escritorio', img: escritorio },
        ],
        proyector: [
            { name: 'Proyector', img: proyector },
            { name: 'Control', img: control },
            { name: 'Ecran', img: ecran },

        ],
        mobiliario: [
            { name: 'Carpetas', img: carpeta },
            { name: 'Estantes', img: estantes },
        ],
        otros: [
            { name: 'Pizarra', img: pizarra },
            { name: 'Cortinas', img: cortinas },
            { name: 'Puertas', img: puertas },
            { name: 'Extintor', img: extintor },
        ]
    },
    'Aula 8': {
        equipo_docente: [
            { name: 'PC', img: EdPc },
            { name: 'Silla', img: silla },
            { name: 'Escritorio', img: escritorio },
        ],
        proyector: [
            { name: 'Proyector', img: proyector },
            { name: 'Control', img: control },
            { name: 'Ecran', img: ecran },

        ],
        mobiliario: [
            { name: 'Sillas', img: silla },
            { name: 'Mesas', img: mesa },
            { name: 'Estantes', img: estantes },
        ],
        otros: [
            { name: 'Pizarra', img: pizarra },
            { name: 'Cortinas', img: cortinas },
            { name: 'Puertas', img: puertas },
            { name: 'Extintor', img: extintor },
        ]
    }
}

const NuevaIncidencia = forwardRef(({ id, user, setIncidents, handleLogout }, ref) => {
    const today = new Date().toLocaleDateString('es-PE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })

    const [formData, setFormData] = useState({
        curso: '',
        docente: '',
        procedencia: '',
        prioridad: '',
        activosReportados: [],
        observaciones: ''
    })

    const [activosReportados, setActivosReportados] = useState(new Set())

    const sortedActivos = useMemo(
        () => sortActivos(activosReportados),
        [activosReportados]
    )

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            activosReportados: sortedActivos
        }))
    }, [sortedActivos])

    const handleChange = (e) => {
        const { id, value } = e.target
        if (id === 'procedencia') setActivosReportados(new Set())
        setFormData((prev) => ({ ...prev, [id]: value }))
    }

    const handleToggleActivosReportados = (activoId) => {
        setActivosReportados((prev) => {
            const upd = new Set(prev)
            if (upd.has(activoId)) upd.delete(activoId)
            else upd.add(activoId)
            return upd
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        for (const [key, value] of Object.entries(formData)) {
            if (
                (Array.isArray(value) && value.length === 0) ||
                (!Array.isArray(value) && !value)
            ) {
                alert(`Datos incompletos: Seleccione o ingrese ${key}`)
                return
            }
        }

        try {
            incidentsService.setToken(user.token)
            const saved = await incidentsService.createIncident(formData)
            setIncidents((prev) => [saved, ...prev])
        } catch (error) {
            if (error.response?.status === 401) {
                const msg = error.response.data?.error
                if (msg === "token expired") {
                    window.alert("Su token de autenticación ha expirado, por favor vuelva a iniciar sesión")
                } else if (msg === "token invalid") {
                    window.alert("Token inválido, vuelva a iniciar sesión")
                } else {
                    window.alert("Error de autenticación, por favor vuelva a iniciar sesión")
                }
                // 🔑 Función de logout pasada desde Menu.jsx en caso de error de token
                handleLogout()
            } else {
                window.alert("Error al guardar la incidencia")
            }
            console.error('Error al guardar la incidencia:', error)
        }

        setFormData({
            curso: '',
            docente: '',
            procedencia: '',
            prioridad: '',
            activosReportados: [],
            observaciones: ''
        })
        setActivosReportados(new Set())
    }

    const config = CONFIGS[formData.procedencia]

    return (
        <section className="formulario-panel" ref={ref} id={id}>
            <div className="formulario">
                <h1>NUEVA INCIDENCIA</h1>
                <p className="fecha">{today}</p>

                <form className="form-grid" id="formulario" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="curso">CURSO</label>
                        <select id="curso" value={formData.curso} onChange={handleChange}>
                            <option value="">Seleccione</option>
                            <option>Curso 1</option>
                            <option>Curso 2</option>
                            <option>Curso 3</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="docente">DOCENTE</label>
                        <select id="docente" value={formData.docente} onChange={handleChange}>
                            <option value="">Seleccione</option>
                            <option>Docente 1</option>
                            <option>Docente 2</option>
                            <option>Docente 3</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="procedencia">PROCEDENCIA</label>
                        <select
                            id="procedencia"
                            value={formData.procedencia}
                            onChange={handleChange}
                        >
                            <option value="">Seleccione</option>
                            <option>Laboratorio 1</option>
                            <option>Laboratorio 2</option>
                            <option>Laboratorio 3</option>
                            <option>Laboratorio 4</option>
                            <option>Aula 1</option>
                            <option>Aula 2</option>
                            <option>Aula 3</option>
                            <option>Aula 4</option>
                            <option>Aula 5</option>
                            <option>Aula 6</option>
                            <option>Aula 7</option>
                            <option>Aula 8</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="prioridad">PRIORIDAD</label>
                        <select
                            id="prioridad"
                            value={formData.prioridad}
                            onChange={handleChange}
                        >
                            <option value="">Seleccione</option>
                            <option>Alta</option>
                            <option>Media</option>
                            <option>Baja</option>
                        </select>
                    </div>

                    <textarea
                        id="observaciones"
                        value={formData.observaciones}
                        onChange={handleChange}
                        placeholder="Observaciones"
                        className="observaciones"
                    ></textarea>
                </form>

                <div className="form-buttons">
                    <button
                        type="button"
                        className="btn-cancelar"
                        onClick={() => {
                            setFormData({
                                curso: '',
                                docente: '',
                                procedencia: '',
                                prioridad: '',
                                activosReportados: [],
                                observaciones: ''
                            })
                            setActivosReportados(new Set())
                        }}
                    >
                        <img src={cancelar} alt="cancelar-icono" />
                        cancelar
                    </button>
                    <button type="submit" form="formulario" className="btn-guardar">
                        <img src={guardar} alt="guardar-icono" />
                        guardar
                    </button>
                </div>
            </div>

            <div className="lista-reportados">
                <h4>Activos afectados</h4>
                <ul>
                    {sortedActivos.map((activo, i) => (
                        <li key={i}>
                            {formatActivo(activo)}
                        </li>
                    ))}
                </ul>
            </div>
            {config && (
                <>
                    {formData.procedencia.startsWith("Laboratorio") ? (
                        <>
                            {/* ----- Render de Laboratorios ----- */}
                            <div className="mapa-pcs">
                                <div className="header">
                                    <h2>{formData.procedencia}</h2>
                                    <img
                                        src={pcD}
                                        alt="PC Docente"
                                        onClick={() => handleToggleActivosReportados('pcD')}
                                        className={`pc-docente ${activosReportados.has('pcD') ? 'reportado' : ''}`}
                                    />
                                </div>

                                <div
                                    className="body"
                                    style={{ gridTemplateColumns: `repeat(${config.gridCols}, auto)` }}
                                >
                                    {config.pcs.map((pc, i) => (
                                        <div
                                            key={pc}
                                            className={`pc-estudiante ${config.pasadizoCondition(i) ? 'pasadizo' : ''} ${activosReportados.has(pc) ? 'reportado' : ''}`}
                                            onClick={() => handleToggleActivosReportados(pc)}
                                            style={{ width: config.pceWidth, height: config.pceHeight }}
                                        >
                                            <span className="pc-numero">{pc}</span>
                                            <img src={pcE} alt={`PC ${pc}`} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mapa-extras">
                                {config.extras.map((activo, i) => (
                                    <div
                                        key={i}
                                        className={`activo-extra ${activosReportados.has(activo.name) ? 'reportado' : ''}`}
                                        onClick={() => handleToggleActivosReportados(activo.name)}
                                    >
                                        <span>{activo.name}</span>
                                        <img src={activo.img} alt={activo.name} />
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* ----- Render de Aulas ----- */}
                            <div className="mapa-aula">
                                <h2>{formData.procedencia}</h2>
                                <div className="aula-grid">
                                    {Object.entries(config).map(([categoria, activos], i) => (
                                        <div key={i} className="aula-col">
                                            <h3>{categoria.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</h3>
                                            {activos.map((activo, j) => (
                                                <div
                                                    key={j}
                                                    className={`activo-extra ${activosReportados.has(activo.name) ? 'reportado' : ''}`}
                                                    onClick={() => handleToggleActivosReportados(activo.name)}
                                                >
                                                    <span>{activo.name}</span>
                                                    <img src={activo.img} alt={activo.name} />
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
        </section>
    )
})

export default NuevaIncidencia
