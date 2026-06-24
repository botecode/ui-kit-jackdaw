// src/theme/themeRegistry.tsx
//
// The per-theme component map for "aware themes". A theme listed here ships its
// own implementations of DAW components; the public components resolve against
// this map via `useThemeComponent` (themeComponents.tsx). Themes NOT listed here
// (Chroma, Manuscript, …) simply use the shared base implementations and remain
// pure colour-token reskins.
//
// Only DAW primitives/composites are themeable — web/mobile marketing components
// are never varied per theme.
import type { ThemeId } from '../tokens/types'
import type { ThemeComponentOverrides } from './themeComponents'

import { ArmButtonCalm } from '../components/ArmButton/ArmButton.calm'
import { MuteSoloToggleCalm } from '../components/MuteSoloToggle/MuteSoloToggle.calm'
import { FaderCalm } from '../components/Fader/Fader.calm'
import { MeterCalm } from '../components/Meter/Meter.calm'
import { PanKnobCalm } from '../components/PanKnob/PanKnob.calm'
import { InputSelectCalm } from '../components/InputSelect/InputSelect.calm'
import { FxChipCalm } from '../components/FxChip/FxChip.calm'
import { TrackHeaderCalm } from '../components/TrackHeader/TrackHeader.calm'
import { TransportButtonCalm } from '../components/TransportButton/TransportButton.calm'
import { RepeatToggleCalm } from '../components/RepeatToggle/RepeatToggle.calm'
import { RecordModeCalm } from '../components/RecordMode/RecordMode.calm'
import { ClockCalm } from '../components/Clock/Clock.calm'
import { TransportBarCalm } from '../components/TransportBar/TransportBar.calm'
import { ToggleCalm } from '../components/Toggle/Toggle.calm'
import { CheckboxCalm } from '../components/Checkbox/Checkbox.calm'
import { KnobCalm } from '../components/Knob/Knob.calm'
import { SegmentedControlCalm } from '../components/SegmentedControl/SegmentedControl.calm'
import { AutomationButtonCalm } from '../components/AutomationButton/AutomationButton.calm'
import { PhaseInvertCalm } from '../components/PhaseInvert/PhaseInvert.calm'

export const THEME_COMPONENTS: Partial<Record<ThemeId, ThemeComponentOverrides>> = {
  calm: {
    ArmButton:        ArmButtonCalm,
    MuteSoloToggle:   MuteSoloToggleCalm,
    Fader:            FaderCalm,
    Meter:            MeterCalm,
    PanKnob:          PanKnobCalm,
    InputSelect:      InputSelectCalm,
    FxChip:           FxChipCalm,
    TrackHeader:      TrackHeaderCalm,
    TransportButton:  TransportButtonCalm,
    RepeatToggle:     RepeatToggleCalm,
    RecordMode:       RecordModeCalm,
    Clock:            ClockCalm,
    TransportBar:     TransportBarCalm,
    Toggle:           ToggleCalm,
    Checkbox:         CheckboxCalm,
    Knob:             KnobCalm,
    SegmentedControl: SegmentedControlCalm,
    AutomationButton: AutomationButtonCalm,
    PhaseInvert:      PhaseInvertCalm,
  },
}
