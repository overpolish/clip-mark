import {
  type ChangeEvent,
  useState,
  type ComponentProps,
  type FormEvent,
  useRef,
  useEffect,
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
  const widthRef = useRef(width);
  const heightRef = useRef(height);

  const [aspectRatio, setAspectRatio] = useState(width / height);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onApply(width, height);
  }

  function createDimensionSetter(dimension: "width" | "height") {
    return (setter: (val: number) => void) => (val: number) => {
      setter(val);

      if (maintainAspectRatio && aspectRatio > 0 && isFinite(aspectRatio)) {
        if (dimension === "width") {
          setHeight(Math.round(val / aspectRatio));
        } else {
          setWidth(Math.round(val * aspectRatio));
        }
      } else {
        // Update aspect ratio when unlocked
        if (dimension === "width") {
          setAspectRatio(val / heightRef.current);
        } else {
          setAspectRatio(widthRef.current / val);
        }
      }
    };
  }

  function formatAspectRatio(ratio: number): string {
    const maxDenominator = 100;
    let bestNumerator = 1;
    let bestDenominator = 1;
    let minError = Math.abs(ratio - 1);

    for (let denom = 1; denom <= maxDenominator; denom++) {
      const numer = Math.round(ratio * denom);
      const currentRatio = numer / denom;
      const error = Math.abs(currentRatio - ratio);

      if (error < minError) {
        minError = error;
        bestNumerator = numer;
        bestDenominator = denom;
      }

      if (error < 0.001) break;
    }

    return `${bestNumerator}:${bestDenominator}`;
  }

  useEffect(() => {
    widthRef.current = width;
    heightRef.current = height;
  }, [width, height]);

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
          onPressedChange={setMaintainAspectRatio}
          pressed={maintainAspectRatio}
          size="icon-sm"
          deselectedContent={
            <div className="flex flex-col items-center justify-center">
              <Unlink className="text-[9px]" />
              <span className="text-[9px] text-muted-foreground">
                {formatAspectRatio(aspectRatio)}
              </span>
            </div>
          }
          asToggle
        >
          <div className="flex flex-col items-center justify-center">
            <Link className="text-[9px]" />
            <span className="text-[9px] text-muted-foreground">
              {formatAspectRatio(aspectRatio)}
            </span>
          </div>
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
            <TooltipContent>Window may have own constraints</TooltipContent>
          </Tooltip>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
