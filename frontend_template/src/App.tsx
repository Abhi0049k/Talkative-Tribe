import { BrowserRouter } from "react-router-dom"
import Router from "./pages/Router"
import { ThemeProvider } from "./components/theme-provider"
import { RecoilRoot } from "recoil"

function App() {
  return (
    <RecoilRoot>
      <BrowserRouter>
        <ThemeProvider>
          <Router />
        </ThemeProvider>
      </BrowserRouter>
    </RecoilRoot>
  )
}

export default App
