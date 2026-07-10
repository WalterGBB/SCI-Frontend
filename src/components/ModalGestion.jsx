import { Fragment, useEffect, useState } from 'react'
import { sortAlphabetically } from "../utils/sort";
import toast from 'react-hot-toast'
import ModalConfirmacion from './ModalConfirmacion'
import ambientesService from '../services/ambientes'
import cursosService from '../services/cursos'
import categoriasService from '../services/categorias'
import ACTIVOS from '../constants/activos'
const checkUrl = 'https://res.cloudinary.com/francode/image/upload/v1778545765/check_ab7dds.png'
const noCheckUrl = 'https://res.cloudinary.com/francode/image/upload/v1778545839/noCheck_m1lqd9.png'

import '../styles/ModalGestion.css'

const ModalGestion = ({ ambientes, setAmbientes, cursos, setCursos, categorias, setCategorias, onClose, handleLogout }) => {
    const [tipoAmbiente, setTipoAmbiente] = useState('Laboratorio')
    const [ambienteSeleccionado, setAmbienteSeleccionado] = useState(null)
    const [nuevoCurso, setNuevoCurso] = useState('')
    const [nuevaCategoria, setNuevaCategoria] = useState('')
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null); // Guarda el objeto de la categoría padre
    const [nuevaSubcategoria, setNuevaSubcategoria] = useState('');

    const [confirmOpen, setConfirmOpen] = useState(false)
    const [confirmMessage, setConfirmMessage] = useState('')
    const [confirmAction, setConfirmAction] = useState(null)

    const [vista, setVista] = useState('menu')

    const getActivosByTipo = (tipo, subtipo = null) => {
        return Object.values(ACTIVOS)
            .filter(activo => {
                // =====================================
                // VALIDAR TIPO DE AMBIENTE
                // =====================================
                const permitido =
                    activo.tiposAmbiente.includes(tipo)

                if (!permitido) return false
                // =====================================
                // VALIDAR SUBTIPO DE AULA
                // =====================================
                if (
                    tipo === 'Aula' &&
                    activo.subtiposAula
                ) {
                    return activo.subtiposAula.includes(subtipo)
                }
                return true
            })
            .map(activo => ({
                code: activo.code,
                active: activo.activoPorDefecto ?? true
            }))
    }

    const agruparActivosPorCategoria = (activos = []) => {
        return activos.reduce((acc, activo) => {
            const data = ACTIVOS[activo.code]
            if (!data) return acc
            const categoria = data.categoria
            if (!acc[categoria]) {
                acc[categoria] = []
            }
            acc[categoria].push({
                ...activo,
                data
            })
            return acc
        }, {})
    }

    const handleSelectAmbiente = (ambiente) => {
        setAmbienteSeleccionado(ambiente)
        setTipoAmbiente(ambiente.tipo)
        // =========================================
        // LABORATORIO
        // =========================================
        if (ambiente.tipo === 'Laboratorio') {
            const activosLaboratorio =
                getActivosByTipo('Laboratorio').map(activo => ({
                    code: activo.code,
                    active: ambiente.activos.includes(activo.code)
                }))
            setFormLaboratorio({
                nombre: ambiente.nombre,
                tipo: ambiente.tipo,
                configuracion: {
                    nPcs: ambiente.configuracion?.nPcs ?? 35,
                    nColumnas: ambiente.configuracion?.nColumnas ?? 5,
                    nColumnaPasadizo:
                        ambiente.configuracion?.nColumnaPasadizo ?? 3
                },
                activos: activosLaboratorio
            })
        }
        // =========================================
        // AULA
        // =========================================
        else {
            const activosAula =
                getActivosByTipo(
                    'Aula',
                    ambiente.subtipo
                ).map(activo => ({
                    code: activo.code,
                    active: ambiente.activos.includes(activo.code)
                }))
            setFormAula({
                nombre: ambiente.nombre,
                tipo: ambiente.tipo,
                subtipo: ambiente.subtipo,
                activos: activosAula
            })
        }
        setVista('detalleAmbiente')
    }

    const initialFormLaboratorio = {
        nombre: '',
        tipo: 'Laboratorio',
        configuracion: {
            nPcs: 35,
            nColumnas: 5,
            nColumnaPasadizo: 3
        },
        activos: getActivosByTipo('Laboratorio')
    }

    const initialFormAula = {
        nombre: '',
        tipo: 'Aula',
        subtipo: 'normal',
        activos: getActivosByTipo('Aula', 'normal')
    }

    const [formLaboratorio, setFormLaboratorio] = useState(initialFormLaboratorio)
    const [formAula, setFormAula] = useState(initialFormAula)

    const resetForms = () => {
        setTipoAmbiente('Laboratorio')
        setFormLaboratorio(
            structuredClone(initialFormLaboratorio)
        )
        setFormAula(
            structuredClone(initialFormAula)
        )
        setAmbienteSeleccionado(null)
    }

    // Cada vez que se selecciona un ambiente, se actualizan los formularios correspondientes con su información
    useEffect(() => {
        if (!ambienteSeleccionado) return
        // =========================================
        // LABORATORIO
        // =========================================
        if (ambienteSeleccionado.tipo === 'Laboratorio') {
            setTipoAmbiente('Laboratorio')
            setFormLaboratorio({
                id: ambienteSeleccionado.id,
                nombre: ambienteSeleccionado.nombre,
                tipo: ambienteSeleccionado.tipo,
                configuracion: {
                    nPcs:
                        ambienteSeleccionado.configuracion?.nPcs ?? 35,
                    nColumnas:
                        ambienteSeleccionado.configuracion?.nColumnas ?? 5,
                    nColumnaPasadizo:
                        ambienteSeleccionado.configuracion?.nColumnaPasadizo ?? 3
                },
                activos: getActivosByTipo('Laboratorio').map(activo => ({
                    ...activo,
                    active:
                        ambienteSeleccionado.activos.includes(activo.code)
                }))
            })
        }
        // =========================================
        // AULA
        // =========================================
        else if (ambienteSeleccionado.tipo === 'Aula') {
            setTipoAmbiente('Aula')
            setFormAula({
                id: ambienteSeleccionado.id,
                nombre: ambienteSeleccionado.nombre,
                tipo: 'Aula',
                subtipo:
                    ambienteSeleccionado.subtipo || 'normal',
                activos: getActivosByTipo(
                    'Aula',
                    ambienteSeleccionado.subtipo || 'normal'
                ).map(activo => ({
                    ...activo,
                    active:
                        ambienteSeleccionado.activos.includes(activo.code)
                }))
            })
        }
    }, [ambienteSeleccionado])

    const handleCheck = async (
        id,
        type,
        code = null
    ) => {
        let item

        // Obtener el elemento según el tipo
        if (type === 'curso') {
            item = cursos.find(c => c.id === id)
        } else if (type === 'extra') {
            item = formLaboratorio.activos.find(
                activo => activo.code === code
            )
        } else if (type === 'activo-aula') {
            item = formAula.activos.find(
                activo => activo.code === code
            )
        }

        if (!item) return

        const nuevoEstado = !item.active

        // Usar nombre para cursos y code para activos
        const itemLabel =
            type === 'curso'
                ? item.nombre
                : item.code?.replaceAll('_', ' ') || 'Sin nombre'

        // Configurar mensaje de confirmación
        setConfirmMessage(
            <>
                ¿Desea marcar el{' '}
                <b>
                    {type === 'curso'
                        ? 'curso'
                        : 'activo'}
                </b>{' '}
                <b>"{itemLabel}"</b>{' '}
                como{' '}
                <b className={nuevoEstado ? 'activo' : 'inactivo'}>
                    {nuevoEstado ? 'activo' : 'inactivo'}
                </b>
                ?
            </>
        )

        // Configurar acción a ejecutar al confirmar
        setConfirmAction(() => async () => {
            try {
                // Actualizar estado de un curso
                if (type === 'curso') {
                    const updated = await cursosService.toggleActive(id, {
                        active: nuevoEstado
                    })

                    setCursos(prev =>
                        prev.map(c =>
                            c.id === id ? updated : c
                        )
                    )
                    toast.success('Curso actualizado correctamente')
                }

                // Actualizar activo de laboratorio
                else if (type === 'extra') {
                    setFormLaboratorio(prev => ({
                        ...prev,
                        activos: prev.activos.map(activo =>
                            activo.code === code
                                ? {
                                    ...activo,
                                    active: nuevoEstado
                                }
                                : activo
                        )
                    }))
                    toast.success('Activo actualizado correctamente')
                }

                // Actualizar activo de aula
                else if (type === 'activo-aula') {
                    setFormAula(prev => ({
                        ...prev,
                        activos: prev.activos.map(activo =>
                            activo.code === code
                                ? {
                                    ...activo,
                                    active: nuevoEstado
                                }
                                : activo
                        )
                    }))
                    toast.success('Activo actualizado correctamente')
                }

            } catch (error) {
                if (error.response?.status === 401) {
                    window.alert('Sesión expirada, vuelva a iniciar sesión')
                    handleLogout()
                } else {
                    toast.error('Error al realizar la operación')
                }

                console.error(error)
            } finally {
                setConfirmOpen(false)
            }
        })

        // Mostrar modal de confirmación
        setConfirmOpen(true)
    }

    const addAmbiente = (e) => {

        e.preventDefault()

        const data =
            tipoAmbiente === 'Laboratorio'
                ? formLaboratorio
                : formAula

        if (!data.nombre.trim()) return

        setConfirmMessage(
            <>
                ¿Deseas añadir el ambiente{" "}
                <b>"{data.nombre}"</b>?
            </>
        )

        setConfirmAction(() => async () => {

            try {

                const payload = {

                    nombre: data.nombre,
                    tipo: data.tipo,

                    subtipo:
                        data.tipo === 'Aula'
                            ? data.subtipo
                            : null,

                    configuracion:
                        data.tipo === 'Laboratorio'
                            ? data.configuracion
                            : {},

                    activos: data.activos
                        .filter(activo => activo.active)
                        .map(activo => activo.code)
                }

                const added =
                    await ambientesService.create(payload)

                setAmbientes(prev => [...prev, added])

                window.alert(
                    `Ambiente "${added.nombre}" añadido exitosamente`
                )

                // =========================
                // RESET FORMULARIOS
                // =========================
                setFormLaboratorio({
                    nombre: '',
                    tipo: 'Laboratorio',

                    configuracion: {
                        nPcs: 35,
                        nColumnas: 5,
                        nColumnaPasadizo: 3
                    },

                    activos: getActivosByTipo('Laboratorio')
                })

                setFormAula({
                    nombre: '',
                    tipo: 'Aula',
                    subtipo: 'normal',

                    activos: getActivosByTipo(
                        'Aula',
                        'normal'
                    )
                })

            } catch (error) {

                console.error(error)

                window.alert(
                    error.response?.data?.error ||
                    'Error al crear el ambiente'
                )

            } finally {

                setConfirmOpen(false)
            }
        })

        setConfirmOpen(true)
    }

    const deleteAmbiente = async (id) => {

        const ambiente = ambientes.find(a => a.id === id)

        if (!ambiente) return

        setConfirmMessage(
            <>
                ¿Desea eliminar el ambiente{" "}
                <b>"{ambiente.nombre}"</b>{" "}
                de los registros del sistema?
            </>
        )

        setConfirmAction(() => async () => {

            try {

                await ambientesService.remove(id)

                setAmbientes(prev =>
                    prev.filter(a => a.id !== id)
                )

                // Si estaba abierto en detalle, regresar
                if (ambienteSeleccionado?.id === id) {
                    setVista('ambientesRegistrados')
                    setAmbienteSeleccionado(null)
                }

                window.alert(
                    `Ambiente "${ambiente.nombre}" eliminado correctamente`
                )

            } catch (e) {

                console.error(e)

                if (e.response?.status === 401) {

                    window.alert(
                        'Sesión expirada, vuelva a iniciar sesión'
                    )

                    handleLogout()

                } else {

                    window.alert(
                        e.response?.data?.error ||
                        'Error al eliminar el ambiente'
                    )
                }

            } finally {

                setConfirmOpen(false)

            }
        })

        setConfirmOpen(true)
    }

    const editAmbiente = (id) => {
        const ambiente =
            ambientes.find(a => a.id === id)
        if (!ambiente) return
        setAmbienteSeleccionado(ambiente)
        setTipoAmbiente(ambiente.tipo)
        // =====================================
        // LABORATORIO
        // =====================================
        if (ambiente.tipo === 'Laboratorio') {

            const activosLaboratorio =
                getActivosByTipo('Laboratorio').map(activo => ({

                    code: activo.code,

                    active:
                        ambiente.activos.includes(activo.code)
                }))

            setFormLaboratorio({

                nombre: ambiente.nombre,

                tipo: ambiente.tipo,

                configuracion: {

                    nPcs:
                        ambiente.configuracion?.nPcs ?? 35,

                    nColumnas:
                        ambiente.configuracion?.nColumnas ?? 5,

                    nColumnaPasadizo:
                        ambiente.configuracion?.nColumnaPasadizo ?? 3
                },

                activos: activosLaboratorio
            })
        }

        // =====================================
        // AULA
        // =====================================
        else {

            const activosAula =
                getActivosByTipo(
                    'Aula',
                    ambiente.subtipo
                ).map(activo => ({

                    code: activo.code,

                    active:
                        ambiente.activos.includes(activo.code)
                }))

            setFormAula({

                nombre: ambiente.nombre,

                tipo: ambiente.tipo,

                subtipo: ambiente.subtipo,

                activos: activosAula
            })
        }

        setVista('detalleAmbiente')
    }

    const updateAmbiente = async (e) => {

        e.preventDefault()

        try {

            const ambienteData =
                tipoAmbiente === 'Laboratorio'
                    ? formLaboratorio
                    : formAula

            const payload = {

                nombre: ambienteData.nombre,

                subtipo:
                    tipoAmbiente === 'Aula'
                        ? ambienteData.subtipo
                        : null,

                configuracion:
                    tipoAmbiente === 'Laboratorio'
                        ? ambienteData.configuracion
                        : {},

                activos:
                    ambienteData.activos
                        .filter(a => a.active)
                        .map(a => a.code)
            }

            const updated =
                await ambientesService.update(
                    ambienteSeleccionado.id,
                    payload
                )

            setAmbientes(prev =>
                prev.map(a =>
                    a.id === updated.id
                        ? updated
                        : a
                )
            )

            window.alert('Ambiente actualizado correctamente')

            setVista('ambientesRegistrados')

        } catch (error) {

            console.error(error)

            window.alert(
                error.response?.data?.error ||
                'Error al actualizar ambiente'
            )
        }
    }

    const handleAddExtra = (e) => {
        e.preventDefault()

        const nombre = prompt("Nombre del activo:")
        if (!nombre) return

        const urlImg = prompt("URL de la imagen:")
        if (!urlImg) return

        const nuevoExtra = {
            nombre,
            urlImg
        }

        setFormLaboratorio(prev => ({
            ...prev,
            activosExtras: [...prev.activosExtras, nuevoExtra]
        }))
    }

    const handleDeleteExtra = (index) => {
        setFormLaboratorio(prev => ({
            ...prev,
            activosExtras: prev.activosExtras.filter((_, i) => i !== index)
        }))
    }

    const handleEditExtra = (index) => {
        const extra = formLaboratorio.activosExtras[index]

        const nombre = prompt("Editar nombre:", extra.nombre)
        if (!nombre) return

        const urlImg = prompt("Editar URL:", extra.urlImg)
        if (!urlImg) return

        const nuevosExtras = [...formLaboratorio.activosExtras]
        nuevosExtras[index] = { nombre, urlImg }

        setFormLaboratorio(prev => ({
            ...prev,
            activosExtras: nuevosExtras
        }))
    }

    const addCurso = (e) => {
        e.preventDefault()
        if (!nuevoCurso.trim()) return

        setConfirmMessage(
            <>
                ¿Deseas añadir <b>"{nuevoCurso}"</b> como un nuevo curso?
            </>)
        setConfirmAction(() => async () => {
            try {
                const added = await cursosService.create({ nombre: nuevoCurso })
                setCursos(prev => [...prev, added])
                window.alert(`Curso "${added.nombre}" añadido exitosamente`)
            } catch (e) {
                console.error(e)
                window.alert(e.response?.data?.error || 'Error al crear el curso')
            }
            finally {
                setConfirmOpen(false)
                setNuevoCurso('')
            }
        })
        setConfirmOpen(true)
    }

    const deleteCurso = async (id) => {
        const curso = cursos.find(c => c.id === id)
        if (!curso) return

        setConfirmMessage(
            <>¿Desea eliminar el curso <b>"{curso.nombre}"</b> de los registros del sistema?</>
        )
        setConfirmAction(() => async () => {
            try {
                await cursosService.remove(id)

                setCursos(prev => prev.filter(c => c.id !== id))
            } catch (e) {
                console.error(e)
            } finally {
                setConfirmOpen(false)
            }
        })
        setConfirmOpen(true)
    }

    const editCurso = (id) => {
        const curso = cursos.find(c => c.id === id)
        if (!curso) return

        const nuevoCurso = prompt('Ingrese el nuevo nombre del curso:', curso.nombre)

        // Canceló o dejó vacío
        if (!nuevoCurso || !nuevoCurso.trim()) return

        const nombreTrim = nuevoCurso.trim()

        // Si no cambió, no hacer nada
        if (nombreTrim === curso.nombre) return

        setConfirmMessage(
            <>
                ¿Desea cambiar el nombre del curso <b>"{curso.nombre}"</b> a <b>"{nombreTrim}"</b>?
            </>
        )

        setConfirmAction(() => async () => {
            try {
                const updated = await cursosService.updateName(id, { newName: nombreTrim })

                setCursos(prev =>
                    prev.map(c => c.id === id ? updated : c)
                )
            } catch (e) {
                console.error(e)
                window.alert(e.response?.data?.error || 'Error al actualizar el curso')
            } finally {
                setConfirmOpen(false)
            }
        })

        setConfirmOpen(true)
    }

    const addCategoria = (e) => {
        e.preventDefault()
        if (!nuevaCategoria.trim()) return

        setConfirmMessage(
            <>
                ¿Deseas añadir <b>"{nuevaCategoria}"</b> como una nueva categoría?
            </>)
        setConfirmAction(() => async () => {
            try {
                const added = await categoriasService.create({ nombre: nuevaCategoria })
                setCategorias(prev => [...prev, added])
                window.alert(`Categoría "${added.nombre}" añadida exitosamente`)
            } catch (e) {
                console.error(e)
                window.alert(e.response?.data?.error || 'Error al crear la categoría')
            }
            finally {
                setConfirmOpen(false)
                setNuevaCategoria('')
            }
        })
        setConfirmOpen(true)
    }

    const deleteCategoria = async (id) => {
        const categoria = categorias.find(c => c.id === id)
        if (!categoria) return

        setConfirmMessage(
            <>¿Desea eliminar la categoría <b>"{categoria.nombre}"</b> de los registros del sistema?</>
        )
        setConfirmAction(() => async () => {
            try {
                await categoriasService.remove(id)
                setCategorias(prev => prev.filter(c => c.id !== id))
            } catch (e) {
                console.error(e)
            } finally {
                setConfirmOpen(false)
            }
        })
        setConfirmOpen(true)
    }

    const editCategoria = (id) => {
        const categoria = categorias.find(c => c.id === id)
        if (!categoria) return

        const nuevaCategoria = prompt('Ingrese el nuevo nombre de la categoría:', categoria.nombre)

        // Canceló o dejó vacío
        if (!nuevaCategoria || !nuevaCategoria.trim()) return

        const nombreTrim = nuevaCategoria.trim()

        // Si no cambió, no hacer nada
        if (nombreTrim === categoria.nombre) return

        setConfirmMessage(
            <>
                ¿Desea cambiar el nombre de la categoría <b>"{categoria.nombre}"</b> a <b>"{nombreTrim}"</b>?
            </>
        )

        setConfirmAction(() => async () => {
            try {
                const updated = await categoriasService.updateName(id, { newName: nombreTrim })
                setCategorias(prev =>
                    prev.map(c => c.id === id ? updated : c)
                )
            } catch (e) {
                console.error(e)
                window.alert(e.response?.data?.error || 'Error al actualizar la categoría')
            } finally {
                setConfirmOpen(false)
            }
        })

        setConfirmOpen(true)
    }

    const addSubcategoria = (e) => {
        e.preventDefault()
        if (!nuevaSubcategoria.trim()) return
        if (!categoriaSeleccionada) {
            window.alert('No se ha seleccionado una categoría padre')
            return
        }

        setConfirmMessage(
            <>
                ¿Deseas añadir <b>"{nuevaSubcategoria}"</b> como una nueva subcategoría de <b>"{categoriaSeleccionada.nombre}"</b>?
            </>
        )
        setConfirmAction(() => async () => {
            try {
                // Usamos addSubcategoria (como lo definimos en el service)
                // El backend nos devuelve la categoría ENTERA ya actualizada
                const categoriaActualizada = await categoriasService.addSubcategoria(categoriaSeleccionada.id, { nombre: nuevaSubcategoria })

                // 1. Actualizamos el arreglo global de categorías
                setCategorias(prev => prev.map(c =>
                    c.id === categoriaSeleccionada.id ? categoriaActualizada : c
                ))

                // 2. IMPORTANTE: Actualizamos la categoría seleccionada para que la UI se refresque instantáneamente
                setCategoriaSeleccionada(categoriaActualizada)

                window.alert(`Subcategoría añadida exitosamente`)
            } catch (e) {
                console.error(e)
                window.alert(e.response?.data?.error || 'Error al crear la subcategoría')
            } finally {
                setConfirmOpen(false)
                setNuevaSubcategoria('')
            }
        })
        setConfirmOpen(true)
    }

    const deleteSubcategoria = (subId) => {
        if (!categoriaSeleccionada) return

        // Buscamos la subcategoría para mostrar su nombre en el mensaje
        const subcategoria = categoriaSeleccionada.subcategorias.find(s => s.id === subId)
        if (!subcategoria) return

        setConfirmMessage(
            <>¿Desea eliminar la subcategoría <b>"{subcategoria.nombre}"</b> de la categoría <b>"{categoriaSeleccionada.nombre}"</b>?</>
        )

        setConfirmAction(() => async () => {
            try {
                // Al igual que al crear, el backend devuelve la categoría completa sin el elemento borrado
                const categoriaActualizada = await categoriasService.removeSubcategoria(categoriaSeleccionada.id, subId)

                setCategorias(prev => prev.map(c =>
                    c.id === categoriaSeleccionada.id ? categoriaActualizada : c
                ))
                setCategoriaSeleccionada(categoriaActualizada)

            } catch (e) {
                console.error(e)
                window.alert(e.response?.data?.error || 'Error al eliminar la subcategoría')
            } finally {
                setConfirmOpen(false)
            }
        })

        setConfirmOpen(true)
    }

    const editSubcategoria = (subId) => {
        if (!categoriaSeleccionada) return

        const subcategoria = categoriaSeleccionada.subcategorias.find(s => s.id === subId)
        if (!subcategoria) return

        const nuevoNombre = prompt('Ingrese el nuevo nombre de la subcategoría:', subcategoria.nombre)

        // Canceló o dejó vacío
        if (!nuevoNombre || !nuevoNombre.trim()) return

        const nombreTrim = nuevoNombre.trim()

        // Si no cambió, no hacemos petición al backend
        if (nombreTrim === subcategoria.nombre) return

        setConfirmMessage(
            <>
                ¿Desea cambiar el nombre de la subcategoría <b>"{subcategoria.nombre}"</b> a <b>"{nombreTrim}"</b>?
            </>
        )

        setConfirmAction(() => async () => {
            try {
                const categoriaActualizada = await categoriasService.updateSubcategoriaName(
                    categoriaSeleccionada.id,
                    subId,
                    { newName: nombreTrim }
                )

                setCategorias(prev => prev.map(c =>
                    c.id === categoriaSeleccionada.id ? categoriaActualizada : c
                ))
                setCategoriaSeleccionada(categoriaActualizada)

            } catch (e) {
                console.error(e)
                window.alert(e.response?.data?.error || 'Error al actualizar la subcategoría')
            } finally {
                setConfirmOpen(false)
            }
        })

        setConfirmOpen(true)
    }

    const cols = formLaboratorio?.configuracion?.nColumnas
    const colPasadizo = formLaboratorio?.configuracion?.nColumnaPasadizo

    // Construcción del grid real
    const templateColumns = []

    // Pasadizo al inicio
    if (colPasadizo === 0) {
        templateColumns.push('15px')
    }

    for (let i = 1; i <= cols; i++) {

        // columna normal
        templateColumns.push('1fr')

        // insertar pasadizo después
        if (i === colPasadizo) {
            templateColumns.push('15px')
        }
    }

    return (
        <div className="MoGe-overlay">
            <div className="modal-gestion">
                {/* Botón X Circular */}
                <button className="btn-exit-circular" onClick={onClose} title="Cerrar">
                    <span>x</span>
                </button>

                {vista === 'menu' && (
                    <>
                        <div className="modal-gestion-header">
                            <h2>Configuración del Sistema</h2>
                            <p className="sub-verde">Gestión de datos</p>
                        </div>
                        <div className="gestion-selector">
                            <div className="card-gestion" onClick={() => setVista('ambientes')}>
                                <img src='https://res.cloudinary.com/francode/image/upload/v1778545750/ambientesImg_xhvtxu.png' alt="Ambientes" />
                                <p>Ambientes</p>
                            </div>

                            <div className="card-gestion" onClick={() => setVista('cursos')}>
                                <img src='https://res.cloudinary.com/francode/image/upload/v1778545772/cursosImg_wfmxuj.png' alt="Cursos" />
                                <p>Cursos</p>
                            </div>

                            <div className="card-gestion" onClick={() => setVista('categorias')}>
                                <img src='https://res.cloudinary.com/francode/image/upload/v1778545762/categoriasImg_taowaw.png' alt="Categorías" />
                                <p>Categorías</p>
                            </div>
                        </div>
                    </>
                )}

                {vista === 'ambientes' && (
                    <>
                        <button className="btn-back" onClick={() => setVista('menu')}>
                            ← Volver
                        </button>
                        <div className="modal-gestion-header">
                            <h2>Configuración del Sistema</h2>
                            <p className="sub-verde">Gestión de ambientes</p>
                        </div>
                        <div className="gestion-selector">
                            <div className="card-gestion" onClick={() => {
                                resetForms()
                                setVista('nuevoAmbiente')
                            }}>
                                <img src='https://res.cloudinary.com/francode/image/upload/v1778545735/add_x46m2i.png' alt="Registrar nuevo ambiente" />
                                <p className='small'>Registrar nuevo ambiente</p>
                            </div>

                            <div className="card-gestion" onClick={() => {
                                resetForms()
                                setVista('ambientesRegistrados')
                            }}
                            >
                                <img src='https://res.cloudinary.com/francode/image/upload/v1778545858/registro_gisreq.png' alt="Ambientes registrados" />
                                <p className='small'>Ambientes registrados</p>
                            </div>
                        </div>
                    </>
                )}

                {vista === 'nuevoAmbiente' && (
                    <div className="gestion-content">
                        <button className="btn-back" onClick={() => {
                            resetForms()
                            setVista('ambientes')
                        }}
                        >
                            ← Volver
                        </button>
                        <div className="modal-gestion-header">
                            <h2>Configuración del Sistema</h2>
                            <p className="sub-verde">Gestión de ambientes</p>
                        </div>
                        <section className="gestion-section ambientes">
                            <div className='container-izquierda'>
                                <form className="form-ambientes" onSubmit={addAmbiente}>
                                    <div className="ambiente-header-form">
                                        <input
                                            className='input-principal'
                                            type="text"
                                            placeholder="Nombre del ambiente"
                                            value={
                                                tipoAmbiente === 'Laboratorio'
                                                    ? formLaboratorio.nombre
                                                    : formAula.nombre
                                            }
                                            onChange={(e) => {
                                                if (tipoAmbiente === 'Laboratorio') {
                                                    setFormLaboratorio(prev => ({
                                                        ...prev,
                                                        nombre: e.target.value
                                                    }))
                                                } else {
                                                    setFormAula(prev => ({
                                                        ...prev,
                                                        nombre: e.target.value
                                                    }))
                                                }
                                            }}
                                        />

                                        <select
                                            value={tipoAmbiente}
                                            onChange={(e) => {
                                                const tipo = e.target.value
                                                setTipoAmbiente(tipo)
                                                setFormLaboratorio({
                                                    nombre: '',
                                                    tipo: 'Laboratorio',
                                                    configuracion: {
                                                        nPcs: 35,
                                                        nColumnas: 5,
                                                        nColumnaPasadizo: 3
                                                    },
                                                    activos: getActivosByTipo('Laboratorio')
                                                })
                                                setFormAula({
                                                    nombre: '',
                                                    tipo: 'Aula',
                                                    subtipo: 'normal',
                                                    activos: getActivosByTipo('Aula', 'normal')
                                                })
                                            }}
                                        >
                                            <option value="Laboratorio">
                                                Laboratorio
                                            </option>
                                            <option value="Aula">
                                                Aula
                                            </option>
                                        </select>
                                    </div>
                                    {tipoAmbiente === 'Laboratorio' && (
                                        <>
                                            <div className="config-grid">

                                                <div className="config-item">
                                                    <label>n.º pcs:</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={40}
                                                        step={1}
                                                        value={formLaboratorio.configuracion.nPcs}
                                                        onChange={(e) => {
                                                            if (e.target.value === '') return
                                                            let value = Number(e.target.value)

                                                            if (value > 40) value = 40
                                                            if (value < 1) value = 1
                                                            setFormLaboratorio(prev => ({
                                                                ...prev,
                                                                configuracion: {
                                                                    ...prev.configuracion,
                                                                    nPcs: value
                                                                }
                                                            }))
                                                        }}
                                                    />
                                                </div>

                                                <div className="config-item">
                                                    <label>n.º columnas:</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={8}
                                                        step={1}
                                                        value={formLaboratorio.configuracion.nColumnas}
                                                        onChange={(e) => {
                                                            if (e.target.value === '') return
                                                            let value = Number(e.target.value)

                                                            if (value > 8) value = 8
                                                            if (value < 1) value = 1
                                                            setFormLaboratorio(prev => ({
                                                                ...prev,
                                                                configuracion: {
                                                                    ...prev.configuracion,
                                                                    nColumnas: value
                                                                }
                                                            }))
                                                        }}
                                                    />
                                                </div>

                                                <div className="config-item">
                                                    <label>activos extras:</label>
                                                    <button
                                                        type="button"
                                                        className="btn-add-extra"
                                                        onClick={handleAddExtra}
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                <div className="config-item">
                                                    <label>col. pasadizo:</label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={formLaboratorio.configuracion.nColumnas - 1}
                                                        step={1}
                                                        value={formLaboratorio.configuracion.nColumnaPasadizo}
                                                        onChange={(e) => {
                                                            if (e.target.value === '') return
                                                            let value = Number(e.target.value)

                                                            if (value > 7) value = 7
                                                            if (value < 0) value = 0
                                                            setFormLaboratorio(prev => ({
                                                                ...prev,
                                                                configuracion: {
                                                                    ...prev.configuracion,
                                                                    nColumnaPasadizo: value
                                                                }
                                                            }))
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="tabla-gestion-wrapper extras-tabla">
                                                <table className="tabla-gestion">
                                                    <tbody>
                                                        {sortAlphabetically(formLaboratorio.activos, "code").map(activo => {
                                                            const data = ACTIVOS[activo.code]
                                                            if (!data) return null
                                                            return (
                                                                <tr key={activo.code}>
                                                                    <td>
                                                                        {data.nombre}
                                                                    </td>
                                                                    <td className="acciones">
                                                                        <img
                                                                            src={
                                                                                activo.active
                                                                                    ? checkUrl
                                                                                    : noCheckUrl
                                                                            }
                                                                            onClick={() =>
                                                                                handleCheck(
                                                                                    null,
                                                                                    'extra',
                                                                                    activo.code
                                                                                )
                                                                            }
                                                                            alt="check-icon"
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    )}

                                    {tipoAmbiente === 'Aula' && (
                                        <>
                                            <div className="d-flex flex-row justify-content-around align-items-center">
                                                <label>
                                                    Tipo de aula
                                                </label>
                                                <select
                                                    name="tipoAula"
                                                    id="tipoAula"
                                                    value={formAula.subtipo}
                                                    onChange={(e) => {
                                                        const subtipo = e.target.value
                                                        setFormAula(prev => ({
                                                            ...prev,
                                                            subtipo,
                                                            activos: getActivosByTipo(
                                                                'Aula',
                                                                subtipo
                                                            )
                                                        }))
                                                    }}
                                                >
                                                    <option value="normal">
                                                        Normal
                                                    </option>
                                                    <option value="taller">
                                                        Taller
                                                    </option>
                                                </select>
                                            </div>

                                            <div className="tabla-gestion-wrapper extras-tabla">
                                                <table className="tabla-gestion">
                                                    <tbody>
                                                        {Object.entries(
                                                            agruparActivosPorCategoria(
                                                                formAula.activos
                                                            )
                                                        ).map(([categoria, activos]) => (
                                                            <Fragment key={categoria}>
                                                                <tr className="categoria-row">
                                                                    <td colSpan={2}>
                                                                        <strong>
                                                                            {categoria.toUpperCase()}
                                                                        </strong>
                                                                    </td>
                                                                </tr>

                                                                {sortAlphabetically(activos, "code").map(activo => (
                                                                    <tr key={activo.code}>
                                                                        <td>
                                                                            {activo.data.nombre}
                                                                        </td>
                                                                        <td className="acciones">
                                                                            <img
                                                                                src={
                                                                                    activo.active
                                                                                        ? checkUrl
                                                                                        : noCheckUrl
                                                                                }
                                                                                onClick={() =>
                                                                                    handleCheck(
                                                                                        null,
                                                                                        'activo-aula',
                                                                                        activo.code
                                                                                    )
                                                                                }
                                                                                alt="check-icon"
                                                                            />
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </Fragment>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    )}
                                </form>
                            </div>

                            <div className='container-derecha'>

                                {/* ===== LABORATORIO ===== */}
                                {tipoAmbiente === 'Laboratorio' && (
                                    <>
                                        <div className="mapa-body">

                                            <div className="mapa-pcs">

                                                <div className="mapa-header">
                                                    <h3>{formLaboratorio.nombre || "Vista previa"}</h3>

                                                    <img
                                                        src={ACTIVOS.PC_DOCENTE.imagenes[0]}
                                                        alt="PC Docente"
                                                    />
                                                </div>

                                                <div
                                                    className="grid-pcs"
                                                    style={{
                                                        gridTemplateColumns: templateColumns.join(' ')
                                                    }}
                                                >

                                                    {Array.from({
                                                        length: formLaboratorio.configuracion.nPcs ?? 35
                                                    }).map((_, i) => {

                                                        const posicionColumna = (i % cols) + 1

                                                        let gridColumn = posicionColumna

                                                        // Pasadizo al inicio
                                                        if (colPasadizo === 0) {
                                                            gridColumn += 1
                                                        }

                                                        // Pasadizo intermedio
                                                        else if (
                                                            colPasadizo > 0 &&
                                                            posicionColumna > colPasadizo
                                                        ) {
                                                            gridColumn += 1
                                                        }

                                                        return (
                                                            <div
                                                                key={i}
                                                                className="pc-box"
                                                                style={{
                                                                    gridColumn
                                                                }}
                                                            >
                                                                <img
                                                                    src={ACTIVOS.PC_ESTUDIANTE.imagenes[0]}
                                                                    alt={`PC ${i + 1}`}
                                                                />
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            <div className="mapa-extras">
                                                {formLaboratorio.activos
                                                    .filter(activo => activo.active)
                                                    .map(activo => {
                                                        const data = ACTIVOS[activo.code]
                                                        if (!data) return null
                                                        return (
                                                            <div
                                                                key={activo.code}
                                                                className="extra-box"
                                                            >
                                                                <span>{data.nombre}</span>

                                                                <img
                                                                    src={data.imagenes[0]}
                                                                    alt={data.nombre}
                                                                />
                                                            </div>
                                                        )
                                                    })}
                                            </div>

                                        </div>
                                    </>
                                )}

                                {/* ===== AULA ===== */}
                                {tipoAmbiente === 'Aula' && (

                                    <div className="mapa-aula">

                                        <div className="mapa-header">
                                            <h3>{formAula.nombre || "Vista previa"}</h3>
                                        </div>

                                        <div className="aula-grid">

                                            {Object.entries(
                                                agruparActivosPorCategoria(formAula.activos)
                                            ).map(([categoria, activos], i) => (

                                                <div key={i} className="aula-col">

                                                    <h3>{categoria}</h3>

                                                    <div className="aula-col-items">

                                                        {activos
                                                            .filter(activo => activo.active)
                                                            .map((activo, j) => (

                                                                <div
                                                                    key={j}
                                                                    className="activo-aula"
                                                                >
                                                                    <span>
                                                                        {activo.data.nombre}
                                                                    </span>

                                                                    <img
                                                                        src={
                                                                            activo.code === 'PC_DOCENTE'
                                                                                ? (activo.data.imagenes[1] || activo.data.imagenes[0])
                                                                                : activo.data.imagenes[0]
                                                                        }
                                                                        alt={activo.data.nombre}
                                                                    />

                                                                </div>

                                                            ))}

                                                    </div>

                                                </div>

                                            ))}

                                        </div>

                                    </div>

                                )}

                            </div>
                        </section>

                        <div className="modal-buttons ambientes">
                            <button className="btn-cancel" onClick={() => {
                                resetForms()
                                setVista('ambientes')
                            }}
                            >
                                Cancelar
                            </button>

                            <button className="btn-confirm" onClick={addAmbiente}>
                                Guardar
                            </button>
                        </div>
                    </div>
                )}

                {vista === 'ambientesRegistrados' && (
                    <>
                        <button className="btn-back" onClick={() => setVista('ambientes')}>
                            ← Volver
                        </button>
                        <div className="modal-gestion-header">
                            <h2>Configuración del Sistema</h2>
                            <p className="sub-verde">Gestión de ambientes</p>
                        </div>
                        <div className="gestion-content">
                            <section className='gestion-section'>
                                <h3>Ambientes registrados</h3>
                                <div className="tabla-gestion-wrapper">
                                    <table className="tabla-gestion">
                                        <tbody>
                                            {ambientes.map(ambiente => (
                                                <tr key={ambiente.id}>
                                                    <td>
                                                        <p onClick={() => {
                                                            setAmbienteSeleccionado(ambiente)
                                                            setVista('detalleAmbiente')
                                                        }}>
                                                            {ambiente.nombre} 📂
                                                        </p>                                                </td>
                                                    <td className="acciones">
                                                        <img
                                                            src='https://res.cloudinary.com/francode/image/upload/v1778865130/edit_aeo7pz.png'
                                                            className="img-eliminar-gestion"
                                                            alt="Editar"
                                                            onClick={() => editAmbiente(ambiente.id)}
                                                        />
                                                        <img
                                                            src='https://res.cloudinary.com/francode/image/upload/v1778864960/eliminar_oso7bj.png'
                                                            className="img-eliminar-gestion"
                                                            alt="Eliminar"
                                                            onClick={() => deleteAmbiente(ambiente.id)}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </div>
                    </>
                )}

                {vista === 'detalleAmbiente' && ambienteSeleccionado && (
                    <div className="gestion-content">
                        <button
                            className="btn-back"
                            onClick={() => {
                                resetForms()
                                setVista('ambientesRegistrados')
                                setAmbienteSeleccionado(null)
                            }}
                        >
                            ← Volver
                        </button>
                        <div className="modal-gestion-header">
                            <h2>Configuración del Sistema</h2>
                            <p className="sub-verde">
                                Gestión de ambientes
                            </p>
                        </div>

                        <section className="gestion-section ambientes">
                            <div className='container-izquierda'>
                                <form
                                    className="form-ambientes"
                                    onSubmit={updateAmbiente}
                                >
                                    <div className="ambiente-header-form">
                                        <input
                                            className='input-principal'
                                            type="text"
                                            placeholder="Nombre del ambiente"
                                            value={
                                                tipoAmbiente === 'Laboratorio'
                                                    ? formLaboratorio.nombre
                                                    : formAula.nombre
                                            }
                                            onChange={(e) => {
                                                if (tipoAmbiente === 'Laboratorio') {
                                                    setFormLaboratorio(prev => ({
                                                        ...prev,
                                                        nombre: e.target.value
                                                    }))
                                                } else {
                                                    setFormAula(prev => ({
                                                        ...prev,
                                                        nombre: e.target.value
                                                    }))
                                                }
                                            }}
                                        />
                                        <select
                                            value={tipoAmbiente}
                                            disabled
                                        >
                                            <option value="Laboratorio">
                                                Laboratorio
                                            </option>
                                            <option value="Aula">
                                                Aula
                                            </option>
                                        </select>
                                    </div>

                                    {tipoAmbiente === 'Laboratorio' && (
                                        <>
                                            <div className="config-grid">
                                                <div className="config-item">
                                                    <label>n.º pcs:</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={40}
                                                        step={1}
                                                        value={formLaboratorio.configuracion.nPcs}
                                                        onChange={(e) => {
                                                            if (e.target.value === '') return
                                                            let value = Number(e.target.value)

                                                            if (value > 40) value = 40
                                                            if (value < 1) value = 1
                                                            setFormLaboratorio(prev => ({
                                                                ...prev,
                                                                configuracion: {
                                                                    ...prev.configuracion,
                                                                    nPcs: value
                                                                }
                                                            }))
                                                        }}
                                                    />
                                                </div>

                                                <div className="config-item">
                                                    <label>n.º columnas:</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={8}
                                                        step={1}
                                                        value={formLaboratorio.configuracion.nColumnas}
                                                        onChange={(e) => {
                                                            if (e.target.value === '') return
                                                            let value = Number(e.target.value)

                                                            if (value > 8) value = 8
                                                            if (value < 1) value = 1
                                                            setFormLaboratorio(prev => ({
                                                                ...prev,
                                                                configuracion: {
                                                                    ...prev.configuracion,
                                                                    nColumnas: value
                                                                }
                                                            }))
                                                        }}
                                                    />
                                                </div>

                                                <div className="config-item">
                                                    <label>activos extras:</label>
                                                    <button
                                                        type="button"
                                                        className="btn-add-extra"
                                                        onClick={handleAddExtra}
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                <div className="config-item">
                                                    <label>col. pasadizo:</label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={formLaboratorio.configuracion.nColumnas - 1}
                                                        step={1}
                                                        value={formLaboratorio.configuracion.nColumnaPasadizo}
                                                        onChange={(e) => {
                                                            if (e.target.value === '') return
                                                            let value = Number(e.target.value)

                                                            if (value > 7) value = 7
                                                            if (value < 0) value = 0
                                                            setFormLaboratorio(prev => ({
                                                                ...prev,
                                                                configuracion: {
                                                                    ...prev.configuracion,
                                                                    nColumnaPasadizo: value
                                                                }
                                                            }))
                                                        }}
                                                    />
                                                </div>

                                            </div>

                                            <div className="tabla-gestion-wrapper extras-tabla">
                                                <table className="tabla-gestion">
                                                    <tbody>
                                                        {sortAlphabetically(formLaboratorio.activos, "code").map(activo => {
                                                            const data =
                                                                ACTIVOS[activo.code]
                                                            if (!data) return null
                                                            return (
                                                                <tr key={activo.code}>
                                                                    <td>
                                                                        {data.nombre}
                                                                    </td>
                                                                    <td className="acciones">
                                                                        <img
                                                                            src={
                                                                                activo.active
                                                                                    ? checkUrl
                                                                                    : noCheckUrl
                                                                            }
                                                                            onClick={() =>
                                                                                handleCheck(
                                                                                    null,
                                                                                    'extra',
                                                                                    activo.code
                                                                                )
                                                                            }
                                                                            alt="check-icon"
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    )}

                                    {tipoAmbiente === 'Aula' && (
                                        <>
                                            <div className="d-flex flex-row justify-content-round align-items-center">
                                                <label>
                                                    Tipo de aula
                                                </label>

                                                <select
                                                    name="tipoAula"
                                                    id="tipoAula"
                                                    value={formAula.subtipo}
                                                    disabled
                                                >
                                                    <option value="normal">
                                                        Normal
                                                    </option>

                                                    <option value="taller">
                                                        Taller
                                                    </option>
                                                </select>

                                            </div>

                                            <div className="tabla-gestion-wrapper extras-tabla">

                                                <table className="tabla-gestion">

                                                    <tbody>

                                                        {Object.entries(
                                                            agruparActivosPorCategoria(formAula.activos)
                                                        ).map(([categoria, activos]) => (

                                                            <Fragment key={categoria}>

                                                                {/* CATEGORÍA */}
                                                                <tr className="categoria-row">

                                                                    <td colSpan={2}>

                                                                        <strong>
                                                                            {categoria
                                                                                .replaceAll('_', ' ')
                                                                                .toUpperCase()}
                                                                        </strong>

                                                                    </td>

                                                                </tr>

                                                                {/* ACTIVOS */}
                                                                {activos.map((activo, i) => (

                                                                    <tr key={`${categoria}-${i}`}>

                                                                        <td>
                                                                            {activo.data.nombre}
                                                                        </td>

                                                                        <td className="acciones">

                                                                            <img
                                                                                src={
                                                                                    activo.active
                                                                                        ? checkUrl
                                                                                        : noCheckUrl
                                                                                }
                                                                                onClick={() =>
                                                                                    handleCheck(
                                                                                        null,
                                                                                        'activo-aula',
                                                                                        activo.code
                                                                                    )
                                                                                }
                                                                                alt="check-icon"
                                                                            />

                                                                        </td>

                                                                    </tr>

                                                                ))}

                                                            </Fragment>

                                                        ))}

                                                    </tbody>

                                                </table>

                                            </div>

                                        </>

                                    )}

                                </form>

                            </div>

                            <div className='container-derecha'>

                                {/* ========================================= */}
                                {/* LABORATORIO */}
                                {/* ========================================= */}
                                {tipoAmbiente === 'Laboratorio' && (
                                    <div className="mapa-body">
                                        <div className="mapa-pcs">
                                            <div className="mapa-header">
                                                <h3>
                                                    {formLaboratorio.nombre || "Vista previa"}
                                                </h3>
                                                <img
                                                    src='https://res.cloudinary.com/francode/image/upload/v1778543648/pc-docente_eoicao.png'
                                                    alt="PC Docente"
                                                />
                                            </div>

                                            <div
                                                className="grid-pcs"
                                                style={{
                                                    gridTemplateColumns: templateColumns.join(' ')
                                                }}
                                            >
                                                {Array.from({
                                                    length: formLaboratorio.configuracion?.nPcs ?? 35
                                                }).map((_, i) => {

                                                    const posicionColumna = (i % cols) + 1

                                                    let gridColumn = posicionColumna

                                                    // Pasadizo al inicio
                                                    if (colPasadizo === 0) {
                                                        gridColumn += 1
                                                    }

                                                    // Pasadizo intermedio
                                                    else if (
                                                        colPasadizo > 0 &&
                                                        posicionColumna > colPasadizo
                                                    ) {
                                                        gridColumn += 1
                                                    }

                                                    return (
                                                        <div
                                                            key={i}
                                                            className="pc-box"
                                                            style={{
                                                                gridColumn
                                                            }}
                                                        >
                                                            <img
                                                                src='https://res.cloudinary.com/francode/image/upload/v1778545333/pc-estudiante_nf7t1j.png'
                                                                alt={`PC ${i + 1}`}
                                                            />
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        {/* ACTIVOS */}
                                        <div className="mapa-extras">

                                            {formLaboratorio.activos
                                                .filter(activo => activo.active)
                                                .map(activo => {
                                                    const data = ACTIVOS[activo.code]
                                                    if (!data) return null
                                                    return (
                                                        <div
                                                            key={activo.code}
                                                            className="extra-box"
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
                                    </div>
                                )}

                                {tipoAmbiente === 'Aula' && (
                                    <div className="mapa-aula">
                                        <div className="mapa-header">
                                            <h3>
                                                {formAula.nombre || "Vista previa"}
                                            </h3>
                                        </div>

                                        <div className="aula-grid">
                                            {Object.entries(
                                                agruparActivosPorCategoria(formAula.activos)
                                            ).map(([categoria, activos], i) => (
                                                <div key={i} className="aula-col">
                                                    <h3>
                                                        {categoria}
                                                    </h3>
                                                    <div className="aula-col-items">
                                                        {activos
                                                            .filter(activo => activo.active)
                                                            .map((activo, j) => (
                                                                <div
                                                                    key={j}
                                                                    className="activo-aula"
                                                                >
                                                                    <span>
                                                                        {activo.data.nombre}
                                                                    </span>
                                                                    <img
                                                                        src={
                                                                            activo.code === 'PC_DOCENTE'
                                                                                ? activo.data.imagenes[1]
                                                                                : activo.data.imagenes[0]
                                                                        }
                                                                        alt={activo.data.nombre}
                                                                    />
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        <div className="modal-buttons ambientes">
                            <button
                                className="btn-cancel"
                                onClick={() => {
                                    resetForms()
                                    setVista('ambientesRegistrados')
                                    setAmbienteSeleccionado(null)
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn-confirm"
                                onClick={updateAmbiente}
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                )}

                {vista === 'cursos' && (
                    <>
                        <button className="btn-back" onClick={() => setVista('menu')}>
                            ← Volver
                        </button>
                        <div className="modal-gestion-header">
                            <h2>Configuración del Sistema</h2>
                            <p className="sub-verde">Gestión de cursos</p>
                        </div>
                        <div className="gestion-content">
                            <section className="gestion-section">
                                <h3>Cursos Registrados</h3>
                                <form className="input-group-gestion" onSubmit={addCurso}>
                                    <input
                                        type="text"
                                        placeholder="Nombre del nuevo curso..."
                                        value={nuevoCurso}
                                        onChange={(e) => setNuevoCurso(e.target.value)}
                                    />
                                    <button type="submit" className="btn-add-gestion">Añadir</button>
                                </form>

                                <div className="tabla-gestion-wrapper">
                                    <table className="tabla-gestion">
                                        <tbody>
                                            {sortAlphabetically(cursos, "nombre").map(curso => (
                                                <tr key={curso.id}>
                                                    <td>{curso.nombre}</td>
                                                    <td className="acciones">
                                                        <img
                                                            src={curso.active === true
                                                                ? 'https://res.cloudinary.com/francode/image/upload/v1778545765/check_ab7dds.png'
                                                                : 'https://res.cloudinary.com/francode/image/upload/v1778545839/noCheck_m1lqd9.png'
                                                            }
                                                            onClick={() => handleCheck(curso.id, 'curso')}
                                                            alt="check-icon"
                                                        />
                                                        <img
                                                            src='https://res.cloudinary.com/francode/image/upload/v1778864960/eliminar_oso7bj.png'
                                                            className="img-eliminar-gestion"
                                                            alt="Eliminar"
                                                            onClick={() => deleteCurso(curso.id)}
                                                        />
                                                        <img
                                                            src='https://res.cloudinary.com/francode/image/upload/v1778865130/edit_aeo7pz.png'
                                                            className="img-eliminar-gestion"
                                                            alt="Eliminar"
                                                            onClick={() => editCurso(curso.id)}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </div>
                    </>
                )}

                {vista === 'categorias' && (
                    <>
                        <button className="btn-back" onClick={() => setVista('menu')}>
                            ← Volver
                        </button>
                        <div className="modal-gestion-header">
                            <h2>Configuración del Sistema</h2>
                            <p className="sub-verde">Gestión de categorías</p>
                        </div>
                        <div className="gestion-content">
                            <section className="gestion-section">
                                <h3>Categorías</h3>

                                <form className="input-group-gestion" onSubmit={addCategoria}>
                                    <input
                                        type="text"
                                        placeholder="Nombre de la nueva categoría..."
                                        value={nuevaCategoria}
                                        onChange={(e) => setNuevaCategoria(e.target.value)}
                                    />
                                    <button type="submit" className="btn-add-gestion">
                                        Añadir
                                    </button>
                                </form>

                                <div className="tabla-gestion-wrapper">
                                    <table className="tabla-gestion">
                                        <tbody>
                                            {sortAlphabetically(categorias, "nombre").map(categoria => (
                                                <tr key={categoria.id}>
                                                    <td>
                                                        <p onClick={() => {
                                                            setCategoriaSeleccionada(categoria)
                                                            setVista('subcategorias')
                                                        }}>{categoria.nombre} 📂</p>
                                                    </td>
                                                    <td className="acciones">
                                                        <img
                                                            src='https://res.cloudinary.com/francode/image/upload/v1778864960/eliminar_oso7bj.png'
                                                            className="img-eliminar-gestion"
                                                            alt="Eliminar"
                                                            onClick={() => deleteCategoria(categoria.id)}
                                                        />
                                                        <img
                                                            src='https://res.cloudinary.com/francode/image/upload/v1778865130/edit_aeo7pz.png'
                                                            className="img-eliminar-gestion"
                                                            alt="Eliminar"
                                                            onClick={() => editCategoria(categoria.id)}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </div>
                    </>
                )}

                {vista === 'subcategorias' && categoriaSeleccionada && (
                    <>
                        <button className="btn-back" onClick={() => {
                            setVista('categorias');
                            setCategoriaSeleccionada(null);
                        }}>
                            ← Volver
                        </button>
                        <div className="modal-gestion-header">
                            <h2>Configuración del Sistema</h2>
                            <p className="sub-verde">Gestión de subcategorías</p>
                        </div>
                        <div className="gestion-content">
                            <section className="gestion-section">
                                <h3>Subcategorías de: <span className="sub-verde">{categoriaSeleccionada.nombre}</span></h3>

                                <form className="input-group-gestion" onSubmit={addSubcategoria}>
                                    <input
                                        type="text"
                                        placeholder="Nombre de subcategoría..."
                                        value={nuevaSubcategoria}
                                        onChange={(e) => setNuevaSubcategoria(e.target.value)}
                                    />
                                    <button type="submit" className="btn-add-gestion">
                                        Añadir
                                    </button>
                                </form>

                                <div className="tabla-gestion-wrapper">
                                    <table className="tabla-gestion">
                                        <tbody>
                                            {sortAlphabetically(categoriaSeleccionada.subcategorias || [], "nombre").map(subcategoria => (
                                                <tr key={subcategoria.id}>
                                                    <td>{subcategoria.nombre}</td>
                                                    <td className="acciones">
                                                        <img
                                                            src='https://res.cloudinary.com/francode/image/upload/v1778864960/eliminar_oso7bj.png'
                                                            className="img-eliminar-gestion"
                                                            alt="Eliminar"
                                                            onClick={() => deleteSubcategoria(subcategoria.id)}
                                                        />
                                                        <img
                                                            src='https://res.cloudinary.com/francode/image/upload/v1778865130/edit_aeo7pz.png'
                                                            className="img-eliminar-gestion"
                                                            alt="Editar"
                                                            onClick={() => editSubcategoria(subcategoria.id)}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </div>
                    </>
                )}

                {confirmOpen && (
                    <ModalConfirmacion
                        mensaje={confirmMessage}
                        onCancel={() => {
                            setConfirmOpen(false)
                            setNuevoCurso('')
                        }}
                        onConfirm={confirmAction}
                    />
                )}
            </div>
        </div>
    )
}

export default ModalGestion