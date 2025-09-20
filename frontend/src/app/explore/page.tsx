"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sidebar } from "@/components/dashboard/sidebar";
import Link from "next/link";
import Image from "next/image";
import { ethers } from "ethers";
import { contractAddress, contractABI } from "../../contractAddressandAbi";

interface EventStruct {
  id: bigint;
  title: string;
  description: string;
  location: string;
  startDate: bigint;
  endDate: bigint;
  expectedAttendees: bigint;
  isPaid: boolean;
  organizer: string;
  userRegCount: bigint;
  verifiedAttendeesCount: bigint;
  revenueReleased: boolean;
  bannerCID: string;
}

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

const categories = ["All", "Conference", "Art", "Gaming", "Workshop", "Networking", "Fashion"];

// Helper function to determine category based on event title/description
const determineCategory = (title: string, description: string): string => {
  const text = (title + " " + description).toLowerCase();
  if (text.includes("conference") || text.includes("summit")) return "Conference";
  if (text.includes("art") || text.includes("nft") || text.includes("exhibition")) return "Art";
  if (text.includes("game") || text.includes("gaming") || text.includes("gamefi")) return "Gaming";
  if (text.includes("workshop") || text.includes("learn") || text.includes("tutorial")) return "Workshop";
  if (text.includes("network") || text.includes("meetup") || text.includes("pitch")) return "Networking";
  if (text.includes("fashion") || text.includes("metaverse")) return "Fashion";
  return "Conference"; // Default category
};

export default function ExplorePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceFilter, setPriceFilter] = useState("All");
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        if (!window.ethereum) {
          setLoading(false);
          return;
        }
        
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        const events: EventStruct[] = await contract.getAllEvents();
        
        const formattedEvents: Event[] = events.map((ev: EventStruct) => {
          const startDate = new Date(Number(ev.startDate) * 1000);
          const bannerUrl = ev.bannerCID
            ? `https://ipfs.io/ipfs/${ev.bannerCID.replace('ipfs://', '')}`
            : "/placeholder.svg";
          
          return {
            id: Number(ev.id),
            title: ev.title,
            date: startDate.toLocaleDateString("en-US", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            time: startDate.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }),
            location: ev.location,
            price: ev.isPaid ? "Paid" : "Free",
            category: determineCategory(ev.title, ev.description),
            organizer: `${ev.organizer.slice(0, 6)}...${ev.organizer.slice(-4)}`,
            image: bannerUrl,
            description: ev.description,
          };
        });

        setAllEvents(formattedEvents);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch events:", error);
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

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

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading events...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <Link href={`/event/${event.id}`} key={event.id}>
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex space-x-2 mb-2">
                        <Badge variant="secondary">{event.category}</Badge>
                        <Badge variant={event.price === "Free" ? "default" : "destructive"}>
                          {event.price}
                        </Badge>
                      </div>
                      <Image
                        src={event.image}
                        alt={event.title}
                        width={300}
                        height={200}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                      <h3 className="text-xl font-semibold mb-2 line-clamp-2">{event.title}</h3>
                      <p className="text-muted-foreground mb-3 line-clamp-3">{event.description}</p>
                      <div className="space-y-1 text-sm">
                        <p className="font-medium">{event.date} at {event.time}</p>
                        <p className="text-muted-foreground">{event.location}</p>
                        <p className="text-muted-foreground">by {event.organizer}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-lg font-medium">No events found</p>
                    <p className="text-muted-foreground">Try adjusting your search criteria or filters</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}