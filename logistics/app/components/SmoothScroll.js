'use client'

import { ReactLenis } from '@/utils/lenis'

function SmoothScroll({ children }) {
  return (
    <ReactLenis root>
      {children}
    </ReactLenis>
  )
}

export default SmoothScroll