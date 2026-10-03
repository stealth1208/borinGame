import { hostMutation } from "@/lib/api/host-route";

export const POST = hostMutation((service) => service.startVoting);
