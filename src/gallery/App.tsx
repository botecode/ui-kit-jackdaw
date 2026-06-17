// src/gallery/App.tsx
import { ThemeRoot, ThemeProvider, useTheme } from '../theme/ThemeProvider'
import { Sidebar } from './Sidebar'
import { Stage } from './Stage'
import styles from './App.module.css'

function Layout() {
  const { theme } = useTheme()
  return (
    <div className={styles.layout}>
      {/* Sidebar: always pinned to default theme — stable neutral chrome */}
      <ThemeProvider theme="default">
        <Sidebar />
      </ThemeProvider>
      {/* Stage: switches with the active theme — the themed canvas */}
      <ThemeProvider theme={theme}>
        <Stage />
      </ThemeProvider>
    </div>
  )
}

export function App() {
  return (
    <ThemeRoot>
      <Layout />
    </ThemeRoot>
  )
}
