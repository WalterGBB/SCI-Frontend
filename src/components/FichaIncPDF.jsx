import '../styles/FichaIncPDF.css'

import ACTIVOS from '../constants/activos'
import agruparActivosPorCategoria from '../utils/activos/agruparActivos'

const FichaIncPDF = ({ incident, ambientes }) => {

    const ambiente = ambientes.find(
        amb => amb.nombre === incident.procedencia
    )

    if (!ambiente) return null

    const activosSet = new Set(
        incident.activosReportados
    )

    // PARA LOS LABORATORIOS
    const cols = Number(
        ambiente?.configuracion?.nColumnas
    )

    const colPasadizo = Number(
        ambiente?.configuracion?.nColumnaPasadizo
    )

    // Construcción del grid
    const templateColumns = []

    // Pasadizo al inicio
    if (colPasadizo === 0) {
        templateColumns.push('20px')
    }

    for (let i = 1; i <= cols; i++) {

        templateColumns.push('1fr')

        // Pasadizo intermedio
        if (i === colPasadizo) {
            templateColumns.push('20px')
        }
    }

    return (
        <div className="pdf-map-container">

            {ambiente && (
                <>
                    {ambiente.tipo === 'Laboratorio' ? (
                        <>
                            <div className="pdf-mapa-pcs">
                                <div className="pdf-header">
                                    <h2>{incident.procedencia}</h2>
                                    <img
                                        src={ACTIVOS.PC_DOCENTE.imagenes[0]}
                                        alt="PC Docente"
                                        className={`
                                            pdf-pc-docente
                                            ${activosSet.has('PC_DOCENTE')
                                                ? 'reportado'
                                                : ''
                                            }
                                        `}
                                    />

                                </div>

                                <div
                                    className="pdf-body"
                                    style={{
                                        gridTemplateColumns:
                                            templateColumns.join(' ')
                                    }}
                                >
                                    {Array.from({
                                        length:
                                            ambiente.configuracion?.nPcs || 0
                                    }).map((_, i) => {

                                        const posicionColumna =
                                            (i % cols) + 1

                                        const pcCode = `PC_${i + 1}`

                                        let gridColumn =
                                            posicionColumna

                                        // PASADIZO IZQUIERDO
                                        if (colPasadizo === 0) {
                                            gridColumn += 1
                                        }

                                        // PASADIZO INTERMEDIO
                                        else if (
                                            colPasadizo > 0 &&
                                            posicionColumna > colPasadizo
                                        ) {
                                            gridColumn += 1
                                        }

                                        return (
                                            <div
                                                key={pcCode}
                                                className={`
                                                    pdf-pc-estudiante
                                                    ${activosSet.has(pcCode)
                                                        ? 'reportado'
                                                        : ''
                                                    }
                                                `}
                                                style={{
                                                    gridColumn
                                                }}
                                            >

                                                <span className="pdf-pc-numero">
                                                    {i + 1}
                                                </span>

                                                <img
                                                    src={
                                                        ACTIVOS
                                                            .PC_ESTUDIANTE
                                                            .imagenes[0]
                                                    }
                                                    alt={pcCode}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="pdf-mapa-extras">
                                {ambiente.activos
                                    ?.filter(code => {

                                        // Excluir PCs
                                        return ![
                                            'PC_DOCENTE',
                                            'PC_ESTUDIANTE'
                                        ].includes(code)

                                    })
                                    .map((code) => {
                                        const data = ACTIVOS[code]
                                        if (!data) return null
                                        return (
                                            <div
                                                key={code}
                                                className={`
                                                    pdf-activo-extra
                                                    ${activosSet.has(code)
                                                        ? 'reportado'
                                                        : ''
                                                    }
                                                `}
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
                        <div className="pdf-mapa-aula">
                            <h2>{ambiente.nombre}</h2>
                            <div className="pdf-aula-grid">
                                {Object.entries(
                                    agruparActivosPorCategoria(
                                        ambiente.activos
                                    )
                                ).map(([categoria, activos], i) => (
                                    <div
                                        key={i}
                                        className="pdf-aula-col"
                                    >
                                        <h3>{categoria}</h3>
                                        {activos.map((activo, j) => (
                                            <div
                                                key={j}
                                                className={`
                                                    pdf-activo-aula
                                                    ${activosSet.has(activo.code)
                                                        ? 'reportado'
                                                        : ''
                                                    }
                                                `}
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
        </div>
    )
}

export default FichaIncPDF