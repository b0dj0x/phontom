import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const Separator = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('shrink-0 bg-zinc-800', className)}
      role="separator"
      {...props}
    />
  )
)
Separator.displayName = 'Separator'

export { Separator }
