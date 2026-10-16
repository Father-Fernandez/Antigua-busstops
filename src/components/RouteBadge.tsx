const SIZES = {
  sm: 'h-9 w-9 rounded-lg text-sm',
  md: 'h-10 w-10 rounded-lg text-sm',
  lg: 'h-12 w-12 rounded-xl text-lg',
} as const;

interface Props {
  number: string;
  color?: string;
  size?: keyof typeof SIZES;
}

export default function RouteBadge({ number, color, size = 'sm' }: Props) {
  return (
    <span
      className={`grid shrink-0 place-items-center font-bold text-white shadow-sm ${SIZES[size]}`}
      style={{ backgroundColor: color || '#407fc9' }}
    >
      {number}
    </span>
  );
}
