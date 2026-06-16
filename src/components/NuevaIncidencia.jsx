import { forwardRef, useState, useEffect, useMemo, useRef } from 'react'
import toast from 'react-hot-toast'
import Notificacion from './Notificacion'

import '../styles/NuevaIncidencia.css'
import { formatActivo } from '../utils/activos/formatActivo'
import { getTodayLocalISO, formatFechaLarga } from '../utils/formatFecha'
import { nombreCorto } from "../utils/nombreCorto"
import incidentsService from '../services/incidents'
import useClickOutside from '../utils/hooks/useClickOutside'
import agruparActivosPorCategoria from '../utils/activos/agruparActivos'
import handleInputChange from '../utils/forms/handleInputChange'
import toggleActivo from '../utils/activos/toggleActivo'
import sortActivos from '../utils/activos/sortActivos'
import triggerFileInput from '../utils/forms/triggerFileInput'
import ACTIVOS from '../constants/activos'

const NuevaIncidencia = forwardRef(({ id, setIncidents, cursosActivos, categorias, ambientes, docentes, handleLogout }, ref) => {
    const [savingIncident, setSavingIncident] = useState(false)
    const todayISO = getTodayLocalISO()
    const fileInputRef = useRef(null)
    const formRef = useRef(null)
    const [fotoIncidencia, setFotoIncidencia] = useState(null)
    const [menuAbierto, setMenuAbierto] = useState(null)
    const [activeSubMenu, setActiveSubMenu] = useState(null)
    const [formData, setFormData] = useState({
        fechaRegistro: todayISO,
        curso: '',
        docente: '',
        prioridad: '',
        categoria: '',
        subcategoria: '',
        procedencia: '',
        responsable: '',
        activosReportados: [],
        observaciones: '',
    })

    // Hook para cerrar menús al hacer clic fuera del formulario
    useEffect(() => {
        // Esta función se ejecuta en cada clic en el documento
        const handleClickOutside = (event) => {
            // Verificamos si hay un menú abierto Y si el clic NO ocurrió dentro del formulario
            if (menuAbierto && formRef.current && !formRef.current.contains(event.target)) {
                setMenuAbierto(null) // Cierra el menú activo
                setActiveSubMenu(null) // Resetea el submenú de categoría si estaba abierto
            }
        }

        // Añadimos el escuchador de eventos al montar el componente
        document.addEventListener('mousedown', handleClickOutside)

        // Función de limpieza: se ejecuta al desmontar el componente
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [menuAbierto])

    const handleSeleccionCompleta = (categoria, subcategoria) => {
        setFormData((prev) => ({
            ...prev,
            categoria: categoria,
            subcategoria: subcategoria
        }))
        setMenuAbierto(null)
        setActiveSubMenu(null)
    }

    const fechaFormateada = formatFechaLarga(formData.fechaRegistro)
    const ambiente = ambientes.find(
        amb => amb.nombre === formData.procedencia
    )
    const [activosReportados, setActivosReportados] = useState(new Set())

    // Memorizamos el resultado de ordenar los activos para evitar cálculos innecesarios en cada renderizado
    const sortedActivos = useMemo(
        () => sortActivos(activosReportados),
        [activosReportados]
    )

    // Sincronizamos el estado formData.activosReportados con el Set de activosReportados cada vez que este último cambia
    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            activosReportados: sortedActivos
        }))
    }, [sortedActivos])

    // 1. Añade un estado para la URL de vista previa
    const [previewUrl, setPreviewUrl] = useState(null)

    // 2. Este useEffect gestiona la creación y limpieza de la URL
    useEffect(() => {
        if (!fotoIncidencia) {
            setPreviewUrl(null)
            return
        }

        // Crear la URL solo cuando cambia la foto
        const objectUrl = URL.createObjectURL(fotoIncidencia)
        setPreviewUrl(objectUrl)

        // Función de limpieza: Se ejecuta cuando el componente se desmonta 
        // o antes de crear la siguiente URL
        return () => URL.revokeObjectURL(objectUrl)
    }, [fotoIncidencia])

    const handleChange = (e) => {
        handleInputChange({
            e,
            setFormData,
            setActivosReportados
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (savingIncident) return // Evita envíos múltiples

        try {
            setSavingIncident(true)

            const data = new FormData()

            Object.entries(formData).forEach(([key, value]) => {
                if (value !== null && value !== '' && value !== undefined) {
                    if (Array.isArray(value)) {
                        value.forEach(v => data.append(key, v))
                    } else {
                        data.append(key, value)
                    }
                }
            })

            if (fotoIncidencia) {
                data.append('imagen', fotoIncidencia) // 👈 coincide con el esquema
            }

            const saved = await incidentsService.createIncident(data)
            toast.success('Incidencia registrada correctamente')

            setIncidents(prev => [saved, ...prev])
        } catch (error) {
            // 🔴 Error de validación del modelo
            if (error.response?.status === 400) {
                toast.error(`${error.response.data?.error}:\n- ${error.response.data.detalles.join('.\n- ')}`)
            }
            // 🔑 Error de autenticación
            else if (error.response?.status === 401) {
                toast.error('Sesión expirada, vuelva a iniciar sesión')
                handleLogout()
            }
            // 🔥 Otros errores
            else {
                toast.error('Error al guardar la incidencia')
            }

            console.error(error)
        } finally {
            setSavingIncident(false)
        }

        setFormData({
            fechaRegistro: todayISO,
            curso: '',
            docente: '',
            prioridad: '',
            categoria: '',
            subcategoria: '',
            procedencia: '',
            responsable: '',
            activosReportados: [],
            observaciones: '',
        })

        setFotoIncidencia(null)
        setActivosReportados(new Set())

        // ✅ LÍNEA CLAVE: Resetea el valor del input nativo
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const cols =
        Number(ambiente?.configuracion?.nColumnas)

    const colPasadizo =
        Number(ambiente?.configuracion?.nColumnaPasadizo)

    // Construcción del grid
    const templateColumns = []

    // Caso especial:
    // pasadizo antes de la primera columna
    if (colPasadizo === 0) {
        templateColumns.push('20px')
    }

    for (let i = 1; i <= cols; i++) {

        // columna normal
        templateColumns.push('1fr')

        // pasadizo después de esta columna
        if (i === colPasadizo) {
            templateColumns.push('20px')
        }
    }

    return (
        <>
            <section className="formulario-panel" ref={ref} id={id}>
                <div className="formulario">
                    <h1>NUEVA INCIDENCIA</h1>
                    <div className="fecha-container">
                        <p className='fecha'>{fechaFormateada}</p>
                        <div className="calendar-wrapper">
                            <img
                                src='https://res.cloudinary.com/francode/image/upload/v1778545755/calendar-icon_ml7tq5.png'
                                alt="Seleccionar fecha"
                                className="calendar-icon"
                            />
                            <input
                                className="fecha-input"
                                type="date"
                                id="fechaRegistro"
                                value={formData.fechaRegistro}
                                onChange={handleChange}
                            />
                        </div>

                        <span className='input-required' aria-hidden="true">*</span>
                    </div>

                    <form className="form-grid" id="formulario" onSubmit={handleSubmit} ref={formRef}>

                        {/* --- SELECT CURSO --- */}
                        <div className="form-group custom-select-group">
                            <label>CURSO <span className='input-required'>*</span></label>
                            <div
                                className={`custom-select-trigger ${!formData.curso ? 'is-empty' : ''}`}
                                onClick={() => setMenuAbierto(menuAbierto === 'curso' ? false : 'curso')}
                            >
                                <span className="select-text-value">
                                    {formData.curso || "Seleccione"}
                                </span>
                                <span className={`arrow-icon ${menuAbierto === 'curso' ? 'open' : ''}`}></span>
                            </div>
                            {menuAbierto === 'curso' && (
                                <div className="custom-dropdown-container">
                                    <ul className="main-category-list">
                                        {cursosActivos.map((curso) => (
                                            <li
                                                key={curso.id}
                                                className="submenu-item"
                                                onClick={() => {
                                                    setFormData({ ...formData, curso: curso.nombre })
                                                    setMenuAbierto(false)
                                                }}
                                            >
                                                {curso.nombre}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* --- SELECT DOCENTE --- */}
                        <div className="form-group custom-select-group">
                            <label>DOCENTE <span className='input-required'>*</span></label>
                            <div
                                className={`custom-select-trigger ${!formData.docente ? 'is-empty' : ''}`}
                                onClick={() => setMenuAbierto(menuAbierto === 'docente' ? false : 'docente')}
                            >
                                <span className="select-text-value">
                                    {nombreCorto(formData.docente, false) || "Seleccione"}
                                </span>
                                <span className={`arrow-icon ${menuAbierto === 'docente' ? 'open' : ''}`}></span>
                            </div>
                            {menuAbierto === 'docente' && (
                                <div className="custom-dropdown-container">
                                    <ul className="main-category-list">
                                        {docentes.map((doc) => (
                                            <li
                                                key={doc.id}
                                                className="submenu-item"
                                                onClick={() => {
                                                    setFormData({ ...formData, docente: doc.name })
                                                    setMenuAbierto(false)
                                                }}
                                            >
                                                {nombreCorto(doc.name, false)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* --- SELECT PRIORIDAD --- */}
                        <div className="form-group custom-select-group">
                            <label>PRIORIDAD <span className='input-required'>*</span></label>
                            <div
                                className={`custom-select-trigger ${!formData.prioridad ? 'is-empty' : ''}`}
                                onClick={() => setMenuAbierto(menuAbierto === 'prioridad' ? false : 'prioridad')}
                            >
                                <span className="select-text-value">
                                    {formData.prioridad || "Seleccione"}
                                </span>
                                <span className={`arrow-icon ${menuAbierto === 'prioridad' ? 'open' : ''}`}></span>
                            </div>
                            {menuAbierto === 'prioridad' && (
                                <div className="custom-dropdown-container">
                                    <ul className="main-category-list">
                                        {["Alta", "Media", "Baja"].map((opcion) => (
                                            <li
                                                key={opcion}
                                                className="submenu-item"
                                                onClick={() => {
                                                    setFormData({ ...formData, prioridad: opcion })
                                                    setMenuAbierto(false)
                                                }}
                                            >
                                                {opcion}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* --- SELECT CATEGORÍA (Mantengo tu lógica intacta) --- */}
                        <div className="form-group custom-select-group">
                            <label>CATEGORÍA<span className='input-required'>*</span></label>
                            <div
                                className={`custom-select-trigger ${!formData.categoria ? 'is-empty' : ''}`}
                                onClick={() => setMenuAbierto(menuAbierto === 'categoria' ? false : 'categoria')}
                            >
                                <span className="select-text-value">
                                    {formData.categoria
                                        ? `${formData.subcategoria}`
                                        : "Seleccione"}
                                </span>
                                <span className={`arrow-icon ${menuAbierto === 'categoria' ? 'open' : ''}`}></span>
                            </div>

                            {menuAbierto === 'categoria' && (
                                <div className="custom-dropdown-container">
                                    <ul className="main-category-list">
                                        {/* 1. Mapeamos directamente el arreglo 'categorias' que viene del backend */}
                                        {categorias.map((categoria) => (
                                            <li
                                                key={categoria.id}
                                                className={`category-item ${activeSubMenu === categoria.id ? 'active' : ''}`}
                                                onMouseEnter={() => setActiveSubMenu(categoria.id)}
                                            >
                                                {categoria.nombre} <span className="arrow-right">▶</span>

                                                {activeSubMenu === categoria.id && (
                                                    <ul className="floating-submenu">
                                                        {/* 2. Mapeamos las subcategorías embebidas, usando || [] por seguridad */}
                                                        {(categoria.subcategorias || []).map((sub) => (
                                                            <li
                                                                key={sub.id}
                                                                className="submenu-item"
                                                                onClick={() => {
                                                                    // 3. Pasamos los nombres al handler tal como lo tenías antes
                                                                    handleSeleccionCompleta(categoria.nombre, sub.nombre);
                                                                    // Opcional: Si en el futuro necesitas enviar IDs al backend en vez 
                                                                    // de nombres, cambiarías esto a (categoria.id, sub.id)
                                                                }}
                                                            >
                                                                {sub.nombre}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* --- SELECT PROCEDENCIA --- */}
                        <div className="form-group custom-select-group">
                            <label>PROCEDENCIA <span className='input-required'>*</span></label>
                            <div
                                className={`custom-select-trigger ${!formData.procedencia ? 'is-empty' : ''}`}
                                onClick={() => setMenuAbierto(menuAbierto === 'procedencia' ? false : 'procedencia')}
                            >
                                <span className="select-text-value">
                                    {formData.procedencia || "Seleccione"}
                                </span>
                                <span className={`arrow-icon ${menuAbierto === 'procedencia' ? 'open' : ''}`}></span>
                            </div>
                            {menuAbierto === 'procedencia' && (
                                <div className="custom-dropdown-container">
                                    <ul className="main-category-list">
                                        {ambientes.map((ambiente) => (
                                            <li
                                                key={ambiente.id}
                                                className="submenu-item"
                                                onClick={() => {
                                                    setFormData({ ...formData, procedencia: ambiente.nombre })
                                                    setActivosReportados(new Set()) // Mantenemos tu borrado de activos
                                                    setMenuAbierto(false)
                                                }}
                                            >
                                                {ambiente.nombre}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* --- INPUT RESPONSABLE (Normal) --- */}
                        <div className="form-group">
                            <label htmlFor="responsable">RESPONSABLE</label>
                            <input
                                type="text"
                                id="responsable"
                                value={formData.responsable}
                                onChange={handleChange}
                                placeholder="Ingrese el nombre (si aplica)"
                                autoComplete='Off'
                            />
                        </div>

                        {/* --- TEXTAREA OBSERVACIONES (Normal) --- */}
                        <div className="form-group form-group-full">
                            <label htmlFor="observaciones">OBSERVACIONES <span className='input-required'>*</span></label>
                            <textarea
                                id="observaciones"
                                value={formData.observaciones}
                                onChange={handleChange}
                                placeholder="Ingrese los detalles de la incidencia"
                                className="detalles"
                            ></textarea>
                        </div>
                    </form>
                </div>

                <div className="lista-reportados">
                    <h4>Activos afectados <span className='input-required'>*</span></h4>
                    <ul>
                        {sortedActivos.map((activo, i) => (
                            <li key={i}>
                                {formatActivo(activo)}
                            </li>
                        ))}
                    </ul>
                    <div className="foto-incidencia">
                        <h4>Añadir foto</h4>

                        {previewUrl ? (
                            <img
                                src={previewUrl} // 👈 Ya no llamas a la función aquí, usas el estado
                                alt="Evidencia"
                                className="foto-preview"
                                onClick={() => triggerFileInput(fileInputRef)}
                            />
                        ) : (
                            <div
                                className="foto-placeholder"
                                onClick={() => triggerFileInput(fileInputRef)}
                            >
                                <img src='https://res.cloudinary.com/francode/image/upload/v1778545830/img-icon_fbuo1y.png' alt="img-icon" />
                            </div>
                        )}

                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={(e) => setFotoIncidencia(e.target.files[0])}
                            hidden
                        />
                    </div>
                </div>

                {ambiente && (
                    <>
                        {ambiente.tipo === 'Laboratorio' ? (
                            <>
                                <div className="NImapa-pcs">
                                    <div className="header">
                                        <h2>{formData.procedencia}</h2>
                                        <img
                                            src={ACTIVOS.PC_DOCENTE.imagenes[0]}
                                            alt="PC Docente"
                                            onClick={() =>
                                                toggleActivo(
                                                    setActivosReportados,
                                                    'PC_DOCENTE'
                                                )
                                            }
                                            className={`
                                            pc-docente
                                            ${activosReportados.has('PC_DOCENTE')
                                                    ? 'reportado'
                                                    : ''
                                                }
                                        `}
                                        />
                                    </div>
                                    <div
                                        className="body"
                                        style={{
                                            gridTemplateColumns: templateColumns.join(' ')
                                        }}
                                    >
                                        {Array.from({
                                            length: ambiente.configuracion?.nPcs || 0
                                        }).map((_, i) => {
                                            const posicionColumna =
                                                (i % cols) + 1
                                            // 👇 AHORA ES CODE
                                            const pcCode = `PC_${i + 1}`
                                            let gridColumn = posicionColumna
                                            // PASADIZO A LA IZQUIERDA
                                            if (colPasadizo === 0) {
                                                gridColumn += 1
                                            }
                                            // PASADIZO INTERMEDIO
                                            else if (
                                                colPasadizo > 0 &&
                                                posicionColumna > colPasadizo
                                            ) {
                                                gridColumn += 1
                                            }
                                            return (
                                                <div
                                                    key={pcCode}
                                                    className={`
                                                    pc-estudiante
                                                    ${activosReportados.has(pcCode)
                                                            ? 'reportado'
                                                            : ''
                                                        }
                                                `}
                                                    style={{
                                                        gridColumn
                                                    }}
                                                    onClick={() =>
                                                        toggleActivo(
                                                            setActivosReportados,
                                                            pcCode
                                                        )
                                                    }
                                                >
                                                    <span className="pc-numero">
                                                        {i + 1}
                                                    </span>
                                                    <img
                                                        src={ACTIVOS.PC_ESTUDIANTE.imagenes[0]}
                                                        alt={pcCode}
                                                    />
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="NImapa-extras">
                                    {ambiente.activos?.map((code, i) => {
                                        const data = ACTIVOS[code]
                                        if (!data) return null
                                        return (
                                            <div
                                                key={i}
                                                className={`
                                                activo-extra
                                                ${activosReportados.has(code)
                                                        ? 'reportado'
                                                        : ''
                                                    }
                                            `}
                                                onClick={() =>
                                                    toggleActivo(
                                                        setActivosReportados,
                                                        code
                                                    )
                                                }
                                            >
                                                <span>
                                                    {data.nombre}
                                                </span>
                                                <img
                                                    src={data.imagenes[0]}
                                                    alt={data.nombre}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            </>
                        ) : (
                            <div className="NImapa-aula">
                                <h2>{ambiente.nombre}</h2>
                                <div className="NIaula-grid">
                                    {Object.entries(
                                        agruparActivosPorCategoria(ambiente.activos)
                                    ).map(([categoria, activos], i) => (
                                        <div
                                            key={i}
                                            className="NIaula-col"
                                        >
                                            <h3>{categoria}</h3>
                                            {activos.map((activo, j) => (
                                                <div
                                                    key={j}
                                                    className={`
                                                    activo-extra
                                                    ${activosReportados.has(activo.code)
                                                            ? 'reportado'
                                                            : ''
                                                        }
                                                `}
                                                    onClick={() =>
                                                        toggleActivo(
                                                            setActivosReportados,
                                                            activo.code
                                                        )
                                                    }
                                                >
                                                    <span>
                                                        {activo.data.nombre}
                                                    </span>
                                                    <img
                                                        src={
                                                            activo.code === 'PC_DOCENTE'
                                                                ? (
                                                                    activo.data.imagenes[1]
                                                                    || activo.data.imagenes[0]
                                                                )
                                                                : activo.data.imagenes[0]
                                                        }
                                                        alt={activo.data.nombre}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
                {
                    savingIncident && (
                        <Notificacion mensaje="Registrando incidencia..." />
                    )
                }
            </section>
            <div className="form-buttons">
                <button
                    type="button"
                    className="btn-cancelar"
                    onClick={() => {
                        setFormData({
                            fechaRegistro: todayISO,
                            curso: '',
                            docente: '',
                            prioridad: '',
                            categoria: '',
                            subcategoria: '',
                            procedencia: '',
                            responsable: '',
                            activosReportados: [],
                            observaciones: ''
                        })
                        setActivosReportados(new Set())
                        setFotoIncidencia(null)
                        // ✅ También aquí
                        if (fileInputRef.current) {
                            fileInputRef.current.value = ""
                        }
                    }}
                >
                    <img src='https://res.cloudinary.com/francode/image/upload/v1778545757/cancelar_wwpj8l.png' alt="cancelar-icono" />
                    cancelar
                </button>
                <button
                    type="submit"
                    disabled={savingIncident}
                    form="formulario"
                    className="btn-guardar">
                    <img src='https://res.cloudinary.com/francode/image/upload/v1778545827/guardar_l1emce.png' alt="guardar-icono" />
                    {
                        savingIncident
                            ? 'Guardando...'
                            : 'Guardar'
                    }
                </button>
            </div>
        </>
    )
})

export default NuevaIncidencia
