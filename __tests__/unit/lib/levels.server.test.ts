// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { LEVELS, getLevel, MAX_ATTEMPTS_PER_LEVEL } from '@/lib/levels.server'

describe('lib/levels.server', () => {
  describe('LEVELS', () => {
    it('contains exactly 5 levels', () => {
      expect(LEVELS.length).toBe(5)
    })

    it('has sequential IDs from 1 to 5', () => {
      const ids = LEVELS.map(l => l.id)
      expect(ids).toEqual([1, 2, 3, 4, 5])
    })

    it('each level has required properties', () => {
      LEVELS.forEach(level => {
        expect(level).toHaveProperty('id')
        expect(level).toHaveProperty('name')
        expect(level).toHaveProperty('model')
        expect(level).toHaveProperty('secret')
        expect(level).toHaveProperty('showHints')
        expect(level).toHaveProperty('systemPrompt')

        expect(typeof level.id).toBe('number')
        expect(typeof level.name).toBe('string')
        expect(typeof level.model).toBe('string')
        expect(typeof level.secret).toBe('string')
        expect(typeof level.showHints).toBe('boolean')
        expect(typeof level.systemPrompt).toBe('string')
      })
    })

    it('each level has a non-empty secret', () => {
      LEVELS.forEach(level => {
        expect(level.secret.length).toBeGreaterThan(0)
      })
    })

    it('each level has a non-empty system prompt', () => {
      LEVELS.forEach(level => {
        expect(level.systemPrompt.length).toBeGreaterThan(0)
      })
    })

    it('each level has a valid OpenAI model', () => {
      const validModels = ['gpt-3.5-turbo', 'gpt-4o-mini', 'gpt-4o', 'gpt-4', 'gpt-4-turbo', 'gpt-5', 'gpt-5.5']
      LEVELS.forEach(level => {
        expect(validModels).toContain(level.model)
      })
    })

    describe('Level 1 - The Rookie', () => {
      const level = LEVELS[0]

      it('has correct basic properties', () => {
        expect(level.id).toBe(1)
        expect(level.name).toBe('The Rookie')
        expect(level.model).toBe('gpt-5')
      })

      it('has secret BLUE FALCON', () => {
        expect(level.secret).toBe('BLUE FALCON')
      })

      it('shows hints', () => {
        expect(level.showHints).toBe(true)
      })

      it('system prompt mentions the secret', () => {
        expect(level.systemPrompt).toContain('BLUE FALCON')
      })
    })

    describe('Level 2 - The Chatty Guard', () => {
      const level = LEVELS[1]

      it('has correct basic properties', () => {
        expect(level.id).toBe(2)
        expect(level.name).toBe('The Chatty Guard')
        expect(level.model).toBe('gpt-5')
      })

      it('has secret SILVER SERPENT', () => {
        expect(level.secret).toBe('SILVER SERPENT')
      })

      it('shows hints', () => {
        expect(level.showHints).toBe(true)
      })
    })

    describe('Level 3 - The Protocol Officer', () => {
      const level = LEVELS[2]

      it('has correct basic properties', () => {
        expect(level.id).toBe(3)
        expect(level.name).toBe('The Protocol Officer')
        expect(level.model).toBe('gpt-5')
      })

      it('has secret GOLDEN PHOENIX', () => {
        expect(level.secret).toBe('GOLDEN PHOENIX')
      })

      it('shows hints', () => {
        expect(level.showHints).toBe(true)
      })
    })

    describe('Level 4 - The Analyst', () => {
      const level = LEVELS[3]

      it('has correct basic properties', () => {
        expect(level.id).toBe(4)
        expect(level.name).toBe('The Analyst')
        expect(level.model).toBe('gpt-5')
      })

      it('has secret IRON FORTRESS', () => {
        expect(level.secret).toBe('IRON FORTRESS')
      })

      it('shows hints', () => {
        expect(level.showHints).toBe(true)
      })
    })

    describe('Level 5 - The Vault', () => {
      const level = LEVELS[4]

      it('has correct basic properties', () => {
        expect(level.id).toBe(5)
        expect(level.name).toBe('The Vault')
        expect(level.model).toBe('gpt-5')
      })

      it('has secret CRIMSON PHOENIX', () => {
        expect(level.secret).toBe('CRIMSON PHOENIX')
      })

      it('shows hints', () => {
        expect(level.showHints).toBe(true)
      })

      it('has the most comprehensive system prompt', () => {
        // The Vault is the composite-jailbreaking challenge: hardened against
        // any single technique, beaten only by prompts that coherently
        // combine two or more techniques.
        expect(level.systemPrompt.length).toBeGreaterThan(500)
        expect(level.systemPrompt).toMatch(/composite|combin/i)
        expect(level.systemPrompt).toMatch(/CRIMSON PHOENIX/)
      })
    })
  })

  describe('getLevel', () => {
    it('returns correct level for valid IDs', () => {
      expect(getLevel(1).id).toBe(1)
      expect(getLevel(2).id).toBe(2)
      expect(getLevel(3).id).toBe(3)
      expect(getLevel(4).id).toBe(4)
      expect(getLevel(5).id).toBe(5)
    })

    it('returns the correct level object', () => {
      const level3 = getLevel(3)
      expect(level3.name).toBe('The Protocol Officer')
      expect(level3.secret).toBe('GOLDEN PHOENIX')
    })

    it('returns level 1 for invalid level ID 0', () => {
      const level = getLevel(0)
      expect(level.id).toBe(1)
    })

    it('returns level 1 for invalid level ID 6', () => {
      const level = getLevel(6)
      expect(level.id).toBe(1)
    })

    it('returns level 1 for negative level ID', () => {
      const level = getLevel(-1)
      expect(level.id).toBe(1)
    })

    it('returns level 1 for very large level ID', () => {
      const level = getLevel(999)
      expect(level.id).toBe(1)
    })
  })

  describe('MAX_ATTEMPTS_PER_LEVEL', () => {
    it('is set to 50', () => {
      expect(MAX_ATTEMPTS_PER_LEVEL).toBe(50)
    })
  })

  describe('level progression', () => {
    it('all levels run on gpt-5', () => {
      expect(LEVELS[0].model).toBe('gpt-5')
      expect(LEVELS[1].model).toBe('gpt-5')
      expect(LEVELS[2].model).toBe('gpt-5')
      expect(LEVELS[3].model).toBe('gpt-5')
      expect(LEVELS[4].model).toBe('gpt-5')
    })

    it('hints are shown on every level', () => {
      expect(LEVELS[0].showHints).toBe(true)
      expect(LEVELS[1].showHints).toBe(true)
      expect(LEVELS[2].showHints).toBe(true)
      expect(LEVELS[3].showHints).toBe(true)
      expect(LEVELS[4].showHints).toBe(true)
    })

    it('all secrets are unique', () => {
      const secrets = LEVELS.map(l => l.secret)
      const uniqueSecrets = new Set(secrets)
      expect(uniqueSecrets.size).toBe(secrets.length)
    })
  })
})
