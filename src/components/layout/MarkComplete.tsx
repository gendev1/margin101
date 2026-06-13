import { Checkbox } from '@/components/ui/checkbox'

interface MarkCompleteProps {
  title: string
  checked: boolean
  onToggle: () => void
}

export function MarkComplete({ title, checked, onToggle }: MarkCompleteProps) {
  return (
    <div className="mt-5 flex items-center gap-3 rounded-lg border bg-card px-5 py-3.5 text-[14.5px]">
      <Checkbox id="mark-complete" checked={checked} onCheckedChange={onToggle} />
      <label htmlFor="mark-complete" className="cursor-pointer select-none">
        Mark “{title}” complete
      </label>
    </div>
  )
}
