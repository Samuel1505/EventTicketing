"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sidebar } from "@/components/dashboard/sidebar";
import { WalletCard } from "@/components/dashboard/wallet-card";
import Link from "next/link";
import { ethers } from "ethers";
import { contractAddress, contractABI } from "../../contractAddressandAbi";
import Image from "next/image";

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
}

export default function DashboardPage() {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        if (!window.ethereum) return;
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
            };
            if (Number(ev.endDate) > now) {
              upcoming.push(event);
            } else {
              past.push(event);
            }
          }
        });

        setUpcomingEvents(upcoming);
        setPastEvents(past);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-6">
        <WalletCard />
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map((event) => (
                  <Link href={`/event/${event.id}`} key={event.id}>
                    <Card>
                      <CardContent className="pt-6">
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
                        <p>{event.date} at {event.time}</p>
                        <p>{event.location}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <p>No upcoming events</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Past Events</CardTitle>
          </CardHeader>
          <CardContent>
            {pastEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastEvents.map((event) => (
                  <Link href={`/event/${event.id}`} key={event.id}>
                    <Card>
                      <CardContent className="pt-6">
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
                        <p>{event.date} at {event.time}</p>
                        <p>{event.location}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <p>No past events</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}