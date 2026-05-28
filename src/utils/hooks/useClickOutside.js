import { useEffect } from 'react'

const useClickOutside = (
    ref,
    isOpen,
    onClose
) => {

    useEffect(() => {

        const handleClickOutside = (event) => {

            if (
                isOpen &&
                ref.current &&
                !ref.current.contains(event.target)
            ) {
                onClose()
            }
        }

        document.addEventListener(
            'mousedown',
            handleClickOutside
        )

        return () => {
            document.removeEventListener(
                'mousedown',
                handleClickOutside
            )
        }

    }, [ref, isOpen, onClose])
}

export default useClickOutside