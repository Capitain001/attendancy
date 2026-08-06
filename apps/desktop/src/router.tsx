import {
  createRouter,
  createRootRoute,
  createRoute,
  redirect,
  Outlet,
} from '@tanstack/react-router'
import { BottomTabs } from './components/BottomTabs'
import { PlanningScreen } from './screens/PlanningScreen'
import { SessionScreen } from './screens/SessionScreen'

const rootRoute = createRootRoute({
  component: () => (
    <>
      <div className="overflow-auto pb-16">
        <Outlet />
      </div>
      <BottomTabs />
    </>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => { throw redirect({ to: '/planning' }) },
})

const planningRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/planning',
  component: PlanningScreen,
})

const sessionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/session',
  component: SessionScreen,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  planningRoute,
  sessionRoute,
])

export const router = createRouter({ routeTree, defaultPreload: 'intent' })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
