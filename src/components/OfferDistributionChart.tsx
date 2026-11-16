import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { OfferDistribution } from "@/lib/offer-distributions";

const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const percent = (value: number) => `${value.toLocaleString("it-IT", { maximumFractionDigits: 1 })}%`;

export function OfferDistributionChart({ title, rows }: { title: string; rows: OfferDistribution[] }) {
  return <section className="min-w-0 space-y-3" aria-label={title}>
    <h2 className="text-base font-semibold">{title}</h2>
    {rows.length === 0 ? <p className="py-10 text-sm text-muted-foreground">Nessun dato disponibile.</p> : <>
      <div className="h-64 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={95} isAnimationActive={false}>
              {rows.map((row, i) => <Cell key={row.name} fill={colors[i % colors.length]} stroke="var(--background)" />)}
            </Pie>
            <Tooltip content={({ active, payload }) => {
              const row = payload?.[0]?.payload as OfferDistribution | undefined;
              return active && row ? <div className="max-w-64 break-words rounded-md border bg-popover p-3 text-sm text-popover-foreground"><p className="font-semibold">{row.name}</p><p>{row.count} offerte · {percent(row.percentage)}</p></div> : null;
            }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <TableLegend rows={rows} />
    </>}
  </section>;
}

function TableLegend({ rows }: { rows: OfferDistribution[] }) {
  return <ul className="max-h-72 space-y-1 overflow-y-auto" aria-label="Distribuzione offerte">
    {rows.map((row, i) => <li key={row.name} className="grid grid-cols-[1rem_minmax(0,1fr)_auto] items-start gap-2 border-b py-2 text-sm">
      <svg width="12" height="12" viewBox="0 0 12 12" className="mt-1" aria-hidden="true"><circle cx="6" cy="6" r="5" fill={colors[i % colors.length]} /></svg>
      <span className="break-words">{row.name}</span><span className="whitespace-nowrap tabular-nums">{row.count} · {percent(row.percentage)}</span>
    </li>)}
  </ul>;
}