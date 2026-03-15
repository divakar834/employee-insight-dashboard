import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import SignatureCanvas from '../components/SignatureCanvas'
import { fetchEmployees } from '../services/api'
import { mergePhotoAndSignature } from '../utils/imageMerge'

const PHOTO_KEY = (id) => `eid_photo_${id}`
const AUDIT_IMAGE_KEY = 'eid_latest_audit_image'

export default function EmployeeDetails() {
  const { id }    = useParams()
  const navigate  = useNavigate()

  // ── Data ───────────────────────────────────────────────────────
  const [employee,    setEmployee]    = useState(null)
  const [loading,     setLoading]     = useState(true)

  // ── Camera ─────────────────────────────────────────────────────
  const videoRef      = useRef(null)
  const streamRef     = useRef(null)
  const photoCanvasRef= useRef(null)
  const [cameraOn,    setCameraOn]    = useState(false)
  const [photoData,   setPhotoData]   = useState(() => localStorage.getItem(PHOTO_KEY(id)) ?? null)
  const [cameraError, setCameraError] = useState('')

  // ── Signature ──────────────────────────────────────────────────
  const sigRef        = useRef(null)
  const [mergedImage, setMergedImage] = useState(null)

  // ── Step control ───────────────────────────────────────────────
  // 0 = capture, 1 = sign, 2 = merged result
  const [step, setStep] = useState(photoData ? 1 : 0)

  // Fetch employee record
  useEffect(() => {
    async function load() {
      try {
        const data = await fetchEmployees()
        const emp  = data.find(e => String(e.id) === String(id)) ?? data[Number(id)] ?? null
        setEmployee(emp)
      } catch {
        setEmployee(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // Cleanup: stop camera when unmounting
  useEffect(() => {
    return () => stopCamera()
  }, [])

  // ── Camera helpers ─────────────────────────────────────────────
  async function startCamera() {
    setCameraError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      streamRef.current        = stream
      videoRef.current.srcObject = stream
      setCameraOn(true)
    } catch (err) {
      setCameraError(`Camera access denied: ${err.message}`)
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraOn(false)
  }

  function capturePhoto() {
    const video  = videoRef.current
    const canvas = photoCanvasRef.current
    if (!video || !canvas) return

    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 480
    canvas.getContext('2d').drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)

    setPhotoData(dataUrl)
    localStorage.setItem(PHOTO_KEY(id), dataUrl)
    stopCamera()
    setStep(1)
  }

  // ── Merge photo + signature ────────────────────────────────────
  function handleMerge() {
    const sig     = sigRef.current
    if (!sig || sig.isEmpty()) {
      alert('Please draw your signature first.')
      return
    }
    const canvas  = photoCanvasRef.current
    const merged  = mergePhotoAndSignature(canvas, sig.getCanvas(), canvas.width, canvas.height)
    setMergedImage(merged)
    localStorage.setItem(AUDIT_IMAGE_KEY, merged)
    setStep(2)
  }

  function reset() {
    setPhotoData(null)
    setMergedImage(null)
    localStorage.removeItem(PHOTO_KEY(id))
    localStorage.removeItem(AUDIT_IMAGE_KEY)
    sigRef.current?.clear()
    setStep(0)
  }

  if (loading) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-ink">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8 page-enter">

        {/* Back */}
        <button onClick={() => navigate('/list')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-accent transition-colors mb-6">
          <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
            <path d="M10 12 6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to employees
        </button>

        {/* Employee Info Card */}
        {employee ? (
          <div className="glass-card rounded-2xl p-6 mb-8 flex flex-wrap gap-6 items-start">
            <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-display font-bold text-xl flex-shrink-0">
              {String(employee.name ?? 'E')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl font-bold text-white">{employee.name ?? 'Employee'}</h1>
              <p className="text-gray-400 text-sm mt-0.5">{employee.email}</p>
              <div className="flex flex-wrap gap-3 mt-3">
                <InfoChip label="City"       value={employee.city} />
                <InfoChip label="Dept"       value={employee.department} />
                <InfoChip label="Salary"     value={`₹${Number(employee.salary ?? 0).toLocaleString()}`} accent />
                <InfoChip label="ID"         value={`#${employee.id}`} mono />
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-xl p-4 mb-8 text-gray-500 text-sm">
            Employee #{id} — details not available
          </div>
        )}

        {/* ── Step indicator ───────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-6">
          {['Capture Photo', 'Sign', 'Result'].map((label, i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono transition-all
                ${step === i ? 'bg-accent/15 text-accent border border-accent/30' : 'text-gray-600'}`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px]
                  ${step > i ? 'bg-accent text-ink' : step === i ? 'border border-accent text-accent' : 'border border-gray-700 text-gray-700'}`}>
                  {step > i ? '✓' : i + 1}
                </span>
                {label}
              </div>
              {i < 2 && <div className="flex-1 h-px bg-slate-border max-w-8" />}
            </React.Fragment>
          ))}
        </div>

        {/* ── Step 0: Camera capture ───────────────────────────── */}
        {step === 0 && (
          <div className="glass-card rounded-2xl p-6 animate-fade-in">
            <h2 className="font-display text-lg font-bold mb-4 text-white">Capture Photo</h2>

            {cameraError && (
              <p className="text-accent-fire text-sm mb-4 bg-accent-fire/10 border border-accent-fire/20 rounded-lg px-3 py-2">
                {cameraError}
              </p>
            )}

            {/* Video preview */}
            <div className="relative bg-slate-panel rounded-xl overflow-hidden mb-4 aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraOn ? 'block' : 'hidden'}`}
              />
              {!cameraOn && (
                <div className="text-center text-gray-600">
                  <svg className="mx-auto mb-2 opacity-40" width="48" height="48" fill="none" viewBox="0 0 48 48">
                    <rect x="4" y="14" width="40" height="28" rx="4" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="24" cy="28" r="7" stroke="currentColor" strokeWidth="2"/>
                    <path d="M18 14l3-6h6l3 6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                  </svg>
                  <p className="text-sm">Camera is off</p>
                </div>
              )}
            </div>

            {/* Hidden canvas for frame capture */}
            <canvas ref={photoCanvasRef} className="hidden" />

            <div className="flex gap-3">
              {!cameraOn
                ? <button onClick={startCamera}  className="btn-primary">Start Camera</button>
                : <>
                    <button onClick={capturePhoto} className="btn-primary">Take Photo</button>
                    <button onClick={stopCamera}   className="btn-ghost">Cancel</button>
                  </>
              }
            </div>
          </div>
        )}

        {/* ── Step 1: Signature ────────────────────────────────── */}
        {step === 1 && (
          <div className="glass-card rounded-2xl p-6 animate-fade-in">
            <h2 className="font-display text-lg font-bold mb-1 text-white">Draw Signature</h2>
            <p className="text-gray-500 text-sm mb-5">Use your mouse or finger to sign below</p>

            {/* Photo thumbnail */}
            {photoData && (
              <img src={photoData} alt="Captured" className="h-24 rounded-lg object-cover mb-5 border border-slate-border" />
            )}

            <SignatureCanvas ref={sigRef} width={700} height={180} />

            <div className="flex gap-3 mt-4">
              <button onClick={handleMerge} className="btn-primary">Merge & Continue</button>
              <button onClick={() => sigRef.current?.clear()} className="btn-ghost">Clear</button>
              <button onClick={() => setStep(0)} className="btn-ghost">Retake Photo</button>
            </div>
          </div>
        )}

        {/* ── Step 2: Merged result ─────────────────────────────── */}
        {step === 2 && mergedImage && (
          <div className="glass-card rounded-2xl p-6 animate-fade-in">
            <h2 className="font-display text-lg font-bold mb-4 text-white">Merged Result</h2>

            <img src={mergedImage} alt="Signed photo" className="w-full max-w-lg rounded-xl border border-slate-border mb-5" />

            <div className="flex flex-wrap gap-3">
              <a
                href={mergedImage}
                download={`employee_${id}_signed.png`}
                className="btn-primary inline-flex items-center gap-2"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
                  <path d="M7 1v8M4 6l3 3 3-3M2 10v1.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Download
              </a>
              <button onClick={reset} className="btn-ghost">Start Over</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────

function InfoChip({ label, value, accent, mono }) {
  return (
    <div className="flex items-center gap-1.5 bg-slate-card/60 border border-slate-border rounded-lg px-3 py-1">
      <span className="text-xs text-gray-600 font-mono">{label}</span>
      <span className={`text-xs font-medium ${accent ? 'text-accent-warm' : mono ? 'text-accent/70 font-mono' : 'text-gray-300'}`}>
        {value ?? '—'}
      </span>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center">
      <div className="flex items-center gap-3 text-gray-500">
        <div className="w-5 h-5 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
        Loading employee data…
      </div>
    </div>
  )
}
