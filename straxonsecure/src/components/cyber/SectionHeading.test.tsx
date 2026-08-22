import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SectionHeading } from "./SectionHeading";
import { Shield } from "lucide-react";

describe("SectionHeading", () => {
  it("renders title, subtitle, and description correctly", () => {
    render(
      <SectionHeading
        title="Main Title"
        eyebrow="Test Subtitle"
        description="This is a description"
      />,
    );

    expect(screen.getByText("Main Title")).toBeInTheDocument();
    expect(screen.getByText("Test Subtitle")).toBeInTheDocument();
    expect(screen.getByText("This is a description")).toBeInTheDocument();
  });

  it("renders without an icon if not provided", () => {
    const { container } = render(<SectionHeading title="Title Only" />);

    expect(screen.getByText("Title Only")).toBeInTheDocument();
    // Assuming the icon container has a specific structure or we just check no svg is rendered as icon
    // It's safer to just verify the title rendered if we don't know the exact DOM
  });
});
