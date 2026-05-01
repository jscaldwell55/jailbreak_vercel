import { describe, it, expect } from 'vitest'
import { render, screen } from '../../utils/test-utils'
import ChatMessage, { LoadingMessage } from '@/components/ChatMessage'

describe('ChatMessage', () => {
  describe('user message', () => {
    it('renders user content', () => {
      render(<ChatMessage role="user" content="Hello AI" />)

      expect(screen.getByText('Hello AI')).toBeInTheDocument()
    })

    it('shows "You" label for user messages', () => {
      render(<ChatMessage role="user" content="Hello AI" />)

      expect(screen.getByText('You')).toBeInTheDocument()
    })

    it('has accessible label indicating user message', () => {
      render(<ChatMessage role="user" content="Hello AI" />)

      expect(screen.getByRole('article')).toHaveAccessibleName(/message from you/i)
    })
  })

  describe('assistant message', () => {
    it('renders assistant content', () => {
      render(<ChatMessage role="assistant" content="Hello human" />)

      expect(screen.getByText('Hello human')).toBeInTheDocument()
    })

    it('shows "AI" label for assistant messages', () => {
      render(<ChatMessage role="assistant" content="Hello" />)

      expect(screen.getByText('AI')).toBeInTheDocument()
    })

    it('has accessible label indicating AI message', () => {
      render(<ChatMessage role="assistant" content="Hello" />)

      expect(screen.getByRole('article')).toHaveAccessibleName(/message from ai/i)
    })
  })

  describe('content formatting', () => {
    it('preserves whitespace in content', () => {
      render(<ChatMessage role="user" content="Line 1\nLine 2" />)

      const content = screen.getByText(/Line 1/i).closest('div')
      expect(content).toHaveClass('whitespace-pre-wrap')
    })

    it('handles long content', () => {
      const longContent = 'a'.repeat(1000)
      render(<ChatMessage role="user" content={longContent} />)

      expect(screen.getByText(longContent)).toBeInTheDocument()
    })

    it('handles special characters', () => {
      render(<ChatMessage role="user" content="<script>alert('xss')</script>" />)

      expect(screen.getByText("<script>alert('xss')</script>")).toBeInTheDocument()
    })
  })

  describe('animation', () => {
    it('has fade-in animation when isLatest is true', () => {
      render(<ChatMessage role="user" content="Latest" isLatest={true} />)

      expect(screen.getByRole('article')).toHaveClass('animate-fade-in')
    })

    it('does not have fade-in animation when isLatest is false', () => {
      render(<ChatMessage role="user" content="Old" isLatest={false} />)

      expect(screen.getByRole('article')).not.toHaveClass('animate-fade-in')
    })

    it('does not have fade-in animation by default', () => {
      render(<ChatMessage role="user" content="Default" />)

      expect(screen.getByRole('article')).not.toHaveClass('animate-fade-in')
    })
  })
})

describe('LoadingMessage', () => {
  it('renders loading indicator', () => {
    render(<LoadingMessage />)

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('has accessible label indicating AI is typing', () => {
    render(<LoadingMessage />)

    expect(screen.getByRole('status')).toHaveAccessibleName(/ai is typing/i)
  })

  it('shows AI label', () => {
    render(<LoadingMessage />)

    expect(screen.getByText('AI')).toBeInTheDocument()
  })

  it('has screen reader text', () => {
    render(<LoadingMessage />)

    expect(screen.getByText(/ai is typing a response/i)).toBeInTheDocument()
  })

  it('has loading dots', () => {
    render(<LoadingMessage />)

    const dots = document.querySelectorAll('.loading-dot')
    expect(dots.length).toBe(3)
  })

  it('has fade-in animation', () => {
    render(<LoadingMessage />)

    expect(screen.getByRole('status')).toHaveClass('animate-fade-in')
  })
})
