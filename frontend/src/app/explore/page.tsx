
"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sidebar } from "@/components/dashboard/sidebar";
import Link from "next/link";
import Image from "next/image";

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  price: string;
  category: string;
  organizer: string;
  image: string;
  description: string;
}

// Mock data for all available events
const allEvents: Event[] = [
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
];

const categories = ["All", "Conference", "Art", "Gaming", "Workshop", "Networking", "Fashion"];

export default function ExplorePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceFilter, setPriceFilter] = useState("All");

  const filteredEvents = allEvents.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.organizer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || event.category === selectedCategory;
    const matchesPrice =
      priceFilter === "All" ||
      (priceFilter === "Free" && event.price === "Free") ||
      (priceFilter === "Paid" && event.price !== "Free");
    return matchesSearch && matchesCategory && matchesPrice;
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">Explore Events</h1>
        <p className="text-muted-foreground mb-6">Discover amazing events powered by blockchain technology</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
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
            <SelectTrigger>
              <SelectValue placeholder="Price" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Free">Free</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <Link href={`/event/${event.id}`} key={event.id}>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex space-x-2 mb-2">
                      <Badge>{event.category}</Badge>
                      <Badge>{event.price}</Badge>
                    </div>
                    <Image
                      src={event.image}
                      alt={event.title}
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover rounded-t-lg"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                    <h3 className="text-xl font-semibold mt-4">{event.title}</h3>
                    <p className="text-muted-foreground">{event.description}</p>
                    <p>{event.date} at {event.time}</p>
                    <p>{event.location}</p>
                    <p>by {event.organizer}</p>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p>No events found</p>
                <p className="text-muted-foreground">Try adjusting your search criteria or filters</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}