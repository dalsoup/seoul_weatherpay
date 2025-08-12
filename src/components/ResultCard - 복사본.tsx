
import React from 'react'
type Props = { title: string; value: string; hint?: string }
export default function ResultCard({title, value, hint}:Props){
  return (
    <div className="card p-5 flex flex-col gap-2 min-w-[220px]">
      <div className="text-sm text-neutral-300">{title}</div>
      <div className="text-3xl font-semibold">{value}</div>
      {hint && <div className="text-xs text-neutral-400">{hint}</div>}
    </div>
  )
}
