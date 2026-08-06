import { useState } from 'react'
import '../styles/ModalEscalarIncidencia.css'

const NIVELES = [
    'Docente',
    'Administrativo',
    'Directivo',
    'OTI',
    'Proveedor'
]

const ModalEscalarIncidencia = ({
    incident,
    onClose,
    onEscalar
}) => {

    const [motivo, setMotivo] = useState('')

    const nivelActual =
        incident.nivelServicio ?? 'Docente'

    const indiceActual =
        NIVELES.indexOf(nivelActual)

    const siguienteNivel =
        indiceActual < NIVELES.length - 1
            ? NIVELES[indiceActual + 1]
            : null

    const handleSubmit = () => {

        if (!motivo.trim()) {
            alert('Ingrese el motivo del escalamiento')
            return
        }

        onEscalar(motivo)
    }

    return (

        <div className="Moes-overlay">
            <div className="Moes-container">
                <h2>
                    Escalamiento de Incidencia
                </h2>
                <p className="Moes-descripcion">
                    La incidencia será transferida al siguiente nivel de
                    soporte siguiendo el flujo establecido por ITIL V4.
                </p>

                <div className="Moes-info">
                    <div className="Moes-item">
                        <label>Activos</label>
                        <span>
                            {incident.activosReportados.join(', ')}
                        </span>
                    </div>
                    <div className="Moes-item">
                        <label>Categoría</label>
                        <span>{incident.categoria}</span>
                    </div>
                    <div className="Moes-item">
                        <label>Subcategoría</label>
                        <span>{incident.subcategoria}</span>
                    </div>
                </div>

                <div className="Moes-flujo">
                    {
                        NIVELES.map((nivel, index) => (
                            <div
                                key={nivel}
                                className={`
                                    Moes-paso
                                    ${index < indiceActual ? 'completado' : ''}
                                    ${index === indiceActual ? 'actual' : ''}
                                `}
                            >
                                <div className="Moes-circulo">
                                    {
                                        index < indiceActual
                                            ? '✓'
                                            : index + 1
                                    }
                                </div>
                                <span>{nivel}</span>
                            </div>
                        ))
                    }
                </div>

                {
                    siguienteNivel && (
                        <div className="Moes-transicion">
                            <div>
                                <small>Nivel actual</small>
                                <strong>
                                    {nivelActual}
                                </strong>
                            </div>
                            <div className="Moes-flecha">
                                ➜
                            </div>
                            <div>
                                <small>Siguiente nivel</small>
                                <strong>
                                    {siguienteNivel}
                                </strong>
                            </div>
                        </div>
                    )
                }

                <label className="Moes-motivo">
                    Motivo del escalamiento
                </label>

                <textarea
                    value={motivo}
                    onChange={(e) =>
                        setMotivo(e.target.value)
                    }
                    placeholder="Explique el motivo del escalamiento..."
                />

                <p className="Moes-aviso">
                    ⚠ Todo escalamiento quedará registrado en el historial
                    de la incidencia.
                </p>
                <div className="Moes-buttons">
                    <button
                        className="Moes-cancel"
                        onClick={onClose}
                    >
                        Cancelar
                    </button>
                    <button
                        className="Moes-confirm"
                        onClick={handleSubmit}
                    >
                        Escalar
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ModalEscalarIncidencia