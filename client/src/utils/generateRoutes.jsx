import React from "react";
import { Route } from "react-router-dom";

export const generateRoutes = (menu) => {
  return Object.values(menu).map((item) => {
    const Component = item.component || (() => <h2>{item.title}</h2>); // Fallback to Placeholder if no component

    // If has children → create a parent route with nested children
    if (item.children) {
      return (
        <Route key={item.path} path={item.path} element={<Component title={item.title} />}>
          {Object.values(item.children).map((child) => {
            const ChildComponent = child.component || (() => <h2>{child.title}</h2>);
            // Child path is relative to parent, no need to strip parent path
            return (
              <Route
                key={`${item.path}/${child.path}`}
                path={child.path} // Use relative path for nesting
                element={<ChildComponent title={child.title} />}
              />
            );
          })}
        </Route>
      );
    }

    // If no children → direct route
    return (
      <Route
        key={item.path}
        path={item.path}
        element={<Component title={item.title} />}
      />
    );
  });
};