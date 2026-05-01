import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '../../utils/test-utils'
import userEvent from '@testing-library/user-event'
import LevelSelector from '@/components/LevelSelector'
import { LEVELS } from '@/lib/constants'

describe('LevelSelector', () => {
  const defaultProps = {
    currentLevel: 1,
    completedLevels: [],
    onSelectLevel: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders all 5 levels', () => {
      render(<LevelSelector {...defaultProps} />)

      LEVELS.forEach(level => {
        expect(screen.getByText(level.subtitle!)).toBeInTheDocument()
      })
    })

    it('renders level descriptions', () => {
      render(<LevelSelector {...defaultProps} />)

      LEVELS.forEach(level => {
        expect(screen.getByText(level.eraDescription)).toBeInTheDocument()
      })
    })

    it('has accessible title', () => {
      render(<LevelSelector {...defaultProps} />)

      expect(screen.getByText(/evolution of ai safety/i)).toBeInTheDocument()
    })

    it('uses list role', () => {
      render(<LevelSelector {...defaultProps} />)

      expect(screen.getByRole('list')).toBeInTheDocument()
    })

    it('each level is a list item', () => {
      render(<LevelSelector {...defaultProps} />)

      expect(screen.getAllByRole('listitem')).toHaveLength(5)
    })
  })

  describe('current level', () => {
    it('highlights current level', () => {
      render(<LevelSelector {...defaultProps} currentLevel={3} />)

      const level3Button = screen.getByRole('button', { name: /level 3.*current/i })
      expect(level3Button).toHaveAttribute('aria-current', 'true')
    })

    it('allows clicking current level', async () => {
      const user = userEvent.setup()
      const onSelectLevel = vi.fn()
      render(<LevelSelector {...defaultProps} currentLevel={2} onSelectLevel={onSelectLevel} />)

      const level2Button = screen.getByRole('button', { name: /level 2/i })
      await user.click(level2Button)

      expect(onSelectLevel).toHaveBeenCalledWith(LEVELS[1])
    })
  })

  describe('completed levels', () => {
    it('shows checkmark for completed levels', () => {
      render(<LevelSelector {...defaultProps} completedLevels={[1, 2]} />)

      const level1Button = screen.getByRole('button', { name: /level 1.*completed/i })
      const level2Button = screen.getByRole('button', { name: /level 2.*completed/i })

      expect(level1Button).toBeInTheDocument()
      expect(level2Button).toBeInTheDocument()
    })

    it('allows clicking completed levels', async () => {
      const user = userEvent.setup()
      const onSelectLevel = vi.fn()
      render(<LevelSelector {...defaultProps} completedLevels={[1]} onSelectLevel={onSelectLevel} />)

      const level1Button = screen.getByRole('button', { name: /level 1.*completed/i })
      await user.click(level1Button)

      expect(onSelectLevel).toHaveBeenCalledWith(LEVELS[0])
    })
  })

  describe('locked levels', () => {
    it('locks levels after incomplete level', () => {
      render(<LevelSelector {...defaultProps} currentLevel={1} completedLevels={[]} />)

      // Level 3 should be locked (level 2 not completed)
      const level3Button = screen.getByRole('button', { name: /level 3.*locked/i })
      expect(level3Button).toBeDisabled()
    })

    it('does not lock level right after completed level', () => {
      render(<LevelSelector {...defaultProps} currentLevel={3} completedLevels={[1, 2]} />)

      // Level 3 should be available (level 2 completed, level 3 is current)
      const level3Button = screen.getByRole('button', { name: /level 3/i })
      expect(level3Button).not.toBeDisabled()
    })

    it('prevents clicking locked levels', async () => {
      const user = userEvent.setup()
      const onSelectLevel = vi.fn()
      render(<LevelSelector {...defaultProps} currentLevel={1} completedLevels={[]} onSelectLevel={onSelectLevel} />)

      const level3Button = screen.getByRole('button', { name: /level 3.*locked/i })
      await user.click(level3Button)

      expect(onSelectLevel).not.toHaveBeenCalled()
    })

    it('unlocks level when previous is completed', () => {
      render(<LevelSelector {...defaultProps} currentLevel={2} completedLevels={[1]} />)

      // Level 2 should not be locked
      const level2Button = screen.getByRole('button', { name: /level 2/i })
      expect(level2Button).not.toBeDisabled()
    })
  })

  describe('level selection', () => {
    it('calls onSelectLevel with correct level', async () => {
      const user = userEvent.setup()
      const onSelectLevel = vi.fn()
      render(<LevelSelector {...defaultProps} completedLevels={[1, 2, 3]} onSelectLevel={onSelectLevel} />)

      const level4Button = screen.getByRole('button', { name: /level 4/i })
      await user.click(level4Button)

      expect(onSelectLevel).toHaveBeenCalledWith(LEVELS[3])
    })

    it('does not call onSelectLevel for locked level', async () => {
      const user = userEvent.setup()
      const onSelectLevel = vi.fn()
      render(<LevelSelector {...defaultProps} currentLevel={1} completedLevels={[]} onSelectLevel={onSelectLevel} />)

      const level5Button = screen.getByRole('button', { name: /level 5.*locked/i })
      await user.click(level5Button)

      expect(onSelectLevel).not.toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('has proper aria labels for each level', () => {
      render(<LevelSelector {...defaultProps} currentLevel={1} completedLevels={[]} />)

      // Current level
      expect(screen.getByRole('button', { name: /level 1.*current/i })).toBeInTheDocument()

      // Locked levels
      expect(screen.getByRole('button', { name: /level 3.*locked/i })).toBeInTheDocument()
    })

    it('indicates available levels', () => {
      render(<LevelSelector {...defaultProps} currentLevel={1} completedLevels={[1]} />)

      // Level 2 should be available
      expect(screen.getByRole('button', { name: /level 2.*available/i })).toBeInTheDocument()
    })
  })

  describe('progressive unlock', () => {
    it('level 2 available when level 1 completed', () => {
      render(<LevelSelector {...defaultProps} currentLevel={2} completedLevels={[1]} />)

      const level2Button = screen.getByRole('button', { name: /level 2/i })
      expect(level2Button).not.toBeDisabled()
    })

    it('all levels available when all previous completed', () => {
      render(<LevelSelector {...defaultProps} currentLevel={5} completedLevels={[1, 2, 3, 4]} />)

      const level5Button = screen.getByRole('button', { name: /level 5/i })
      expect(level5Button).not.toBeDisabled()
    })
  })
})
