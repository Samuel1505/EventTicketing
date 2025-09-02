"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sidebar } from "@/components/dashboard/sidebar"
import Link from "next/link"

// Mock data for all available events
const allEvents = [
  {
    id: 1,
    title: "Blockchain Conference 2024",
    date: "Dec 15, 2024",
    time: "10:00 AM",
    location: "San Francisco, CA",
    price: "Free",
    category: "Conference",
    organizer: "TechCorp",
    image: "/blockchain-conference.png",
    description: "Join industry leaders for the biggest blockchain conference of the year.",
  },
  {
    id: 2,
    title: "NFT Art Exhibition",
    date: "Dec 20, 2024",
    time: "6:00 PM",
    location: "New York, NY",
    price: "0.05 ETH",
    category: "Art",
    organizer: "ArtDAO",
    image: "/nft-art-exhibition.png",
    description: "Discover the latest NFT artworks from emerging and established artists.",
  },
  {
    id: 3,
    title: "Web3 Gaming Summit",
    date: "Jan 5, 2025",
    time: "9:00 AM",
    location: "Austin, TX",
    price: "0.1 ETH",
    category: "Gaming",
    organizer: "GameFi Labs",
    image: "/web3-gaming.png",
    description: "Explore the future of gaming with blockchain technology.",
  },
  {
    id: 4,
    title: "DeFi Workshop",
    date: "Jan 10, 2025",
    time: "2:00 PM",
    location: "Miami, FL",
    price: "0.02 ETH",
    category: "Workshop",
    organizer: "DeFi Academy",
    image: "/defi-workshop.png",
    description: "Learn the fundamentals of decentralized finance.",
  },
  {
    id: 5,
    title: "Crypto Startup Pitch Day",
    date: "Jan 15, 2025",
    time: "11:00 AM",
    location: "Los Angeles, CA",
    price: "Free",
    category: "Networking",
    organizer: "Crypto Ventures",
    image: "/crypto-pitch.png",
    description: "Watch innovative crypto startups pitch their ideas to investors.",
  },
  {
    id: 6,
    title: "Metaverse Fashion Show",
    date: "Jan 20, 2025",
    time: "7:00 PM",
    location: "Virtual Event",
    price: "0.03 ETH",
    category: "Fashion",
    organizer: "MetaFashion",
    image: "/metaverse-fashion.png",
    description: "Experience fashion in the metaverse with exclusive NFT wearables.",
  },
]

const categories = ["All", "Conference", "Art", "Gaming", "Workshop", "Networking", "Fashion"]

export default function ExplorePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [priceFilter, setPriceFilter] = useState("All")

  const filteredEvents = allEvents.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.organizer.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === "All" || event.category === selectedCategory

    const matchesPrice =
      priceFilter === "All" ||
      (priceFilter === "Free" && event.price === "Free") ||
      (priceFilter === "Paid" && event.price !== "Free")

    return matchesSearch && matchesCategory && matchesPrice
  })

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Explore Events</h1>
          <p className="text-muted-foreground">Discover amazing events powered by blockchain technology</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search events, locations, or organizers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priceFilter} onValueChange={setPriceFilter}>
            <SelectTrigger className="w-full md:w-32">
              <SelectValue placeholder="Price" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Free">Free</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Link key={event.id} href={`/event/${event.id}`}>
                <Card className="cursor-pointer hover:shadow-lg transition-shadow group">
                  <CardHeader className="p-0">
                    <img
                      src={event.image || "/placeholder.svg"}
                      alt={event.title}
                      className="w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform"
                    />
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary" className="mb-2">
                        {event.category}
                      </Badge>
                      <Badge variant={event.price === "Free" ? "default" : "outline"}>{event.price}</Badge>
                    </div>
                    <CardTitle className="text-lg mb-2 line-clamp-2">{event.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{event.description}</p>
                    <div className="space-y-1 text-sm text-muted-foreground mb-3">
                      <p className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2"
                          />
                        </svg>
                        {event.date} at {event.time}
                      </p>
                      <p className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        {event.location}
                      </p>
                      <p className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        by {event.organizer}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="text-lg font-semibold mb-2">No events found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria or filters</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
