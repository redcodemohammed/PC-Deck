import { Redirect } from "expo-router"

import { useConnectionStore } from "@/stores/connectionStore"

export default function Index() {
  const activeDeviceId = useConnectionStore((s) => s.activeDeviceId)
  return <Redirect href={activeDeviceId ? "/deck" : "/connect"} />
}
