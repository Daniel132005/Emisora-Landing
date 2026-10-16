import { Link } from 'react-router-dom'

/**
 * Enlace del menú. Los de sección ("#programacion") llevan a esa sección de la portada desde
 * cualquier página, sin recargar (la radio sigue sonando).
 */
export default function NavLink({ href, children, ...props }) {
  const to = href.startsWith('#') ? { pathname: '/', hash: href } : href
  return <Link to={to} {...props}>{children}</Link>
}
