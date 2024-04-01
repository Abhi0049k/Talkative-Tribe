import { BrowserRouter } from "react-router-dom"
import Router from "./pages/Router"
import { ThemeProvider } from "./components/theme-provider"

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Router />
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
