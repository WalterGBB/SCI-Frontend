import { forwardRef, useState, useMemo } from "react"
import toast from 'react-hot-toast'
import Notificaciones from "./Notificacion"
import "../styles/Reportes.css"
import { formatActivo } from "../utils/activos/formatActivo"
import { nombreCorto } from "../utils/nombreCorto"
import { formatFechaCorta, formatFechaHora } from "../utils/formatFecha"
import { calcularTiempoPromedio, calcularUbicacionMayor } from "../utils/helperKPIs"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"

import html2canvas from 'html2canvas'

const Reportes = forwardRef(({ id, incidents, estadisticasRef }, ref) => {
    const [donwloading, setDonwloading] = useState(false)

    const [intervalo, setIntervalo] = useState("DIARIO")
    const [visible, setVisible] = useState(2)

    // 🔹 Filtrar incidencias según intervalo
    const filtradas = useMemo(() => {

        const ahoraPeru = new Date(
            new Date().toLocaleString("en-US", { timeZone: "America/Lima" })
        )

        const inicioHoy = new Date(
            ahoraPeru.getFullYear(),
            ahoraPeru.getMonth(),
            ahoraPeru.getDate(),
            0, 0, 0, 0
        )

        const finHoy = new Date(
            ahoraPeru.getFullYear(),
            ahoraPeru.getMonth(),
            ahoraPeru.getDate(),
            23, 59, 59, 999
        )

        const rangos = {
            DIARIO: () => ({
                inicio: inicioHoy,
                fin: finHoy
            }),

            MENSUAL: () => ({
                inicio: new Date(ahoraPeru.getFullYear(), ahoraPeru.getMonth(), 1),
                fin: new Date(ahoraPeru.getFullYear(), ahoraPeru.getMonth() + 1, 0, 23, 59, 59, 999)
            }),

            "CICLO ACADÉMICO": () => {
                const mes = ahoraPeru.getMonth() + 1

                if (mes <= 7) {
                    return {
                        inicio: new Date(ahoraPeru.getFullYear(), 0, 1),
                        fin: new Date(ahoraPeru.getFullYear(), 6, 31, 23, 59, 59, 999)
                    }
                }

                return {
                    inicio: new Date(ahoraPeru.getFullYear(), 7, 1),
                    fin: new Date(ahoraPeru.getFullYear(), 11, 31, 23, 59, 59, 999)
                }
            }
        }

        const { inicio, fin } = rangos[intervalo]?.() || rangos.DIARIO()

        return incidents
            .filter(i => {
                const fecha = new Date(i.fechaRegistro)
                return fecha >= inicio && fecha <= fin
            })
            .sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro))

    }, [intervalo, incidents])

    // 🔹 KPIs
    const total = filtradas.length
    const resueltas = filtradas.filter((i) => i.estado === 'Resuelta').length
    const pendientes = filtradas.filter((i) => i.estado === 'Pendiente').length
    const cerradas = filtradas.filter((i) => i.estado === 'Cerrada').length
    const porResueltas = total > 0 ? Math.round((resueltas / total) * 100) : 0
    const porCerradas = total > 0 ? Math.round((cerradas / total) * 100) : 0
    const promedio = calcularTiempoPromedio(filtradas)

    // 🔹 Paginación
    const visibles = filtradas.slice(0, visible)
    const hayMas = visible < filtradas.length

    const loadImage = (src) =>
        new Promise((resolve) => {
            const img = new Image()
            img.src = src
            img.onload = () => resolve(img)
        })

    const imprimirKPI = (doc, label, valor, xCentro, y) => {
        doc.setFont("times", "bold")
        const textoLabel = label + ": "
        doc.setFont("times", "normal")
        const textoValor = valor

        // Calculamos el ancho de ambos para centrar el bloque completo
        const anchoLabel = doc.getTextWidth(textoLabel)
        const anchoValor = doc.getTextWidth(textoValor)
        const anchoTotal = anchoLabel + anchoValor

        // El punto de inicio X para que el conjunto quede centrado
        const xInicio = xCentro - (anchoTotal / 2)

        // Dibujamos el Label (Negrita)
        doc.setFont("times", "bold")
        doc.text(textoLabel, xInicio - 1, y)

        // Dibujamos el Valor (Normal) justo después del label
        doc.setFont("times", "normal")
        doc.text(textoValor, xInicio + anchoLabel + 1, y)
    }

    // 🔹 Descargar PDF
    const generarPDF = async () => {
        setDonwloading(true)
        try {
            // 1. Orientación correcta: landscape (Ancho total = 297mm)
            const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
            const centroPagina = 297 / 2 // 148.5mm
            const fechaActual = new Date()

            // --- OPTIMIZACIÓN DE CARGA EN PARALELO ---
            // Lanzamos todas las peticiones de imágenes y capturas de gráficos al mismo tiempo
            const promesasGraficos = []
            if (estadisticasRef?.current) {
                const graficos = estadisticasRef.current.querySelectorAll('.grafico')
                // Mantenemos tu scale: 2 para que no pierdas calidad visual
                for (let i = 0; i < 4; i++) {
                    if (graficos[i]) {
                        promesasGraficos.push(html2canvas(graficos[i], { scale: 2, backgroundColor: "#ffffff" }))
                    } else {
                        promesasGraficos.push(Promise.resolve(null))
                    }
                }
            }

            const promesasImagenesTabla = filtradas.map(i =>
                i.imagen?.url ? loadImage(i.imagen.url).catch(() => null) : Promise.resolve(null)
            )

            // Ejecución masiva de promesas
            const [
                logoIzquierda,
                logoDerecha,
                imgUbicacion,
                imgTiempo,
                imgArrow,
                canvas1, canvas2, canvas3, canvas4,
                ...imagenesCargadas
            ] = await Promise.all([
                loadImage('https://res.cloudinary.com/francode/image/upload/v1778545882/unc_us4bkp.png'),
                loadImage('https://res.cloudinary.com/francode/image/upload/v1778545800/epis_fylrm7.png'),
                loadImage('https://res.cloudinary.com/francode/image/upload/v1778545879/ubicacion_jhydrl.png'),
                loadImage('https://res.cloudinary.com/francode/image/upload/v1778545876/tiempo_sunotv.png'),
                loadImage('https://res.cloudinary.com/francode/image/upload/v1778545752/arrow_m2erpg.png'),
                ...promesasGraficos,
                ...promesasImagenesTabla
            ])

            // --- LOGOS (Tus cálculos de aspecto originales) ---
            const alturaLogo = 32
            const aspectIzq = logoIzquierda.width / logoIzquierda.height
            const aspectDer = logoDerecha.width / logoDerecha.height

            doc.addImage(logoIzquierda, "PNG", 15, 14, alturaLogo * aspectIzq, alturaLogo)
            doc.addImage(logoDerecha, "PNG", 282 - alturaLogo * aspectDer, 14, alturaLogo * aspectDer, alturaLogo)

            // --- ENCABEZADO INSTITUCIONAL (Tus estilos exactos) ---
            let y = 20
            doc.setFont("times", "bold").setFontSize(14)
            doc.text("UNIVERSIDAD NACIONAL DE CAJAMARCA", centroPagina, y, { align: "center" })
            y += 7
            doc.setFontSize(13).text("FACULTAD DE INGENIERÍA", centroPagina, y, { align: "center" })
            y += 8
            doc.setFont("times", "normal").setFontSize(12)
            doc.text("ESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMAS", centroPagina, y, { align: "center" })
            y += 7
            doc.setFontSize(11).text("SISTEMA DE CONTROL DE INCIDENCIAS", centroPagina, y, { align: "center" })

            y += 14
            doc.setFont("times", "bold").setFontSize(12)
            doc.text("REPORTE DE INCIDENCIAS", centroPagina, y, { align: "center" })

            // --- INTERVALO DINÁMICO ---
            y += 7
            doc.setFontSize(11)
            let valorIntervalo = ""
            if (intervalo === "DIARIO") {
                valorIntervalo = "Diario"
            } else if (intervalo === "MENSUAL") {
                const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
                valorIntervalo = `Mensual / ${meses[fechaActual.getMonth()]}`
            } else if (intervalo === "CICLO ACADÉMICO") {
                valorIntervalo = "Ciclo Académico"
            } else {
                valorIntervalo = intervalo
            }

            const etiqueta = "Tipo: "
            doc.setFont("times", "bold")
            const anchoEtiqueta = doc.getTextWidth(etiqueta)
            doc.setFont("times", "normal")
            const anchoValor = doc.getTextWidth(valorIntervalo)
            const xInicio = (297 - (anchoEtiqueta + anchoValor)) / 2

            doc.setFont("times", "bold").text(etiqueta, xInicio, y)
            doc.setFont("times", "normal").text(valorIntervalo, xInicio + anchoEtiqueta, y)

            // --- INSERTAR GRÁFICOS (Tus posiciones originales) ---
            doc.setFontSize(10).setFont("times", "bold")
            if (canvas1) {
                doc.text("Incidencias por nivel de prioridad", 62.5, 70, { align: "center" })
                doc.addImage(canvas1.toDataURL("image/png"), 'PNG', 15, 72, 95, 50)
            }
            if (canvas2) {
                doc.text("Distribución por Procedencia", 234.5, 70, { align: "center" })
                doc.addImage(canvas2.toDataURL("image/png"), 'PNG', 187, 72, 95, 50)
            }
            if (canvas3) {
                doc.text("Prioridades por Procedencia", 62.5, 138, { align: "center" })
                doc.addImage(canvas3.toDataURL("image/png"), 'PNG', 15, 140, 95, 50)
            }
            if (canvas4) {
                doc.text("Evolución de Incidencias", 234.5, 138, { align: "center" })
                doc.addImage(canvas4.toDataURL("image/png"), 'PNG', 187, 140, 95, 50)
            }

            y += 7
            imprimirKPI(doc, "Fecha", formatFechaCorta(fechaActual), centroPagina, y)

            // --- TABLA KPIs ---
            const getCount = (estado, prioridad) => filtradas.filter(i => i.estado === estado && i.prioridad === prioridad).length
            let yTablaKPI = 95
            doc.setFontSize(12).setTextColor(0, 51, 102).setFont("times", "bold")
            doc.text("Resumen de incidencias por prioridad", centroPagina, yTablaKPI - 5, { align: "center" })

            autoTable(doc, {
                startY: yTablaKPI,
                margin: { left: centroPagina - 38 },
                head: [['ESTADO', 'ALTA', 'MEDIA', 'BAJA', 'TOTAL']],
                body: [
                    ['Registradas', filtradas.filter(i => i.prioridad === 'Alta').length, filtradas.filter(i => i.prioridad === 'Media').length, filtradas.filter(i => i.prioridad === 'Baja').length, total],
                    ['Resueltas', getCount('Resuelta', 'Alta'), getCount('Resuelta', 'Media'), getCount('Resuelta', 'Baja'), resueltas],
                    ['Pendientes', getCount('Pendiente', 'Alta'), getCount('Pendiente', 'Media'), getCount('Pendiente', 'Baja'), pendientes],
                    ['Cerradas', getCount('Cerrada', 'Alta'), getCount('Cerrada', 'Media'), getCount('Cerrada', 'Baja'), cerradas],
                ],
                theme: 'grid',
                styles: { fontSize: 8, halign: 'center' },
                headStyles: { fillColor: [0, 51, 102] },
                columnStyles: { 0: { fontStyle: 'bold', halign: 'left', cellWidth: 21 }, 1: { cellWidth: 13 }, 2: { cellWidth: 13 }, 3: { cellWidth: 13 }, 4: { cellWidth: 16 } }
            })

            // --- INDICADORES RESUMEN (Tu función original intacta) ---
            const drawIndicadorResumen = (img, xdistImg, xdistFlecha, text1, text2, valor, yPosition) => {
                const xCentroBloque = 143
                if (img) doc.addImage(img, 'PNG', xCentroBloque - xdistImg, yPosition, 7, 7)
                doc.setFontSize(8.5).setFont("helvetica", "normal").setTextColor(60, 60, 60)
                doc.text(text1, xCentroBloque, yPosition + 2, { align: "center" })
                doc.text(text2, xCentroBloque, yPosition + 6, { align: "center" })
                const anchoMaxTexto = Math.max(doc.getTextWidth(text1), doc.getTextWidth(text2))
                const xFlecha = (xCentroBloque + 5) + (anchoMaxTexto / 2) - xdistFlecha
                doc.addImage(imgArrow, 'PNG', xFlecha, yPosition + 2.5, 4, 3)
                doc.setFontSize(10).setFont("helvetica", "bold").setTextColor(0, 51, 102)
                doc.text(valor, xFlecha + 5, yPosition + 5.5)
            }

            let yFinalTabla = doc.lastAutoTable.finalY
            drawIndicadorResumen(imgUbicacion, 28, 4, "Ubicación con mayor número", "de incidencias registradas", calcularUbicacionMayor(filtradas), yFinalTabla + 10)
            drawIndicadorResumen(imgTiempo, 25, 3, "Tiempo promedio de", "respuesta a incidencias", promedio, yFinalTabla + 22)

            // --- TABLA DETALLADA (Tus estilos originales) ---
            let encabezados = [
                "FECHA / LUGAR", // Fecha + Procedencia
                "CURSO / DOCENTE",     // Curso + Docente
                "ACTIVOS",              // Equipos involucrados
                "PRIORIDAD / CATEGORÍA",  // Nivel de urgencia y tipo de incidencia
                "OBSERVACIONES",        // Descripción del problema
                "EVIDENCIA",               // Evidencia visual
                "SOLUCIÓN"              // Resolución aplicada
            ]
            const filas = filtradas.map(i => {
                // Fecha + Procedencia
                const registro = `${formatFechaHora(i.fechaRegistro)}\n\n${i.procedencia}`
                // Curso + Docente
                const sesion = `${i.curso}\n\n${nombreCorto(i.docente) || "N/A"}`
                // Prioridad + Categoria
                const clasificacion = `${i.prioridad}\n\n${i.categoria}: ${i.subcategoria || "N/A"}`;

                let fila = [
                    registro,
                    sesion,
                    i.activosReportados?.length
                        ? i.activosReportados
                            .map(formatActivo)
                            .join(", ")
                        : "-",
                    clasificacion,
                    i.observaciones,
                    "", // La imagen se maneja en didDrawCell
                    i.solucion || "-"]
                return fila
            })

            doc.addPage()
            autoTable(doc, {
                startY: 12,
                head: [encabezados],
                body: filas,
                showHead: 'firstPage',
                styles: { fontSize: 11, lineColor: [44, 62, 80], lineWidth: 0.1, valign: 'middle', minCellHeight: 42 },
                headStyles: { fontSize: 9.5, fillColor: [0, 51, 102], textColor: 255, halign: 'center', valign: 'middle', minCellHeight: 10 },
                columnStyles: {
                    [encabezados.indexOf("FECHA / LUGAR")]: { cellWidth: 30 },
                    [encabezados.indexOf("CURSO / DOCENTE")]: { cellWidth: 32 },
                    [encabezados.indexOf("ACTIVOS")]: { cellWidth: 38 },
                    [encabezados.indexOf("PRIORIDAD / CATEGORÍA")]: { cellWidth: 28 },
                    [encabezados.indexOf("OBSERVACIONES")]: { cellWidth: 45 },
                    [encabezados.indexOf("EVIDENCIA")]: { cellWidth: 50 },
                    [encabezados.indexOf("SOLUCIÓN")]: { cellWidth: 45 },
                },
                bodyStyles: { halign: 'center', valign: 'middle' },
                didDrawCell: function (data) {
                    const indexImagen = encabezados.indexOf("EVIDENCIA")
                    if (data.section === "body" && data.column.index === indexImagen) {
                        const img = imagenesCargadas[data.row.index]
                        if (img) {
                            const padding = 2
                            const cellW = data.cell.width - (padding * 2)
                            const cellH = data.cell.height - (padding * 2)
                            const imgAspect = img.width / img.height
                            let drawW = cellW, drawH = cellW / imgAspect
                            if (drawH > cellH) { drawH = cellH; drawW = cellH * imgAspect }
                            doc.addImage(img, "JPEG", data.cell.x + (data.cell.width - drawW) / 2, data.cell.y + (data.cell.height - drawH) / 2, drawW, drawH)
                        } else {
                            doc.setFontSize(9).text("No hay imagen disponible", data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, { align: "center" })
                        }
                    }
                },
                didParseCell: function (data) {
                    if (data.section === "body") {
                        const incidencia = filtradas[data.row.index]
                        const colPrioridad = encabezados.indexOf("PRIORIDAD / CATEGORÍA")

                        // 1. Fondo de fila: Blanco puro para que el reporte respire
                        if (incidencia.estado === "Pendiente") {
                            data.cell.styles.fillColor = [255, 245, 245]; // Rojo muy pálido
                        } else if (incidencia.estado === "Resuelta") {
                            data.cell.styles.fillColor = [245, 255, 245]; // Verde muy pálido
                        } else if (incidencia.estado === "Cerrada") {
                            data.cell.styles.fillColor = [248, 248, 248]; // Gris muy pálido
                        }

                        // 2. Estilo específico para la COLUMNA PRIORIDAD
                        if (data.column.index === colPrioridad) {
                            data.cell.styles.fontStyle = 'bold'
                            const p = (incidencia.prioridad || "").toLowerCase()

                            if (p === "alta") {
                                data.cell.styles.fillColor = [255, 76, 36] // Rojo Flat (Elegante)
                                data.cell.styles.textColor = [255, 255, 255] // Blanco
                            } else if (p === "media") {
                                data.cell.styles.fillColor = [233, 179, 0] // Amarillo Flat
                                data.cell.styles.textColor = [0, 0, 0]       // Negro
                            } else if (p === "baja") {
                                data.cell.styles.fillColor = [0, 199, 100] // Verde Flat
                                data.cell.styles.textColor = [255, 255, 255] // Blanco
                            }
                        }
                    }
                }
            })

            // --- FIRMAS (Tus coordenadas y anchos exactos) ---
            let yFirma = doc.lastAutoTable.finalY + 40
            if (yFirma > 180) { doc.addPage(); yFirma = 30 }

            doc.setFontSize(11)
            const anchoLinea = 46
            const lineaY = yFirma - 5

            doc.line(50 - (anchoLinea / 2), lineaY, 50 + (anchoLinea / 2), lineaY)
            doc.text("Personal administrativo", 50, yFirma, { align: "center" })

            doc.line(247 - (anchoLinea / 2), lineaY, 247 + (anchoLinea / 2), lineaY)
            doc.text("Jefe de Laboratorio", 247, yFirma, { align: "center" })

            const yDirector = yFirma + 35
            doc.line(centroPagina - (anchoLinea / 2), yDirector - 5, centroPagina + (anchoLinea / 2), yDirector - 5)
            doc.text("Director académico", centroPagina, yDirector, { align: "center" })

            doc.save(`Reporte_${intervalo}.pdf`)
            toast.success('PDF generado correctamente')

        } catch (error) {
            toast.error('Error al generar PDF')
            console.error("Error generating PDF:", error)
        } finally {
            setDonwloading(false)
        }
    }

    // 🔹 Descargar Excel con ExcelJS
    const handleDownloadExcel = async () => {
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet(`Reporte ${intervalo}`)

        // Encabezado
        const headerRow = worksheet.addRow([
            "FECHA",
            "DOCENTE",
            "PROCEDENCIA",
            "ACTIVOS",
            "PRIORIDAD",
            "OBSERVACIONES",
            "IMAGEN",
            "ESTADO",
        ])

        headerRow.eachCell((cell) => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "003366" }, // azul oscuro sistema
            }
            cell.font = { color: { argb: "FFFFFF" }, bold: true }
            cell.alignment = { vertical: "middle", horizontal: "center" }
            cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            }
        })

        // Filas
        filtradas.forEach((i) => {
            const row = worksheet.addRow([
                new Date(i.fechaRegistro).toLocaleDateString(),
                i.docente || "-",
                i.procedencia,
                i.activosReportados?.join(", ") || "-",
                i.prioridad,
                i.observaciones || "-",
                i.estado,
            ])

            row.eachCell((cell) => {
                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                }
            })

            // Colorear estado
            const estadoCell = row.getCell(7)
            estadoCell.font = { bold: true }
            estadoCell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: i.estado ? "C6EFCE" : "FFC7CE" }, // verde si resuelta, rojo si pendiente
            }
        })

        worksheet.columns.forEach((col) => {
            col.width = 20
        })

        const buffer = await workbook.xlsx.writeBuffer()
        saveAs(new Blob([buffer]), `Reporte_${intervalo}.xlsx`)
    }

    return (
        <section className="reportes-panel" ref={ref} id={id}>
            {/* Intervalos */}
            <div className="encabezado">
                <h1>REPORTES</h1>
                <div className="intervalos">
                    {["DIARIO", "MENSUAL", "CICLO ACADÉMICO"].map((btn) => (
                        <button
                            key={btn}
                            className={intervalo === btn ? "activo" : ""}
                            onClick={() => {
                                setIntervalo(btn)
                                setVisible(2)
                            }}
                        >
                            {btn}
                        </button>
                    ))}
                </div>
            </div>

            {/* Indicadores */}
            <div className="indicadores">
                <div className="indicador">
                    <div className="circulo1"><span className="regist">{total}</span></div>
                    <p>Incidencias registradas</p>
                </div>
                <div className="indicador">
                    <div className="circulo2"><span className="percent">{porResueltas}%</span></div>
                    <p>Incidencias resueltas</p>
                </div>
                <div className="indicador">
                    <div className="circulo3"><span className="average">{promedio}</span></div>
                    <p>Tiempo promedio de respuesta</p>
                </div>
            </div>

            {/* Tabla */}
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
                        {visibles.map((i) => (
                            <tr key={i.id}>
                                <td className="fechaLugar">
                                    <p>{formatFechaHora(i.fechaRegistro)}</p>
                                    <p>{i.procedencia}</p>
                                </td>
                                <td className="cursoDocente">
                                    <p>{i.curso}</p>
                                    <p>{i.docente}</p>
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
                                    <p>{i.estado}</p>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            <div className="paginacion">
                {hayMas && <button
                    className="btn-vermas"
                    onClick={() => setVisible((v) => v + 3)}
                >
                    <img src='https://res.cloudinary.com/francode/image/upload/v1778545833/info_kn7ij3.png' alt="info-icon" />
                    Ver más
                </button>}
                {visible > 5 &&
                    <button
                        className="btn-vermas"
                        onClick={() => setVisible(2)}
                    >
                        <img src='https://res.cloudinary.com/francode/image/upload/v1778545842/ocultar_yqldvu.png' alt="ocultar-icon" />
                        Ocultar
                    </button>}

                <div className="descargas">
                    <p>Descargar en formato:</p>
                    <div className="iconos">
                        <img src='https://res.cloudinary.com/francode/image/upload/v1778545846/pdf_smirrk.png'
                            alt="PDF-icon"
                            onClick={generarPDF} />
                        <img src='https://res.cloudinary.com/francode/image/upload/v1778545809/excel_xgeav6.png'
                            alt="excel-icon"
                            onClick={() => toast.error('Funcionalidad en desarrollo') /* handleDownloadExcel */}
                        />
                    </div>
                </div>
            </div>
            {
                donwloading && <Notificaciones mensaje="Generando reporte, por favor espere..." />
            }
        </section>
    )
})

export default Reportes
