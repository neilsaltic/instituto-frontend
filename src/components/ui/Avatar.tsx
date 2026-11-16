type AvatarProps = {
  initials: string
  color?: string
  size?: 'small' | 'large'
}

export function Avatar({ initials, color = 'rose', size }: AvatarProps) {
  return <span className={`avatar avatar-${color} ${size ? `avatar-${size}` : ''}`}>{initials}</span>
}
