import { useEffect } from "react";

import { createFileRoute } from "@tanstack/react-router";
import { CornerDownLeft, PenLine } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { ShineBorder } from "@/components/ui/shine-border";

export const Route = createFileRoute("/capture-note")({
  component: CaptureNote,
});

function CaptureNote() {
  useEffect(() => {
    document.body.classList.add("bg-transparent");

    return () => {
      document.body.classList.remove("bg-transparent");
    };
  }, []);

  // TODO focus on window open
  // TODO on blur of input close window - if content exists save it

  return (
    <div className="flex h-dvh items-center px-4 py-2">
      <div className="relative w-full rounded-[18px] shadow-xl">
        <ShineBorder
          borderWidth={2}
          className="z-50 rounded-[18px]"
          shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
        />

        <InputGroup
          className="border-2 has-[[data-slot=input-group-control]:focus-visible]:ring-0"
          size="spotlight"
        >
          <InputGroupAddon>
            <PenLine />
          </InputGroupAddon>

          <InputGroupInput placeholder="Capture Note" />

          <InputGroupAddon
            align="inline-end"
            className="mr-2 flex flex-col items-center pl-1"
          >
            <span className="text-xs">
              <Kbd>
                <CornerDownLeft className="text-[8px]" />
                Enter
              </Kbd>
            </span>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </div>
  );
}
