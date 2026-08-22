import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CyberCard } from "./CyberCard";

describe("CyberCard", () => {
  it("renders children correctly", () => {
    render(
      <CyberCard>
        <div data-testid="child-element">Test Content</div>
      </CyberCard>,
    );

    expect(screen.getByTestId("child-element")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("applies the magenta variant classes", () => {
    const { container } = render(<CyberCard variant="magenta">Content</CyberCard>);

    // Check if the magenta border class is applied
    expect(container.firstChild).toHaveClass("border-fuchsia-500/30");
    // Verify it doesn't have the teal class
    expect(container.firstChild).not.toHaveClass("border-teal-500/30");
  });

  it("applies the cyan variant classes by default", () => {
    const { container } = render(<CyberCard>Content</CyberCard>);

    expect(container.firstChild).toHaveClass("border-cyan-500/30");
  });
});
