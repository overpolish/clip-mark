import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Book, EthernetPort, KeyRound, Plug } from "lucide-react";
import { cn } from "tailwind-variants";
import z from "zod";

import { Button } from "@/components/buttons/button/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/inputs/input-group";
import { Label } from "@/components/typography/label";

const commands = {
  GetServerDetails: "get_server_details",
  UpdateServerDetails: "update_server_details",
} as const;

const schema = z.object({
  address: z.string().min(1, "Address is required"),
  password: z.string().min(1, "Password is required"),
  port: z.coerce.number().min(1),
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

export function ObsWebsocketConfiguration({
  className,
}: ObsWebsocketConfigurationProps) {
  const { handleSubmit, register, reset } = useForm({
    defaultValues: {
      address: "localhost",
      password: "",
      port: 4455,
    },
    resolver: zodResolver(schema),
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
        className={cn("flex flex-col gap-4", className)}
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex flex-col gap-2">
          <div className="flex w-full flex-row items-end justify-between">
            <Label htmlFor="address">OBS Address</Label>
            <Button
              size="icon-xs"
              type="button"
              variant="outline"
              onClick={() => {
                // TODO link to specific header
                openUrl("https://github.com/domingasp/clip-mark");
              }}
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
              aria-label="Port"
              autoComplete="false"
              className="max-w-15 text-center"
              id="port"
              type="number"
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
