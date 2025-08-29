import React from "react";
import { Route, Outlet } from "react-router-dom";

export const generateRoutes = (menu) => {
  return Object.values(menu).map((item) => {
    const Component = item.component || (() => <h2>{item.title}</h2>);

    if (item.children) {
      return (
        <Route
          key={item.path}
          path={item.path}
          element={
            <div>
              {/* <Component title={item.title} /> */}
              {/* 🔑 This allows children to render */}
              <Outlet />
            </div>
          }
        >
          {Object.values(item.children).map((child) => {
            const ChildComponent =
              child.component || (() => <h2>{child.title}</h2>);
            return (
              <Route
                key={`${item.path}/${child.path}`}
                path={child.path}
                element={<ChildComponent title={child.title} />}
              />
            );
          })}
        </Route>
      );
    }

    return (
      <Route
        key={item.path}
        path={item.path}
        element={<Component title={item.title} />}
      />
    );
  });
};
