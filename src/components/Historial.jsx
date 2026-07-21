import { forwardRef, useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import Notificacion from './Notificacion'

import '../styles/Historial.css'
import { formatActivo } from '../utils/activos/formatActivo'
import { nombreCorto } from '../utils/nombreCorto'
import FichaIncPDF from "./FichaIncPDF"
import jsPDF from "jspdf"
import html2canvas from 'html2canvas'

import incidentsService from '../services/incidents'
import ModalResolucion from './ModalResolucion'
import ModalConfirmacion from './ModalConfirmacion'
import ModalEditarIncidencia from './ModalEditarIncidencia'

import { formatFechaCorta, formatFechaHora, formatSoloHora } from '../utils/formatFecha'

const loadImage = (src) =>
    new Promise((resolve) => {
        const img = new Image()
        img.src = src
        img.onload = () => resolve(img)
    })

const Historial = forwardRef(({ id, incidents, setIncidents, ambientes, cursosActivos, categorias, docentes }, ref) => {
    const [savingIncident, setSavingIncident] = useState(false)
    const [downloading, setDownloading] = useState(false)

    const [filtered, setFiltered] = useState([])
    const [visible, setVisible] = useState(3)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [priority, setPriority] = useState('todos')

    const [modalOpen, setModalOpen] = useState(false)
    const [incidentToResolve, setIncidentToResolve] = useState(null)

    const [confirmOpen, setConfirmOpen] = useState(false)
    const [confirmMessage, setConfirmMessage] = useState('')
    const [confirmAction, setConfirmAction] = useState(null)

    const [editOpen, setEditOpen] = useState(false)
    const [incidentToEdit, setIncidentToEdit] = useState(null)

    useEffect(() => {
        if (incidents.length > 0) {
            // Ordenar de más reciente a más antigua
            const sorted = [...incidents].sort(
                (a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro)
            )

            const first = sorted[sorted.length - 1].fechaRegistro // más antigua
            const last = sorted[0].fechaRegistro // más reciente

            setStartDate(first.slice(0, 10))
            setEndDate(last.slice(0, 10))
            setFiltered(sorted)
        }
    }, [incidents])

    const handleFiltrar = () => {
        const desde = new Date(startDate)
        desde.setHours(0, 0, 0, 0)

        const hasta = new Date(endDate)
        hasta.setHours(23, 59, 59, 999)

        const result = [...incidents]
            .filter((i) => {
                const fecha = new Date(i.fechaRegistro)
                return fecha >= desde && fecha <= hasta && (priority === 'todos' || i.prioridad === priority)
            })
            .sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro))

        setFiltered(result)
    }

    const handleVerMas = () => setVisible((prev) => prev + 3)
    const handleOcultar = () => setVisible(3)

    const visibleItems = filtered.slice(0, visible)
    const hayMas = visible < filtered.length

    const handleCheck = (id) => {
        const incident = incidents.find(i => i.id === id)

        if (!incident || incident.estado === 'Cerrada') return

        const nuevoEstado =
            incident.estado === 'Pendiente'
                ? 'Resuelta'
                : 'Pendiente'

        setConfirmMessage(<>
            ¿Estás seguro de marcar esta incidencia como "<b className={nuevoEstado === 'Resuelta' ?
                'resuelta' : nuevoEstado === 'Pendiente' ?
                    'pendiente' : 'cerrada'}>{nuevoEstado}</b>"?
        </>
        )

        setConfirmAction(() => async () => {
            try {
                const updated = await incidentsService.updatedIncident(id, {
                    estado: nuevoEstado
                })

                toast.success('Estado actualizado correctamente')

                setIncidents(prev =>
                    prev.map(i => i.id === updated.id ? updated : i)
                )

                setFiltered(prev =>
                    prev.map(i => i.id === updated.id ? updated : i)
                )

            } catch (error) {
                toast.error('Error al actualizar el estado de la incidencia')
                console.error(error)
            } finally {
                setConfirmOpen(false)
            }
        })

        setConfirmOpen(true)
    }

    const handleCloseIncident = (id) => {
        const incident = incidents.find(i => i.id === id)

        if (!incident || incident.estado !== 'Resuelta') return

        setConfirmMessage(
            '¿Deseas cerrar definitivamente esta incidencia?'
        )

        setConfirmAction(() => () => {
            setIncidentToResolve(incident)
            setModalOpen(true)
            setConfirmOpen(false)
        })

        setConfirmOpen(true)
    }

    const handleConfirmResolution = async (solucion) => {
        try {
            const updated = await incidentsService.updatedIncident(
                incidentToResolve.id,
                {
                    solucion,
                    estado: 'Cerrada'
                }
            )
            toast.success('Incidencia documentada correctamente')

            setIncidents(prev =>
                prev.map(i => i.id === updated.id ? updated : i)
            )

            setFiltered(prev =>
                prev.map(i => i.id === updated.id ? updated : i)
            )

            setModalOpen(false)
            setIncidentToResolve(null)

        } catch (error) {
            toast.error('Error al cerrar la incidencia')
            console.error(error)
        }
    }

    const handleDelete = (id) => {
        // 1. Configuramos el mensaje del modal
        setConfirmMessage('¿Estás seguro de que deseas eliminar esta incidencia de forma permanente?')

        // 2. Definimos la acción que se ejecutará si el usuario confirma
        setConfirmAction(() => async () => {
            try {
                await incidentsService.deleteIncident(id)

                // Actualizar el estado global de incidencias
                setIncidents((prev) => prev.filter((i) => i.id !== id))

                // Actualizar el estado filtrado (la lista que se muestra)
                setFiltered((prev) => prev.filter((i) => i.id !== id))

                // Opcional: Podrías usar un toast o un mensaje de éxito no intrusivo aquí
                toast.success('Registro eliminado correctamente')

            } catch (error) {
                toast.error('Error al eliminar la incidencia')
                console.error('Error al eliminar la incidencia:', error)
                // Aquí podrías setear un mensaje de error para mostrar al usuario
            } finally {
                // 3. Cerramos el modal de confirmación pase lo que pase
                setConfirmOpen(false)
            }
        })

        // 4. Abrimos el modal
        setConfirmOpen(true)
    }

    const handleEdit = (id) => {
        const incident = incidents.find(i => i.id === id)

        if (!incident) return

        setConfirmMessage('¿Deseas editar los datos de este registro?')

        setConfirmAction(() => () => {
            setIncidentToEdit(incident)
            setEditOpen(true)
            setConfirmOpen(false)
        })

        setConfirmOpen(true)
    }

    const pdfRef = useRef()
    const [incidentPDF, setIncidentPDF] = useState(null)

    const drawField = (doc, label, value, x, y, maxWidth = 80) => {
        // Label
        doc.setFont("times", "bold").setFontSize(10)
        doc.text(`${label}:`, x, y)

        // Valor (puede ser multilínea)
        doc.setFont("times", "normal")
        const textValue = String(value || "-")
        const lines = doc.splitTextToSize(textValue, maxWidth)

        // Dibujamos las líneas. jsPDF maneja el array de strings automáticamente
        doc.text(lines, x, y + 5)

        // Retorna la posición Y final ocupada: 
        // y inicial + 5 (espacio al valor) + (líneas * interlineado)
        return y + 5 + (lines.length * 4.5)
    }

    const drawTwoColumns = (doc, left, right, x1, x2, y, w1 = 40, w2 = 45) => {
        // Calculamos el Y final de cada columna de forma independiente
        const y1 = drawField(doc, left.label, left.value, x1, y, w1)
        const y2 = drawField(doc, right.label, right.value, x2, y, w2)

        // Retornamos el Y más alto + un margen de separación para la siguiente fila
        return Math.max(y1, y2) + 2
    }

    const waitForElement = () =>
        new Promise((resolve, reject) => {
            let attempts = 0

            const check = () => {
                if (pdfRef.current) {
                    resolve(pdfRef.current)
                } else if (attempts > 30) {
                    reject("No se pudo renderizar el componente PDF")
                } else {
                    attempts++
                    requestAnimationFrame(check)
                }
            }

            check()
        })

    const handleDownload = async (id) => {
        const incident = incidents.find(i => i.id === id)
        if (!incident) return
        if (downloading) return

        try {
            setDownloading(true)
            // 🔴 1. Render oculto
            setIncidentPDF(incident)

            // 🔴 2. Espera REAL (no timeout fake)
            const element = await waitForElement()

            if (!element) {
                console.error("Elemento PDF no encontrado")
                return
            }

            const doc = new jsPDF("p", "mm", "a4")

            const margin = 15
            const pageWidth = 210
            const centerX = pageWidth / 2

            // 🔹 LOGOS
            const [logoIzquierda, logoDerecha] = await Promise.all([
                loadImage('https://res.cloudinary.com/francode/image/upload/v1778545882/unc_us4bkp.png'),
                loadImage('https://res.cloudinary.com/francode/image/upload/v1778545800/epis_fylrm7.png')
            ])

            const alturaLogo = 32
            const aspectIzq = logoIzquierda.width / logoIzquierda.height
            const aspectDer = logoDerecha.width / logoDerecha.height

            doc.addImage(logoIzquierda, "PNG", 15, 14, alturaLogo * aspectIzq, alturaLogo)
            doc.addImage(logoDerecha, "PNG", 200 - (alturaLogo * aspectDer), 14, alturaLogo * aspectDer, alturaLogo)


            // 🔹 HEADER
            let y = 20
            doc.setFont("times", "bold").setFontSize(14)
            doc.text("UNIVERSIDAD NACIONAL DE CAJAMARCA", centerX, y, { align: "center" })

            y += 7
            doc.setFontSize(13)
            doc.text("FACULTAD DE INGENIERÍA", centerX, y, { align: "center" })

            y += 7
            doc.setFont("times", "normal").setFontSize(12)
            doc.text("ESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMAS", centerX, y, { align: "center" })

            y += 10
            doc.setFont("times", "bold").setFontSize(12)
            doc.text("REPORTE DE INCIDENCIA", centerX, y, { align: "center" })

            // 🔹 FECHA
            y += 7
            doc.setFont("times", "normal").setFontSize(11)
            doc.text(`Fecha de emisión: ${formatFechaCorta(new Date())}`, centerX, y, { align: "center" })

            // Donde inicia la sección de datos (texto a la izquierda) y el mapa (a la derecha)
            const leftX = margin
            // El mapa lo colocaremos a la derecha, dejando un espacio entre ambos
            const rightX = 98
            let startY = y + 10

            doc.setFontSize(10)

            // 🔹 GRID 2 COLUMNAS
            let yLeft = startY + 3
            const colWidth = 35

            yLeft = drawTwoColumns(
                doc,
                { label: "Fecha", value: formatFechaCorta(incident.fechaRegistro) },
                { label: "Hora", value: formatSoloHora(incident.fechaRegistro) },
                leftX, leftX + 45, yLeft, colWidth, colWidth
            )

            yLeft += 4

            yLeft = drawTwoColumns(
                doc,
                { label: "Curso", value: incident.curso },
                { label: "Docente", value: nombreCorto(incident.docente) },
                leftX, leftX + 45, yLeft, colWidth, colWidth
            )

            yLeft += 4

            yLeft = drawTwoColumns(
                doc,
                { label: "Prioridad", value: incident.prioridad },
                { label: "Categoría", value: `${incident.categoria}: ${incident.subcategoria}` },
                leftX, leftX + 45, yLeft, colWidth, colWidth
            )

            yLeft += 4

            yLeft = drawTwoColumns(
                doc,
                { label: "Procedencia", value: incident.procedencia },
                { label: "Responsable", value: incident.responsable || "N/A" },
                leftX, leftX + 45, yLeft, colWidth, colWidth
            )

            yLeft += 4

            // 🔹 UNA COLUMNA
            yLeft = drawField(
                doc,
                "Activos afectados",
                incident.activosReportados.map(formatActivo).join(", "),
                leftX, yLeft, 70
            )

            yLeft += 4

            yLeft = drawField(
                doc,
                "Observaciones",
                incident.observaciones,
                leftX, yLeft, 70
            )

            yLeft += 4

            // 🔹 DERECHA (MAPA DE ACTIVOS)
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true
            })

            const imgMapa = canvas.toDataURL("image/png")

            const mapaWidth = 100
            const mapaHeight = (canvas.height * mapaWidth) / canvas.width

            doc.addImage(imgMapa, "PNG", rightX, startY, mapaWidth, mapaHeight)

            // 🔹 SECCIÓN DE EVIDENCIA
            const evidenciaWidth = 80
            const evidenciaHeight = 60

            doc.setFont("times", "bold")
            doc.text("Evidencia fotográfica", leftX, yLeft)

            yLeft += 5

            if (incident.imagen?.url) {
                try {
                    const img = await loadImage(incident.imagen.url)

                    // 👇 AQUÍ ESTÁ LA CLAVE: usamos yLeft directamente
                    doc.addImage(
                        img,
                        "JPEG",
                        leftX,       // alineado a la izquierda
                        yLeft,
                        evidenciaWidth,
                        evidenciaHeight
                    )

                    // 👇 actualizar posición real después de la imagen
                    yLeft += evidenciaHeight + 8

                } catch (imgError) {
                    toast.error('Error al cargar la imagen de evidencia')
                    console.error("Error cargando imagen:", imgError)

                    doc.setFont("times", "italic").setFontSize(10)
                    doc.text("Error al cargar la imagen.", leftX, yLeft)

                    yLeft += 10
                }

            } else {
                doc.setFont("times", "italic").setFontSize(10)
                doc.setTextColor(100)

                doc.text(
                    "No se registró una imagen como evidencia",
                    leftX,
                    yLeft
                )

                doc.setTextColor(0)
                yLeft += evidenciaHeight + 8
            }

            // 🔹 FIRMAS
            doc.setFont("times", "normal")
            let firmaY = yLeft + 25

            // Firma izquierda
            doc.line(30, firmaY, 70, firmaY)
            doc.text("Personal administrativo", 50, firmaY + 5, { align: "center" })

            // Firma derecha
            doc.line(120, firmaY, 180, firmaY)
            doc.text(nombreCorto(incident.docente), 150, firmaY + 5, { align: "center" })

            // Firma adicional (laboratorio)
            if (incident.procedencia.startsWith("Laboratorio")) {
                doc.line(80, firmaY, 110, firmaY)
                doc.text("Jefe de laboratorio", 95, firmaY + 5, { align: "center" })
            }

            doc.save(`Incidencia_${incident.id}.pdf`)
            toast.success('PDF generado correctamente')
        } catch (error) {
            toast.error('Error al generar el PDF: ', error.message || error)
            console.error("Error generando PDF: ", error)
        } finally {
            // 🔴 LIMPIEZA (CLAVE)
            setDownloading(false)
            setIncidentPDF(null)
        }
    }

    return (
        <section className="historial-panel" ref={ref} id={id}>
            <h1>HISTORIAL</h1>
            {startDate && endDate && (
                <p className="subtitulo">
                    Incidencias registradas desde el {formatFechaCorta(startDate)} hasta el {formatFechaCorta(endDate)}
                </p>
            )}

            <div className="filtrosH">
                <span>Del</span>
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
                <span>al</span>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />
                Prioridad
                <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                >
                    <option value="todos">Todos</option>
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                </select>
                <button className="btn-filtrar" onClick={handleFiltrar}>
                    <img src='https://res.cloudinary.com/francode/image/upload/v1778545815/filtrar_sjfqfi.png' alt="filtrar-icon" />
                    Filtrar
                </button>
            </div>

            <div className="leyenda-estados">
                <span className="titulo-leyenda">Estados:</span>
                <div className="items">
                    <div className="item-leyenda">
                        <span className="color pendiente"></span>
                        <span>Pendiente</span>
                    </div>

                    <div className="item-leyenda">
                        <span className="color resuelta"></span>
                        <span>Resuelta</span>
                    </div>

                    <div className="item-leyenda">
                        <span className="color cerrada"></span>
                        <span>Cerrada</span>
                    </div>
                </div>
            </div>

            <div className="tabla-container">
                <table className="tabla">
                    <thead>
                        <tr>
                            <th className="fechaLugar">FECHA / LUGAR</th>
                            <th className="cursoDocente">CURSO / DOCENTE</th>
                            <th className="activos">ACTIVOS</th>
                            <th className="prioridadCategoria">PRIORIDAD / CATEGORÍA</th>
                            <th className="observaciones">OBSERVACIONES</th>
                            <th className="imagen">EVIDENCIA</th>
                            <th className="estado">ESTADO</th>
                        </tr>
                    </thead>

                    <tbody>
                        {visibleItems.map((i) => (
                            <tr key={i.id}>
                                <td className="fechaLugar">
                                    <p>{formatFechaHora(i.fechaRegistro)}</p>
                                    <p>{i.procedencia}</p>
                                    <div className="acciones">
                                        <img src='https://res.cloudinary.com/francode/image/upload/v1778864960/eliminar_oso7bj.png' alt="delete-icon" onClick={() => handleDelete(i.id)} />
                                        <img src='https://res.cloudinary.com/francode/image/upload/v1778865130/edit_aeo7pz.png' alt="edit-icon" onClick={() => handleEdit(i.id)} />
                                        <img src='https://res.cloudinary.com/francode/image/upload/v1778865130/descargar_chtebn.png' alt="download-icon" onClick={() => handleDownload(i.id)} />
                                    </div>
                                </td>
                                <td className="cursoDocente">
                                    <p>{i.curso}</p>
                                    <p>{nombreCorto(i.docente, false)}</p>
                                </td>
                                <td className="activos">{i.activosReportados.map(formatActivo).join(', ')}</td>
                                <td className={`prioridadCategoria ${i.prioridad.toLowerCase()}`}>
                                    <p>{i.prioridad.toUpperCase()}</p>
                                    <p>{i.subcategoria || 'N/A'}</p>
                                </td>
                                <td className="observaciones">
                                    <div className="cell-content">{i.observaciones}</div>
                                </td>
                                <td className="imagen">
                                    <div className="img-content">
                                        {i.imagen ? (
                                            <img src={i.imagen.url} alt="Imagen de incidencia" className="imagen-incidencia" />
                                        ) : (
                                            <span className="no-imagen">No hay imagen</span>
                                        )}
                                    </div>
                                </td>
                                <td className={`estado ${i.estado === 'Resuelta'
                                    ? 'resuelta'
                                    : i.estado === 'Cerrada'
                                        ? 'cerrada'
                                        : 'pendiente'
                                    }`}>
                                    <div className="editar-estado">
                                        <img
                                            src={i.estado === 'Resuelta'
                                                ? 'https://res.cloudinary.com/francode/image/upload/v1778545765/check_ab7dds.png'
                                                : 'https://res.cloudinary.com/francode/image/upload/v1778545839/noCheck_m1lqd9.png'
                                            }
                                            alt="check-icon"
                                            onClick={() => handleCheck(i.id)}
                                            style={{
                                                opacity: i.estado === 'Cerrada' ? 0.4 : 1,
                                                cursor: i.estado === 'Cerrada' ? 'not-allowed' : 'pointer',
                                                display: i.estado === 'Cerrada' ? 'none' : 'inline'
                                            }}
                                        />
                                        {i.estado === 'Resuelta' && (
                                            <img
                                                src='https://res.cloudinary.com/francode/image/upload/v1778545778/documentar_ootz7q.png'
                                                alt="documentar-icon"
                                                onClick={() => handleCloseIncident(i.id)}
                                            />
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>


            <div className="paginacion">
                {hayMas && (
                    <button className="btn-vermas" onClick={handleVerMas}>
                        <img src='https://res.cloudinary.com/francode/image/upload/v1778545833/info_kn7ij3.png' alt="info-icon" />
                        Ver más
                    </button>
                )}

                {visible > 3 && (
                    <button className="btn-vermas" onClick={handleOcultar}>
                        <img src='https://res.cloudinary.com/francode/image/upload/v1778545842/ocultar_yqldvu.png' alt="ocultar-icon" />
                        Ocultar
                    </button>
                )}
            </div>
            {modalOpen && (
                <ModalResolucion
                    incident={incidentToResolve}
                    onClose={() => setModalOpen(false)}
                    onConfirm={handleConfirmResolution}
                />
            )}
            {confirmOpen && (
                <ModalConfirmacion
                    mensaje={confirmMessage}
                    onCancel={() => setConfirmOpen(false)}
                    onConfirm={confirmAction}
                />
            )}
            {editOpen && (
                <><ModalEditarIncidencia
                    incident={incidentToEdit}
                    ambientes={ambientes}
                    cursosActivos={cursosActivos}
                    categorias={categorias}
                    docentes={docentes}
                    onClose={() => setEditOpen(false)}
                    onSave={async (updatedData) => {
                        if (savingIncident) return // Evita envíos múltiples
                        try {
                            setSavingIncident(true)
                            const updated = await incidentsService.updateIncidentData(
                                incidentToEdit.id,
                                updatedData
                            )

                            setIncidents(prev =>
                                prev.map(i => i.id === incidentToEdit.id ? updated : i)
                            )

                            setEditOpen(false)
                            setIncidentToEdit(null)
                            toast.success('Incidencia editada correctamente')
                        } catch (error) {
                            // 🔴 Error de validación del modelo
                            if (error.response?.status === 400) {
                                toast.error(`${error.response.data?.error}:\n- ${error.response.data.detalles.join('.\n- ')}`)
                            }
                            // 🔑 Error de autenticación
                            else if (error.response?.status === 401) {
                                toast.error('Sesión expirada, vuelva a iniciar sesión')
                            }
                            // 🔥 Otros errores
                            else {
                                toast.error('Error al editar la incidencia')
                            }
                            console.error("Error al editar:", error)
                        } finally {
                            setSavingIncident(false)
                        }
                    }}
                />
                    {
                        savingIncident && (
                            <Notificacion mensaje="Guardando cambios..." />
                        )
                    }
                </>
            )}
            {
                incidentPDF && (
                    <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
                        <div ref={pdfRef}>
                            <FichaIncPDF incident={incidentPDF} ambientes={ambientes} />
                        </div>
                    </div>
                )
            }
            {
                downloading && (
                    <Notificacion mensaje="Generando PDF..." />
                )
            }
        </section>
    )
})

export default Historial
