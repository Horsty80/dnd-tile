import App, { TILE_SIZE } from "./App";
import { describe, it, expect } from "vitest";
import { customRender } from "./test-utils";
import { screen } from "@testing-library/dom";

describe("App Component", () => {
    it("renders without crashing", () => {
        customRender(<App />);
        expect(screen.getByRole("grid")).toBeInTheDocument();
    });

    it("adds a new tile on click",async () => {
        const {user} = customRender(<App />);
        const grid = screen.getByRole("grid");
        await user.click(grid);
        expect(screen.getAllByText(/x:/)).toHaveLength(1);
    });

    it("does not add a tile on occupied position",async () => {
        const {user} = customRender(<App />);
        const grid = screen.getByRole("grid");
        await user.click(grid); // Add first tile
        await user.click(grid); // Try to add second tile at the same position
        expect(screen.getAllByText(/x:/)).toHaveLength(1);
    });

    it("enlarges a tile horizontally", async () => {
        const {user} = customRender(<App />);
        const grid = screen.getByRole("grid");
        await user.click(grid); // Add a tile
        const enlargeButton = screen.getByText("Enlarge Horizontally");
        await user.click(enlargeButton);
        const tile = screen.getByText(/x:/).parentElement?.parentElement;
        expect(tile).toHaveStyle(`width: ${4 * TILE_SIZE}px`);
    });

    it("enlarges a tile vertically", async () => {
        const {user} = customRender(<App />);
        const grid = screen.getByRole("grid");
        await user.click(grid); // Add a tile
        const enlargeButton = screen.getByText("Enlarge Vertically");
        await user.click(enlargeButton);
        const tile = screen.getByText(/x:/).parentElement?.parentElement;
        expect(tile).toHaveStyle(`height: ${3 * TILE_SIZE}px`);
    });

    it("resets a tile size",async () => {
        const {user} = customRender(<App />);
        const grid = screen.getByRole("grid");
        await user.click(grid); // Add a tile
        const enlargeButton = screen.getByText("Enlarge Both");
        await user.click(enlargeButton);
        const resetButton = screen.getByText("Reset Size");
        await user.click(resetButton);
        const tile = screen.getByText(/x:/).parentElement?.parentElement;
        expect(tile).toHaveStyle(`width: ${TILE_SIZE}px`);
        expect(tile).toHaveStyle(`height: ${TILE_SIZE}px`);
    });
});