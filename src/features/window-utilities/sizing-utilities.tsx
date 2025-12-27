import {
  type ChangeEvent,
  useState,
  type ComponentProps,
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
        id={label.toLowerCase()}
        min={0}
        onKeyDown={handleKeyDown}
        step={1}
        // Number input was keeping leading zeroes
        type="text"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const value = e.target.value;
          if (value === "") return onChange(0);
          onChange(Math.max(0, parseInt(value, 10)));
        }}
        {...props}
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

export function SizingUtilities() {
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);

  function onApply() {
    console.log({ height, width });
  }

  useEffect(() => {
    console.log(width);
  }, [width]);

  return (
    <InputGroup>
      <InputGroupAddon>
        <InputGroupText>Size</InputGroupText>
      </InputGroupAddon>
      <SizeInput label="Width" onChange={setWidth} value={width} />
      <InputGroupButton
        deselectedContent={<Unlink className="text-[10px]" />}
        size="icon-sm"
        asToggle
      >
        <Link className="text-[10px]" />
      </InputGroupButton>
      <SizeInput label="Height" onChange={setHeight} value={height} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton onClick={onApply} size="icon-sm">
          <Wand2 />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
