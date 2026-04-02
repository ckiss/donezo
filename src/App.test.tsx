import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the Donezo heading', () => {
    render(<App />)
    expect(screen.getByText('Donezo')).toBeInTheDocument()
  })
})
