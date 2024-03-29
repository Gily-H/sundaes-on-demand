import { rest } from "msw";

import { render, screen, waitFor } from "../../../test-utils/testing-library-utils";
import userEvent from "@testing-library/user-event";
import { server } from "../../../mocks/server";
import OrderEntry from "../OrderEntry.js";

test("handles error for scoops and topping routes", async () => {
  // mock request failures that result in a status error 500
  // reset the mock server handlers to produce an error
  server.resetHandlers(
    rest.get("http://localhost:3030/scoops", (req, res, ctx) => {
      return res(ctx.status(500));
    }),
    rest.get("http://localhost:3030/toppings", (req, res, ctx) => {
      return res(ctx.status(500));
    })
  );

  // pass in mock function to satisfy Component props even if not used in test
  // jest.fn() is a mock function that does nothing
  render(<OrderEntry orderPhaseHandler={jest.fn()} />);

  // multiple server requests will not resolve simultaneously
  // without waitFor, function will return only the very first server response
  // asynchronous waitFor does not return until all server requests have completed
  await waitFor(async () => {
    // requests are still asynchronous even though they will send an error
    const errorAlerts = await screen.findAllByRole("alert", {
      // bootstrap alert (div) component message is not the default accessible name
      // will not be found unless manually adding an accessible name to the components
      name: "An unexpected error occurred. Please try again later.",
    });

    // should have an array of 2 alerts
    expect(errorAlerts).toHaveLength(2); // one for scoops and one for toppings
  });
});

test("order button disabled if no scoop option selected", async () => {
  render(<OrderEntry orderPhaseHandler={jest.fn()} />);

  // check if order button is disabled
  const orderButton = screen.getByRole("button", { name: /order sundae!/i });
  expect(orderButton).toBeDisabled();

  // add a scoop to the order
  const vanillaInput = await screen.findByRole("spinbutton", { name: "Vanilla" });
  userEvent.clear(vanillaInput);
  userEvent.type(vanillaInput, "1");

  // check if order button is enabled
  expect(orderButton).toBeEnabled();

  // remove selected scoop
  userEvent.clear(vanillaInput);
  userEvent.type(vanillaInput, "0");

  // check if order button is disabled
  expect(orderButton).toBeDisabled();
});
