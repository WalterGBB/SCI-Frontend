import { forwardRef, useState, useEffect, useMemo } from 'react'
import {
    PieChart, Pie,
    BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, LineChart, Line
} from 'recharts'

import '../styles/Estadisticas.css'

const Estadisticas = forwardRef(({ id, incidents }, ref) => {
    // Fechas aplicadas (afectan gráficos)
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    // Fechas de los inputs (edición del usuario)
    const [inputFrom, setInputFrom] = useState('')
    const [inputTo, setInputTo] = useState('')

    // Inicializar con la primera y última incidencia
    useEffect(() => {
        if (incidents.length > 0) {
            const sorted = [...incidents].sort((a, b) => new Date(a.fechaRegistro) - new Date(b.fechaRegistro))
            const first = new Date(sorted[0].fechaRegistro).toISOString().slice(0, 10)
            const last = new Date(sorted[sorted.length - 1].fechaRegistro).toISOString().slice(0, 10)

            // Si first y last son iguales (mismo día), establecer un rango de un día
            setFromDate(first)
            setToDate(last)
            setInputFrom(first)
            setInputTo(last)
        }
    }, [incidents])

    // Aplicar filtros al hacer clic
    const handleGenerar = () => {
        setFromDate(inputFrom)
        setToDate(inputTo)
    }

    // Incidencias filtradas por el rango APLICADO
    const filteredIncidents = useMemo(() => {
        if (!fromDate || !toDate) return incidents

        const start = new Date(fromDate + "T00:00:00")
        const end = new Date(toDate + "T23:59:59.999")

        return incidents.filter(({ fechaRegistro }) => {
            const fecha = new Date(fechaRegistro)
            return fecha >= start && fecha <= end
        })

    }, [incidents, fromDate, toDate])

    // Helpers
    const countByField = (list, field) => {
        const counts = {}
        list.forEach((inc) => {
            const key = inc[field]
            counts[key] = (counts[key] || 0) + 1
        })
        return Object.entries(counts).map(([name, value]) => ({ name, value }))
    }

    // ======== Pie: Prioridades (filtrado) ========
    const necesidadesData = useMemo(() => {
        const data = countByField(filteredIncidents, 'prioridad')
        return data.map((item) => {
            let fill = '#ffffff'
            if (item.name === 'Baja') fill = '#00c764'
            else if (item.name === 'Media') fill = '#e9b300'
            else if (item.name === 'Alta') fill = '#ff4c24'
            return { ...item, fill }
        })
    }, [filteredIncidents])

    // ======== Barras horizontales: Procedencia (filtrado) ========
    const activosData = useMemo(() => {
        return countByField(filteredIncidents, 'procedencia').sort((a, b) => b.value - a.value)
    }, [filteredIncidents])

    // Escala azul por cantidad (mismo valor => mismo tono)
    const blueScale = (value, min, max) => {
        if (max === min) return 'rgb(100,149,237)' // todos iguales
        const ratio = (value - min) / (max - min)     // 0..1
        const lightness = 100 - ratio * 40             // 100% (claro) -> 40% (oscuro)
        return `hsl(220, 100%, ${lightness}%)`
    }
    const values = activosData.map(d => d.value)
    const minVal = values.length ? Math.min(...values) : 0
    const maxVal = values.length ? Math.max(...values) : 0

    // ======== Barras agrupadas: Prioridad vs Procedencia (filtrado) ========
    const graficoPrioridades = useMemo(() => {
        const resumen = {
            Aulas: { Baja: 0, Media: 0, Alta: 0 },
            Laboratorios: { Baja: 0, Media: 0, Alta: 0 }
        }
        filteredIncidents.forEach(({ prioridad, procedencia }) => {
            if (!prioridad || !procedencia) return
            const esAula = procedencia.toLowerCase().includes('aula')
            const esLab = procedencia.toLowerCase().includes('laboratorio')
            if (esAula && resumen.Aulas[prioridad] !== undefined) resumen.Aulas[prioridad]++
            else if (esLab && resumen.Laboratorios[prioridad] !== undefined) resumen.Laboratorios[prioridad]++
        })
        return ['Baja', 'Media', 'Alta'].map((nivel) => ({
            name: nivel,
            Aulas: resumen.Aulas[nivel],
            Laboratorios: resumen.Laboratorios[nivel],
        }))
    }, [filteredIncidents])

    // ======== Línea de tendencia diaria (filtrado por rango aplicado) ========
    const graficoTendencia = useMemo(() => {
        if (!fromDate || !toDate) return []

        const start = new Date(fromDate + "T00:00:00")
        const end = new Date(toDate + "T23:59:59.999")

        const counts = {}

        filteredIncidents.forEach(({ fechaRegistro }) => {
            const fecha = new Date(fechaRegistro)
            const key = fecha.toLocaleDateString('sv-SE') // formato YYYY-MM-DD estable
            counts[key] = (counts[key] || 0) + 1
        })

        const data = []

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const key = d.toLocaleDateString('sv-SE')
            data.push({
                fechaRegistro: key.split('-').reverse().join('/'),
                Incidencias: counts[key] || 0
            })
        }

        return data

    }, [filteredIncidents, fromDate, toDate])

    return (
        <section className="estadisticas-panel" ref={ref} id={id}>
            <div className="encabezado">
                <h1>ESTADÍSTICAS</h1>
                <div className="filtrosE">
                    <span>Del</span>
                    <input
                        type="date"
                        value={inputFrom}
                        onChange={(e) => setInputFrom(e.target.value)}
                    />
                    <span>al</span>
                    <input
                        type="date"
                        value={inputTo}
                        onChange={(e) => setInputTo(e.target.value)}
                    />
                    <button className="btn-generar" onClick={handleGenerar}>
                        <img src='https://res.cloudinary.com/francode/image/upload/v1778545821/generar_buxlmz.png' alt="generar-icon" />
                        generar
                    </button>
                </div>
            </div>

            <div className="graficos-grid">
                {/* CIRCULAR - PRIORIDAD */}
                <div className="grafico">
                    <ResponsiveContainer width="100%" height="90%">
                        <PieChart>
                            <Tooltip />

                            <Legend
                                layout="vertical"
                                verticalAlign="middle"
                                align="right"
                                wrapperStyle={{
                                    fontSize: "12px"
                                }}
                            />

                            <Pie
                                data={necesidadesData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={65}
                                label={({ percent }) =>
                                    `${(percent * 100).toFixed(0)}%`
                                }
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* BARRAS HORIZONTALES - PROCEDENCIA */}
                <div className="grafico">
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart
                            data={activosData}
                            layout="vertical"
                            barCategoryGap="25%"
                            margin={{ top: 10, right: 5, left: -24, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" tick={{ fontSize: 12 }} />
                            <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} interval={0} />
                            <Tooltip />
                            <Bar dataKey="value" name="Incidencias">
                                {activosData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={blueScale(entry.value, minVal, maxVal)}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* BARRAS AGRUPADAS - PRIORIDAD VS PROCEDENCIA */}
                <div className="grafico">
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart
                            barCategoryGap="15%"
                            barGap="6%"
                            data={graficoPrioridades}
                            margin={{ left: -10 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" align="center" />
                            <XAxis dataKey="name" />
                            <YAxis width={50} />
                            <Tooltip />
                            <Legend align='center' layout="horizontal" verticalAlign="top"
                                wrapperStyle={{
                                    left: 0,
                                    width: '100%',
                                    paddingBottom: 10,
                                    textAlign: 'center',
                                    gap: 5
                                }}
                            />
                            <Bar dataKey="Aulas" fill="#2563EB" />
                            <Bar dataKey="Laboratorios" fill="#10B981" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* LÍNEA - TENDENCIA DIARIA */}
                <div className="grafico">
                    <ResponsiveContainer width="100%" height="90%">
                        <LineChart
                            data={graficoTendencia}
                            margin={{ top: 10, right: 5, left: -35, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="fechaRegistro" />
                            <YAxis />
                            <Tooltip />
                            <Legend layout="horizontal" verticalAlign="top" align="center" />
                            <Line type="monotone" dataKey="Incidencias" stroke="#06B6D4" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </section>
    )
})

export default Estadisticas