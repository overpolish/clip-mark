import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";

import { Book, EthernetPort, KeyRound, Plug } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

const commands = {
  GetServerDetails: "get_server_details",
  UpdateServerDetails: "update_server_details",
} as const;

const schema = z.object({
  address: z.string().min(1, "Address is required"),
  port: z.coerce.number().min(1),
  password: z.string().min(1, "Password is required"),
});

type Schema = z.infer<typeof schema>;

async function getServerDetails(): Promise<Schema> {
  const details = await invoke(commands.GetServerDetails);
  return schema.parse(details);
}

async function updateServerDetails(data: Schema) {
  invoke(commands.UpdateServerDetails, data);
}

type ObsWebsocketConfigurationProps = {
  className?: string;
};

function ObsWebsocketConfiguration({
  className,
}: ObsWebsocketConfigurationProps) {
  const { register, handleSubmit, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      address: "localhost",
      port: 4455,
      password: "",
    },
  });

  function onSubmit(data: Schema) {
    updateServerDetails(data);
  }

  useEffect(() => {
    getServerDetails().then((details) => {
      reset(details);
    });
  }, []);

  return (
    <div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={cn("flex flex-col gap-4", className)}
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-row items-end w-full justify-between">
            <Label htmlFor="address">OBS Address</Label>
            <Button
              size="icon-xs"
              variant="outline"
              onClick={() => {
                // TODO link to specific header
                openUrl("https://github.com/domingasp/clip-mark");
              }}
              type="button"
            >
              <Book />
            </Button>
          </div>

          <InputGroup>
            <InputGroupAddon>
              <EthernetPort />
            </InputGroupAddon>
            <InputGroupInput
              autoComplete="off"
              {...register("address")}
              id="address"
            />
            <p>:</p>
            <InputGroupInput
              {...register("port")}
              id="port"
              type="number"
              className="max-w-15 text-center"
              aria-label="Port"
              autoComplete="false"
            />
          </InputGroup>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Server Password</Label>
          <InputGroup>
            <InputGroupAddon>
              <KeyRound />
            </InputGroupAddon>

            <InputGroupInput
              {...register("password")}
              id="password"
              type="password"
            />
          </InputGroup>
        </div>

        <Button type="submit" grow>
          <Plug />
          Connect
        </Button>
      </form>
    </div>
  );
}

export default ObsWebsocketConfiguration;
