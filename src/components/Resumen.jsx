import { forwardRef } from 'react'
import '../styles/Resumen.css'
import { calcularTiempoPromedio, calcularUbicacionMayor } from "../utils/helperKPIs"

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

    // Calcular ubicación con mayor número de incidencias registradas
    const ubicacionMayorIncidencias = calcularUbicacionMayor(incidents)

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
                    <h2>
                        <img className='signo' src='https://res.cloudinary.com/francode/image/upload/v1778545870/signo_ierjcs.png' alt="signo-exclamación" />
                        {pendientes.length}
                    </h2>
                    <p>Incidencias<br />sin resolver</p>
                    <button className="btn-atender" onClick={onAtenderClick}>
                        <img src='https://res.cloudinary.com/francode/image/upload/v1778545786/editar_waws8f.png' alt="editar-icon" />atender
                    </button>
                </div>

                <div className='contabilizacion'>
                    <img src='https://res.cloudinary.com/francode/image/upload/v1778545818/flecha_s5mau7.png' alt="flecha" className='flecha' />
                    <ul className="lista">
                        <li><span className="rojo">{altas}</span> incidencias de prioridad alta</li>
                        <li><span className="naranja">{medias}</span> incidencias de prioridad media</li>
                        <li><span className="verde">{bajas}</span> incidencias de prioridad baja</li>
                    </ul>
                </div>

                <div className="extras">
                    <div className='extra'>
                        <img src='https://res.cloudinary.com/francode/image/upload/v1778545879/ubicacion_jhydrl.png' alt="ubicación-ícono" />
                        <p>Ubicación con mayor número de incidencias registradas</p>
                        <p><img src='https://res.cloudinary.com/francode/image/upload/v1778545752/arrow_m2erpg.png' alt="arrow-icon" /></p>
                        <p className='ubicacion'>{ubicacionMayorIncidencias}</p>
                    </div>
                    <div className='extra'>
                        <img src='https://res.cloudinary.com/francode/image/upload/v1778545876/tiempo_sunotv.png' alt="reloj-icono" />
                        <p>Tiempo promedio de respuesta a incidencias</p>
                        <p><img src='https://res.cloudinary.com/francode/image/upload/v1778545752/arrow_m2erpg.png' alt="arrow-icon" /></p>
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