import { Toaster } from "sonner";
import Home from "./pages/Home";
import { BrowserRouter, Route, Routes } from "react-router";
import NotFound from "./pages/NotFound";
import SignInPage from "./pages/sign-in";
import SignUpPage from "./pages/sign-up";

function App() {
  return (
    <>
      <Toaster richColors />

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
