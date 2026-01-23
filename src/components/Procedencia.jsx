import './ Procedencia.css'

const Procedencia = ({ numPCs, docentePosition = 'right' }) => {
    const pcs = Array.from({ length: numPCs }, (_, i) => i + 1)

    const filas = Math.ceil(pcs.length / 5)

    return (
        <div className="laboratorio-container">
            <h3>Mapa del laboratorio</h3>
            <div className="laboratorio-grid" style={{ gridTemplateRows: `repeat(${filas}, 1fr)` }}>
                {pcs.map(num => (
                    <div className="pc" key={num}>{num}</div>
                ))}
                <div className={`pc-docente ${docentePosition}`}>
                    <img src="/pc-docente.png" alt="PC Docente" />
                    <span>Docente</span>
                </div>
            </div>
        </div>
    )
}

export default Procedencia
