import {
  type ChangeEvent,
  useState,
  type ComponentProps,
  type FormEvent,
  useEffect,
  useRef,
} from "react";

import { Link, Unlink, Wand2 } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/inputs/input-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/overlays/tooltip";
import { Label } from "@/components/typography/label";

type SizeInputProps = Omit<
  ComponentProps<typeof InputGroupInput>,
  "onChange"
> & {
  label: string;
  onChange: (value: number) => void;
};

function SizeInput({ label, onChange, ...props }: SizeInputProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ([".", ",", "-", "e"].includes(e.key)) {
      e.preventDefault();
    }
  }

  return (
    <div className="group relative">
      <InputGroupInput
        autoComplete="off"
        id={label.toLowerCase()}
        min={0}
        onKeyDown={handleKeyDown}
        step={1}
        // Number input was keeping leading zeroes
        type="text"
        {...props}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const value = e.target.value;
          if (value === "") return onChange(0);
          onChange(Math.max(0, parseInt(value, 10)));
        }}
      />
      <Label
        htmlFor={label.toLowerCase()}
        className={`
          absolute -bottom-5 left-3.5 text-[10px] text-muted-foreground
          transition-colors
          group-focus-within:text-primary
        `}
      >
        {label}
      </Label>
    </div>
  );
}

type SizingUtilitiesProps = {
  onApply: (width: number, height: number) => void;
};

export function SizingUtilities({ onApply }: SizingUtilitiesProps) {
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(false);
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);

  const [lastChanged, setLastChanged] = useState<"width" | "height">("width");
  const aspectRatioRef = useRef(width / height);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onApply(width, height);
  }

  function createDimensionSetter(dimension: "width" | "height") {
    return (setter: (val: number) => void) => (val: number) => {
      setLastChanged(dimension);
      setter(val);
    };
  }

  useEffect(() => {
    if (maintainAspectRatio && height !== 0) {
      aspectRatioRef.current = width / height;
    }
  }, [maintainAspectRatio]);

  useEffect(() => {
    if (!maintainAspectRatio) return;
    if (aspectRatioRef.current === 0 || !isFinite(aspectRatioRef.current))
      return;

    if (lastChanged === "width") {
      setHeight(Math.round(width / aspectRatioRef.current));
    } else {
      setWidth(Math.round(height * aspectRatioRef.current));
    }
  }, [width, height, lastChanged, maintainAspectRatio]);

  return (
    <form onSubmit={handleSubmit}>
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>Size</InputGroupText>
        </InputGroupAddon>
        <SizeInput
          label="Width"
          onChange={createDimensionSetter("width")(setWidth)}
          value={width}
        />
        <InputGroupButton
          deselectedContent={<Unlink className="text-[10px]" />}
          onPressedChange={setMaintainAspectRatio}
          pressed={maintainAspectRatio}
          size="icon-sm"
          asToggle
        >
          <Link className="text-[10px]" />
        </InputGroupButton>
        <SizeInput
          label="Height"
          onChange={createDimensionSetter("height")(setHeight)}
          value={height}
        />
        <InputGroupAddon align="inline-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <InputGroupButton size="icon-sm" type="submit">
                <Wand2 />
              </InputGroupButton>
            </TooltipTrigger>
            <TooltipContent>Windows may have own constraints</TooltipContent>
          </Tooltip>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
