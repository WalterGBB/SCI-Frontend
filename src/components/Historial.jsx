import { forwardRef, useState, useEffect } from 'react'
import '../styles/Historial.css'
import { formatActivo } from '../utils/formatActivo'

import filtrar from '../assets/filtrar.png'
import info from '../assets/info.png'
import ocultar from '../assets/ocultar.png'
import noCheck from '../assets/noCheck.png'
import check from '../assets/check.png'
import eliminar from '../assets/eliminar.png'

import incidentsService from '../services/incidents'

const Historial = forwardRef(({ id, incidents, setIncidents }, ref) => {
    const [filtered, setFiltered] = useState([])
    const [visible, setVisible] = useState(3)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [priority, setPriority] = useState('todos')

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
        const sorted = [...incidents].sort(
            (a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro)
        )

        const result = sorted.filter((i) => {
            const fechaRegistro = new Date(i.fechaRegistro)
            const desde = new Date(startDate)
            const hasta = new Date(endDate)

            const cumpleFecha = fechaRegistro >= desde && fechaRegistro <= hasta
            const cumplePrioridad =
                priority === 'todos' || i.prioridad === priority

            return cumpleFecha && cumplePrioridad
        })

        setFiltered(result)
        setVisible(5)
    }

    const handleVerMas = () => setVisible((prev) => prev + 3)
    const handleOcultar = () => setVisible(3)

    const visibleItems = filtered.slice(0, visible)
    const hayMas = visible < filtered.length

    const formatDate = (iso) => {
        const date = new Date(iso)
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
    }

    const handleCheck = async (id) => {
        try {
            // Llamar al servicio para actualizar el estado
            const updatedIncident = await incidentsService.updatedIncident(id)

            // Actualizar el estado global
            setIncidents((prev) =>
                prev.map((i) => (i.id === id ? updatedIncident : i))
            )

            // Actualizar el estado local
            setFiltered((prev) =>
                prev.map((i) => (i.id === id ? updatedIncident : i))
            )
        } catch (error) {
            console.error('Error al actualizar el estado:', error)
        }
    }

    const handleDelete = async (id) => {
        try {
            await incidentsService.deleteIncident(id)

            // Actualizar el estado global
            setIncidents((prev) => prev.filter((i) => i.id !== id))

            // Actualizar el estado local
            setFiltered((prev) => prev.filter((i) => i.id !== id))
        } catch (error) {
            console.error('Error al eliminar la incidencia:', error)
        }
    }

    return (
        <section className="historial-panel" ref={ref} id={id}>
            <h1>HISTORIAL</h1>
            {startDate && endDate && (
                <p className="subtitulo">
                    Incidencias registradas desde el {formatDate(startDate)} hasta el {formatDate(endDate)}
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
                    <img src={filtrar} alt="filtrar-icon" />
                    Filtrar
                </button>
            </div>

            <div className="tabla-container">
                <table className="tabla">
                    <colgroup>
                        <col className="col-fecha" />
                        <col className="col-curso" />
                        <col className="col-docente" />
                        <col className="col-procedencia" />
                        <col className="col-activos" />
                        <col className="col-prioridad" />
                        <col className="col-observaciones" />
                        <col className="col-estado" />
                    </colgroup>

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
                        {visibleItems.map((i) => (
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
                                    <span>{i.estado ? 'Resuelta' : 'Pendiente'}</span>
                                    <div className="editar-estado">
                                        <img
                                            src={i.estado ? check : noCheck}
                                            alt="check-icon"
                                            onClick={() => handleCheck(i.id)}
                                        />
                                        <img
                                            src={eliminar}
                                            alt="eliminar-icon"
                                            onClick={() => handleDelete(i.id)}
                                        />
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
                        <img src={info} alt="info-icon" />
                        Ver más
                    </button>
                )}

                {visible > 3 && (
                    <button className="btn-vermas" onClick={handleOcultar}>
                        <img src={ocultar} alt="ocultar-icon" />
                        Ocultar
                    </button>
                )}
            </div>
        </section>
    )
})

export default Historial
