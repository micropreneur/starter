import { useEffect, useRef } from 'react'

const STORY =
  'Good defaults should accelerate the first release without owning the second. Starter keeps the stack legible, the seams replaceable, and the interface source-owned—so every fork can become its own product without fighting the foundation.'

const STORY_WORDS = STORY.split(' ').map((word, position) => ({
  id: `story-word-${position}-${word}`,
  word,
}))
const INITIAL_REVEALED_WORDS = 4
const MIN_WORD_OPACITY = 0.28

export function ScrollStory() {
  const sectionRef = useRef<HTMLElement>(null)
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([])

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let animationFrame: number | null = null

    const render = () => {
      animationFrame = null

      if (mediaQuery.matches) {
        for (const word of wordRefs.current) {
          if (word) word.style.opacity = '1'
        }
        return
      }

      const viewportHeight = window.innerHeight
      const sectionBounds = section.getBoundingClientRect()
      const travel = Math.max(sectionBounds.height - viewportHeight, 1)
      const progress = Math.min(Math.max(-sectionBounds.top / travel, 0), 1)
      const revealedWords =
        INITIAL_REVEALED_WORDS + progress * (STORY_WORDS.length - INITIAL_REVEALED_WORDS)

      wordRefs.current.forEach((word, index) => {
        if (!word) return

        const opacity = Math.min(Math.max((revealedWords - index + 1) * 0.72, MIN_WORD_OPACITY), 1)
        word.style.opacity = opacity.toFixed(3)
      })
    }

    const scheduleRender = () => {
      if (animationFrame !== null) return
      animationFrame = window.requestAnimationFrame(render)
    }

    scheduleRender()
    window.addEventListener('scroll', scheduleRender, { passive: true })
    window.addEventListener('resize', scheduleRender)
    mediaQuery.addEventListener('change', scheduleRender)

    return () => {
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('scroll', scheduleRender)
      window.removeEventListener('resize', scheduleRender)
      mediaQuery.removeEventListener('change', scheduleRender)
    }
  }, [])

  return (
    <section
      className="relative min-h-[135svh] bg-muted/20 motion-reduce:min-h-auto sm:min-h-[165svh]"
      data-testid="scroll-story"
      id="story"
      ref={sectionRef}
    >
      <div className="sticky top-0 flex min-h-svh items-center px-6 py-24 motion-reduce:static motion-reduce:min-h-0 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-5xl">
          <p className="sr-only">{STORY}</p>
          <p
            aria-hidden="true"
            className="text-balance text-4xl leading-[1.08] font-medium tracking-[-0.04em] sm:text-5xl lg:text-6xl"
          >
            {STORY_WORDS.map(({ id, word }, index) => (
              <span
                className="transition-opacity duration-150 ease-linear"
                key={id}
                ref={(node) => {
                  wordRefs.current[index] = node
                }}
              >
                {word}{' '}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  )
}
