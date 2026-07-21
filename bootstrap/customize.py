from pathlib import Path
import re

root = Path('.')
index_path = root / 'index.html'
css_path = root / 'site.css'

html = index_path.read_text()
head = re.search(r'(?s)<!doctype html>\s*<html([^>]*)>\s*<head>(.*?)</head>', html)
if not head:
    raise SystemExit('Could not preserve generated document head')

body = r'''  <body id="top">
    <a class="skip-to-content" href="#main-content">Skip to content</a>

    <header class="site-header">
      <div class="container site-header__inner">
        <a class="site-name" href="#top">Zen Tips</a>
        <nav class="site-nav" aria-label="Primary navigation">
          <a href="#truths">Four truths</a>
          <a href="#paths">Wisdom paths</a>
          <a href="#breathing">Breathe</a>
          <a href="https://www.zentips.com/">Original site</a>
          <button id="theme-toggle" class="theme-toggle" type="button" aria-label="Theme preference: system">◐</button>
        </nav>
      </div>
    </header>

    <main id="main-content" tabindex="-1">
      <section class="zen-hero" aria-labelledby="page-title">
        <div class="container zen-hero__grid">
          <div class="zen-hero__copy">
            <p class="eyebrow">Tip 42 · Mindful wisdom</p>
            <h1 id="page-title">Zen Tips</h1>
            <blockquote>“The quieter you become, the more you can hear.”</blockquote>
            <p class="zen-hero__intro">Small reminders for meeting ordinary life with a little more presence and a little less gripping.</p>
            <div class="zen-actions">
              <a class="button button-primary" href="#paths">Explore wisdom paths</a>
              <a class="button button-secondary" href="#breathing">Try calm breathing</a>
            </div>
          </div>
          <figure class="zen-hero__art">
            <img src="./assets/icons/clouds.png" width="640" height="640" alt="Soft clouds drifting through an open sky" />
          </figure>
        </div>
      </section>

      <section class="truths-section" id="truths" aria-labelledby="truths-title">
        <div class="container truths-layout">
          <div class="section-heading">
            <p class="eyebrow">Buddha’s Four Noble Truths for a 4 Year Old</p>
            <h2 id="truths-title">The difficult part, explained simply.</h2>
          </div>
          <ol class="truth-list">
            <li><span>01</span><p>Sometimes people feel sad.</p></li>
            <li><span>02</span><p>Sometimes sadness comes from not getting what we want—or getting what we don’t want.</p></li>
            <li><span>03</span><p>There is a way not to be so sad about those things.</p></li>
            <li><span>04</span><p>Think less about what you want and more about how you can be kind and helpful to people, animals, bugs, and everything that lives.</p></li>
          </ol>
        </div>
      </section>

      <section class="paths-section" id="paths" aria-labelledby="paths-title">
        <div class="container">
          <div class="section-heading paths-heading">
            <p class="eyebrow">Explore our wisdom paths</p>
            <h2 id="paths-title">Different doors into the same room.</h2>
          </div>
          <div class="path-grid">
            <a class="path-card" href="https://www.zentips.com/paths/basics.html">
              <img src="./assets/icons/clouds.png" width="220" height="220" alt="Cloud icon" />
              <div><p class="path-number">01</p><h3>The Basics</h3><p>The foundational principles of a more mindful life.</p></div>
            </a>
            <a class="path-card" href="https://www.zentips.com/paths/presence.html">
              <img src="./assets/icons/mountain.png" width="220" height="220" alt="Mountain icon" />
              <div><p class="path-number">02</p><h3>The Art of Presence</h3><p>Practical wisdom for staying grounded in the present moment.</p></div>
            </a>
            <a class="path-card" href="https://www.zentips.com/paths/eightfold.html">
              <img src="./assets/icons/8track.png" width="220" height="220" alt="Eight-track icon" />
              <div><p class="path-number">03</p><h3>The Eightfold Chill</h3><p>A modern rewriting of the path for a busy, confusing world.</p></div>
            </a>
            <a class="path-card" href="https://www.zentips.com/paths/non-attachment.html">
              <img src="./assets/icons/enso.png" width="220" height="220" alt="Enso circle icon" />
              <div><p class="path-number">04</p><h3>Non-Attachment</h3><p>Caring cleanly—without gripping or chaining yourself to the outcome.</p></div>
            </a>
            <a class="path-card path-card--wide" href="https://www.zentips.com/paths/grounding.html">
              <img src="./assets/icons/tree-hand.png" width="220" height="220" alt="Hand and tree icon" />
              <div><p class="path-number">05</p><h3>Grounding Truths</h3><p>In a world that profits from panic, step away from the feed and remember the sky.</p></div>
            </a>
          </div>
        </div>
      </section>

      <section class="breathing-section" id="breathing" aria-labelledby="breathing-title">
        <div class="container breathing-card">
          <img src="./assets/icons/infinity.png" width="260" height="260" alt="Continuous breathing loop icon" />
          <div>
            <p class="eyebrow">A one-minute reset</p>
            <h2 id="breathing-title">4–7–8 calm breathing</h2>
            <p>Inhale for four counts. Hold for seven. Exhale for eight. Let the long exhale tell your nervous system that this moment is survivable.</p>
            <a class="text-link" href="https://www.zentips.com/paths/grounding.html">Practice the original exercise →</a>
          </div>
        </div>
      </section>

      <section class="closing-quote" aria-label="Closing thought">
        <div class="container">
          <blockquote>“Not every wave needs a name. Some just want to pass through.”</blockquote>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="container site-footer__inner">
        <p>© 2025 Zen Tips</p>
        <p>Rebuilt with Syntax for a real-world dogfood test.</p>
      </div>
    </footer>
    <script src="./site.js" defer></script>
  </body>'''

