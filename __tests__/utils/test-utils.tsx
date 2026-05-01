import { render, RenderOptions } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'

interface WrapperProps {
  children: ReactNode
}

function AllTheProviders({ children }: WrapperProps) {
  return <>{children}</>
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllTheProviders, ...options })
}

export * from '@testing-library/react'
export { customRender as render }
