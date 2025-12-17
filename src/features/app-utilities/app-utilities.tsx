import Combobox from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

type AppUtilitiesProps = {
  className?: string;
};

const windows = [
  {
    label: "VS Code",
    value: "vs-code",
  },
  {
    label: "Google Chrome asdasd asdsad",
    value: "google-chrome",
  },
  {
    label: "OBS Studio",
    value: "obs-studio",
  },
];

function AppUtilities({ className }: AppUtilitiesProps) {
  return (
    <div className={cn("grid grid-cols-2", className)}>
      <div>
        <Combobox
          data={windows}
          emptyMessage="No Windows found."
          placeholder="Select a Window"
          searchPlaceholder="Search Windows..."
        />
      </div>
    </div>
  );
}

export default AppUtilities;
