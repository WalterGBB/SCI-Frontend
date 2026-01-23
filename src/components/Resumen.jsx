import { forwardRef } from 'react'
import '../styles/Resumen.css'
import flecha from '../assets/flecha.png'
import signo from '../assets/signo.png'
import ubicacion from '../assets/ubicacion.png'
import tiempo from '../assets/tiempo.png'
import arrow from '../assets/arrow.png'
import editar from '../assets/editar.png'

import { calcularTiempoPromedio } from "../utils/tiempoPromedio"

const Resumen = forwardRef(({ incidents, onAtenderClick }, ref) => {
    // Número total de incidencias registradas
    const totales = incidents.length

    // Número de incidencias resueltas
    const resueltas = incidents.filter(i => i.estado === true).length

    // Incidencias pendientes
    const pendientes = incidents.filter(i => i.estado === false)

    // Número de incidencias por prioridad
    const altas = pendientes.filter(i => i.prioridad === 'Alta').length
    const medias = pendientes.filter(i => i.prioridad === 'Media').length
    const bajas = pendientes.filter(i => i.prioridad === 'Baja').length

    // Porcentaje de incidencias resueltas
    const porcentajeResueltas = totales > 0 ? ((resueltas / totales) * 100).toFixed(0) : 0

    // Número de incidencias registradas hoy
    const hoy = new Date()
    const registradasHoy = incidents.filter(i => {
        const fechaIncidencia = new Date(i.fechaRegistro)
        return fechaIncidencia.toDateString() === hoy.toDateString()
    })

    // Calcular el ángulo para el gráfico circular
    // Convertir porcentaje a grados (360deg = 100%)
    const anguloGrado = (porcentajeResueltas / 100) * 360

    // Estilo dinámico para el gráfico circular
    const estiloGraficoCircular = {
        background: `conic-gradient(#22c55e 0deg ${anguloGrado}deg, #6b7280 ${anguloGrado}deg 360deg)`
    }

    // Calcular ubicación con mayor número de incidencias
    const calcularUbicacionMayor = () => {
        if (incidents.length === 0) return "Sin datos"

        // Contar incidencias por procedencia
        const contadorProcedencia = {}
        incidents.forEach(incidencia => {
            const procedencia = incidencia.procedencia
            contadorProcedencia[procedencia] = (contadorProcedencia[procedencia] || 0) + 1
        })

        // Encontrar la ubicación con más incidencias
        const ubicacionMayor = Object.keys(contadorProcedencia).reduce((a, b) =>
            contadorProcedencia[a] > contadorProcedencia[b] ? a : b
        )

        return ubicacionMayor
    }

    const ubicacionMayorIncidencias = calcularUbicacionMayor()

    // Calcular tiempo promedio de respuesta
    const tiempoPromedioRespuesta = calcularTiempoPromedio(incidents)

    return (
        <section className="main-panel" ref={ref}>
            <div className="kpis">
                <div className="kpi total">
                    <h1>{totales}</h1>
                    <p>Incidencias<br />registradas</p>
                </div>

                <div className="kpi resueltas">
                    <h2>{resueltas}</h2>
                    <p>Incidencias<br />resueltas</p>
                </div>

                <div className="kpi pendientes">
                    <h2><img src={signo} alt="signo-exclamación" />{pendientes.length}</h2>
                    <p>Incidencias<br />sin resolver</p>
                    <button className="btn-atender" onClick={onAtenderClick}>
                        <img src={editar} alt="editar-icon" />atender
                    </button>
                </div>

                <div className='detalles'>
                    <img src={flecha} alt="flecha" className='flecha' />
                    <ul className="detalle-lista">
                        <li><span className="rojo">{altas}</span> incidencias de prioridad alta</li>
                        <li><span className="naranja">{medias}</span> incidencias de prioridad media</li>
                        <li><span className="verde">{bajas}</span> incidencias de prioridad baja</li>
                    </ul>
                </div>

                <div className="extras">
                    <div>
                        <img src={ubicacion} alt="ubicación-ícono" />
                        <p>Ubicación con mayor número<br />de incidencias registradas</p>
                        <p><img src={arrow} alt="arrow-icon" /></p>
                        <p className='ubicacion'>{ubicacionMayorIncidencias}</p>
                    </div>
                    <div>
                        <img src={tiempo} alt="reloj-icono" />
                        <p>Tiempo promedio de<br />respuesta a incidencias</p>
                        <p><img src={arrow} alt="arrow-icon" /></p>
                        <p className='tiempo'>{tiempoPromedioRespuesta}</p>
                    </div>
                </div>
            </div>

            <aside className="graficos">
                <div className="grafico1">
                    <div className="porcentaje" style={estiloGraficoCircular}>
                        <span className='porcentaje-texto'>{porcentajeResueltas} %</span>
                    </div>
                    <p>Incidencias<br />resueltas</p>
                </div>

                <div className="grafico2">
                    <div className="numero">{registradasHoy.length}</div>
                    <p>Incidencias<br />registradas hoy</p>
                </div>
            </aside>
        </section>
    )
})

export default Resumen