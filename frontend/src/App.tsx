import React from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { useAuth } from "./lib/auth";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Attacks from "./pages/attacks";
import Settings from "./pages/settings";
import FakeDashboard from "./pages/fake-dashboard";
import NotFound from "./pages/not-found";
import { LiveProvider } from "./lib/live-context";

function ProtectedRoute({ component: Component, path }: { component: React.ComponentType; path: string }) {
  const { token, isDeception } = useAuth();
  if (!token) return <Redirect to="/" />;
  if (isDeception && path !== "/fake-dashboard") return <Redirect to="/fake-dashboard" />;
  if (!isDeception && path === "/fake-dashboard") return <Redirect to="/dashboard" />;
  return <Component />;
}

function Router() {
  const { token, isDeception } = useAuth();
  return (
    <Switch>
      <Route path="/">
        {token ? (isDeception ? <Redirect to="/fake-dashboard" /> : <Redirect to="/dashboard" />) : <Login />}
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute path="/dashboard" component={() => <AppLayout><Dashboard /></AppLayout>} />
      </Route>
      <Route path="/attacks">
        <ProtectedRoute path="/attacks" component={() => <AppLayout><Attacks /></AppLayout>} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute path="/settings" component={() => <AppLayout><Settings /></AppLayout>} />
      </Route>
      <Route path="/fake-dashboard">
        <ProtectedRoute path="/fake-dashboard" component={FakeDashboard} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <WouterRouter>
      <LiveProvider><Router /></LiveProvider>
    </WouterRouter>
  );
}