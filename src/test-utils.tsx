import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) => {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllTheProviders, ...options }),
  };
};
