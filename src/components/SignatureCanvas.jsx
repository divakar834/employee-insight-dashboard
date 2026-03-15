import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react'

/**
 * SignatureCanvas
 * ─────────────────────────────────────────────────────────────────
 * An HTML5 Canvas element the user can draw on using mouse or touch.
 *
 * Exposed via `ref` (forwardRef):
 *   ref.current.clear()    — wipe the canvas
 *   ref.current.isEmpty()  — true when nothing has been drawn
 *   ref.current.getCanvas()— returns the raw <canvas> element
 */
const SignatureCanvas = forwardRef(function SignatureCanvas({ width = 600, height = 180, strokeColor = '#6EE7B7' }, ref) {
  const canvasRef   = useRef(null)
  const isDrawing   = useRef(false)
  const lastPos     = useRef({ x: 0, y: 0 })
  const [hasDrawn, setHasDrawn] = useState(false)

  // ── Expose methods to parent via ref ──────────────────────────
  useImperativeHandle(ref, () => ({
    clear() {
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
      setHasDrawn(false)
    },
    isEmpty() {
      return !hasDrawn
    },
    getCanvas() {
      return canvasRef.current
    },
  }))

  // ── Helpers: normalise mouse and touch coordinates ─────────────
  function getPos(e) {
    const canvas = canvasRef.current
    const rect   = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height

    if (e.touches) {
      const touch = e.touches[0]
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top)  * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    }
  }

  // ── Drawing logic ──────────────────────────────────────────────
  function startDraw(e) {
    e.preventDefault()
    isDrawing.current = true
    lastPos.current   = getPos(e)
  }

  function draw(e) {
    e.preventDefault()
    if (!isDrawing.current) return

    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    const pos    = getPos(e)

    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = strokeColor
    ctx.lineWidth   = 2.5
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.stroke()

    lastPos.current = pos
    setHasDrawn(true)
  }

  function stopDraw(e) {
    e?.preventDefault()
    isDrawing.current = false
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Touch events (passive: false so we can call preventDefault)
    canvas.addEventListener('touchstart', startDraw, { passive: false })
    canvas.addEventListener('touchmove',  draw,      { passive: false })
    canvas.addEventListener('touchend',   stopDraw,  { passive: false })

    return () => {
      canvas.removeEventListener('touchstart', startDraw)
      canvas.removeEventListener('touchmove',  draw)
      canvas.removeEventListener('touchend',   stopDraw)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="signature-canvas w-full rounded-lg border border-slate-border bg-slate-panel block"
      style={{ touchAction: 'none' }}
      onMouseDown={startDraw}
      onMouseMove={draw}
      onMouseUp={stopDraw}
      onMouseLeave={stopDraw}
    />
  )
})

export default SignatureCanvas
