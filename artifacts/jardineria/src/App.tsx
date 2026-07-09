import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Tienda from "@/pages/tienda";
import Admin from "@/pages/admin/index";
import LandingPage from "@/pages/landing-page";
import { ThemeProvider } from "@/lib/site-settings";
import ElementInspectorProvider from "@/components/element-inspector-provider";

const queryClient = new QueryClient();

function Router() {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin");
  return (
    <>
      {!isAdmin && <ElementInspectorProvider />}
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/tienda" component={Tienda} />
        <Route path="/clientes/:slug" component={LandingPage} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
