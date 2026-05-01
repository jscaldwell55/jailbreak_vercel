import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '../../utils/test-utils'
import userEvent from '@testing-library/user-event'
import ChatInput from '@/components/ChatInput'

describe('ChatInput', () => {
  const defaultProps = {
    onSend: vi.fn(),
    onReset: vi.fn(),
    disabled: false,
    loading: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders textarea', () => {
      render(<ChatInput {...defaultProps} />)

      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('renders Send button', () => {
      render(<ChatInput {...defaultProps} />)

      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
    })

    it('renders New button', () => {
      render(<ChatInput {...defaultProps} />)

      expect(screen.getByRole('button', { name: /new/i })).toBeInTheDocument()
    })

    it('renders placeholder text', () => {
      render(<ChatInput {...defaultProps} />)

      expect(screen.getByPlaceholderText(/type your prompt/i)).toBeInTheDocument()
    })
  })

  describe('sending messages', () => {
    it('calls onSend with message when Send is clicked', async () => {
      const user = userEvent.setup()
      const onSend = vi.fn()
      render(<ChatInput {...defaultProps} onSend={onSend} />)

      await user.type(screen.getByRole('textbox'), 'Hello AI')
      await user.click(screen.getByRole('button', { name: /send/i }))

      expect(onSend).toHaveBeenCalledWith('Hello AI')
    })

    it('calls onSend when Enter is pressed', async () => {
      const user = userEvent.setup()
      const onSend = vi.fn()
      render(<ChatInput {...defaultProps} onSend={onSend} />)

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'Hello AI')
      await user.keyboard('{Enter}')

      expect(onSend).toHaveBeenCalledWith('Hello AI')
    })

    it('does not send on Shift+Enter (allows new line)', async () => {
      const user = userEvent.setup()
      const onSend = vi.fn()
      render(<ChatInput {...defaultProps} onSend={onSend} />)

      await user.type(screen.getByRole('textbox'), 'Line 1')
      await user.keyboard('{Shift>}{Enter}{/Shift}')

      expect(onSend).not.toHaveBeenCalled()
    })

    it('clears input after sending', async () => {
      const user = userEvent.setup()
      render(<ChatInput {...defaultProps} />)

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      await user.type(textarea, 'Hello')
      await user.click(screen.getByRole('button', { name: /send/i }))

      expect(textarea.value).toBe('')
    })

    it('trims whitespace from message', async () => {
      const user = userEvent.setup()
      const onSend = vi.fn()
      render(<ChatInput {...defaultProps} onSend={onSend} />)

      await user.type(screen.getByRole('textbox'), '  Hello  ')
      await user.click(screen.getByRole('button', { name: /send/i }))

      expect(onSend).toHaveBeenCalledWith('Hello')
    })
  })

  describe('disabled states', () => {
    it('disables Send button when message is empty', () => {
      render(<ChatInput {...defaultProps} />)

      expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
    })

    it('disables Send button when only whitespace', async () => {
      const user = userEvent.setup()
      render(<ChatInput {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), '   ')

      expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
    })

    it('enables Send button when message has content', async () => {
      const user = userEvent.setup()
      render(<ChatInput {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), 'Hello')

      expect(screen.getByRole('button', { name: /send/i })).not.toBeDisabled()
    })

    it('disables Send button when disabled prop is true', async () => {
      const user = userEvent.setup()
      render(<ChatInput {...defaultProps} disabled={true} />)

      await user.type(screen.getByRole('textbox'), 'Hello')

      expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
    })

    it('disables textarea when disabled prop is true', () => {
      render(<ChatInput {...defaultProps} disabled={true} />)

      expect(screen.getByRole('textbox')).toBeDisabled()
    })

    it('disables Send button when loading', async () => {
      const user = userEvent.setup()
      render(<ChatInput {...defaultProps} loading={true} />)

      await user.type(screen.getByRole('textbox'), 'Hello')

      expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled()
    })

    it('disables textarea when loading', () => {
      render(<ChatInput {...defaultProps} loading={true} />)

      expect(screen.getByRole('textbox')).toBeDisabled()
    })
  })

  describe('loading state', () => {
    it('shows "Sending..." when loading', () => {
      render(<ChatInput {...defaultProps} loading={true} />)

      expect(screen.getByRole('button', { name: /sending/i })).toBeInTheDocument()
    })

    it('does not show "Sending..." when not loading', () => {
      render(<ChatInput {...defaultProps} loading={false} />)

      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /sending/i })).not.toBeInTheDocument()
    })
  })

  describe('reset functionality', () => {
    it('calls onReset when New button is clicked', async () => {
      const user = userEvent.setup()
      const onReset = vi.fn()
      render(<ChatInput {...defaultProps} onReset={onReset} />)

      await user.click(screen.getByRole('button', { name: /new/i }))

      expect(onReset).toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('has accessible label for textarea', () => {
      render(<ChatInput {...defaultProps} />)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAccessibleName()
    })

    it('has aria-busy on Send button when loading', () => {
      render(<ChatInput {...defaultProps} loading={true} />)

      expect(screen.getByRole('button', { name: /sending/i })).toHaveAttribute('aria-busy', 'true')
    })

    it('has aria-label on New button', () => {
      render(<ChatInput {...defaultProps} />)

      expect(screen.getByRole('button', { name: /new/i })).toHaveAttribute('aria-label')
    })
  })

  describe('keyboard interaction', () => {
    it('does not send empty message on Enter', async () => {
      const user = userEvent.setup()
      const onSend = vi.fn()
      render(<ChatInput {...defaultProps} onSend={onSend} />)

      const textarea = screen.getByRole('textbox')
      await user.click(textarea)
      await user.keyboard('{Enter}')

      expect(onSend).not.toHaveBeenCalled()
    })

    it('does not send whitespace-only message on Enter', async () => {
      const user = userEvent.setup()
      const onSend = vi.fn()
      render(<ChatInput {...defaultProps} onSend={onSend} />)

      await user.type(screen.getByRole('textbox'), '   ')
      await user.keyboard('{Enter}')

      expect(onSend).not.toHaveBeenCalled()
    })
  })
})
