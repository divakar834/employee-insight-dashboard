import React, { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getVisibleRange, ROW_HEIGHT } from '../utils/virtualization'

const TABLE_HEIGHT = 540

export default function VirtualizedTable({ data, columns }) {
  const navigate = useNavigate()
  const scrollBoxRef = useRef(null)
  const [scrollTop, setScrollTop] = useState(0)

  const handleScroll = useCallback(() => {
    setScrollTop(scrollBoxRef.current?.scrollTop ?? 0)
  }, [])

  const { startIndex, endIndex, offsetY, totalHeight } = getVisibleRange(
    scrollTop,
    TABLE_HEIGHT,
    data.length,
  )

  const rowsToRender = data.slice(startIndex, endIndex)

  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-border">
      <div
        className="grid border-b border-slate-border bg-slate-panel px-4 py-3"
        style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}
      >
        {columns.map((column) => (
          <span key={column.key} className="select-none text-xs uppercase tracking-widest text-gray-500 font-mono">
            {column.label}
          </span>
        ))}
      </div>

      <div
        ref={scrollBoxRef}
        onScroll={handleScroll}
        className="relative overflow-y-auto"
        style={{ height: TABLE_HEIGHT }}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {rowsToRender.map((employee, localIndex) => {
              const rowIndex = startIndex + localIndex
              const rowId = employee.id ?? rowIndex

              return (
                <div
                  key={rowId}
                  onClick={() => navigate(`/details/${rowId}`)}
                  className="table-row-hover grid items-center border-b border-slate-border/60 px-4"
                  style={{
                    gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
                    height: ROW_HEIGHT,
                  }}
                >
                  {columns.map((column) => (
                    <span key={column.key} className="truncate pr-3 text-sm text-gray-300">
                      {column.render ? column.render(employee[column.key], employee) : (employee[column.key] ?? '—')}
                    </span>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-border bg-slate-panel px-4 py-2">
        <span className="text-xs text-gray-500 font-mono">
          Showing {data.length ? startIndex + 1 : 0}–{Math.min(endIndex, data.length)} of {data.length}
        </span>
        <span className="text-xs text-accent/60 font-mono">
          Rendered rows: {rowsToRender.length}
        </span>
      </div>
    </div>
  )
}
