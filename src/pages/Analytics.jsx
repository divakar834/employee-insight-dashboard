import React, { useEffect, useMemo, useRef, useState } from 'react'
import Navbar from '../components/Navbar'
import { fetchEmployees } from '../services/api'

const AUDIT_IMAGE_KEY = 'eid_latest_audit_image'

const CITY_COORDINATES = {
  Chennai: [13.0827, 80.2707],
  Mumbai: [19.076, 72.8777],
  Delhi: [28.7041, 77.1025],
  Bangalore: [12.9716, 77.5946],
  Hyderabad: [17.385, 78.4867],
  Kolkata: [22.5726, 88.3639],
  Pune: [18.5204, 73.8567],
  Ahmedabad: [23.0225, 72.5714],
  Jaipur: [26.9124, 75.7873],
  Surat: [21.1702, 72.8311],
}

export default function Analytics() {
  const [employeeList, setEmployeeList] = useState([])
  const [auditImage, setAuditImage] = useState(() => localStorage.getItem(AUDIT_IMAGE_KEY) || '')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const mapRootRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    async function loadEmployees() {
      try {
        const rows = await fetchEmployees()
        setEmployeeList(rows)
      } catch (error) {
        setErrorMessage(error.message || 'Failed to load employees')
      } finally {
        setIsLoading(false)
      }
    }

    loadEmployees()
  }, [])

  const stats = useMemo(() => {
    if (!employeeList.length) return null

    const uniqueCities = [...new Set(employeeList.map((employee) => employee.city).filter(Boolean))]
    const salaries = employeeList.map((employee) => Number(employee.salary || 0)).filter((value) => value > 0)
    const averageSalary = salaries.length
      ? Math.round(salaries.reduce((sum, value) => sum + value, 0) / salaries.length)
      : 0

    const groupedByCity = {}

    employeeList.forEach((employee) => {
      const city = employee.city || 'Unknown'
      const salary = Number(employee.salary || 0)

      if (!groupedByCity[city]) {
        groupedByCity[city] = { totalSalary: 0, count: 0 }
      }

      groupedByCity[city].totalSalary += salary
      groupedByCity[city].count += 1
    })

    const cityStats = Object.entries(groupedByCity)
      .map(([city, info]) => ({
        city,
        averageSalary: Math.round(info.totalSalary / info.count),
        count: info.count,
      }))
      .sort((first, second) => second.averageSalary - first.averageSalary)

    return {
      uniqueCities,
      averageSalary,
      cityStats,
      topCity: cityStats[0]?.city || '—',
    }
  }, [employeeList])

  useEffect(() => {
    if (!stats || !mapRootRef.current || mapInstanceRef.current) return

    let isCancelled = false

    import('leaflet').then((leafletModule) => {
      if (isCancelled || mapInstanceRef.current) return

      const L = leafletModule.default
      const map = L.map(mapRootRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(map)

      const markerIcon = L.divIcon({
        className: '',
        html: `<div style="
          width:28px;height:28px;border-radius:50% 50% 50% 0;
          background:#6EE7B7;border:2px solid #0D0D0D;
          transform:rotate(-45deg);
          box-shadow:0 2px 8px rgba(110,231,183,0.4)"></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -32],
      })

      stats.cityStats.forEach(({ city, averageSalary, count }) => {
        const coords = CITY_COORDINATES[city]
        if (!coords) return

        L.marker(coords, { icon: markerIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:'DM Sans',sans-serif;padding:4px 2px">
              <strong style="font-size:14px">${city}</strong><br/>
              <span style="color:#6EE7B7;font-family:monospace;font-size:12px">₹${averageSalary.toLocaleString()} avg</span><br/>
              <span style="color:#6b7280;font-size:11px">${count} employees</span>
            </div>
          `)
      })

      mapInstanceRef.current = map
    })

    return () => {
      isCancelled = true
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [stats])

  return (
    <div className="min-h-screen bg-ink">
      <Navbar />

      <main className="page-enter mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <p className="mb-1 text-xs uppercase tracking-widest text-accent/60 font-mono">Overview</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">Analytics</h1>
        </div>

        {isLoading && <LoadingState />}

        {!isLoading && errorMessage && (
          <div className="glass-card rounded-xl border border-accent-fire/30 p-6">
            <p className="text-sm text-accent-fire font-mono">Error: {errorMessage}</p>
          </div>
        )}

        {!isLoading && !errorMessage && stats && (
          <>
            <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Total Employees" value={employeeList.length.toLocaleString()} icon={<PeopleIcon />} accent="accent" />
              <StatCard label="Unique Cities" value={stats.uniqueCities.length} icon={<MapPinIcon />} accent="accent-blue" />
              <StatCard label="Avg Salary" value={`₹${stats.averageSalary.toLocaleString()}`} icon={<CurrencyIcon />} accent="accent-warm" />
              <StatCard label="Top City" value={stats.topCity} icon={<TrophyIcon />} accent="accent" />
            </div>

            <div className="mb-6 grid gap-6 lg:grid-cols-2">
              <AuditImageCard auditImage={auditImage} />
              <SalarySVGChart data={stats.cityStats} />
            </div>

            <div className="mb-6 grid gap-6 lg:grid-cols-2">
              <EmployeeCountChart data={stats.cityStats} />
              <div className="glass-card overflow-hidden rounded-2xl border border-slate-border">
                <div className="flex items-center justify-between border-b border-slate-border px-5 py-4">
                  <h2 className="font-display font-bold text-white">City Distribution Map</h2>
                  <span className="text-xs text-gray-500 font-mono">Static city → coordinate mapping</span>
                </div>
                <div ref={mapRootRef} style={{ height: 380 }} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function AuditImageCard({ auditImage }) {
  return (
    <div className="glass-card overflow-hidden rounded-2xl border border-slate-border">
      <div className="border-b border-slate-border px-5 py-4">
        <h2 className="font-display font-bold text-white">Audit Image</h2>
        <p className="mt-0.5 text-xs text-gray-500 font-mono">Latest merged photo + signature</p>
      </div>
      <div className="p-4">
        {auditImage ? (
          <img src={auditImage} alt="Latest audit" className="max-h-[360px] w-full rounded-xl border border-slate-border object-contain" />
        ) : (
          <div className="flex h-[360px] items-center justify-center rounded-xl border border-dashed border-slate-border bg-slate-panel text-center text-gray-500">
            <div>
              <p className="font-display text-lg text-gray-300">No audit image yet</p>
              <p className="mt-1 text-sm">Capture a photo and sign it from the details page.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SalarySVGChart({ data }) {
  if (!data.length) return null

  const width = 520
  const height = 280
  const padding = { top: 20, right: 20, bottom: 60, left: 70 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const topCities = data.slice(0, 8)
  const maxValue = Math.max(...topCities.map((item) => item.averageSalary))
  const barWidth = Math.floor(chartWidth / topCities.length) - 8
  const tickValues = Array.from({ length: 5 }, (_, index) => Math.round((maxValue / 4) * index))

  return (
    <div className="glass-card overflow-hidden rounded-2xl border border-slate-border">
      <div className="border-b border-slate-border px-5 py-4">
        <h2 className="font-display font-bold text-white">Avg Salary by City</h2>
        <p className="mt-0.5 text-xs text-gray-500 font-mono">Raw SVG chart</p>
      </div>
      <div className="overflow-x-auto p-4">
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ minWidth: 320, fontFamily: "'DM Sans', sans-serif" }}>
          {tickValues.map((value, index) => {
            const y = padding.top + chartHeight - (value / maxValue) * chartHeight
            return (
              <g key={index}>
                <line x1={padding.left} y1={y} x2={padding.left + chartWidth} y2={y} stroke="#2A2A45" strokeWidth="1" strokeDasharray="4 3" />
                <text x={padding.left - 8} y={y + 4} textAnchor="end" fill="#6b7280" fontSize="10" fontFamily="'JetBrains Mono', monospace">
                  {value >= 1000 ? `${Math.round(value / 1000)}k` : value}
                </text>
              </g>
            )
          })}

          {topCities.map((item, index) => {
            const currentBarHeight = Math.max(2, (item.averageSalary / maxValue) * chartHeight)
            const x = padding.left + index * (chartWidth / topCities.length) + 4
            const y = padding.top + chartHeight - currentBarHeight
            const opacity = 0.5 + 0.5 * (item.averageSalary / maxValue)

            return (
              <g key={item.city}>
                <rect x={x} y={y} width={barWidth} height={currentBarHeight} rx="4" fill={`rgba(110,231,183,${opacity})`} />
                <text x={x + barWidth / 2} y={y - 5} textAnchor="middle" fill="#6EE7B7" fontSize="9" fontFamily="'JetBrains Mono', monospace">
                  {item.averageSalary >= 1000 ? `${Math.round(item.averageSalary / 1000)}k` : item.averageSalary}
                </text>
                <text x={x + barWidth / 2} y={padding.top + chartHeight + 16} textAnchor="middle" fill="#9ca3af" fontSize="9" transform={`rotate(-35, ${x + barWidth / 2}, ${padding.top + chartHeight + 16})`}>
                  {item.city}
                </text>
              </g>
            )
          })}

          <line x1={padding.left} y1={padding.top + chartHeight} x2={padding.left + chartWidth} y2={padding.top + chartHeight} stroke="#2A2A45" strokeWidth="1.5" />
          <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + chartHeight} stroke="#2A2A45" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  )
}

function EmployeeCountChart({ data }) {
  if (!data.length) return null

  const topCities = data.slice(0, 6)
  const maxCount = Math.max(...topCities.map((item) => item.count))
  const barHeight = 28
  const gap = 12
  const leftPadding = 80
  const rightPadding = 20
  const width = 480
  const graphWidth = width - leftPadding - rightPadding
  const height = topCities.length * (barHeight + gap) + 20

  return (
    <div className="glass-card overflow-hidden rounded-2xl border border-slate-border">
      <div className="border-b border-slate-border px-5 py-4">
        <h2 className="font-display font-bold text-white">Employees per City</h2>
        <p className="mt-0.5 text-xs text-gray-500 font-mono">Raw SVG chart</p>
      </div>
      <div className="overflow-x-auto p-4">
        <svg viewBox={`0 0 ${width} ${height + 20}`} width="100%" style={{ minWidth: 300, fontFamily: "'DM Sans', sans-serif" }}>
          {topCities.map((item, index) => {
            const y = 10 + index * (barHeight + gap)
            const currentBarWidth = Math.max(4, (item.count / maxCount) * graphWidth)
            const opacity = 0.4 + 0.6 * (item.count / maxCount)

            return (
              <g key={item.city}>
                <text x={leftPadding - 8} y={y + barHeight / 2 + 4} textAnchor="end" fill="#9ca3af" fontSize="11">
                  {item.city}
                </text>
                <rect x={leftPadding} y={y} width={graphWidth} height={barHeight} rx="6" fill="#1C1C30" />
                <rect x={leftPadding} y={y} width={currentBarWidth} height={barHeight} rx="6" fill={`rgba(129,140,248,${opacity})`} />
                <text x={leftPadding + currentBarWidth + 6} y={y + barHeight / 2 + 4} fill="#818CF8" fontSize="10" fontFamily="'JetBrains Mono', monospace">
                  {item.count}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, accent }) {
  const accentClass = {
    accent: 'text-accent bg-accent/10 border-accent/20',
    'accent-blue': 'text-accent-blue bg-accent-blue/10 border-accent-blue/20',
    'accent-warm': 'text-accent-warm bg-accent-warm/10 border-accent-warm/20',
  }[accent] || 'text-accent bg-accent/10 border-accent/20'

  return (
    <div className="stat-card animate-fade-in">
      <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border ${accentClass}`}>
        {icon}
      </div>
      <p className="font-display text-2xl font-bold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-gray-500 font-mono">{label}</p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="mb-8 grid grid-cols-2 gap-4 animate-pulse lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-28 rounded-xl border border-slate-border bg-slate-card" />
      ))}
    </div>
  )
}

const PeopleIcon = () => <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M1.5 13c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="11.5" cy="5" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M14 13c0-1.933-1.343-3.5-3-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
const MapPinIcon = () => <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M8 1.5a5 5 0 0 1 5 5c0 3.5-5 8-5 8s-5-4.5-5-8a5 5 0 0 1 5-5Z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="6.5" r="1.5" fill="currentColor"/></svg>
const CurrencyIcon = () => <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 4v8M10 6H7a1 1 0 0 0 0 2h2a1 1 0 0 1 0 2H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
const TrophyIcon = () => <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M5 2h6v5a3 3 0 0 1-6 0V2Z" stroke="currentColor" strokeWidth="1.5"/><path d="M8 9v3M6 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M5 4H3a1 1 0 0 0-1 1v1a2 2 0 0 0 2 2M11 4h2a1 1 0 0 1 1 1v1a2 2 0 0 1-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