new_html = '<!doctype html>\n<html' + head.group(1) + '>\n  <head>' + head.group(2) + '</head>\n' + body + '\n</html>\n'
index_path.write_text(new_html)

css = css_path.read_text()
css += r'''

/* Zen Tips project-owned composition */
html { scroll-padding-top: 5rem; }
body { overflow-x: hidden; background: var(--color-bg); }
.site-header { position: sticky; top: 0; z-index: var(--z-nav); }
.site-nav { flex-wrap: wrap; justify-content: flex-end; }
.zen-hero, .truths-section, .paths-section, .breathing-section, .closing-quote { padding-block: var(--consumer-section-space); }
.zen-hero { min-height: calc(100svh - 4.25rem); display: grid; align-items: center; }
.zen-hero__grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(16rem, .85fr); gap: clamp(2rem, 7vw, 7rem); align-items: center; }
.zen-hero h1 { max-width: 8ch; margin: 0; font-family: var(--consumer-font-heading); font-size: clamp(5rem, 15vw, 11rem); line-height: .78; letter-spacing: -.075em; }
.zen-hero blockquote { max-width: 16ch; margin: var(--space-5) 0 0; font-family: var(--consumer-font-heading); font-size: clamp(1.8rem, 4vw, 3.6rem); line-height: 1.08; }
.zen-hero__intro { max-width: 38rem; margin-top: var(--space-4); color: var(--color-text-secondary); font-size: clamp(1.05rem, 2vw, 1.35rem); line-height: 1.7; }
.zen-actions { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-4); }
.zen-hero__art { margin: 0; padding: clamp(1rem, 5vw, 3rem); border: 1px solid var(--color-border); border-radius: 50%; background: radial-gradient(circle, rgba(var(--color-primary-rgb), .16), transparent 68%); }
.zen-hero__art img { display: block; width: 100%; height: auto; filter: saturate(.75); }
.truths-section, .breathing-section { border-block: 1px solid var(--color-border); background: var(--color-surface); }
.truths-layout { display: grid; grid-template-columns: minmax(0, .75fr) minmax(0, 1.25fr); gap: clamp(2rem, 8vw, 8rem); }
.section-heading h2, .breathing-card h2 { margin: 0; font-family: var(--consumer-font-heading); font-size: clamp(2.6rem, 6vw, 5.5rem); line-height: .95; letter-spacing: var(--consumer-heading-tracking); text-wrap: balance; }
.truth-list { display: grid; gap: 0; margin: 0; padding: 0; list-style: none; }
.truth-list li { display: grid; grid-template-columns: 3rem 1fr; gap: var(--space-3); padding-block: var(--space-4); border-top: 1px solid var(--color-border); }
.truth-list li:last-child { border-bottom: 1px solid var(--color-border); }
.truth-list span, .path-number { color: var(--color-primary); font-family: var(--font-mono); font-size: var(--font-size-xs); font-weight: 700; }
.truth-list p { margin: 0; font-size: clamp(1.1rem, 2vw, 1.35rem); line-height: 1.6; }
.paths-heading { max-width: 54rem; margin-bottom: var(--space-6); }
.path-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-3); }
.path-card { display: grid; grid-template-columns: 8rem 1fr; gap: var(--space-4); align-items: center; padding: clamp(1.25rem, 3vw, 2rem); border: 1px solid var(--color-border); border-radius: var(--consumer-card-radius); background: var(--color-surface-raised); color: var(--color-text); text-decoration: none; transition: transform var(--transition-fast) var(--ease-out), border-color var(--transition-fast) var(--ease-out); }
.path-card:hover, .path-card:focus-visible { transform: translateY(-.2rem); border-color: var(--color-primary); }
.path-card--wide { grid-column: 1 / -1; }
.path-card img { display: block; width: 100%; height: auto; filter: saturate(.7); }
.path-card h3 { margin: .35rem 0 .5rem; font-family: var(--consumer-font-heading); font-size: clamp(1.5rem, 3vw, 2.5rem); }
.path-card p:last-child { margin: 0; color: var(--color-text-secondary); line-height: 1.55; }
.breathing-card { display: grid; grid-template-columns: minmax(10rem, .45fr) minmax(0, 1fr); gap: clamp(2rem, 7vw, 6rem); align-items: center; }
.breathing-card img { display: block; width: 100%; max-width: 16rem; height: auto; margin-inline: auto; }
.breathing-card p:not(.eyebrow) { max-width: 42rem; color: var(--color-text-secondary); font-size: 1.15rem; line-height: 1.7; }
.text-link { color: var(--color-primary); font-weight: 700; }
.closing-quote blockquote { max-width: 22ch; margin: 0 auto; font-family: var(--consumer-font-heading); font-size: clamp(2.5rem, 7vw, 6.5rem); line-height: .98; text-align: center; text-wrap: balance; }
@media (max-width: 56rem) {
  .zen-hero__grid, .truths-layout { grid-template-columns: 1fr; }
  .zen-hero__art { max-width: 28rem; }
  .path-grid { grid-template-columns: 1fr; }
  .path-card--wide { grid-column: auto; }
}
@media (max-width: 42rem) {
  .site-header__inner { align-items: flex-start; }
  .site-nav a { display: none; }
  .zen-hero h1 { font-size: clamp(4.5rem, 27vw, 8rem); }
  .path-card, .breathing-card { grid-template-columns: 1fr; }
  .path-card img { width: 7rem; }
  .zen-actions > * { width: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .path-card { transition: none; }
}
'''
css_path.write_text(css)

readme = root / 'README.md'
if readme.exists():
    readme.write_text(readme.read_text() + '\n\n## Dogfood test\n\nThis site was generated from Syntax Consumer Mode, then adapted using the public text and image content from zentips.com.\n')
