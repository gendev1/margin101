import { Slider } from '@/components/ui/slider'

interface SliderFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  money?: boolean
}

export function SliderField({ label, value, onChange, min, max, step = 1, money = false }: SliderFieldProps) {
  return (
    <div className="my-2 flex items-center gap-3">
      <label className="min-w-[150px] font-mono text-cap text-muted-foreground">{label}</label>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="flex-1"
      />
      <span className="min-w-[84px] text-right font-mono text-[13px] tabular-nums text-foreground">
        {money ? '$' : ''}{value}
      </span>
    </div>
  )
}
