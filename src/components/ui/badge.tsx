import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-mono font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-zinc-800 bg-zinc-800/50 text-zinc-400',
        primary: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300',
        secondary: 'border-violet-500/20 bg-violet-500/10 text-violet-300',
        success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
