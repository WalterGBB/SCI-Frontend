import { forwardRef, useState, useMemo } from "react"
import "../styles/Reportes.css"
import info from "../assets/info.png"
import ocultar from '../assets/ocultar.png'
import pdfIcon from "../assets/pdf.png"
import excelIcon from "../assets/excel.png"
import { formatActivo } from "../utils/formatActivo"
import { calcularTiempoPromedio } from "../utils/tiempoPromedio"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"

const Reportes = forwardRef(({ id, incidents }, ref) => {
    const [intervalo, setIntervalo] = useState("SEMANAL")
    const [visible, setVisible] = useState(2)

    // 🔹 Filtrar incidencias según intervalo
    const filtradas = useMemo(() => {
        const ahora = new Date()
        let desde
        if (intervalo === "SEMANAL") {
            desde = new Date(ahora.setDate(ahora.getDate() - 7))
        } else if (intervalo === "MENSUAL") {
            desde = new Date(ahora.setMonth(ahora.getMonth() - 1))
        } else {
            desde = new Date(ahora.setFullYear(ahora.getFullYear() - 1))
        }

        return incidents
            .filter((i) => new Date(i.fechaRegistro) >= desde)
            .sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro))
    }, [intervalo, incidents])

    // 🔹 KPIs
    const total = filtradas.length
    const resueltas = filtradas.filter((i) => i.estado === true)
    const porcentaje = total > 0 ? Math.round((resueltas.length / total) * 100) : 0
    const promedio = calcularTiempoPromedio(filtradas)

    // 🔹 Paginación
    const visibles = filtradas.slice(0, visible)
    const hayMas = visible < filtradas.length

    // 🔹 Descargar PDF
    const handleDownloadPDF = () => {
        const doc = new jsPDF()
        doc.setFontSize(16)
        doc.text(`REPORTE ${intervalo}`, 14, 20)

        doc.setFontSize(12)
        doc.text(`Incidencias registradas: ${total}`, 14, 30)
        doc.text(`% Resueltas: ${porcentaje}%`, 14, 38)
        doc.text(`Tiempo promedio: ${promedio}`, 14, 46)

        autoTable(doc, {
            startY: 55,
            head: [["FECHA", "DOCENTE", "ACTIVO", "NECESIDAD", "PRIORIDAD", "PROCEDENCIA", "ESTADO"]],
            body: filtradas.map((i) => [
                new Date(i.fechaRegistro).toLocaleDateString(),
                i.docente || "-",
                i.activosReportados?.join(", ") || "-",
                i.necesidad || "-",
                i.prioridad,
                i.procedencia,
                i.estado ? "Resuelta" : "Pendiente",
            ]),
        })

        doc.save(`Reporte_${intervalo}.pdf`)
    }

    // 🔹 Descargar Excel con ExcelJS
    const handleDownloadExcel = async () => {
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet(`Reporte ${intervalo}`)

        // Encabezado
        const headerRow = worksheet.addRow([
            "FECHA",
            "DOCENTE",
            "ACTIVO",
            "NECESIDAD",
            "PRIORIDAD",
            "PROCEDENCIA",
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
                i.activosReportados?.join(", ") || "-",
                i.necesidad || "-",
                i.prioridad,
                i.procedencia,
                i.estado ? "Resuelta" : "Pendiente",
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

    const formatDate = (iso) => {
        const date = new Date(iso)
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
    }

    return (
        <section className="reportes-panel" ref={ref} id={id}>
            <h1>GENERAR REPORTES</h1>

            {/* Intervalos */}
            <div className="intervalos">
                {["SEMANAL", "MENSUAL", "ANUAL"].map((btn) => (
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

            {/* Indicadores */}
            <div className="indicadores">
                <div className="indicador">
                    <div className="circulo1"><span className="regist">{total}</span></div>
                    <p>Incidencias registradas</p>
                </div>
                <div className="indicador">
                    <div className="circulo2"><span className="percent">{porcentaje}%</span></div>
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
                            <th className="col-fecha">FECHA</th>
                            <th className="col-curso">CURSO</th>
                            <th className="col-docente">DOCENTE</th>
                            <th className="col-procedencia">PROCEDENCIA</th>
                            <th className="col-activos">ACTIVOS</th>
                            <th className="col-prioridad">PRIORIDAD</th>
                            <th className="col-observaciones">OBSERVACIONES</th>
                            <th className="col-estado">ESTADO</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibles.map((i) => (
                            <tr key={i.id}>
                                <td className="col-fecha">{formatDate(i.fechaRegistro)}</td>
                                <td className="col-curso">{i.curso}</td>
                                <td className="col-docente">{i.docente}</td>
                                <td className="col-procedencia">{i.procedencia}</td>
                                <td className="col-activos">{i.activosReportados.map(formatActivo).join(', ')}</td>
                                <td className={`col-prioridad prioridad ${i.prioridad.toLowerCase()}`}>{i.prioridad}</td>
                                <td className="col-observaciones">
                                    <div className="cell-content">{i.observaciones}</div>
                                </td>
                                <td className={`col-estado estado ${i.estado ? 'resuelta' : 'pendiente'}`}>
                                    {i.estado ? 'Resuelta' : 'Pendiente'}
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
                    <img src={info} alt="info-icon" />
                    Ver más
                </button>}
                {visible > 5 &&
                    <button
                        className="btn-vermas"
                        onClick={() => setVisible(2)}
                    >
                        <img src={ocultar} alt="ocultar-icon" />
                        Ocultar
                    </button>}
            </div>

            {/* Descarga */}
            <div className="descargas">
                <p>Descargar en formato:</p>
                <div className="iconos">
                    <img src={pdfIcon} alt="PDF-icon" onClick={handleDownloadPDF} />
                    <img src={excelIcon} alt="excel-icon" onClick={handleDownloadExcel} />
                </div>
            </div>
        </section>
    )
})

export default Reportes
