"use client";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/dashboard/sidebar";
import { useState } from "react";
import Image from "next/image";

interface AgendaItem {
  time: string;
  title: string;
  speaker: string;
}

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  endDate: string;
  endTime: string;
  location: string;
  venue: string;
  ticketType: string;
  price: string;
  category: string;
  organizer: string;
  image: string;
  description: string;
  fullDescription: string;
  speakers: string[];
  agenda: AgendaItem[];
  totalTickets: number;
  availableTickets: number;
}

// Mock event data - in real app this would come from API
const eventData: { [key: string]: Event } = {
  "1": {
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
    description: "Join industry leaders for the biggest blockchain conference of the year. Learn about the latest developments in DeFi, NFTs, and Web3 technologies.",
    fullDescription: "This comprehensive blockchain conference brings together thought leaders, developers, and entrepreneurs from around the world. Featuring keynote speakers from major blockchain companies, hands-on workshops, and networking opportunities. Topics include DeFi protocols, NFT marketplaces, smart contract development, and the future of decentralized applications.",
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
  "2": {
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
    fullDescription: "An immersive NFT art exhibition showcasing digital masterpieces from renowned artists worldwide. Experience art in the metaverse with exclusive NFT drops, artist meet-and-greets, and interactive installations.",
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
};

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const eventId = params.id as string;
  const event = eventData[eventId];

  if (!event) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 p-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p>The event you&apos;re looking for doesn&apos;t exist.</p>
              <Button onClick={() => router.push("/explore")} className="mt-4">
                Back to Events
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time: string): string => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleTicketPurchase = () => {
    alert(`Purchasing ${ticketQuantity} ticket${ticketQuantity > 1 ? "s" : ""} for ${event.title}`);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-6">
        <Button onClick={() => router.back()} className="mb-4">Back</Button>
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Badge>{event.category}</Badge>
                <Badge>{event.price}</Badge>
              </div>
            </div>
            <CardTitle>{event.title}</CardTitle>
            <p className="text-muted-foreground">{event.description}</p>
          </CardHeader>
          <CardContent>
            <Image
              src={event.image}
              alt={event.title}
              width={1200}
              height={300}
              className="w-full h-48 object-cover rounded-t-lg"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Event Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{formatDate(event.date)}</p>
              <p>{formatTime(event.time)} - {formatTime(event.endTime)}</p>
              <p>{event.venue}</p>
              <p>{event.location}</p>
              <p>Organized by {event.organizer}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ticket Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Available {event.availableTickets} / {event.totalTickets}</p>
              <p>{event.availableTickets > 0 ? `${event.availableTickets} tickets remaining` : "Sold out"}</p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>About This Event</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{event.fullDescription}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Featured Speakers</CardTitle>
            </CardHeader>
            <CardContent>
              {event.speakers.map((speaker, index) => (
                <p key={index}>{speaker}</p>
              ))}
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Event Agenda</CardTitle>
            </CardHeader>
            <CardContent>
              {event.agenda.map((item, index) => (
                <div key={index} className="flex space-x-4 mb-2">
                  <p>{item.time}</p>
                  <p>{item.title}</p>
                  {item.speaker && <p>{item.speaker}</p>}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Get Your Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{event.price}</p>
              <p>per ticket</p>
              {event.availableTickets > 0 ? (
                <>
                  <label htmlFor="ticketQuantity" className="block mt-4">Quantity</label>
                  <select
                    id="ticketQuantity"
                    value={ticketQuantity}
                    onChange={(e) => setTicketQuantity(Number(e.target.value))}
                    className="w-full p-2 border border-border rounded-md"
                  >
                    {[...Array(Math.min(5, event.availableTickets))].map((_, i) => (
                      <option key={i} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                  <Button onClick={handleTicketPurchase} className="w-full mt-4">
                    {event.price === "Free" ? "Get Free Ticket" : `Buy Ticket${ticketQuantity > 1 ? "s" : ""}`}
                  </Button>
                  <p className="text-muted-foreground mt-2">Tickets are minted as NFTs on the blockchain</p>
                </>
              ) : (
                <>
                  <p className="text-red-500">This event is sold out</p>
                  <Button disabled className="w-full mt-4">Sold Out</Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}