import { useEffect, useRef, useState } from 'react'

/**
 * Square avatar cropper. Shows the chosen image inside a fixed square viewport;
 * the user drags to reposition and zooms (slider / buttons / scroll). On save it
 * exports exactly what's framed as a 512×512 JPEG blob — so the stored photo is
 * always a square. All geometry is computed in the OUT (canvas) coordinate space.
 */
const OUT = 512

export default function AvatarEditor({ file, onCancel, onSave, busy }) {
  const canvasRef = useRef(null)
  const imgRef = useRef(null)
  const dragRef = useRef(null) // last pointer position while dragging
  const scaleRef = useRef(1) // latest scale for pointer/zoom math (avoids stale closures)
  const [ready, setReady] = useState(false)
  const [minScale, setMinScale] = useState(1)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  scaleRef.current = scale

  // Load the picked file and fit it to "cover" the square.
  useEffect(() => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      const min = Math.max(OUT / img.width, OUT / img.height)
      setMinScale(min)
      setScale(min)
      setOffset({ x: (OUT - img.width * min) / 2, y: (OUT - img.height * min) / 2 })
      setReady(true)
    }
    img.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Keep the image covering the square (no empty edges).
  const clamp = (o, s) => {
    const img = imgRef.current
    if (!img) return o
    const w = img.width * s
    const h = img.height * s
    return {
      x: Math.min(0, Math.max(OUT - w, o.x)),
      y: Math.min(0, Math.max(OUT - h, o.y)),
    }
  }

  // Redraw whenever the framing changes.
  useEffect(() => {
    const c = canvasRef.current
    const img = imgRef.current
    if (!c || !img) return
    const ctx = c.getContext('2d')
    ctx.clearRect(0, 0, OUT, OUT)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, offset.x, offset.y, img.width * scale, img.height * scale)
  }, [scale, offset, ready])

  const toCanvasFactor = () => OUT / canvasRef.current.getBoundingClientRect().width

  const onPointerDown = (e) => {
    canvasRef.current.setPointerCapture(e.pointerId)
    dragRef.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerMove = (e) => {
    if (!dragRef.current) return
    const f = toCanvasFactor()
    const dx = (e.clientX - dragRef.current.x) * f
    const dy = (e.clientY - dragRef.current.y) * f
    dragRef.current = { x: e.clientX, y: e.clientY }
    setOffset((o) => clamp({ x: o.x + dx, y: o.y + dy }, scaleRef.current))
  }
  const onPointerUp = (e) => {
    dragRef.current = null
    try { canvasRef.current.releasePointerCapture(e.pointerId) } catch { /* noop */ }
  }

  // Zoom while keeping the point under (cx, cy) fixed. Defaults to the centre.
  const zoomTo = (next, cx = OUT / 2, cy = OUT / 2) => {
    const s = Math.min(minScale * 4, Math.max(minScale, next))
    setOffset((o) => {
      const nx = cx - ((cx - o.x) / scaleRef.current) * s
      const ny = cy - ((cy - o.y) / scaleRef.current) * s
      return clamp({ x: nx, y: ny }, s)
    })
    setScale(s)
  }

  const onWheel = (e) => {
    e.preventDefault()
    const rect = canvasRef.current.getBoundingClientRect()
    const f = OUT / rect.width
    zoomTo(scaleRef.current * (e.deltaY < 0 ? 1.1 : 0.9), (e.clientX - rect.left) * f, (e.clientY - rect.top) * f)
  }

  const save = () => canvasRef.current.toBlob((b) => b && onSave(b), 'image/jpeg', 0.9)

  const step = minScale * 3 / 100 || 0.01

  return (
    <div className="avatar-editor">
      <div className="avatar-editor-stage">
        <canvas
          ref={canvasRef}
          width={OUT}
          height={OUT}
          className="avatar-editor-canvas"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={onWheel}
        />
      </div>

      <div className="avatar-editor-zoom">
        <button type="button" className="avatar-zoom-btn" onClick={() => zoomTo(scaleRef.current / 1.2)} aria-label="Zoom out">−</button>
        <input
          type="range" className="avatar-zoom-range"
          min={minScale} max={minScale * 4} step={step}
          value={scale} onChange={(e) => zoomTo(Number(e.target.value))}
          aria-label="Zoom"
        />
        <button type="button" className="avatar-zoom-btn" onClick={() => zoomTo(scaleRef.current * 1.2)} aria-label="Zoom in">+</button>
      </div>
      <p className="avatar-editor-hint">Drag to reposition · scroll or use the slider to zoom</p>

      <div className="avatar-editor-actions">
        <button type="button" className="settings-save" onClick={save} disabled={busy || !ready}>
          {busy ? 'Saving…' : 'Save photo'}
        </button>
        <button type="button" className="settings-link" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </div>
  )
}
