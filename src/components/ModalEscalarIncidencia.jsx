import { useState } from 'react'
import '../styles/ModalEscalarIncidencia.css'

const NIVELES = [
    'Personal Docente',
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

    const nivelActual = incident.nivelServicio ?? 'Personal Docente'
    const indiceActual = NIVELES.indexOf(nivelActual)

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
        <div className="modal-overlay">
            <div className="modal-escalar">
                <h2>
                    Escalamiento de Incidencia
                </h2>
                <p className="descripcion">
                    La incidencia será transferida al siguiente nivel
                    de soporte siguiendo el flujo establecido por ITIL.
                </p>
                <div className="info-incidencia">
                    <div className="info-item">
                        <label>Activo</label>
                        <span>
                            {incident.activosReportados.join(', ')}
                        </span>
                    </div>
                    <div className="info-item">
                        <label>Categoría</label>
                        <span>
                            {incident.categoria}
                        </span>
                    </div>
                    <div className="info-item">
                        <label>Subcategoría</label>
                        <span>
                            {incident.subcategoria}
                        </span>
                    </div>
                </div>
                <div className="stepper">
                    {
                        NIVELES.map((nivel, index) => (
                            <div
                                key={nivel}
                                className="step-wrapper"
                            >
                                <div
                                    className={`
                                        step
                                        ${index < indiceActual
                                            ? 'completed'
                                            : ''
                                        }
                                        ${index === indiceActual
                                            ? 'current'
                                            : ''
                                        }
                                        ${index > indiceActual
                                            ? 'pending'
                                            : ''
                                        }
                                    `}
                                >
                                    {
                                        index < indiceActual
                                            ? '✓'
                                            : index + 1
                                    }
                                </div>
                                <span>
                                    {nivel}
                                </span>
                                {
                                    index < NIVELES.length - 1 && (
                                        <div className="step-line"></div>
                                    )
                                }
                            </div>
                        ))
                    }
                </div>
                {
                    siguienteNivel && (
                        <div className="transicion">
                            <div className="nivel-actual">
                                <small>
                                    Nivel actual
                                </small>
                                <strong>
                                    {nivelActual}
                                </strong>
                            </div>
                            <div className="arrow">
                                ➜
                            </div>
                            <div className="nivel-destino">
                                <small>
                                    Siguiente nivel
                                </small>
                                <strong>
                                    {siguienteNivel}
                                </strong>
                            </div>
                        </div>
                    )
                }
                {
                    siguienteNivel && (
                        <>
                            <label>
                                Motivo del escalamiento
                            </label>
                            <textarea
                                value={motivo}
                                onChange={(e) =>
                                    setMotivo(e.target.value)
                                }
                                placeholder="Explique por qué la incidencia debe escalarse al siguiente nivel..."
                            />
                        </>
                    )
                }
                <div className="advertencia">
                    ⚠ Todo escalamiento quedará registrado
                    permanentemente en el historial de la incidencia.
                </div>
                <div className="acciones">
                    <button
                        className="btn-cancelar"
                        onClick={onClose}
                    >
                        Cancelar
                    </button>
                    {
                        siguienteNivel && (
                            <button
                                className="btn-escalar"
                                onClick={handleSubmit}
                            >
                                Escalar incidencia
                            </button>
                        )
                    }
                </div>
            </div>
        </div>
    )
}

export default ModalEscalarIncidencia