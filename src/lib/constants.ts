export const commands = {
  GetServerDetails: "get_server_details",
  UpdateServerDetails: "update_server_details",
  GetServerConnectionStatus: "get_server_connection_status",
} as const;

// TODO colocate with features rather than global
export const events = {
  ConnectionStatus: "connection_status",
} as const;
