import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'

const SWATCHES = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#14b8a6', '#06b6d4',
    '#3b82f6', '#6366f1', '#a855f7', '#ec4899',
]

export const ColorPicker = ({ color, onChange, className = '' }) => {
    const [open, setOpen] = useState(false)
    const [anchor, setAnchor] = useState({ top: 0, bottom: undefined, right: 0 })
    const triggerRef = useRef(null)

    const openPicker = () => {
        const rect = triggerRef.current.getBoundingClientRect()
        const openUp = window.innerHeight - rect.bottom < rect.top
        setAnchor({
            right: window.innerWidth - rect.right,
            top: openUp ? undefined : rect.bottom + 4,
            bottom: openUp ? window.innerHeight - rect.top + 4 : undefined,
        })
        setOpen(true)
    }

    const choose = (next) => {
        setOpen(false)
        onChange(next)
    }

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                className={className}
                style={{ backgroundColor: color }}
                onClick={openPicker}
            />
            {open && createPortal(
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div
                        className="fixed z-50 grid grid-cols-4 gap-2 border border-black bg-white p-3"
                        style={{ top: anchor.top, bottom: anchor.bottom, right: anchor.right }}
                    >
                        {SWATCHES.map(swatch => (
                            <button
                                key={swatch}
                                type="button"
                                className="h-8 w-8 border border-black/20 hover:border-black"
                                style={{ backgroundColor: swatch }}
                                onClick={() => choose(swatch)}
                            />
                        ))}
                        <label className="col-span-4 flex items-center justify-between gap-2 pt-1 text-sm">
                            Custom
                            <input
                                type="color"
                                value={color || '#000000'}
                                onChange={event => choose(event.target.value)}
                            />
                        </label>
                    </div>
                </>,
                document.body
            )}
        </>
    )
}
