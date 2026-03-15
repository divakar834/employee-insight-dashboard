import React, { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import VirtualizedTable from '../components/VirtualizedTable'
import { fetchEmployees } from '../services/api'

const COLUMNS = [
  {
    key: 'id',
    label: 'ID',
    render: (value) => <span className="font-mono text-xs text-accent/80">#{value}</span>,
  },
  {
    key: 'name',
    label: 'Name',
    render: (value) => <span className="font-medium text-gray-100">{value}</span>,
  },
  {
    key: 'email',
    label: 'Email',
    render: (value) => <span className="text-xs text-gray-400">{value}</span>,
  },
  {
    key: 'city',
    label: 'City',
    render: (value) => <CityTag city={value} />,
  },
  {
    key: 'salary',
    label: 'Salary',
    render: (value) => (
      <span className="font-mono text-sm text-accent-warm">
        ₹{Number(value).toLocaleString()}
      </span>
    ),
  },
  {
    key: 'department',
    label: 'Dept',
    render: (value) => <span className="truncate text-xs text-gray-400">{value}</span>,
  },
]

export default function Employees() {
  const [employeeList, setEmployeeList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [searchText, setSearchText] = useState('')

  // Intentional bug for assignment:
  // loadEmployees is inside useEffect and dependency array is empty,
  // which can keep the original closure in some cases.
  useEffect(() => {
    async function loadEmployees() {
      try {
        setIsLoading(true)
        setErrorMessage('')

        const rows = await fetchEmployees()
        console.log('Employees from service:', rows)

        setEmployeeList(Array.isArray(rows) ? rows : [])
      } catch (error) {
        console.error('Employee fetch failed:', error)
        setErrorMessage(error.message || 'Failed to load employees')
      } finally {
        setIsLoading(false)
      }
    }

    loadEmployees()
  }, [])

  const filteredEmployees = useMemo(() => {
    const query = searchText.trim().toLowerCase()

    if (!query) return employeeList

    return employeeList.filter((employee) => {
      return [employee.name, employee.email, employee.city, employee.department].some((field) =>
        String(field ?? '')
          .toLowerCase()
          .includes(query)
      )
    })
  }, [employeeList, searchText])

  return (
    <div className="min-h-screen bg-ink">
      <Navbar />

      <main className="page-enter mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-1 font-mono text-xs uppercase tracking-widest text-accent/60">
              Dashboard
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-white">
              Employees
            </h1>
            {!isLoading && (
              <p className="mt-1 text-sm text-gray-500">
                {employeeList.length.toLocaleString()} records loaded
              </p>
            )}
          </div>

          <div className="relative sm:w-72">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              width="14"
              height="14"
              fill="none"
              viewBox="0 0 14 14"
            >
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M9.5 9.5 12 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>

            <input
              type="text"
              placeholder="Search by name, email, city..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              className="input-field py-2.5 pl-9 text-sm"
            />
          </div>
        </div>

        {isLoading && <SkeletonTable />}

        {!isLoading && errorMessage && (
          <div className="glass-card rounded-xl border border-accent-fire/30 p-6">
            <p className="font-mono text-sm text-accent-fire">Error: {errorMessage}</p>
          </div>
        )}

        {!isLoading && !errorMessage && filteredEmployees.length === 0 && (
          <div className="py-20 text-center text-gray-600">
            <p className="font-display text-lg">No employees found</p>
            <p className="mt-1 text-sm">Try a different search query</p>
          </div>
        )}

        {!isLoading && !errorMessage && filteredEmployees.length > 0 && (
          <VirtualizedTable data={filteredEmployees} columns={COLUMNS} />
        )}
      </main>
    </div>
  )
}

function CityTag({ city }) {
  const colorMap = {
    Chennai: 'bg-accent/10 text-accent',
    Mumbai: 'bg-accent-blue/10 text-accent-blue',
    Delhi: 'bg-accent-warm/10 text-accent-warm',
    default: 'bg-gray-700/40 text-gray-400',
  }

  const colorClass = colorMap[city] ?? colorMap.default

  return <span className={`tag ${colorClass}`}>{city ?? '—'}</span>
}

function SkeletonTable() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-slate-border">
      <div className="h-10 bg-slate-panel" />
      {Array.from({ length: 10 }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex h-[52px] items-center gap-6 border-t border-slate-border/60 px-4"
        >
          {Array.from({ length: 6 }).map((_, cellIndex) => (
            <div
              key={cellIndex}
              className="h-3 flex-1 rounded bg-slate-card"
              style={{ opacity: 1 - cellIndex * 0.1 }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}