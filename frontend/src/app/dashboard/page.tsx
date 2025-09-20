"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/dashboard/sidebar";
import { WalletCard } from "@/components/dashboard/wallet-card";
import Link from "next/link";
import { ethers } from "ethers";
import { contractAddress, contractABI } from "../../contractAddressandAbi";
import Image from "next/image";
import { RefreshCw } from "lucide-react";

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
  image: string;
  description: string;
  attendees: number;
  expectedAttendees: number;
  isPaid: boolean;
}

export default function DashboardPage() {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = async () => {
    try {
      if (!window.ethereum) {
        setLoading(false);
        return;
      }
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();
      const contract = new ethers.Contract(contractAddress, contractABI, provider);
      const allEvents: EventStruct[] = await contract.getAllEvents();
      const now = Math.floor(Date.now() / 1000);
      const upcoming: Event[] = [];
      const past: Event[] = [];

      allEvents.forEach((ev: EventStruct) => {
        if (ev.organizer.toLowerCase() === userAddress.toLowerCase()) {
          const startDate = new Date(Number(ev.startDate) * 1000);
          const bannerUrl = ev.bannerCID
            ? `https://ipfs.io/ipfs/${ev.bannerCID.replace('ipfs://', '')}`
            : "/placeholder.svg";
          
          const event: Event = {
            id: Number(ev.id),
            title: ev.title,
            date: startDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            time: startDate.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }),
            location: ev.location,
            image: bannerUrl,
            description: ev.description,
            attendees: Number(ev.userRegCount),
            expectedAttendees: Number(ev.expectedAttendees),
            isPaid: ev.isPaid,
          };
          
          if (Number(ev.endDate) > now) {
            upcoming.push(event);
          } else {
            past.push(event);
          }
        }
      });

      // Sort upcoming events by start date
      upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setUpcomingEvents(upcoming);
      setPastEvents(past);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Failed to fetch events:", error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
  };

  const EventCard = ({ event, isPast = false }: { event: Event; isPast?: boolean }) => (
    <Link href={`/event/${event.id}`} key={event.id}>
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="pt-6">
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
          <p className="text-muted-foreground mb-3 line-clamp-2">{event.description}</p>
          <div className="space-y-1 text-sm">
            <p className="font-medium">{event.date} at {event.time}</p>
            <p className="text-muted-foreground">{event.location}</p>
            <div className="flex justify-between items-center mt-2">
              <p className="text-muted-foreground">
                {event.attendees}/{event.expectedAttendees} attendees
              </p>
              <div className="flex items-center space-x-2">
                {event.isPaid && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                    Paid
                  </span>
                )}
                {isPast && (
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                    Ended
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-6">
        <WalletCard />
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Your Events</h1>
            <p className="text-muted-foreground">Manage your created events</p>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Events</CardTitle>
            <span className="text-sm text-muted-foreground">
              {upcomingEvents.length} event{upcomingEvents.length !== 1 ? 's' : ''}
            </span>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <p>Loading events...</p>
              </div>
            ) : upcomingEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No upcoming events</p>
                <Link href="/create">
                  <Button>Create Your First Event</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Past Events</CardTitle>
            <span className="text-sm text-muted-foreground">
              {pastEvents.length} event{pastEvents.length !== 1 ? 's' : ''}
            </span>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <p>Loading events...</p>
              </div>
            ) : pastEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} isPast />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No past events</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}