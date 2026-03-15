const BASE_URL = 'https://backend.jotish.in/backend_dev'

function readFirst(obj, keys, fallback = '') {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      return obj[key]
    }
  }
  return fallback
}

function normalizeEmployee(raw, index) {
  return {
    id: readFirst(raw, ['id', 'ID', 'emp_id', 'employee_id'], index + 1),
    name: readFirst(raw, ['name', 'Name', 'employee_name', 'full_name'], 'Unknown'),
    email: readFirst(raw, ['email', 'Email', 'mail'], '—'),
    city: readFirst(raw, ['city', 'City', 'location'], 'Unknown'),
    salary: Number(readFirst(raw, ['salary', 'Salary', 'amount'], 0)) || 0,
    department: readFirst(raw, ['department', 'Department', 'dept'], 'General'),
    raw,
  }
}

function extractRows(result) {
  if (Array.isArray(result)) return result
  if (Array.isArray(result?.data)) return result.data
  if (Array.isArray(result?.employees)) return result.employees
  if (Array.isArray(result?.result)) return result.result
  if (Array.isArray(result?.records)) return result.records

  if (result && typeof result === 'object') {
    for (const value of Object.values(result)) {
      if (Array.isArray(value)) return value
      if (value && typeof value === 'object') {
        for (const nested of Object.values(value)) {
          if (Array.isArray(nested)) return nested
        }
      }
    }
  }

  return []
}

export async function fetchEmployees() {
  const response = await fetch(`${BASE_URL}/gettabledata.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain, */*',
    },
    body: JSON.stringify({
      username: 'test',
      password: '123456',
    }),
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }

  const text = await response.text()
  console.log('Raw API response text:', text)

  let result
  try {
    result = JSON.parse(text)
  } catch (error) {
    throw new Error('API did not return valid JSON')
  }

  console.log('Parsed API response:', result)

  const rows = extractRows(result)
  console.log('Extracted rows:', rows)

  return rows.map(normalizeEmployee)
}