import type { ThemeMeta } from '../types'
import { chromaTheme } from './chroma'
import { defaultTheme } from './default'
import { bowieTheme } from './bowie'
import { bubbleGumPopTheme } from './bubble-gum-pop'
import { buckleyTheme } from './buckley'
import { gilTheme } from './gil'
import { goldenHourTheme } from './golden-hour'
import { inkTheme } from './ink'
import { manuscriptTheme } from './manuscript'
import { nocturneTheme } from './nocturne'
import { pineTheme } from './pine'
import { reaperTheme } from './reaper'
import { songwriterTheme } from './songwriter'
import { technoTheme } from './techno'
import { tropicaliaTheme } from './tropicalia'

export {
  chromaTheme,
  defaultTheme, bowieTheme, bubbleGumPopTheme, buckleyTheme, gilTheme,
  goldenHourTheme, inkTheme, manuscriptTheme, nocturneTheme, pineTheme,
  reaperTheme, songwriterTheme, technoTheme, tropicaliaTheme,
}

export const THEMES: ThemeMeta[] = [
  { id: 'chroma',         name: 'Chroma',         tokens: chromaTheme },
  { id: 'default',        name: 'Default',        tokens: defaultTheme },
  { id: 'bowie',          name: 'Bowie',          tokens: bowieTheme },
  { id: 'bubble-gum-pop', name: 'Bubble Gum Pop', tokens: bubbleGumPopTheme },
  { id: 'buckley',        name: 'Buckley',        tokens: buckleyTheme },
  { id: 'gil',            name: 'Gil',            tokens: gilTheme },
  { id: 'golden-hour',    name: 'Golden Hour',    tokens: goldenHourTheme },
  { id: 'ink',            name: 'Ink',            tokens: inkTheme },
  { id: 'manuscript',     name: 'Manuscript',     tokens: manuscriptTheme },
  { id: 'nocturne',       name: 'Nocturne',       tokens: nocturneTheme },
  { id: 'pine',           name: 'Pine',           tokens: pineTheme },
  { id: 'reaper',         name: 'Reaper',         tokens: reaperTheme },
  { id: 'songwriter',     name: 'Songwriter',     tokens: songwriterTheme },
  { id: 'techno',         name: 'Techno',         tokens: technoTheme },
  { id: 'tropicalia',     name: 'Tropicália',     tokens: tropicaliaTheme },
]
