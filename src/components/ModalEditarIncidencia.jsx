import { useState, useEffect, useMemo, useRef } from "react"
import { sortAlphabetically } from "../utils/sort";
import toast from 'react-hot-toast'
import "../styles/ModalEditarIncidencia.css"
import { formatFechaLarga } from "../utils/formatFecha"
import { formatActivo } from '../utils/activos/formatActivo'
import { nombreCorto } from "../utils/nombreCorto"
import ACTIVOS from '../constants/activos'
import sortActivos from "../utils/activos/sortActivos"
import agruparActivosPorCategoria from "../utils/activos/agruparActivos"
import useClickOutside from "../utils/hooks/useClickOutside"
import toggleActivo from "../utils/activos/toggleActivo"
import handleInputChange from "../utils/forms/handleInputChange"
import triggerFileInput from "../utils/forms/triggerFileInput"

const ModalEditarIncidencia = ({ incident, onClose, onSave, ambientes, cursosActivos, categorias, docentes }) => {
    const fileInputRef = useRef(null)
    const [menuAbierto, setMenuAbierto] = useState(null)
    const [activeSubMenu, setActiveSubMenu] = useState(null)
    const formRef = useRef(null)
    const [fotoIncidencia, setFotoIncidencia] = useState(null)
    const [formData, setFormData] = useState({
        fechaRegistro: '',
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

    const [activosReportados, setActivosReportados] = useState(new Set())

    const sortedActivos = useMemo(
        () => sortActivos(activosReportados),
        [activosReportados]
    )
    const fechaFormateada = formatFechaLarga(formData.fechaRegistro)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                menuAbierto &&
                formRef.current &&
                !formRef.current.contains(event.target)
            ) {
                setMenuAbierto(null)
            }
        }
        document.addEventListener(
            'mousedown',
            handleClickOutside
        )
        return () => {
            document.removeEventListener(
                'mousedown',
                handleClickOutside
            )
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

    useEffect(() => {
        if (incident) {
            setFormData({
                fechaRegistro: incident.fechaRegistro?.slice(0, 10) || "",
                curso: incident.curso || "",
                docente: incident.docente || "",
                prioridad: incident.prioridad || "",
                categoria: incident.categoria || "",
                procedencia: incident.procedencia || "",
                responsable: incident.responsable || "",
                observaciones: incident.observaciones || ""
            })

            setActivosReportados(new Set(incident.activosReportados || []))

            // 👇 NUEVO: cargar imagen existente
            if (incident.imagen?.url) {
                setFotoIncidencia(incident.imagen.url)
            } else {
                setFotoIncidencia(null)
            }
        }
    }, [incident])

    const ambiente = ambientes.find(a => a.nombre === formData.procedencia)

    const cols =
        ambiente?.configuracion?.nColumnas ?? 5

    const colPasadizo =
        ambiente?.configuracion?.nColumnaPasadizo ?? 3

    const nPcs =
        ambiente?.configuracion?.nPcs ?? 35

    // Grid dinámico
    const templateColumns = []

    // Pasadizo al inicio
    if (colPasadizo === 0) {
        templateColumns.push('15px')
    }

    for (let i = 1; i <= cols; i++) {

        templateColumns.push('1fr')

        if (i === colPasadizo) {
            templateColumns.push('15px')
        }
    }

    // Función genérica para manejar cambios en inputs y selects del form
    const handleChange = (e) => {
        handleInputChange({
            e,
            setFormData,
            setActivosReportados
        })
    }

    const handleSubmit = () => {
        // 1. Definir campos obligatorios
        const camposObligatorios = {
            fechaRegistro: "Fecha de Registro",
            curso: "Curso",
            docente: "Docente",
            prioridad: "Prioridad",
            categoria: "Categoría",
            procedencia: "Procedencia",
            observaciones: "Observaciones"
        }

        // 2. Validar campos obligatorios
        for (const [key, label] of Object.entries(camposObligatorios)) {
            if (!formData[key] || formData[key].toString().trim() === "") {
                return toast.error(`El campo "${label}" es obligatorio.`)
            }
        }

        // 3. Validar que haya al menos un activo afectado
        if (activosReportados.size === 0) {
            return toast.error("Debe seleccionar al menos un activo afectado.")
        }

        const data = new FormData()
        const payload = {
            ...formData,
            activosReportados: [...activosReportados]
        }

        // 4. Enviar TODO (permitiendo el string vacío para campos opcionales)
        Object.entries(payload).forEach(([key, value]) => {
            // Solo omitimos null o undefined, pero permitimos '' (vacío)
            if (value !== null && value !== undefined) {
                if (Array.isArray(value)) {
                    value.forEach(v => data.append(key, v))
                } else {
                    data.append(key, value)
                }
            }
        })

        if (fotoIncidencia && typeof fotoIncidencia !== "string") {
            data.append("imagen", fotoIncidencia)
        }

        onSave(data)
    }

    // Si no hay incidencia, no renderizar nada (puede pasar mientras se carga o si se cierra el modal)
    if (!incident) return null

    return (
        <div className="MoEd-overlay">
            <div className="MoEd-editar">
                <div className="MoEd-form">
                    <h3>Editar incidencia</h3>
                    <div className="fecha-container">
                        <p className="Mo fecha">{fechaFormateada}</p>
                        <div className="MoEd-calendar-wrapper">
                            <img src='https://res.cloudinary.com/francode/image/upload/v1778545755/calendar-icon_ml7tq5.png' className="calendar-icon" />
                            <input
                                type="date"
                                id="fechaRegistro"
                                value={formData.fechaRegistro}
                                onChange={handleChange}
                                className="fecha-input"
                            />
                        </div>
                        <span className="input-required">*</span>
                    </div>

                    <form className="MoEd-grid" ref={formRef}>
                        <div className="Mo form-group custom-select-group">

                            <label>
                                Curso <span className="input-required">*</span>
                            </label>

                            <div
                                className={`
                                custom-select-trigger
                                ${!formData.curso ? 'is-empty' : ''}
                                `}
                                onClick={() =>
                                    setMenuAbierto(
                                        menuAbierto === 'curso'
                                            ? null
                                            : 'curso'
                                    )
                                }
                            >

                                <span className="select-text-value">
                                    {formData.curso || 'Seleccione'}
                                </span>

                                <span
                                    className={`
                                    arrow-icon
                                    ${menuAbierto === 'curso' ? 'open' : ''}
                                `}
                                />

                            </div>

                            {menuAbierto === 'curso' && (
                                <div className="custom-dropdown-container">
                                    <ul className="main-category-list">
                                        {sortAlphabetically(cursosActivos, "nombre").map((curso) => (
                                            <li
                                                key={curso.id}
                                                className="submenu-item"
                                                onClick={() => {

                                                    setFormData(prev => ({
                                                        ...prev,
                                                        curso: curso.nombre
                                                    }))

                                                    setMenuAbierto(null)
                                                }}
                                            >
                                                {curso.nombre}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="Mo form-group custom-select-group">
                            <label>
                                Docente <span className="input-required">*</span>
                            </label>

                            <div
                                className={`
                                    custom-select-trigger
                                    ${!formData.docente ? 'is-empty' : ''}
                                `}
                                onClick={() =>
                                    setMenuAbierto(
                                        menuAbierto === 'docente'
                                            ? false
                                            : 'docente'
                                    )
                                }
                            >
                                <span className="select-text-value">
                                    {formData.docente || "Seleccione"}
                                </span>

                                <span
                                    className={`
                                        arrow-icon
                                        ${menuAbierto === 'docente' ? 'open' : ''}
                                    `}
                                ></span>
                            </div>

                            {menuAbierto === 'docente' && (
                                <div className="custom-dropdown-container">
                                    <ul className="main-category-list">

                                        {sortAlphabetically(docentes, "name").map((doc) => (

                                            <li
                                                key={doc.id}
                                                className="submenu-item"
                                                onClick={() => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        docente: doc.name
                                                    }))

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

                        <div className="Mo form-group custom-select-group">
                            <label>
                                Prioridad <span className="input-required">*</span>
                            </label>

                            <div
                                className={`
                                    custom-select-trigger
                                    ${!formData.prioridad ? 'is-empty' : ''}
                                `}
                                onClick={() =>
                                    setMenuAbierto(
                                        menuAbierto === 'prioridad'
                                            ? false
                                            : 'prioridad'
                                    )
                                }
                            >
                                <span className="select-text-value">
                                    {formData.prioridad || "Seleccione"}
                                </span>

                                <span
                                    className={`
                                        arrow-icon
                                        ${menuAbierto === 'prioridad' ? 'open' : ''}
                                    `}
                                ></span>
                            </div>

                            {menuAbierto === 'prioridad' && (
                                <div className="custom-dropdown-container">
                                    <ul className="main-category-list">

                                        {["Alta", "Media", "Baja"].map((opcion) => (

                                            <li
                                                key={opcion}
                                                className="submenu-item"
                                                onClick={() => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        prioridad: opcion
                                                    }))

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

                        <div className="Mo form-group custom-select-group">
                            <label>
                                Categoría
                                <span className="input-required">*</span>
                            </label>
                            <div
                                className={`
                                custom-select-trigger
                                ${!formData.categoria ? 'is-empty' : ''}
                                `}
                                onClick={() =>
                                    setMenuAbierto(
                                        menuAbierto === 'categoria'
                                            ? null
                                            : 'categoria'
                                    )
                                }
                            >
                                <span className="select-text-value">
                                    {incident.subcategoria}
                                </span>

                                <span
                                    className={`
                                        arrow-icon
                                        ${menuAbierto === 'categoria'
                                            ? 'open'
                                            : ''
                                        }
                                    `}
                                />

                            </div>

                            {menuAbierto === 'categoria' && (
                                <div className="custom-dropdown-container">
                                    <ul className="main-category-list">
                                        {sortAlphabetically(categorias, "nombre").map((categoria) => (
                                            <li
                                                key={categoria.id}
                                                className={`
                                                    category-item
                                                    ${activeSubMenu === categoria.id
                                                        ? 'active'
                                                        : ''
                                                    }
                                                `}
                                                onMouseEnter={() =>
                                                    setActiveSubMenu(categoria.id)
                                                }
                                            >

                                                {categoria.nombre}

                                                <span className="arrow-right">
                                                    ▶
                                                </span>

                                                {activeSubMenu === categoria.id && (
                                                    <ul className="floating-submenu">
                                                        {sortAlphabetically(categoria.subcategorias || [], "nombre").map((sub) => (
                                                            <li
                                                                key={sub.id}
                                                                className="submenu-item"
                                                                onClick={() =>
                                                                    handleSeleccionCompleta(
                                                                        categoria.nombre,
                                                                        sub.nombre
                                                                    )
                                                                }
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

                        <div className="Mo form-group custom-select-group">

                            <label>
                                Procedencia
                                <span className="input-required">*</span>
                            </label>

                            <div
                                className={`
                                    custom-select-trigger
                                    ${!formData.procedencia ? 'is-empty' : ''}
                                `}
                                onClick={() =>
                                    setMenuAbierto(
                                        menuAbierto === 'procedencia'
                                            ? null
                                            : 'procedencia'
                                    )
                                }
                            >

                                <span className="select-text-value">

                                    {formData.procedencia || 'Seleccione'}

                                </span>

                                <span
                                    className={`
                                        arrow-icon
                                        ${menuAbierto === 'procedencia'
                                            ? 'open'
                                            : ''
                                        }
                                    `}
                                />

                            </div>

                            {menuAbierto === 'procedencia' && (
                                <div className="custom-dropdown-container">
                                    <ul className="main-category-list">
                                        {ambientes.map((ambiente) => (
                                            <li
                                                key={ambiente.id}
                                                className="submenu-item"
                                                onClick={() => {

                                                    setFormData(prev => ({
                                                        ...prev,
                                                        procedencia: ambiente.nombre
                                                    }))

                                                    // Limpiar activos reportados
                                                    // cuando cambia el ambiente
                                                    setActivosReportados(new Set())

                                                    setMenuAbierto(null)

                                                }}
                                            >
                                                {ambiente.nombre}
                                            </li>

                                        ))}

                                    </ul>

                                </div>

                            )}

                        </div>

                        <div className="Mo form-group">
                            <label>Responsable</label>
                            <input
                                id="responsable"
                                value={formData.responsable}
                                onChange={handleChange}
                                placeholder="Ingresar responsable"
                                autoComplete="off"
                            />
                        </div>

                        <div className="Mo form-group Mo form-group-full">
                            <label>Observaciones <span className="input-required">*</span></label>

                            <textarea
                                id="observaciones"
                                value={formData.observaciones}
                                onChange={handleChange}
                                className="MoEd-detalles"
                            />
                        </div>
                    </form>
                </div>

                <div className="MoEd-lista-reportados">
                    <h4>Activos afectados <span className='input-required'>*</span></h4>
                    <ul>
                        {sortedActivos.map((activo, i) => (
                            <li key={i}>
                                {formatActivo(activo)}
                            </li>
                        ))}
                    </ul>
                    <div className="MoEd-foto-incidencia">
                        <h4>Añadir foto</h4>

                        {fotoIncidencia ? (
                            <img
                                src={
                                    typeof fotoIncidencia === "string"
                                        ? fotoIncidencia
                                        : URL.createObjectURL(fotoIncidencia)
                                }
                                alt="Evidencia"
                                className="MoEd-foto-preview"
                                onClick={() => triggerFileInput(fileInputRef)}
                            />
                        ) : (
                            <div
                                className="MoEd-foto-placeholder"
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
                        {formData.procedencia.startsWith("Laboratorio") ? (
                            <>
                                <div className="MoEd-mapa-pcs">
                                    <div className="header">
                                        <h3>{formData.procedencia}</h3>
                                        <img
                                            src={ACTIVOS.PC_DOCENTE.imagenes[0]}
                                            className={`
                                                MoEd-pc-docente
                                                ${activosReportados.has("PC_DOCENTE")
                                                    ? "reportado"
                                                    : ""
                                                }
                                            `}
                                            onClick={() =>
                                                toggleActivo(
                                                    setActivosReportados,
                                                    "PC_DOCENTE"
                                                )
                                            }
                                        />
                                    </div>

                                    <div
                                        className="MoEd-body"
                                        style={{
                                            gridTemplateColumns: templateColumns.join(' ')
                                        }}
                                    >
                                        {Array.from({ length: nPcs }).map((_, i) => {

                                            const posicionColumna =
                                                (i % cols) + 1

                                            let gridColumn = posicionColumna

                                            // Pasadizo al inicio
                                            if (colPasadizo === 0) {
                                                gridColumn += 1
                                            }

                                            // Pasadizo intermedio
                                            else if (
                                                colPasadizo > 0 &&
                                                posicionColumna > colPasadizo
                                            ) {
                                                gridColumn += 1
                                            }

                                            const pcCode = `PC_${i + 1}`
                                            return (
                                                <div
                                                    key={pcCode}
                                                    className={`
                                                        MoEd-pc-estudiante
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
                                                    <span className="MoEd-pc-numero">
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

                                <div className="MoEd-mapa-extras">
                                    {ambiente.activos
                                        ?.filter(code => {
                                            // Excluir PCs
                                            return ![
                                                'PC_DOCENTE',
                                                'PC_ESTUDIANTE'
                                            ].includes(code)
                                        })
                                        .map(code => {
                                            const data = ACTIVOS[code]
                                            if (!data) return null
                                            return (
                                                <div
                                                    key={code}
                                                    className={`
                                                    MoEd-activo-extra
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
                            <div className="MoEd-mapa-aula">
                                <h3>
                                    {formData.procedencia}
                                </h3>
                                <div className="MoEd-aula-grid">
                                    {Object.entries(
                                        agruparActivosPorCategoria(ambiente.activos)
                                    ).map(([categoria, activos], i) => (
                                        <div
                                            key={i}
                                            className="MoEd-aula-col"
                                        >
                                            <h3>{categoria}</h3>
                                            {activos.map((activo, j) => (
                                                <div
                                                    key={j}
                                                    className={`
                                                        MoEd-activo-aula
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

                <div className="MoEd-buttons">
                    <button className="MoEd-btn-cancel" onClick={onClose}>
                        Cancelar
                    </button>
                    <button className="MoEd-btn-confirm" onClick={handleSubmit}>
                        Confirmar
                    </button>

                </div>
            </div>
        </div>
    )
}

export default ModalEditarIncidencia