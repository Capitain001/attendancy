import { getChannelsAction } from "@/services/channel"

export default async function page() {
    const channels = await getChannelsAction()
  return (
    <div>
            <pre>{JSON.stringify(channels, null,2)}</pre>
    </div>
  )
}

