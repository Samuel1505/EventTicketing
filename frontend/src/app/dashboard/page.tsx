"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sidebar } from "@/components/dashboard/sidebar"
import { WalletCard } from "@/components/dashboard/wallet-card"
import Link from "next/link"
import { ethers } from "ethers"
import {contractAddress, contractABI } from "../../contractAddressandAbi"

interface EventStruct {
  id: bigint
  title: string
  description: string
  location: string
  startDate: bigint
  endDate: bigint
  expectedAttendees: bigint
  isPaid: boolean
  organizer: string
  userRegCount: bigint
  verifiedAttendeesCount: bigint
  revenueReleased: boolean
  bannerCID: string // New field from contract
}

export default function DashboardPage() {
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [pastEvents, setPastEvents] = useState<any[]>([])

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        if (!window.ethereum) return

        const provider = new ethers.providers.Web3Provider(window.ethereum)
        await provider.send("eth_requestAccounts", [])
        const signer = provider.getSigner()
        const userAddress = await signer.getAddress()
        const contract = new ethers.Contract(contractAddress, contractABI, provider)

        const allEvents = await contract.getAllEvents()
        const now = Math.floor(Date.now() / 1000)

        const upcoming: any[] = []
        const past: any[] = []

        allEvents.forEach((ev: EventStruct) => {
          if (ev.organizer.toLowerCase() === userAddress.toLowerCase()) {
            const startDate = new Date(Number(ev.startDate) * 1000)
            // Convert bannerCID to IPFS URL
            const bannerUrl = ev.bannerCID ? `https://ipfs.io/ipfs/${ev.bannerCID.replace('ipfs://', '')}` : "/placeholder.svg"
            const event = {
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
              image: bannerUrl, // Use the IPFS URL or placeholder
            }

            if (Number(ev.endDate) > now) {
              upcoming.push(event)
            } else {
              past.push(event)
            }
          }
        })

        setUpcomingEvents(upcoming)
        setPastEvents(past)
      } catch (error) {
        console.error("Failed to fetch events:", error)
      }
    }

    fetchEvents()
  }, [])

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
                        src={event.image}
                        alt={event.title}
                        className="w-full h-32 object-cover rounded-t-lg"
                        onError={(e) => { // Fallback if IPFS fails to load
                          e.currentTarget.src = "/placeholder.svg"
                        }}
                      />
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        {/* Removed badge since it's organized events */}
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
                        src={event.image}
                        alt={event.title}
                        className="w-full h-32 object-cover rounded-t-lg"
                        onError={(e) => { // Fallback if IPFS fails to load
                          e.currentTarget.src = "/placeholder.svg"
                        }}
                      />
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        {/* Removed badge */}
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