```typescript
import { lazy } from 'solid-js';
import { RouteDefinition } from 'solid-app-router';

export interface ViewModule {
  path: string;
  component: () => Promise<{ default: any }>;
  name: string;
}

export interface ViewRegistration {
  registerViews: () => ViewModule[];
}

const defaultViews: ViewModule[] = [
  {
    path: '/',
    component: () => import('../../pages/Home'),
    name: 'Home',
  },
];

let pluginViews: ViewModule[] = [];

export const registerPluginViews = (views: ViewModule[]) => {
  pluginViews = views;
};

export const getRoutes = (): RouteDefinition[] => {
  const allViews = [...defaultViews, ...pluginViews];

  return allViews.map(view => ({
    path: view.path,
    component: lazy(view.component),
    // @ts-ignore
    name: view.name,
  }));
};
```