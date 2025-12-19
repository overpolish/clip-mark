import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { listen } from "@tauri-apps/api/event";
import { CornerDownLeft, PenLine } from "lucide-react";
import z from "zod";

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

const events = {
  CaptureNoteWillShow: "window:capture_note_will_show",
} as const;

const schema = z.object({
  note: z.string(),
});

type Schema = z.infer<typeof schema>;

function CaptureNote() {
  const { handleSubmit, register, reset, setFocus } = useForm<Schema>({
    defaultValues: {
      note: "",
    },
    resolver: zodResolver(schema),
  });

  function onSubmit(data: Schema) {
    console.log("TODO submit note:", data);

    if (data.note.trim().length === 0) return;

    reset();
  }

  function resetSpotlight() {
    reset();
    closeWindow();
  }

  function closeWindow() {
    // TODO hide window rust side
    console.log("TODO close window");
  }

  useEffect(() => {
    document.body.classList.add("bg-transparent");

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        resetSpotlight();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.classList.remove("bg-transparent");
      document.removeEventListener("keydown", handleEscape);
    };
  }, [reset]);

  useEffect(() => {
    const unlisten = listen(events.CaptureNoteWillShow, () => {
      setFocus("note");
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, [reset, setFocus]);

  return (
    <div className="flex h-dvh items-center px-4 py-2">
      <div className="relative w-full rounded-[18px] shadow-md">
        <ShineBorder
          borderWidth={2}
          className="z-50 rounded-[18px]"
          shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
        />
        <form onSubmit={handleSubmit(onSubmit)}>
          <InputGroup
            className="border-2 has-[[data-slot=input-group-control]:focus-visible]:ring-0"
            size="spotlight"
          >
            <InputGroupAddon>
              <PenLine />
            </InputGroupAddon>

            <InputGroupInput
              {...register("note")}
              onBlur={resetSpotlight}
              placeholder="Capture Note"
            />

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
        </form>
      </div>
    </div>
  );
}
