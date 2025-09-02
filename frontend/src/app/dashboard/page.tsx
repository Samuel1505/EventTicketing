import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/dashboard/sidebar"
import { WalletCard } from "@/components/dashboard/wallet-card"
import Link from "next/link"

// Mock data for demonstration
const upcomingEvents = [
  {
    id: 1,
    title: "Blockchain Conference 2024",
    date: "Dec 15, 2024",
    time: "10:00 AM",
    location: "San Francisco, CA",
    ticketType: "VIP",
    image: "/blockchain-conference.png",
  },
  {
    id: 2,
    title: "NFT Art Exhibition",
    date: "Dec 20, 2024",
    time: "6:00 PM",
    location: "New York, NY",
    ticketType: "Regular",
    image: "/nft-art-exhibition.png",
  },
]

const pastEvents = [
  {
    id: 3,
    title: "Web3 Summit",
    date: "Nov 10, 2024",
    time: "9:00 AM",
    location: "Austin, TX",
    ticketType: "Regular",
    image: "/web3-summit.png",
  },
  {
    id: 4,
    title: "DeFi Workshop",
    date: "Oct 25, 2024",
    time: "2:00 PM",
    location: "Miami, FL",
    ticketType: "VIP",
    image: "/defi-workshop.png",
  },
]

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-6">
        {/* Wallet Card */}
        <WalletCard />

        {/* Upcoming Events */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
          {upcomingEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.map((event) => (
                <Link key={event.id} href={`/event/${event.id}`}>
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader className="p-0">
                      <img
                        src={event.image || "/placeholder.svg"}
                        alt={event.title}
                        className="w-full h-32 object-cover rounded-t-lg"
                      />
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <Badge variant={event.ticketType === "VIP" ? "default" : "secondary"}>{event.ticketType}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {event.date} at {event.time}
                      </p>
                      <p className="text-sm text-muted-foreground">{event.location}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No upcoming events</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Past Events */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Past Events</h2>
          {pastEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastEvents.map((event) => (
                <Link key={event.id} href={`/event/${event.id}`}>
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow opacity-75">
                    <CardHeader className="p-0">
                      <img
                        src={event.image || "/placeholder.svg"}
                        alt={event.title}
                        className="w-full h-32 object-cover rounded-t-lg"
                      />
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <Badge variant="outline">{event.ticketType}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {event.date} at {event.time}
                      </p>
                      <p className="text-sm text-muted-foreground">{event.location}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No past events</p>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  )
}
