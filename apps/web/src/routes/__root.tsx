import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'

const theme = createTheme({
  palette: {
    mode: 'light',
  },
})

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Outlet />
      <TanStackRouterDevtools />
    </ThemeProvider>
  ),
})
