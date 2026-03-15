import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import SignatureCanvas from '../components/SignatureCanvas'
import { fetchEmployees } from '../services/api'

const PHOTO_KEY = (id) => `eid_photo_${id}`
const AUDIT_IMAGE_KEY = 'eid_latest_audit_image'

export default function EmployeeDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const photoCanvasRef = useRef(null)

  const [cameraOn, setCameraOn] = useState(false)
  const [photoData, setPhotoData] = useState(() => localStorage.getItem(PHOTO_KEY(id)) ?? null)
  const [cameraError, setCameraError] = useState('')

  const sigRef = useRef(null)
  const [mergedImage, setMergedImage] = useState(() => localStorage.getItem(AUDIT_IMAGE_KEY) ?? null)

  // 0 = capture, 1 = sign, 2 = merged result
  const [step, setStep] = useState(() => {
    const savedMerged = localStorage.getItem(AUDIT_IMAGE_KEY)
    const savedPhoto = localStorage.getItem(PHOTO_KEY(id))

    if (savedMerged) return 2
    if (savedPhoto) return 1
    return 0
  })

  useEffect(() => {
    async function loadEmployee() {
      try {
        const data = await fetchEmployees()
        const currentEmployee =
          data.find((item) => String(item.id) === String(id)) ??
          data[Number(id)] ??
          null

        setEmployee(currentEmployee)
      } catch (error) {
        console.error('Failed to load employee:', error)
        setEmployee(null)
      } finally {
        setLoading(false)
      }
    }

    loadEmployee()
  }, [id])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  async function startCamera() {
    setCameraError('')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      setCameraOn(true)
    } catch (error) {
      console.error('Camera error:', error)
      setCameraError(`Camera access denied: ${error.message}`)
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    setCameraOn(false)
  }

  function capturePhoto() {
    const video = videoRef.current
    const canvas = photoCanvasRef.current

    if (!video || !canvas) {
      alert('Camera is not ready yet.')
      return
    }

    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const dataUrl = canvas.toDataURL('image/png')

    setPhotoData(dataUrl)
    localStorage.setItem(PHOTO_KEY(id), dataUrl)

    stopCamera()
    setStep(1)

    console.log('Photo captured successfully')
  }

  function handleMerge() {
    const signatureApi = sigRef.current

    if (!photoData) {
      alert('Photo is missing. Please capture the photo again.')
      return
    }

    if (!signatureApi || signatureApi.isEmpty()) {
      alert('Please draw your signature first.')
      return
    }

    const signatureCanvas = signatureApi.getCanvas()
    const photo = new Image()

    photo.onload = () => {
      const finalCanvas = document.createElement('canvas')
      finalCanvas.width = photo.width
      finalCanvas.height = photo.height

      const ctx = finalCanvas.getContext('2d')

      // Draw the captured photo first
      ctx.drawImage(photo, 0, 0, finalCanvas.width, finalCanvas.height)

      // Draw the signature canvas on top
      ctx.drawImage(signatureCanvas, 0, 0, finalCanvas.width, finalCanvas.height)

      const finalImage = finalCanvas.toDataURL('image/png')

      setMergedImage(finalImage)
      localStorage.setItem(AUDIT_IMAGE_KEY, finalImage)
      setStep(2)

      console.log('Merged image created successfully')
    }

    photo.onerror = () => {
      alert('Could not load the captured photo for merging.')
    }

    photo.src = photoData
  }

  function resetAll() {
    setPhotoData(null)
    setMergedImage(null)

    localStorage.removeItem(PHOTO_KEY(id))
    localStorage.removeItem(AUDIT_IMAGE_KEY)

    if (sigRef.current) {
      sigRef.current.clear()
    }

    setStep(0)
  }

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-ink">
      <Navbar />

      <main className="page-enter mx-auto max-w-4xl px-6 py-8">
        <button
          onClick={() => navigate('/list')}
          className="mb-6 flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-accent"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
            <path
              d="M10 12 6 8l4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to employees
        </button>

        {employee ? (
          <div className="glass-card mb-8 flex flex-wrap items-start gap-6 rounded-2xl p-6">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-xl font-bold text-accent">
              {String(employee.name ?? 'E')[0].toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl font-bold text-white">
                {employee.name ?? 'Employee'}
              </h1>
              <p className="mt-0.5 text-sm text-gray-400">{employee.email}</p>

              <div className="mt-3 flex flex-wrap gap-3">
                <InfoChip label="City" value={employee.city} />
                <InfoChip label="Dept" value={employee.department} />
                <InfoChip
                  label="Salary"
                  value={`₹${Number(employee.salary ?? 0).toLocaleString()}`}
                  accent
                />
                <InfoChip label="ID" value={`#${employee.id}`} mono />
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card mb-8 rounded-xl p-4 text-sm text-gray-500">
            Employee #{id} — details not available
          </div>
        )}

        <div className="mb-6 flex items-center gap-2">
          {['Capture Photo', 'Sign', 'Result'].map((label, index) => (
            <React.Fragment key={label}>
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-mono transition-all ${
                  step === index
                    ? 'border border-accent/30 bg-accent/15 text-accent'
                    : 'text-gray-600'
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                    step > index
                      ? 'bg-accent text-ink'
                      : step === index
                      ? 'border border-accent text-accent'
                      : 'border border-gray-700 text-gray-700'
                  }`}
                >
                  {step > index ? '✓' : index + 1}
                </span>
                {label}
              </div>

              {index < 2 && <div className="h-px max-w-8 flex-1 bg-slate-border" />}
            </React.Fragment>
          ))}
        </div>

        {step === 0 && (
          <div className="glass-card animate-fade-in rounded-2xl p-6">
            <h2 className="font-display mb-4 text-lg font-bold text-white">Capture Photo</h2>

            {cameraError && (
              <p className="mb-4 rounded-lg border border-accent-fire/20 bg-accent-fire/10 px-3 py-2 text-sm text-accent-fire">
                {cameraError}
              </p>
            )}

            <div className="relative mb-4 flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-slate-panel">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover ${cameraOn ? 'block' : 'hidden'}`}
              />

              {!cameraOn && (
                <div className="text-center text-gray-600">
                  <svg
                    className="mx-auto mb-2 opacity-40"
                    width="48"
                    height="48"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <rect
                      x="4"
                      y="14"
                      width="40"
                      height="28"
                      rx="4"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <circle cx="24" cy="28" r="7" stroke="currentColor" strokeWidth="2" />
                    <path
                      d="M18 14l3-6h6l3 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="text-sm">Camera is off</p>
                </div>
              )}
            </div>

            <canvas ref={photoCanvasRef} className="hidden" />

            <div className="flex gap-3">
              {!cameraOn ? (
                <button onClick={startCamera} className="btn-primary">
                  Start Camera
                </button>
              ) : (
                <>
                  <button onClick={capturePhoto} className="btn-primary">
                    Take Photo
                  </button>
                  <button onClick={stopCamera} className="btn-ghost">
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="glass-card animate-fade-in rounded-2xl p-6">
            <h2 className="font-display mb-1 text-lg font-bold text-white">Draw Signature</h2>
            <p className="mb-5 text-sm text-gray-500">Use your mouse or finger to sign below</p>

            {photoData && (
              <img
                src={photoData}
                alt="Captured"
                className="mb-5 h-24 rounded-lg border border-slate-border object-cover"
              />
            )}

            <SignatureCanvas ref={sigRef} width={700} height={180} />

            <div className="mt-4 flex gap-3">
              <button onClick={handleMerge} className="btn-primary">
                Merge & Continue
              </button>

              <button
                onClick={() => {
                  if (sigRef.current) sigRef.current.clear()
                }}
                className="btn-ghost"
              >
                Clear
              </button>

              <button
                onClick={() => {
                  setStep(0)
                  setMergedImage(null)
                }}
                className="btn-ghost"
              >
                Retake Photo
              </button>
            </div>
          </div>
        )}

        {step === 2 && mergedImage && (
          <div className="glass-card animate-fade-in rounded-2xl p-6">
            <h2 className="font-display mb-4 text-lg font-bold text-white">Merged Result</h2>

            <img
              src={mergedImage}
              alt="Signed photo"
              className="mb-5 w-full max-w-lg rounded-xl border border-slate-border"
            />

            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate('/analytics')} className="btn-primary">
                Go to Analytics
              </button>

              <a
                href={mergedImage}
                download={`employee_${id}_signed.png`}
                className="btn-ghost inline-flex items-center gap-2"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
                  <path
                    d="M7 1v8M4 6l3 3 3-3M2 10v1.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Download
              </a>

              <button onClick={resetAll} className="btn-ghost">
                Start Over
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function InfoChip({ label, value, accent, mono }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-slate-border bg-slate-card/60 px-3 py-1">
      <span className="text-xs font-mono text-gray-600">{label}</span>
      <span
        className={`text-xs font-medium ${
          accent
            ? 'text-accent-warm'
            : mono
            ? 'font-mono text-accent/70'
            : 'text-gray-300'
        }`}
      >
        {value ?? '—'}
      </span>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink">
      <div className="flex items-center gap-3 text-gray-500">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent/40 border-t-accent" />
        Loading employee data…
      </div>
    </div>
  )
}