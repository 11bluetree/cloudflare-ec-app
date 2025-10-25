import { createFileRoute } from '@tanstack/react-router'
import { Container, Typography, Box } from '@mui/material'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to EC App
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          TanStack Router SPA with Material-UI
        </Typography>
      </Box>
    </Container>
  )
}
