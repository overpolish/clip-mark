import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider
      defaultColorScheme="auto"
      theme={{
        activeClassName: "",
        defaultRadius: "md",
        components: {
          Button: {
            styles: () => ({
              root: {
                cursor: "default",
                transition:
                  "background-color 100ms ease-out, color 100ms ease-out, border-color 100ms ease-out",
              },
            }),
            defaultProps: {
              size: "xs",
            },
          },
        },
      }}
    >
      <App />
    </MantineProvider>
  </React.StrictMode>
);
