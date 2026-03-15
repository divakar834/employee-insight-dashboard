# Employee Insights Dashboard

A React dashboard built for the internship assignment. It includes login protection, a virtualized employee table, a camera-based details page, signature capture, image merging, SVG analytics, and a Leaflet map.

## Stack

- React + Vite
- React Router
- Tailwind CSS
- HTML5 Canvas
- Browser Camera API
- Raw SVG
- Leaflet

## Main flow

1. Login with the demo credentials.
2. Open the employee list and fetch records from the company API.
3. Click a row to open the details page.
4. Capture a photo, add a signature, and merge them into one audit image.
5. Open analytics to see the latest audit image, SVG charts, and city map.

## Login credentials

- Username: `testuser`
- Password: `Test123`

## API used

`POST https://backend.jotish.in/backend_dev/gettabledata.php`

Payload:

```json
{
  "username": "test",
  "password": "123456"
}
```

## Virtualization math

```js
startIndex = Math.floor(scrollTop / rowHeight)
visibleCount = Math.ceil(containerHeight / rowHeight)
endIndex = startIndex + visibleCount + buffer
```

Only the visible rows plus a small buffer are rendered. A spacer div keeps the full scroll height so the scrollbar still feels normal.

## Camera + merge logic

On the details page:

- `getUserMedia()` opens the camera.
- A frame is captured to an off-screen canvas.
- The user signs on a second canvas.
- `drawImage()` merges the photo and signature into one final PNG.
- The merged image is saved to localStorage so it can also be shown on the analytics page.

## City to coordinate mapping

The map uses a small hard-coded city-to-coordinate object for common Indian cities. If a city is not in that mapping, it is skipped on the map instead of crashing the page.

## Intentional bug

This project intentionally contains **one bug** to satisfy the assignment requirement.

- File: `src/pages/Employees.jsx`
- Type: missing dependency / stale closure pattern
- Detail: the `useEffect` that loads employees uses an empty dependency array.

In this assignment build the effect runs only once, which is fine for the current flow, but the pattern is intentionally left as the documented bug because it can cause stale values if the effect later depends on changing state.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
"# employee-insight-dashboard" 
