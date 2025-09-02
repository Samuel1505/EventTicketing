"use client"

import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/dashboard/sidebar"
import { useState } from "react"

// Mock event data - in real app this would come from API
const eventData = {
  1: {
    id: 1,
    title: "Blockchain Conference 2024",
    date: "Dec 15, 2024",
    time: "10:00 AM",
    endDate: "Dec 15, 2024",
    endTime: "6:00 PM",
    location: "San Francisco, CA",
    venue: "Moscone Center",
    ticketType: "VIP",
    price: "Free",
    category: "Conference",
    organizer: "TechCorp",
    image: "/blockchain-conference.png",
    description:
      "Join industry leaders for the biggest blockchain conference of the year. Learn about the latest developments in DeFi, NFTs, and Web3 technologies.",
    fullDescription:
      "This comprehensive blockchain conference brings together thought leaders, developers, and entrepreneurs from around the world. Featuring keynote speakers from major blockchain companies, hands-on workshops, and networking opportunities. Topics include DeFi protocols, NFT marketplaces, smart contract development, and the future of decentralized applications.",
    speakers: ["Vitalik Buterin", "Changpeng Zhao", "Brian Armstrong"],
    agenda: [
      { time: "10:00 AM", title: "Opening Keynote", speaker: "Vitalik Buterin" },
      { time: "11:30 AM", title: "DeFi Revolution", speaker: "Changpeng Zhao" },
      { time: "1:00 PM", title: "Lunch Break", speaker: "" },
      { time: "2:30 PM", title: "NFT Marketplaces", speaker: "Brian Armstrong" },
      { time: "4:00 PM", title: "Panel Discussion", speaker: "All Speakers" },
    ],
    totalTickets: 500,
    availableTickets: 150,
  },
  2: {
    id: 2,
    title: "NFT Art Exhibition",
    date: "Dec 20, 2024",
    time: "6:00 PM",
    endDate: "Dec 22, 2024",
    endTime: "10:00 PM",
    location: "New York, NY",
    venue: "Metropolitan Art Gallery",
    ticketType: "Regular",
    price: "0.05 ETH",
    category: "Art",
    organizer: "ArtDAO",
    image: "/nft-art-exhibition.png",
    description: "Discover the latest NFT artworks from emerging and established artists.",
    fullDescription:
      "An immersive NFT art exhibition showcasing digital masterpieces from renowned artists worldwide. Experience art in the metaverse with exclusive NFT drops, artist meet-and-greets, and interactive installations.",
    speakers: ["Pak", "Beeple", "XCOPY"],
    agenda: [
      { time: "6:00 PM", title: "Gallery Opening", speaker: "" },
      { time: "7:00 PM", title: "Artist Talk: Pak", speaker: "Pak" },
      { time: "8:00 PM", title: "NFT Drop Event", speaker: "" },
      { time: "9:00 PM", title: "Networking Reception", speaker: "" },
    ],
    totalTickets: 200,
    availableTickets: 45,
  },
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [ticketQuantity, setTicketQuantity] = useState(1)

  const eventId = params.id as string
  const event = eventData[eventId as unknown as keyof typeof eventData]

  if (!event) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Event Not Found</h1>
            <p className="text-muted-foreground mb-4">The event you're looking for doesn't exist.</p>
            <Button onClick={() => router.push("/explore")}>Back to Events</Button>
          </div>
        </main>
      </div>
    )
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const handleTicketPurchase = () => {
    // In real app, this would integrate with blockchain for NFT minting
    alert(`Purchasing ${ticketQuantity} ticket(s) for ${event.title}`)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Button>

          {/* Event Header */}
          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2">
              <img
                src={event.image || "/placeholder.svg"}
                alt={event.title}
                className="w-full h-64 object-cover rounded-lg mb-6"
              />

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary">{event.category}</Badge>
                <Badge variant={event.price === "Free" ? "default" : "outline"}>{event.price}</Badge>
              </div>

              <h1 className="text-4xl font-bold mb-4 text-balance">{event.title}</h1>
              <p className="text-lg text-muted-foreground mb-6">{event.description}</p>

              {/* Event Details */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Event Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2"
                        />
                      </svg>
                      <div>
                        <p className="font-medium">{formatDate(event.date)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatTime(event.time)} - {formatTime(event.endTime)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <div>
                        <p className="font-medium">{event.venue}</p>
                        <p className="text-sm text-muted-foreground">{event.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <p className="font-medium">Organized by {event.organizer}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ticket Availability</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Available</span>
                          <span>
                            {event.availableTickets} / {event.totalTickets}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${(event.availableTickets / event.totalTickets) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {event.availableTickets > 0 ? `${event.availableTickets} tickets remaining` : "Sold out"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Full Description */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>About This Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{event.fullDescription}</p>
                </CardContent>
              </Card>

              {/* Speakers */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Featured Speakers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {event.speakers.map((speaker, index) => (
                      <Badge key={index} variant="outline">
                        {speaker}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Agenda */}
              <Card>
                <CardHeader>
                  <CardTitle>Event Agenda</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {event.agenda.map((item, index) => (
                      <div key={index} className="flex gap-4 pb-4 border-b border-border last:border-b-0">
                        <div className="text-sm font-medium text-primary min-w-20">{item.time}</div>
                        <div className="flex-1">
                          <p className="font-medium">{item.title}</p>
                          {item.speaker && <p className="text-sm text-muted-foreground">{item.speaker}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ticket Purchase Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Get Your Ticket</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold">{event.price}</p>
                    <p className="text-sm text-muted-foreground">per ticket</p>
                  </div>

                  {event.availableTickets > 0 ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Quantity</label>
                        <select
                          value={ticketQuantity}
                          onChange={(e) => setTicketQuantity(Number(e.target.value))}
                          className="w-full p-2 border border-border rounded-md"
                        >
                          {[...Array(Math.min(5, event.availableTickets))].map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {i + 1}
                            </option>
                          ))}
                        </select>
                      </div>

                      <Button onClick={handleTicketPurchase} className="w-full" size="lg">
                        {event.price === "Free" ? "Get Free Ticket" : `Buy Ticket${ticketQuantity > 1 ? "s" : ""}`}
                      </Button>

                      <p className="text-xs text-muted-foreground text-center">
                        Tickets are minted as NFTs on the blockchain
                      </p>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground mb-2">This event is sold out</p>
                      <Button variant="outline" disabled className="w-full bg-transparent">
                        Sold Out
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
